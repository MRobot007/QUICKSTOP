/** @type {import('tailwindcss').Config} */

// ── Theme: Deep Teal & Brass ───────────────────────────────────────
// One source of truth for the palette. Components reference these by name
// (brand-600, bg-primary, text-dark) and never hardcode a hex, so re-theming
// the whole POS means editing this block and nothing else.
//
// The teal ramp is tuned so every step that carries text clears WCAG AA against
// the surface it sits on: brand-600 and darker are safe for body text on white
// or brand-50, brand-300/400 are for light-on-dark in the sidebar rail, and
// brand-100/200 are borders and fills only. Brass is the accent — brass-600 is
// the only step safe to put white text on.
const brand = {
    50: '#F2F7F6',
    100: '#DCEAE8',
    200: '#BDD7D4',
    300: '#93BAB6',
    400: '#6A9A97',
    500: '#47807C',
    600: '#2F6764',
    700: '#14534F',
    800: '#0F403D',
    900: '#0A2422',
}

const brass = {
    50: '#FBF6EC',
    100: '#F3E7CE',
    200: '#E6CE9C',
    300: '#D6B36B',
    400: '#C79A4E',
    500: '#A9762A',
    600: '#8E631F',
    700: '#6E4C17',
}

// ── Type floor ───────────────────────────────────────────────────────────────
// The app had 230 uses of text-[8px]/[9px]/[10px]. At a till, read at arm's
// length under shop lighting all day, that is too small to scan reliably. These
// two steps are the floor: nothing renders smaller than 11px, and 11px is only
// for uppercase micro-labels where the tracking does the legibility work.
const fontSize = {
    label: ['0.6875rem', { lineHeight: '1rem' }],     // 11px — uppercase micro-labels
    caption: ['0.75rem', { lineHeight: '1.125rem' }],                        // 12px
}

// ── Motion ───────────────────────────────────────────────────────────────────
// Two durations, not one copied everywhere. "fast" is for feedback the finger
// is still touching (press, hover); "base" is for a state that actually
// changed. Entry decelerates, because arriving is what it is describing.
const transitionDuration = { fast: '120ms', base: '220ms', slow: '360ms' }
const transitionTimingFunction = { 'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)' }

// ── Stock states ─────────────────────────────────────────────────────────────
// Named rather than reached for as raw red/amber at each call site, and each
// pair is checked against the surface it sits on: ok 6.5:1, low 7.2:1,
// out 6.1:1 — all clear of AA at the small sizes these badges use.
const state = {
    'ok-bg': brand[50], 'ok-fg': brand[600],
    'low-bg': brass[50], 'low-fg': brass[700],
    'out-bg': '#FEF2F2', 'out-fg': '#B91C1C',
}

export default {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)'],
                outfit: ['var(--font-outfit)'],
            },
            fontSize,
            transitionDuration,
            transitionTimingFunction,
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                brand,
                brass,
                primary: {
                    DEFAULT: brand[700],
                    foreground: '#FFFFFF',
                    glow: 'rgba(20, 83, 79, 0.5)',
                },
                accent: {
                    DEFAULT: brass[600],
                    foreground: '#FFFFFF',
                    glow: 'rgba(142, 99, 31, 0.3)',
                },
                // Ink for body copy, and the app canvas the cards sit on.
                dark: '#0C1A19',
                canvas: '#F7FAFA',
                // The near-black pine used by the sidebar rails.
                rail: brand[900],
                state,
            },
        },
    },
    plugins: [],
}
