/**
 * Floating product silhouettes for the sign-in screen — the things a convenience store
 * actually stocks, one per aisle: bottles and cans, snacks, vapes and tobacco.
 *
 * Each item is two nested elements: the outer bobs (`geo-float`), the inner
 * rocks (`geo-tilt`). Keeping them separate stops the two animations fighting
 * over the same `transform`, and the tilt is a gentle rock rather than a spin —
 * a bottle turning a full circle reads as broken. Only transform and opacity
 * animate, so the layer stays on the compositor; the keyframes and the
 * prefers-reduced-motion guard live in app/globals.css.
 *
 * Positions are literals, never Math.random() — random values would differ
 * between the server and client render and React would flag a hydration
 * mismatch. They are placed around the headline and chips deliberately so the
 * panel reads as a composed shelf rather than scattered clip-art.
 *
 * Strokes use vectorEffect="non-scaling-stroke" so every item keeps the same
 * hairline weight no matter how differently its viewBox is scaled.
 */

type ArtKey =
    | 'beerBottle' | 'spiritBottle' | 'sodaCan' | 'energyCan' | 'waterBottle'
    | 'chipBag' | 'chocolateBar' | 'vapeBar' | 'cigarettePack' | 'sodaCup'

type Art = { viewBox: string; ratio: number; body: React.ReactNode }

const ART: Record<ArtKey, Art> = {
    beerBottle: {
        viewBox: '0 0 34 100',
        ratio: 0.34,
        body: (
            <>
                <path d="M12 3h10v8H12z" />
                <path d="M13 11v13c0 7-9 11-9 21v45a5 5 0 0 0 5 5h16a5 5 0 0 0 5-5V45c0-10-9-14-9-21V11" />
                <path d="M5 55h24M5 74h24" />
            </>
        ),
    },
    spiritBottle: {
        viewBox: '0 0 42 100',
        ratio: 0.42,
        body: (
            <>
                <path d="M15 3h12v10H15z" />
                <path d="M17 13v11c0 4-11 3-11 10v58a5 5 0 0 0 5 5h20a5 5 0 0 0 5-5V34c0-7-11-6-11-10V13" />
                <rect x="9" y="44" width="24" height="26" rx="2" />
            </>
        ),
    },
    sodaCan: {
        viewBox: '0 0 56 100',
        ratio: 0.56,
        body: (
            <>
                <path d="M8 18v64c0 5 9 9 20 9s20-4 20-9V18" />
                <ellipse cx="28" cy="18" rx="20" ry="8" />
                <path d="M21 16h11" />
                <path d="M8 42h40M8 64h40" />
            </>
        ),
    },
    energyCan: {
        viewBox: '0 0 40 100',
        ratio: 0.40,
        body: (
            <>
                <path d="M6 16v68c0 4 6 7 14 7s14-3 14-7V16" />
                <ellipse cx="20" cy="16" rx="14" ry="6" />
                <path d="M22 38l-8 15h6l-2 12 10-17h-6z" />
                <path d="M6 72h28" />
            </>
        ),
    },
    waterBottle: {
        viewBox: '0 0 34 100',
        ratio: 0.34,
        body: (
            <>
                <path d="M12 3h10v8H12z" />
                <path d="M13 11v8c0 5-8 7-8 14v58a6 6 0 0 0 6 6h12a6 6 0 0 0 6-6V33c0-7-8-9-8-14v-8" />
                <path d="M5 40h24M5 48h24" />
            </>
        ),
    },
    chipBag: {
        viewBox: '0 0 74 100',
        ratio: 0.74,
        body: (
            <>
                <path d="M11 22c0-3 12-5 26-5s26 2 26 5v56c0 3-12 5-26 5s-26-2-26-5z" />
                <path d="M13 16l6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5" />
                <path d="M13 90l6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5" />
                <path d="M24 46h26M24 58h18" />
            </>
        ),
    },
    chocolateBar: {
        viewBox: '0 0 100 58',
        ratio: 1.72,
        body: (
            <>
                <rect x="8" y="10" width="84" height="38" rx="4" />
                <rect x="18" y="17" width="64" height="24" rx="2" />
                <path d="M39 17v24M61 17v24M18 29h64" />
            </>
        ),
    },
    vapeBar: {
        viewBox: '0 0 34 100',
        ratio: 0.34,
        body: (
            <>
                <rect x="12" y="4" width="10" height="9" rx="3" />
                <rect x="7" y="13" width="20" height="79" rx="9" />
                <path d="M7 34h20" />
                <circle cx="17" cy="80" r="2.5" />
            </>
        ),
    },
    cigarettePack: {
        viewBox: '0 0 68 100',
        ratio: 0.68,
        body: (
            <>
                <rect x="17" y="12" width="6" height="11" rx="1" />
                <rect x="26" y="7" width="6" height="16" rx="1" />
                <rect x="35" y="12" width="6" height="11" rx="1" />
                <rect x="11" y="22" width="46" height="68" rx="4" />
                <path d="M11 40h46" />
                <path d="M22 58h24M22 70h16" />
            </>
        ),
    },
    sodaCup: {
        viewBox: '0 0 66 100',
        ratio: 0.66,
        body: (
            <>
                <path d="M14 28h38l-5 60a5 5 0 0 1-5 4H24a5 5 0 0 1-5-4z" />
                <rect x="9" y="18" width="48" height="10" rx="3" />
                <path d="M40 18V5" />
                <path d="M17 54h32" />
            </>
        ),
    },
}

type Item = {
    art: ArtKey
    /** Rendered height in px; width follows the artwork's own proportions. */
    height: number
    /** Tailwind positioning classes. */
    position: string
    tiltFrom: number
    tiltTo: number
    tiltDuration: string
    floatDuration: string
    floatDelay: string
    rise: string
    sway: string
    className: string
    opacity: number
}

/** Dark brand panel — one from each aisle, sized so the shelf has a hierarchy. */
const PANEL_ITEMS: Item[] = [
    { art: 'spiritBottle', height: 210, position: 'top-[7%] right-[11%]', tiltFrom: -7, tiltTo: 4, tiltDuration: '19s', floatDuration: '22s', floatDelay: '0s', rise: '18px', sway: '10px', className: 'text-brass-300', opacity: 0.40 },
    { art: 'beerBottle', height: 168, position: 'top-[27%] right-[33%]', tiltFrom: 6, tiltTo: -5, tiltDuration: '16s', floatDuration: '17s', floatDelay: '-4s', rise: '15px', sway: '-9px', className: 'text-brand-300', opacity: 0.36 },
    { art: 'sodaCan', height: 132, position: 'bottom-[28%] right-[13%]', tiltFrom: -5, tiltTo: 7, tiltDuration: '21s', floatDuration: '19s', floatDelay: '-8s', rise: '20px', sway: '12px', className: 'text-brand-300', opacity: 0.34 },
    { art: 'energyCan', height: 118, position: 'top-[15%] left-[45%]', tiltFrom: 5, tiltTo: -6, tiltDuration: '14s', floatDuration: '14s', floatDelay: '-6s', rise: '13px', sway: '-8px', className: 'text-brass-300', opacity: 0.34 },
    { art: 'chipBag', height: 128, position: 'bottom-[13%] right-[34%]', tiltFrom: -6, tiltTo: 5, tiltDuration: '18s', floatDuration: '20s', floatDelay: '-11s', rise: '17px', sway: '10px', className: 'text-brass-300', opacity: 0.32 },
    { art: 'vapeBar', height: 122, position: 'top-[57%] right-[5%]', tiltFrom: 8, tiltTo: -4, tiltDuration: '15s', floatDuration: '13s', floatDelay: '-5s', rise: '12px', sway: '7px', className: 'text-brand-300', opacity: 0.34 },
    { art: 'cigarettePack', height: 104, position: 'top-[21%] right-[54%]', tiltFrom: -8, tiltTo: 3, tiltDuration: '17s', floatDuration: '12s', floatDelay: '-3s', rise: '11px', sway: '6px', className: 'text-brand-300', opacity: 0.28 },
    { art: 'waterBottle', height: 150, position: 'bottom-[31%] left-[4%]', tiltFrom: 5, tiltTo: -7, tiltDuration: '20s', floatDuration: '23s', floatDelay: '-16s', rise: '14px', sway: '-9px', className: 'text-brand-300', opacity: 0.22 },
    { art: 'chocolateBar', height: 62, position: 'top-[6%] left-[29%]', tiltFrom: -9, tiltTo: 4, tiltDuration: '22s', floatDuration: '26s', floatDelay: '-14s', rise: '11px', sway: '8px', className: 'text-brass-300', opacity: 0.26 },
]

/** Light form panel — the same language, dialled right down. */
const FORM_ITEMS: Item[] = [
    { art: 'sodaCup', height: 132, position: 'top-[9%] right-[7%]', tiltFrom: -6, tiltTo: 5, tiltDuration: '20s', floatDuration: '24s', floatDelay: '0s', rise: '15px', sway: '9px', className: 'text-brand-300', opacity: 0.45 },
    { art: 'chocolateBar', height: 56, position: 'bottom-[14%] left-[7%]', tiltFrom: 7, tiltTo: -5, tiltDuration: '17s', floatDuration: '18s', floatDelay: '-7s', rise: '13px', sway: '-8px', className: 'text-brass-300', opacity: 0.50 },
    { art: 'beerBottle', height: 116, position: 'top-[24%] left-[6%]', tiltFrom: -5, tiltTo: 6, tiltDuration: '16s', floatDuration: '21s', floatDelay: '-4s', rise: '12px', sway: '7px', className: 'text-brand-300', opacity: 0.35 },
]

function StockLayer({ items }: { items: Item[] }) {
    return (
        <>
            {items.map((item, i) => {
                const art = ART[item.art]
                return (
                    <div
                        key={i}
                        className={`geo-float absolute ${item.position}`}
                        style={{
                            width: Math.round(item.height * art.ratio),
                            height: item.height,
                            opacity: item.opacity,
                            animationDelay: item.floatDelay,
                            ['--geo-float-duration' as string]: item.floatDuration,
                            ['--geo-rise' as string]: item.rise,
                            ['--geo-sway' as string]: item.sway,
                        }}
                    >
                        <div
                            className="geo-tilt h-full w-full"
                            style={{
                                ['--geo-tilt-duration' as string]: item.tiltDuration,
                                ['--geo-tilt-from' as string]: `${item.tiltFrom}deg`,
                                ['--geo-tilt-to' as string]: `${item.tiltTo}deg`,
                            }}
                        >
                            <svg
                                viewBox={art.viewBox}
                                className={`h-full w-full ${item.className}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            >
                                {art.body}
                            </svg>
                        </div>
                    </div>
                )
            })}
        </>
    )
}

export function PanelStock() {
    return <StockLayer items={PANEL_ITEMS} />
}

export function FormStock() {
    return <StockLayer items={FORM_ITEMS} />
}
