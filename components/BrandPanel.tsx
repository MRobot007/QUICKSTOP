import { Beer, CupSoda, Cookie, Cigarette, Store } from 'lucide-react'
import { PanelStock } from '@/components/FloatingStock'
import { PRODUCT_NAME } from '@/lib/branding'

/**
 * The dark brand half of the sign-in screen.
 *
 * Decorative throughout except the wordmark, so the aurora layers are
 * aria-hidden and never take pointer events. Only `transform` animates (the
 * `aurora-pool` class in globals.css), and the blur is set once rather than
 * per frame — re-blurring on every frame is what makes this kind of backdrop
 * stutter. The prefers-reduced-motion guard also lives in globals.css.
 */

const AISLES = [
    { icon: Beer, label: 'Beer & Alcohol' },
    { icon: CupSoda, label: 'Drinks & Energy' },
    { icon: Cookie, label: 'Snacks' },
    { icon: Cigarette, label: 'Vapes & Tobacco' },
]

const POOLS = [
    { className: 'bg-[#0E6F68]', size: 680, top: '-18%', left: '-18%', opacity: 0.55, duration: '38s', delay: '0s' },
    { className: 'bg-[#C08A2E]', size: 560, bottom: '-20%', right: '-14%', opacity: 0.30, duration: '44s', delay: '-8s' },
    { className: 'bg-[#14807A]', size: 400, bottom: '18%', left: '24%', opacity: 0.40, duration: '30s', delay: '-18s' },
    { className: 'bg-[#0A5F7A]', size: 340, top: '22%', right: '8%', opacity: 0.30, duration: '26s', delay: '-24s' },
]

export default function BrandPanel() {
    return (
        <div className="relative hidden w-[54%] shrink-0 overflow-hidden bg-[#06201E] lg:flex lg:flex-col lg:justify-between lg:p-14">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                {POOLS.map((pool, i) => (
                    <div
                        key={i}
                        className={`aurora-pool absolute rounded-full blur-[120px] ${pool.className}`}
                        style={{
                            width: pool.size,
                            height: pool.size,
                            top: pool.top,
                            left: pool.left,
                            right: pool.right,
                            bottom: pool.bottom,
                            opacity: pool.opacity,
                            animationDuration: pool.duration,
                            animationDelay: pool.delay,
                        }}
                    />
                ))}
                <div className="aurora-grid-dark absolute inset-0" />
                <PanelStock />
            </div>

            <div className="relative z-10 flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brass-400 text-[#06201E] shadow-lg shadow-black/30">
                    <Store size={22} strokeWidth={2.2} />
                </div>
                <span className="font-outfit text-lg font-black uppercase tracking-[0.22em] text-white">{PRODUCT_NAME}</span>
            </div>

            <div className="relative z-10 max-w-lg">
                <p className="mb-5 text-label font-bold uppercase tracking-[0.4em] text-brass-300">Point of Sale</p>
                <h2 className="font-outfit text-[52px] font-black leading-[0.98] tracking-tight text-white">
                    Every sale,<br />
                    <span className="text-brand-300">every shift,</span><br />
                    one screen.
                </h2>
                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-brand-200">
                    Ring up the aisle, age-check what needs it, and close the drawer with the numbers already counted.
                </p>
            </div>

            <ul className="relative z-10 flex flex-wrap gap-2.5">
                {AISLES.map(({ icon: Icon, label }) => (
                    <li
                        key={label}
                        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 backdrop-blur-sm"
                    >
                        <Icon size={14} className="text-brass-300" aria-hidden="true" />
                        <span className="text-label font-bold uppercase tracking-[0.14em] text-brand-100">{label}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
