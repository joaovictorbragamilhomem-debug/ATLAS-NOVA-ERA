import { Skeleton } from "@/components/ui/skeleton"

// Generic placeholder for the logged-in screens while the server renders the
// next one. Without a loading.tsx, Next.js can't prefetch dynamic routes and a
// click shows nothing until every Supabase query of the next page finishes;
// with it, the click swaps to this skeleton right away.
function PageSkeleton() {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10"
      aria-busy="true"
    >
      <span role="status" className="sr-only">
        Carregando…
      </span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    </main>
  )
}

export { PageSkeleton }
