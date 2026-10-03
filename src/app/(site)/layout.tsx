import localFont from "next/font/local"
import { SiteHeader } from "./_components/site-header"
import { SiteFooter } from "./_components/site-footer"
import "./site.css"

// Satoshi (Fontshare, ITF Free Font License) for the marketing pages only:
// headings and body text. The logged-in app stays on Geist.
const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-display",
  weight: "300 900",
  style: "normal",
  display: "swap",
})

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site-root ${satoshi.variable} flex min-h-screen flex-col overflow-x-clip`}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
