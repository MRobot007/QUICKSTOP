import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/Toast'
import { PRODUCT_NAME, PRODUCT_DESCRIPTION } from '@/lib/branding'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
    title: `${PRODUCT_NAME} | Convenience Store`,
    description: PRODUCT_DESCRIPTION,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
            <body className="font-sans antialiased text-dark" suppressHydrationWarning>
                <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 flex flex-col min-h-screen">
                    {children}
                </div>
                <Toaster />
            </body>
        </html>
    )
}
