"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { cn } from "cn"
import { useReducedMotionSafe } from "@/lib/motion-hooks"
import { GlobeStatic } from "./globe-static"

// three.js lives only in this lazily-loaded chunk: never server-rendered and
// never part of the first paint.
const GlobeCanvas = dynamic(() => import("./globe-canvas"), { ssr: false })

type NavigatorWithHints = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

// Skip WebGL where it would cost more than it gives: data-saver mode, very
// small CPUs/RAM, or no WebGL at all. Those visitors keep the static drawing.
function canAffordWebGL(): boolean {
  const nav = navigator as NavigatorWithHints
  if (nav.connection?.saveData) return false
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4) return false
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false
  try {
    const probe = document.createElement("canvas")
    return Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"))
  } catch {
    return false
  }
}

function HeroGlobe({ className }: { className?: string }) {
  const reduceMotion = useReducedMotionSafe()
  const [mount3d, setMount3d] = React.useState(false)
  const [ready, setReady] = React.useState(false)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    if (reduceMotion) return
    // Wait for the browser to be idle so hydration and LCP go first.
    const schedule =
      window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600) as unknown as number)
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = schedule(() => {
      if (canAffordWebGL()) setMount3d(true)
    })
    return () => cancel(handle)
  }, [reduceMotion])

  const show3d = mount3d && !reduceMotion && !failed

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative aspect-square select-none", className)}
    >
      <GlobeStatic
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-1000 ease-out",
          show3d && ready ? "opacity-0" : "opacity-100"
        )}
      />
      {show3d && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-out",
            ready ? "opacity-100" : "opacity-0"
          )}
        >
          <GlobeCanvas onReady={() => setReady(true)} onError={() => setFailed(true)} />
        </div>
      )}
    </div>
  )
}

export { HeroGlobe }
