// Shared, framework-free data and math for the hero globe. Used by both the
// WebGL scene (globe-canvas.tsx) and the static SVG fallback (globe-static.tsx)
// so the two render the exact same drawing from the same orientation.

export type Vec3 = [number, number, number]

const DEG = Math.PI / 180

// The globe faces Brazil, which sits a little right of center so it peeks
// out beside the phone mockup in the hero.
export const VIEW_CENTER = { lat: -12, lon: -64 }

// Small axial tilt so the drawing does not look perfectly "upright".
export const VIEW_ROLL = -8 * DEG

// Tilted orbit ring around the globe (echoes the ring in the Atlas logo).
// radius: relative to the globe; squash: apparent height/width of the
// ellipse; tiltDeg: on-screen roll (negative = rising to the right).
export const ORBIT = { radius: 1.26, squash: 0.22, tiltDeg: -14 }

// Brazilian capitals and large hubs — where a small lender's customers are.
export const CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "São Paulo", lat: -23.55, lon: -46.63 },
  { name: "Rio de Janeiro", lat: -22.91, lon: -43.17 },
  { name: "Belo Horizonte", lat: -19.92, lon: -43.94 },
  { name: "Brasília", lat: -15.79, lon: -47.88 },
  { name: "Salvador", lat: -12.97, lon: -38.5 },
  { name: "Recife", lat: -8.05, lon: -34.88 },
  { name: "Fortaleza", lat: -3.73, lon: -38.52 },
  { name: "Manaus", lat: -3.12, lon: -60.02 },
  { name: "Belém", lat: -1.46, lon: -48.49 },
  { name: "Porto Alegre", lat: -30.03, lon: -51.23 },
  { name: "Curitiba", lat: -25.43, lon: -49.27 },
  { name: "Goiânia", lat: -16.68, lon: -49.25 },
  { name: "Cuiabá", lat: -15.6, lon: -56.1 },
  { name: "Campo Grande", lat: -20.47, lon: -54.62 },
  { name: "São Luís", lat: -2.53, lon: -44.3 },
  { name: "Porto Velho", lat: -8.76, lon: -63.9 },
]

// Pairs of CITIES indexes: the "payment routes" drawn as arcs.
export const ROUTES: [number, number][] = [
  [0, 3],
  [0, 6],
  [0, 7],
  [1, 4],
  [2, 8],
  [3, 5],
  [3, 15],
  [9, 0],
  [10, 12],
  [11, 14],
  [13, 1],
  [4, 6],
  [7, 8],
  [12, 3],
]

export function latLonToVec(lat: number, lon: number, radius = 1): Vec3 {
  const la = lat * DEG
  const lo = lon * DEG
  return [radius * Math.cos(la) * Math.sin(lo), radius * Math.sin(la), radius * Math.cos(la) * Math.cos(lo)]
}

// Graticule polylines (parallels and meridians), as arrays of points on the
// unit sphere. `step` is the angular spacing between lines, `sample` the
// angular resolution along each line.
export function graticule(step: number, sample: number): Vec3[][] {
  const lines: Vec3[][] = []
  for (let lat = -90 + step; lat < 90; lat += step) {
    const line: Vec3[] = []
    for (let lon = -180; lon <= 180; lon += sample) line.push(latLonToVec(lat, lon))
    lines.push(line)
  }
  for (let lon = -180; lon < 180; lon += step) {
    const line: Vec3[] = []
    for (let lat = -90; lat <= 90; lat += sample) line.push(latLonToVec(lat, lon))
    lines.push(line)
  }
  return lines
}

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

// Great-circle arc between two cities, lifted off the surface in the middle
// so routes read as "flights" of money rather than lines painted on the map.
export function routeArc(a: number, b: number, segments = 48): Vec3[] {
  const p = latLonToVec(CITIES[a].lat, CITIES[a].lon)
  const q = latLonToVec(CITIES[b].lat, CITIES[b].lon)
  const dot = Math.min(1, Math.max(-1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]))
  const omega = Math.acos(dot)
  const lift = 0.04 + omega * 0.45
  const points: Vec3[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    let v: Vec3
    if (omega < 1e-6) {
      v = p
    } else {
      const s1 = Math.sin((1 - t) * omega) / Math.sin(omega)
      const s2 = Math.sin(t * omega) / Math.sin(omega)
      v = normalize([p[0] * s1 + q[0] * s2, p[1] * s1 + q[1] * s2, p[2] * s1 + q[2] * s2])
    }
    const r = 1 + lift * Math.sin(Math.PI * t)
    points.push([v[0] * r, v[1] * r, v[2] * r])
  }
  return points
}

// Rotation that brings VIEW_CENTER to face the viewer (+z), then rolls it.
// Same convention as a three.js Euler in "XYZ" order: (x, y, z) radians.
export const VIEW_ROTATION: Vec3 = [VIEW_CENTER.lat * DEG, -VIEW_CENTER.lon * DEG, VIEW_ROLL]

// Applies VIEW_ROTATION to a point: spin around the polar axis (Ry), tilt
// (Rx), then roll in screen space (Rz). globe-canvas.tsx reproduces the same
// order with an inner "XYZ" Euler group (Ry then Rx) inside a rolled group.
export function orient(v: Vec3): Vec3 {
  const [ax, ay, az] = VIEW_ROTATION
  // Ry
  let x = v[0] * Math.cos(ay) + v[2] * Math.sin(ay)
  let z = -v[0] * Math.sin(ay) + v[2] * Math.cos(ay)
  let y = v[1]
  // Rx
  const y2 = y * Math.cos(ax) - z * Math.sin(ax)
  const z2 = y * Math.sin(ax) + z * Math.cos(ax)
  y = y2
  z = z2
  // Rz (screen roll)
  const x3 = x * Math.cos(az) - y * Math.sin(az)
  const y3 = x * Math.sin(az) + y * Math.cos(az)
  x = x3
  return [x, y3, z]
}
