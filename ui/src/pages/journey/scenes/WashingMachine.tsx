import React from 'react';
import styles from './washingMachine.module.scss';

interface WashingMachineProps {
    className?: string;
}

/**
 * The machine from `laundrylo-washer.svg`, inlined and grouped so the parts that
 * have to move can be reached: the door, the drawer, the glass and the water in
 * it. Every path, coordinate and colour is the artwork's own. Nothing here is
 * redrawn, only wrapped.
 *
 * The door group's origin sits on its left edge, which is where the hinge is.
 */
const WashingMachine: React.FC<WashingMachineProps> = ({ className }) => (
    <svg
        className={[styles.machine, className].filter(Boolean).join(' ')}
        viewBox="0 0 480 600"
        role="img"
        aria-label="A washing machine, its drum near empty"
    >
        <ellipse
            cx="240"
            cy="562"
            rx="180"
            ry="16"
            fill="#1F1D1A"
            opacity="0.08"
        />

        <g className={styles.body}>
            <rect
                x="60"
                y="60"
                width="360"
                height="490"
                rx="36"
                fill="#EAE3D3"
            />
            <rect
                x="60"
                y="60"
                width="360"
                height="490"
                rx="36"
                fill="none"
                stroke="#D8CFBA"
                strokeWidth="2"
            />
            <path
                d="M386 60 h-2 a34 490 0 0 1 0 490 h2 a34 34 0 0 0 34 -34 V94 a34 34 0 0 0 -34 -34 z"
                fill="#DFD6C2"
                opacity="0.8"
            />
            <rect
                x="60"
                y="60"
                width="360"
                height="76"
                rx="36"
                fill="#E2DAC7"
            />
            <rect
                x="60"
                y="112"
                width="360"
                height="24"
                fill="#EAE3D3"
            />
        </g>

        {/* Tips into the drawer for the pour, and is not there before it. */}
        <g
            className={styles.cup}
            data-wash="cup"
        >
            <path
                d="M112 36 H152 L146 68 C146 71 144 72 141 72 H123 C120 72 118 71 118 68 Z"
                fill="#F5F0E4"
                stroke="#C9BFA8"
                strokeWidth="2.5"
            />
            <path
                d="M152 42 C160 42 162 50 156 54"
                fill="none"
                stroke="#C9BFA8"
                strokeWidth="2.5"
            />
        </g>

        <g
            className={styles.drawer}
            data-wash="drawer"
        >
            <rect
                x="92"
                y="84"
                width="84"
                height="28"
                rx="8"
                fill="#F5F0E4"
                stroke="#C9BFA8"
                strokeWidth="2"
            />
            <rect
                x="92"
                y="84"
                width="18"
                height="28"
                rx="8"
                fill="#C9BFA8"
                opacity="0.5"
            />
            {/* The drawer holds the detergent for a beat before it travels. */}
            <rect
                className={styles.drawerTint}
                data-wash="drawer-tint"
                x="92"
                y="84"
                width="84"
                height="28"
                rx="8"
                fill="#EEA9B6"
            />
        </g>

        <g className={styles.dial}>
            <circle
                cx="352"
                cy="98"
                r="20"
                fill="#F5F0E4"
                stroke="#1F1D1A"
                strokeWidth="3"
            />
            <rect
                x="350"
                y="82"
                width="4"
                height="12"
                rx="2"
                fill="#1F1D1A"
            />
        </g>

        {/* The only thing that moves while the page is at rest, so it has to be
            seen doing it: a halo breathes out around the light itself. */}
        <g className={styles.led}>
            <circle
                className={styles.ledHalo}
                cx="304"
                cy="98"
                r="13"
            />
            <circle
                cx="304"
                cy="98"
                r="7"
                fill="#5FBF9A"
            />
        </g>

        {/* The drum sits behind the door, so opening the door reveals it rather
            than taking the water with it. */}
        <g className={styles.drum}>
            <circle
                cx="240"
                cy="330"
                r="140"
                fill="#DFD6C2"
            />
            <circle
                cx="240"
                cy="330"
                r="112"
                fill="#F5F0E4"
            />
            <circle
                cx="240"
                cy="330"
                r="100"
                fill="#DCE9F5"
            />

            <clipPath id="laundrylo-machine-glass">
                <circle
                    cx="240"
                    cy="330"
                    r="100"
                />
            </clipPath>

            <g clipPath="url(#laundrylo-machine-glass)">
                <g
                    className={styles.drumBubbles}
                    data-wash="drum-bubbles"
                    fill="#B9CFE4"
                    opacity="0.5"
                >
                    <circle
                        cx="200"
                        cy="290"
                        r="4"
                    />
                    <circle
                        cx="240"
                        cy="278"
                        r="4"
                    />
                    <circle
                        cx="280"
                        cy="290"
                        r="4"
                    />
                    <circle
                        cx="184"
                        cy="330"
                        r="4"
                    />
                    <circle
                        cx="296"
                        cy="330"
                        r="4"
                    />
                    <circle
                        cx="200"
                        cy="370"
                        r="4"
                    />
                    <circle
                        cx="240"
                        cy="382"
                        r="4"
                    />
                    <circle
                        cx="280"
                        cy="370"
                        r="4"
                    />
                </g>

                {/* Water sits low at rest; the wash raises it. The body runs well
                    past the glass so rising never uncovers the bottom. */}
                <g
                    className={styles.water}
                    data-wash="water"
                >
                    <path
                        d="M140 402 C 180 394, 210 394, 240 400 C 270 406, 310 406, 340 398 L 340 520 L 140 520 Z"
                        fill="#8FBFEA"
                    />
                    <g
                        className={styles.foam}
                        data-wash="foam"
                    >
                        <path
                            d="M140 402 C 180 394, 210 394, 240 400 C 270 406, 310 406, 340 398"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                        />
                        <circle
                            cx="182"
                            cy="393"
                            r="5"
                            fill="#FFFFFF"
                        />
                        <circle
                            cx="193"
                            cy="388"
                            r="3.5"
                            fill="#FFFFFF"
                        />
                        <circle
                            cx="286"
                            cy="399"
                            r="4.5"
                            fill="#FFFFFF"
                        />
                        <circle
                            cx="296"
                            cy="394"
                            r="3"
                            fill="#FFFFFF"
                        />
                        <circle
                            cx="238"
                            cy="396"
                            r="3.5"
                            fill="#FFFFFF"
                        />
                    </g>
                </g>

                {/* Detergent, then conditioner. Each enters through the top of
                    the glass and sinks; the clip is what keeps liquid inside the
                    machine rather than running across its face. */}
                <path
                    className={styles.ribbon}
                    data-wash="ribbon-pink"
                    d="M206 214 C 216 244, 198 268, 210 296 C 220 320, 204 340, 212 368"
                    fill="none"
                    stroke="#EEA9B6"
                    strokeWidth="15"
                    strokeLinecap="round"
                />
                <path
                    className={styles.ribbon}
                    data-wash="ribbon-blue"
                    d="M268 210 C 258 240, 276 262, 264 292 C 254 316, 270 338, 262 366"
                    fill="none"
                    stroke="#8FBFEA"
                    strokeWidth="13"
                    strokeLinecap="round"
                />

                {/* Smeared into rotation for one beat as the drum spins up. */}
                <g
                    className={styles.swirls}
                    data-wash="swirls"
                >
                    <path
                        d="M168 330 a 72 72 0 0 1 144 0"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity="0.7"
                    />
                    <path
                        d="M196 348 a 44 44 0 0 0 88 0"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="4"
                        strokeLinecap="round"
                        opacity="0.5"
                    />
                </g>
            </g>
        </g>

        <g
            className={styles.door}
            data-wash="door"
        >
            <circle
                cx="240"
                cy="330"
                r="128"
                fill="none"
                stroke="#1F1D1A"
                strokeWidth="22"
            />
            <path
                d="M176 274 a 88 88 0 0 1 78 -28"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.85"
            />
        </g>

        <rect
            x="98"
            y="312"
            width="14"
            height="36"
            rx="7"
            fill="#1F1D1A"
        />
        <rect
            x="366"
            y="318"
            width="20"
            height="24"
            rx="8"
            fill="#F5F0E4"
            stroke="#1F1D1A"
            strokeWidth="3"
        />
        <rect
            x="84"
            y="512"
            width="312"
            height="10"
            rx="5"
            fill="#D8CFBA"
        />
        <rect
            x="104"
            y="546"
            width="36"
            height="16"
            rx="8"
            fill="#1F1D1A"
        />
        <rect
            x="340"
            y="546"
            width="36"
            height="16"
            rx="8"
            fill="#1F1D1A"
        />
    </svg>
);

export default WashingMachine;
