import { getCurrentMembership } from "@/lib/auth/current-user"
import { AppNav } from "./_components/app-nav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const membership = await getCurrentMembership()

  return (
    <div className="min-h-screen">
      {membership && <AppNav />}
      {children}
    </div>
  )
}
