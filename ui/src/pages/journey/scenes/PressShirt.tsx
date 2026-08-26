import React from 'react';
import { FOLD } from '../../../config/cycleConfig';
import { BenefitItem } from '../../../config/membershipConfig';
import styles from './pressShirt.module.scss';

/**
 * A shirt laid flat, cut into the four panels its creases make. Three carry a
 * perk each; the fourth is the chest.
 *
 * The panels are separate pieces of cloth rather than regions of one rectangle,
 * because folding one has to make the shirt narrower. Each turns over on its
 * crease and lands exactly on the chest column: the left sleeve spans 30 to 330
 * and mirrors about 330, which puts it on 330 to 630, and the right is cut to do
 * the same.
 *
 * The waist splits every column in two, and the lower halves share a group. Two
 * folds compose on the pieces in it, the sleeve's and the waist's, and because
 * the two use different axes they do not fight: a sleeve's lower half mirrors
 * about x=330 and then about y=320, and lands on the chest with everything else.
 *
 * The chest is three hundred of nine hundred and sixty rather than two hundred
 * and twenty of seven hundred and eighty, because the folded shirt is the thing
 * the section ends on and the wordmark printed on it has to fit across it.
 *
 * Nothing crosses a crease. Every line of text is centred inside one panel,
 * because a perk cut in half by a fold is a defect rather than a detail.
 *
 * The creases live in the fold's timeline as svgOrigin values, not as
 * transform-origin here: GSAP computes its own origin for SVG and a stylesheet
 * cannot win that argument.
 */
export const CREASE = { left: 330, right: 630, bottom: 320 };

/**
 * The iron's route, and the creases lying under it.
 *
 * Three crossings, alternating direction, each one running along a band of the
 * shirt with a pair of creases either side of the plate. The bands are what tie
 * the two halves of this together: the fold's timeline erases a crease in step
 * with the iron that is passing over it, so a band's creases have to be creases
 * that band actually reaches. Kept here, with the drawing, because moving a
 * crease is a drawing change and the timing has to follow it.
 *
 * The iron comes on and goes off well outside the box, so a crossing starts and
 * ends off the cloth and the change of band happens where nobody can see it.
 */
export const PRESS = {
    /** The span a crease is drawn across, which is what a crossing has to cover. */
    span: { left: 60, right: 900 },
    enters: -170,
    leaves: 1050,
    bands: [
        { runsAt: 194, creases: [182, 220] },
        { runsAt: 340, creases: [328, 364] },
        { runsAt: 470, creases: [458, 494] },
    ],
};

/**
 * Steam, escaping from under the plate at either edge of it.
 *
 * Beside the iron rather than out of the top of it. An iron makes steam where
 * it touches the cloth, so that is where these start: on the shirt, at the lip
 * of the plate, curling up outside the body. Inside it would only be a wisp
 * drawn over a solid lump of metal.
 *
 * Both edges, because the iron crosses in both directions and steam should
 * escape ahead of it as well as behind.
 */
const STEAM = [
    'M-76 8 C -88 -4, -68 -12, -80 -26',
    'M-98 12 C -108 2, -90 -6, -102 -20',
    'M76 8 C 64 -4, 84 -12, 72 -26',
    'M98 12 C 88 2, 106 -6, 94 -20',
];

/** Two lines at most, split at the middle word, so nothing runs past a crease. */
const lines = (title = '') => {
    const words = title.split(' ');
    if (words.length < 3) {
        return [title];
    }
    const middle = Math.ceil(words.length / 2);
    return [words.slice(0, middle).join(' '), words.slice(middle).join(' ')];
};

const Perk: React.FC<{ title?: string; x: number; y: number; hook: string }> = ({
    title,
    x,
    y,
    hook,
}) => (
    <text
        className={styles.perk}
        data-fold={hook}
        x={x}
        y={y}
        textAnchor="middle"
    >
        {lines(title).map((line, index) => (
            <tspan
                key={line}
                x={x}
                dy={index === 0 ? 0 : 38}
            >
                {line}
            </tspan>
        ))}
    </text>
);

const wrinkle = (y: number) =>
    `M${PRESS.span.left} ${y} C 200 ${y - 7}, 340 ${y + 7}, 480 ${y} ` +
    `C 620 ${y - 7}, 760 ${y + 7}, ${PRESS.span.right} ${y}`;

const PressShirt: React.FC<{ benefits: BenefitItem[] }> = ({ benefits }) => (
    <svg
        className={styles.shirt}
        viewBox="0 0 960 620"
        aria-hidden="true"
        focusable="false"
    >
        {/* The cloth, all of it, in one group so the finished parcel can settle
            into the middle of the frame. The box is cut for the shirt laid flat,
            which is four times the size of the thing left at the end of the
            fold: without this the parcel sits in the top corner of a frame built
            for something else, with the rest of the section empty under it. */}
        <g data-fold="shirt">
            {/* Chest: the panel everything else folds onto, and the one left showing. */}
            <path
                className={styles.cloth}
                d="M330 100 H630 V320 H330 Z"
            />
            <path
                className={styles.collar}
                d="M410 100 H550 V126 C550 134 544 140 536 140 H424 C416 140 410 134 410 126 Z"
            />

            {/* The upper half: sleeves either side of the chest. Neither piece
                strokes the waist, so the split that lets the shirt fold in half
                leaves no seam across it before it does. */}
            <g data-fold="panel-left">
                <path
                    className={styles.cloth}
                    d="M330 320 V100 H62 C44 100 30 112 30 130 V320"
                />
                <rect
                    className={styles.underside}
                    x="30"
                    y="100"
                    width="300"
                    height="220"
                />
                <Perk
                    title={benefits[0]?.title}
                    x={180}
                    y={196}
                    hook="face-left"
                />
            </g>

            <g data-fold="panel-right">
                <path
                    className={styles.cloth}
                    d="M630 320 V100 H898 C916 100 930 112 930 130 V320"
                />
                <rect
                    className={styles.underside}
                    x="630"
                    y="100"
                    width="300"
                    height="220"
                />
                <Perk
                    title={benefits[1]?.title}
                    x={780}
                    y={196}
                    hook="face-right"
                />
            </g>

            {/* Everything below the waist, in one group, because that is what folds
                up. The sleeves fold in first and their lower halves come with it: a
                shirt folded in half is folded through whatever is already lying on
                it, and folding only the tail left the sleeves at full length and the
                finished shirt twice as tall as it should be. */}
            <g data-fold="lower">
                <g data-fold="panel-left">
                    <path
                        className={styles.cloth}
                        d="M30 320 V510 C30 528 44 540 62 540 H330 V320"
                    />
                    <rect
                        className={styles.underside}
                        x="30"
                        y="320"
                        width="300"
                        height="220"
                    />
                </g>

                <g data-fold="panel-right">
                    <path
                        className={styles.cloth}
                        d="M930 320 V510 C930 528 916 540 898 540 H630 V320"
                    />
                    <rect
                        className={styles.underside}
                        x="630"
                        y="320"
                        width="300"
                        height="220"
                    />
                </g>

                <path
                    className={styles.cloth}
                    d="M330 320 V540 H630 V320"
                />
                <rect
                    className={styles.underside}
                    x="330"
                    y="320"
                    width="300"
                    height="220"
                />
                <Perk
                    title={benefits[2]?.title}
                    x={480}
                    y={412}
                    hook="face-bottom"
                />
            </g>

            {/* Painted after every panel, not before them.
                Underneath, four fifths of the shirt covered them: the panels
                and the tail are opaque cloth drawn over the chest, so three of
                the five creases were hidden completely and the other two only
                showed across the chest column. The ironing had almost nothing
                visible to do.

                Each is normalised to a path length of one and dashed at
                exactly that, so it is drawn whole at an offset of zero and
                gone at an offset of one, and the fold can rub it out from
                either end without measuring anything. The offset is animated
                as an attribute rather than as a style, because a bare number
                there is a user unit and there is nothing to argue about. */}
            <g>
                {PRESS.bands.map((band, index) =>
                    band.creases.map((y) => (
                        <path
                            className={styles.wrinkle}
                            d={wrinkle(y)}
                            data-band={index}
                            data-fold="wrinkle"
                            key={y}
                            pathLength={1}
                            strokeDasharray={1}
                            strokeDashoffset={0}
                        />
                    ))
                )}
            </g>

            {/* Creases stay faintly visible once the shirt is folded. */}
            <g
                className={styles.creases}
                data-fold="creases"
            >
                <path d={`M${CREASE.left} 100 V${CREASE.bottom}`} />
                <path d={`M${CREASE.right} 100 V${CREASE.bottom}`} />
                <path d={`M${CREASE.left} ${CREASE.bottom} H${CREASE.right}`} />
            </g>

            {/* What the folded shirt reads, printed like a tee. */}
            <g data-fold="chest">
                <text
                    className={styles.chestBrand}
                    x="480"
                    y="205"
                    textAnchor="middle"
                >
                    {FOLD.chest.brand}
                </text>
                <text
                    className={styles.chestPlan}
                    x="480"
                    y="262"
                    textAnchor="middle"
                >
                    {FOLD.chest.plan}
                </text>
            </g>
        </g>

        {/* The iron, and the steam it raises. */}
        <g data-fold="iron">
            <path
                className={styles.ironBody}
                d="M-64 0 C-64 -26 -44 -44 -16 -44 H40 C56 -44 64 -34 64 -18 C64 -4 52 6 34 6 H-44 C-56 6 -64 -2 -64 0 Z"
            />
            <path
                className={styles.ironHandle}
                d="M-34 -44 C-34 -74 40 -74 40 -44"
            />
            <g
                className={styles.steam}
                data-fold="steam"
            >
                {STEAM.map((wisp) => (
                    <path
                        d={wisp}
                        data-fold="wisp"
                        key={wisp}
                    />
                ))}
            </g>
        </g>
    </svg>
);

export default PressShirt;
