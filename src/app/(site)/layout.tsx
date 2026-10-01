import { Sora } from "next/font/google"
import { SiteHeader } from "./_components/site-header"
import { SiteFooter } from "./_components/site-footer"
import "./site.css"

// Display face for the marketing pages only: geometric and slightly wide,
// close to the Atlas wordmark. Body text stays on Geist.
const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
})

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`site-root ${display.variable} flex min-h-screen flex-col overflow-x-clip`}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
