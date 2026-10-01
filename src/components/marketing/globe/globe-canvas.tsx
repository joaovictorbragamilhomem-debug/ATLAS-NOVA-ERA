"use client"

import * as React from "react"
import * as THREE from "three"
import { CITIES, ORBIT, ROUTES, VIEW_CENTER, VIEW_ROLL, graticule, latLonToVec, routeArc, type Vec3 } from "./globe-data"

// WebGL version of the hero globe: a wireframe Earth facing Brazil that
// "draws itself" on load, with payments travelling between cities as light
// pulses along the arcs. Loaded lazily (see hero-globe.tsx) and only when the
// device can afford it; the static SVG stays underneath until the first frame.

const DEG = Math.PI / 180
const MAX_DPR = 1.5
const DRAW_IN_SECONDS = 2.4

const LINE_VERTEX = /* glsl */ `
  attribute float aProgress;
  attribute float aSeed;
  varying float vProgress;
  varying float vSeed;
  varying float vFacing;
  void main() {
    vProgress = aProgress;
    vSeed = aSeed;
    vFacing = normalize(normalMatrix * normalize(position)).z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const GRID_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uReveal;
  varying float vProgress;
  varying float vFacing;
  void main() {
    float drawn = 1.0 - smoothstep(uReveal - 0.03, uReveal, vProgress);
    float a = uOpacity * drawn * mix(0.25, 1.0, clamp(vFacing, 0.0, 1.0));
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

const ROUTE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uReveal;
  varying float vProgress;
  varying float vSeed;
  void main() {
    float drawn = 1.0 - smoothstep(uReveal - 0.05, uReveal, vProgress);
    float head = fract(uTime * 0.11 + vSeed) * 1.6 - 0.3;
    float d = head - vProgress;
    float pulse = d > 0.0 && d < 0.28 ? pow(1.0 - d / 0.28, 2.0) : 0.0;
    float a = drawn * (0.32 + pulse * 0.68);
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

const POINT_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uDpr;
  uniform float uReveal;
  varying float vAlpha;
  void main() {
    vAlpha = uReveal * (0.75 + 0.25 * sin(uTime * 1.4 + aSeed * 6.2831));
    gl_PointSize = uSize * uDpr * (0.85 + 0.15 * sin(uTime * 1.4 + aSeed * 6.2831));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const POINT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = vAlpha * (1.0 - smoothstep(0.3, 0.5, r));
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

// Polylines → LineSegments geometry with a 0..1 progress along each line and
// a per-line random seed.
function polylineGeometry(lines: Vec3[][], seedFor: (index: number) => number) {
  const positions: number[] = []
  const progress: number[] = []
  const seeds: number[] = []
  lines.forEach((line, li) => {
    const seed = seedFor(li)
    for (let i = 0; i < line.length - 1; i++) {
      positions.push(...line[i], ...line[i + 1])
      progress.push(i / (line.length - 1), (i + 1) / (line.length - 1))
      seeds.push(seed, seed)
    }
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("aProgress", new THREE.Float32BufferAttribute(progress, 1))
  geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1))
  return geometry
}

function readThemeColors(node: HTMLElement) {
  const style = getComputedStyle(node)
  const line = style.getPropertyValue("--globe-line").trim() || "#f6f1e8"
  const route = style.getPropertyValue("--globe-route").trim() || "#2dd4a8"
  return { line: new THREE.Color(line), route: new THREE.Color(route) }
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3)

type GlobeCanvasProps = {
  onReady?: () => void
  onError?: () => void
}

export default function GlobeCanvas({ onReady, onError }: GlobeCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  // Keep the latest callbacks without re-running the whole scene effect.
  const callbacks = React.useRef({ onReady, onError })
  React.useEffect(() => {
    callbacks.current = { onReady, onError }
  })

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" })
    } catch {
      callbacks.current.onError?.()
      return
    }
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"
    renderer.domElement.style.display = "block"
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    // Narrow FOV keeps the perspective close to the orthographic SVG fallback.
    const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 50)
    // Distance chosen so the globe fills the same share of the box as in the
    // SVG fallback (radius 46 of a 124-unit viewBox).
    const cameraDistance = 1 / (Math.tan(11 * DEG) * (46 / 62))
    camera.position.set(0, 0, cameraDistance)

    const colors = readThemeColors(container)

    // tilt (parallax + roll) → globe (faces Brazil, slow swing)
    const tilt = new THREE.Group()
    tilt.rotation.z = VIEW_ROLL
    scene.add(tilt)
    const globe = new THREE.Group()
    globe.rotation.order = "XYZ"
    globe.rotation.set(VIEW_CENTER.lat * DEG, -VIEW_CENTER.lon * DEG, 0)
    tilt.add(globe)

    // Invisible sphere that only writes depth, hiding the far side of every
    // line so the wireframe reads as a solid object.
    const occluderGeometry = new THREE.SphereGeometry(0.995, 48, 32)
    const occluderMaterial = new THREE.MeshBasicMaterial({ colorWrite: false })
    const occluder = new THREE.Mesh(occluderGeometry, occluderMaterial)
    occluder.renderOrder = -1
    globe.add(occluder)

    const gridGeometry = polylineGeometry(graticule(15, 2), () => 0)
    const gridMaterial = new THREE.ShaderMaterial({
      vertexShader: LINE_VERTEX,
      fragmentShader: GRID_FRAGMENT,
      uniforms: {
        uColor: { value: colors.line },
        uOpacity: { value: 0.34 },
        uReveal: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    })
    globe.add(new THREE.LineSegments(gridGeometry, gridMaterial))

    const routeLines = ROUTES.map(([a, b]) => routeArc(a, b, 64))
    const routeGeometry = polylineGeometry(routeLines, (i) => (i * 0.618034) % 1)
    const routeMaterial = new THREE.ShaderMaterial({
      vertexShader: LINE_VERTEX,
      fragmentShader: ROUTE_FRAGMENT,
      uniforms: {
        uColor: { value: colors.route },
        uTime: { value: 0 },
        uReveal: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
    globe.add(new THREE.LineSegments(routeGeometry, routeMaterial))

    const cityPositions = CITIES.flatMap((c) => latLonToVec(c.lat, c.lon, 1.004))
    const citySeeds = CITIES.map((_, i) => (i * 0.37) % 1)
    const cityGeometry = new THREE.BufferGeometry()
    cityGeometry.setAttribute("position", new THREE.Float32BufferAttribute(cityPositions, 3))
    cityGeometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(citySeeds, 1))
    const cityMaterial = new THREE.ShaderMaterial({
      vertexShader: POINT_VERTEX,
      fragmentShader: POINT_FRAGMENT,
      uniforms: {
        uColor: { value: colors.route },
        uTime: { value: 0 },
        uSize: { value: 9 },
        uDpr: { value: dpr },
        uReveal: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    })
    globe.add(new THREE.Points(cityGeometry, cityMaterial))

    // Orbit ring + a small "satellite" travelling on it. Lives in `tilt`, not
    // `globe`, so it does not swing with the Earth.
    const orbit = new THREE.Group()
    orbit.rotation.z = -ORBIT.tiltDeg * DEG - VIEW_ROLL
    tilt.add(orbit)
    const ringPlane = new THREE.Group()
    ringPlane.rotation.x = Math.asin(ORBIT.squash)
    orbit.add(ringPlane)
    const ringPoints: Vec3[] = []
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2
      ringPoints.push([Math.sin(a) * ORBIT.radius, 0, Math.cos(a) * ORBIT.radius])
    }
    const ringGeometry = polylineGeometry([ringPoints], () => 0)
    const ringMaterial = new THREE.ShaderMaterial({
      vertexShader: LINE_VERTEX,
      fragmentShader: GRID_FRAGMENT,
      uniforms: {
        uColor: { value: colors.line },
        uOpacity: { value: 0.5 },
        uReveal: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    })
    ringPlane.add(new THREE.LineSegments(ringGeometry, ringMaterial))

    const satelliteGeometry = new THREE.BufferGeometry()
    satelliteGeometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3))
    satelliteGeometry.setAttribute("aSeed", new THREE.Float32BufferAttribute([0.25], 1))
    const satelliteMaterial = new THREE.ShaderMaterial({
      vertexShader: POINT_VERTEX,
      fragmentShader: POINT_FRAGMENT,
      uniforms: {
        uColor: { value: colors.line },
        uTime: { value: 0 },
        uSize: { value: 6 },
        uDpr: { value: dpr },
        uReveal: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    })
    const satellite = new THREE.Points(satelliteGeometry, satelliteMaterial)
    ringPlane.add(satellite)

    // Silhouette outline: the circle where the sphere meets its tangent cone
    // from the camera. Lives in `tilt` so it always faces the viewer.
    const limbPoints: Vec3[] = []
    const limbZ = 1 / cameraDistance
    const limbRadius = Math.sqrt(1 - limbZ * limbZ)
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2
      limbPoints.push([Math.cos(a) * limbRadius, Math.sin(a) * limbRadius, limbZ])
    }
    const limbGeometry = polylineGeometry([limbPoints], () => 0)
    const limbMaterial = new THREE.ShaderMaterial({
      vertexShader: LINE_VERTEX,
      fragmentShader: GRID_FRAGMENT,
      uniforms: {
        uColor: { value: colors.line },
        uOpacity: { value: 0.95 },
        uReveal: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    })
    const limb = new THREE.LineSegments(limbGeometry, limbMaterial)
    limb.renderOrder = 1
    tilt.add(limb)

    // --- sizing -----------------------------------------------------------
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (width === 0 || height === 0) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    // --- theme --------------------------------------------------------------
    const themeObserver = new MutationObserver(() => {
      const next = readThemeColors(container)
      gridMaterial.uniforms.uColor.value = next.line
      ringMaterial.uniforms.uColor.value = next.line
      limbMaterial.uniforms.uColor.value = next.line
      satelliteMaterial.uniforms.uColor.value = next.line
      routeMaterial.uniforms.uColor.value = next.route
      cityMaterial.uniforms.uColor.value = next.route
      if (!running) renderer.render(scene, camera)
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    // --- pointer parallax ---------------------------------------------------
    const pointer = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true })

    // --- loop (paused off-screen and in hidden tabs) ------------------------
    let frame = 0
    let running = false
    let inView = true
    let elapsed = 0
    let last = 0
    let readySent = false

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      elapsed += dt

      const reveal = easeOutCubic(elapsed / DRAW_IN_SECONDS)
      const routeReveal = easeOutCubic((elapsed - DRAW_IN_SECONDS * 0.5) / DRAW_IN_SECONDS)
      gridMaterial.uniforms.uReveal.value = reveal * 1.05
      ringMaterial.uniforms.uReveal.value = reveal * 1.05
      limbMaterial.uniforms.uReveal.value = reveal * 1.05
      routeMaterial.uniforms.uReveal.value = routeReveal * 1.1
      routeMaterial.uniforms.uTime.value = elapsed
      cityMaterial.uniforms.uReveal.value = routeReveal
      cityMaterial.uniforms.uTime.value = elapsed
      satelliteMaterial.uniforms.uReveal.value = reveal
      satelliteMaterial.uniforms.uTime.value = elapsed

      const orbitAngle = elapsed * 0.25
      satellite.position.set(Math.sin(orbitAngle) * ORBIT.radius, 0, Math.cos(orbitAngle) * ORBIT.radius)

      globe.rotation.y = -VIEW_CENTER.lon * DEG + Math.sin(elapsed * 0.12) * 0.3
      tilt.rotation.x += (pointer.y * 0.1 - tilt.rotation.x) * 0.04
      tilt.rotation.y += (pointer.x * 0.16 - tilt.rotation.y) * 0.04

      renderer.render(scene, camera)
      if (!readySent) {
        readySent = true
        callbacks.current.onReady?.()
      }
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running || !inView || document.hidden) return
      running = true
      last = 0
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) start()
      else stop()
    })
    intersectionObserver.observe(container)

    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener("visibilitychange", onVisibility)

    const onContextLost = (event: Event) => {
      event.preventDefault()
      stop()
      callbacks.current.onError?.()
    }
    renderer.domElement.addEventListener("webglcontextlost", onContextLost)

    start()

    return () => {
      stop()
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      themeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pointermove", onPointerMove)
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost)
      for (const disposable of [
        occluderGeometry,
        occluderMaterial,
        gridGeometry,
        gridMaterial,
        routeGeometry,
        routeMaterial,
        cityGeometry,
        cityMaterial,
        ringGeometry,
        ringMaterial,
        limbGeometry,
        limbMaterial,
        satelliteGeometry,
        satelliteMaterial,
      ]) {
        disposable.dispose()
      }
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0" />
}
