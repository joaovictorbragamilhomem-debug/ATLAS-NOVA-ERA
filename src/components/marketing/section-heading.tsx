import * as React from "react"
import { cn } from "cn"
import { Reveal } from "@/components/ui/reveal"

type SectionHeadingProps = {
  title: React.ReactNode
  children?: React.ReactNode
  /** "split": title left, description right on wide screens. "center": stacked and centered. */
  layout?: "split" | "center"
  className?: string
}

// Marketing section heading. The "split" layout starts each section with a
// drafting rule (a hairline with a short brand-colored lead) — the same
// pen-on-paper language as the hero globe.
function SectionHeading({ title, children, layout = "split", className }: SectionHeadingProps) {
  if (layout === "center") {
    return (
      <Reveal className={cn("mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center", className)}>
        <h2 className="font-display text-3xl font-semibold text-balance sm:text-[2.5rem] sm:leading-[1.1]">{title}</h2>
        {children && <p className="max-w-xl text-pretty text-muted-foreground sm:text-lg">{children}</p>}
      </Reveal>
    )
  }

  return (
    <Reveal className={cn("mb-12", className)}>
      <div aria-hidden className="relative mb-8 h-px bg-border">
        <span className="absolute top-0 left-0 h-px w-16 bg-primary" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-12">
        <h2 className="font-display max-w-xl text-3xl font-semibold text-balance sm:text-[2.5rem] sm:leading-[1.1]">
          {title}
        </h2>
        {children && <p className="max-w-md text-pretty text-muted-foreground sm:text-lg lg:justify-self-end">{children}</p>}
      </div>
    </Reveal>
  )
}

export { SectionHeading }
