import { CITIES, ORBIT, ROUTES, graticule, latLonToVec, orient, routeArc, type Vec3 } from "./globe-data"

// Static, server-renderable drawing of the hero globe (orthographic view).
// It is what people see before the WebGL scene loads, on low-power devices
// and with prefers-reduced-motion — so it has to stand on its own.

const R = 46 // globe radius, centered in a 100×100 box (viewBox padded for the orbit)
const C = 50
const ORBIT_RX = R * ORBIT.radius
const ORBIT_RY = ORBIT_RX * ORBIT.squash
const ORBIT_TILT = ORBIT.tiltDeg

function project(v: Vec3): { x: number; y: number; z: number } {
  const [x, y, z] = orient(v)
  return { x: C + x * R, y: C - y * R, z }
}

function round(n: number) {
  return Math.round(n * 10) / 10
}

// Builds a path from a polyline, breaking it wherever it goes behind the globe.
function toPath(points: Vec3[], minZ = 0): string {
  let d = ""
  let pen = false
  for (const p of points) {
    const q = project(p)
    if (q.z < minZ) {
      pen = false
      continue
    }
    d += `${pen ? "L" : "M"}${round(q.x)} ${round(q.y)}`
    pen = true
  }
  return d
}

const GRATICULE_PATH = graticule(15, 5)
  .map((line) => toPath(line))
  .join("")

const ROUTE_PATHS = ROUTES.map(([a, b]) => toPath(routeArc(a, b, 24), -0.05))

const CITY_POINTS = CITIES.map((c) => project(latLonToVec(c.lat, c.lon))).filter((p) => p.z > 0)

function GlobeStatic({ className }: { className?: string }) {
  return (
    <svg viewBox="-12 -12 124 124" className={className} aria-hidden="true" focusable="false">
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--globe-line)" strokeOpacity={0.55} strokeWidth={0.25} />
      <path
        d={GRATICULE_PATH}
        fill="none"
        stroke="var(--globe-line)"
        strokeOpacity={0.32}
        strokeWidth={0.14}
        strokeLinecap="round"
      />
      {ROUTE_PATHS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--globe-route)" strokeOpacity={0.7} strokeWidth={0.22} />
      ))}
      {CITY_POINTS.map((p, i) => (
        <circle key={i} cx={round(p.x)} cy={round(p.y)} r={0.55} fill="var(--globe-route)" />
      ))}
      {/* Tilted orbit around the globe — echoes the ring held up in the Atlas logo. */}
      <g transform={`rotate(${ORBIT_TILT} ${C} ${C})`}>
        <path
          d={`M${C - ORBIT_RX} ${C} A ${ORBIT_RX} ${ORBIT_RY} 0 0 1 ${C + ORBIT_RX} ${C}`}
          fill="none"
          stroke="var(--globe-line)"
          strokeOpacity={0.14}
          strokeWidth={0.2}
        />
        <path
          d={`M${C - ORBIT_RX} ${C} A ${ORBIT_RX} ${ORBIT_RY} 0 0 0 ${C + ORBIT_RX} ${C}`}
          fill="none"
          stroke="var(--globe-line)"
          strokeOpacity={0.5}
          strokeWidth={0.25}
        />
      </g>
    </svg>
  )
}

export { GlobeStatic }
