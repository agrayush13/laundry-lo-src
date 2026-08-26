import { DRY } from '../config/cycleConfig';
import type * as ClotheslineModule from '../motion/clothesline';
import { pinScene, whileVisible } from '../motion/pinScene';
import type * as RopeModule from '../motion/rope';
import { useSceneMotion } from './useSceneMotion';

/** The curve the line is drawn at, which is also its resting shape. */
const SAG = { left: { x: 40, y: 152 }, right: { x: 1160, y: 152 }, control: 300 };
const PIN_LENGTH = '+=173%';
const PIN_LENGTH_MOBILE = '+=121%';
/** The scene's own width, which the breeze wanders along. */
const SCENE_WIDTH = 1200;

/**
 * The markup hooks the dry drives, and the source of every selector below. The
 * scene must render all of them; contract-tested against it.
 */
export const DRY_PARTS = ['scene', 'rope', 'garment'] as const;

const part = (name: (typeof DRY_PARTS)[number]) => `[data-dry="${name}"]`;

const sample = (t: number) => {
    const mt = 1 - t;
    return {
        x:
            mt ** 3 * SAG.left.x +
            3 * mt * mt * t * 320 +
            3 * mt * t * t * 880 +
            t ** 3 * SAG.right.x,
        y:
            mt ** 3 * SAG.left.y +
            3 * mt * mt * t * SAG.control +
            3 * mt * t * t * SAG.control +
            t ** 3 * SAG.right.y,
    };
};

/**
 * The dry, alive. A verlet rope carries the garments, the garments swing as
 * pendulums off the points they are pegged to, and a breeze wanders along the
 * line and dries the washing.
 *
 * The wind used to be the pointer: the cursor became a swirl inside the section
 * and moving it pushed a gust. It was a nice idea that nobody found. There is
 * nothing on the screen telling a visitor to sweep their mouse across a drawing,
 * so almost every one of them scrolled past a line that never moved, and the one
 * piece of the page that asked to be played with read as the one piece that was
 * broken. The line moves by itself now.
 *
 * Assembly is scrubbed against the hold, so scrolling back up takes the washing
 * in again. Physics loads with the spine, not with the page.
 */
export const useClothesline = () =>
    useSceneMotion(
        DRY.meta.id,
        ({ gsap, ScrollTrigger, section }, { rope: ropeModule, line }) => {
            const scene = section.querySelector<SVGSVGElement>(part('scene'));
            if (!scene) {
                return undefined;
            }

            const { Rope } = ropeModule;
            const { arrival, breeze, land, readGarments, swing } = line;

            const rope = new Rope(sample);
            const ropePaths = scene.querySelectorAll<SVGPathElement>(part('rope'));
            const garments = readGarments(scene, rope, part('garment'));
            const landed = new Set<ClotheslineModule.Garment>();

            let progress = 0;
            let elapsed = 0;
            // The rope solves every frame while the section is on screen and not
            // one frame while it is not: a physics loop running behind five
            // other sections is just a battery drain.
            let onScreen = false;
            // The breeze blows for exactly as long as the page is held here.
            let held = false;

            /**
             * The transform is written to the attribute rather than set through
             * GSAP, and the reason is the whole reason the washing used to hang
             * off the line.
             *
             * GSAP resolves an SVG transform origin against the scene's own
             * coordinate system, so `svgOrigin: '0 0'` means the corner of the
             * drawing, not the corner of the garment. Every garment was swinging
             * about a point up to a thousand units away, which threw it further
             * the further along the line it hung: the towel on the right end
             * moved two hundred units for a fifteen degree flutter. Written
             * here, `rotate` with no centre is the element's own origin, which
             * is the peg, and the cloth turns about the point it is pegged by
             * because there is nothing else it could turn about.
             */
            const place = (garment: ClotheslineModule.Garment) => {
                const at = arrival(garment, rope, progress);
                garment.el.setAttribute(
                    'transform',
                    `translate(${at.x.toFixed(2)} ${at.y.toFixed(2)}) rotate(${at.angle.toFixed(2)})`
                );
                garment.el.style.opacity = String(at.opacity);
            };

            const frame = (_time: number, delta: number) => {
                if (!onScreen) {
                    return;
                }

                const seconds = Math.min(delta / 1000, 1 / 30);

                // Off the hold the weather stops: the clock the breeze is read
                // from stops advancing, so every garment's target angle holds
                // still and the pendulums damp onto it. The line stills rather
                // than freezing, which is the difference between the wind
                // dropping and the page being paused. Everything below keeps
                // running, because coming to rest is itself motion.
                if (held) {
                    elapsed += seconds;
                    breeze(rope, elapsed, seconds, SCENE_WIDTH);
                }

                rope.step(seconds);
                const d = rope.path();
                ropePaths.forEach((path) => path.setAttribute('d', d));

                garments.forEach((garment) => {
                    if (progress >= garment.landsAt) {
                        if (!landed.has(garment)) {
                            landed.add(garment);
                            land(rope, garment);
                        }
                        swing(garment, rope, seconds, elapsed);
                    } else {
                        landed.delete(garment);
                    }
                    place(garment);
                });
            };

            gsap.ticker.add(frame);

            whileVisible(ScrollTrigger, section, (visible) => {
                onScreen = visible;
            });

            pinScene(ScrollTrigger, {
                section,
                length: PIN_LENGTH,
                mobileLength: PIN_LENGTH_MOBILE,
                scrub: 0.7,
                onProgress: (value) => {
                    progress = value;
                },
                onActive: (active) => {
                    held = active;
                },
            });

            return () => gsap.ticker.remove(frame);
        },
        async () => ({
            rope: (await import('../motion/rope')) as typeof RopeModule,
            line: (await import('../motion/clothesline')) as typeof ClotheslineModule,
        })
    );
