import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'
import { FIGURES, place, seeded, type Hue } from './layouts'

export type Palette = Record<Hue, string> & { ground: string }

export interface WelcomeScene {
  show: (step: number) => void
  setPalette: (palette: Palette, day: boolean) => void
  dispose: () => void
}

const FIELD = 1400
const FIGURE = 1700
const TRAIL = 28
const MORPH_MS = 1900

/** Mirrors the welcome's CSS breakpoint: text left, sky right. */
export const sideBySide = (width: number, height: number) => width >= 640 && width / height >= 1.25

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

/* Figure stars travel from one figure to the next along an arc through depth, each with its own delay. */
const FIGURE_VERTEX = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aColorFrom;
  attribute vec3 aColorTo;
  attribute vec2 aSize;
  attribute float aDelay;
  uniform float uProgress;
  uniform float uTime;
  uniform float uScale;
  uniform float uMotion;
  uniform float uDay;
  varying vec3 vColor;
  varying float vBig;
  varying float vAlpha;

  float ease(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }

  void main() {
    float p = ease(clamp(uProgress * 1.5 - aDelay * 0.5, 0.0, 1.0));
    vec3 pos = mix(aFrom, aTo, p);
    pos.z += sin(p * 3.14159) * (1.5 + aDelay * 2.5) * uMotion;
    pos.xy += vec2(sin(uTime * 0.6 + aDelay * 40.0), cos(uTime * 0.5 + aDelay * 31.0)) * 0.025 * uMotion;
    float size = mix(aSize.x, aSize.y, p);
    vColor = mix(aColorFrom, aColorTo, p);
    vBig = step(1.1, size);
    // Halo dust is faint; by day the line stars are finer and lighter so the lines read as dotted ink.
    bool line = size < 0.8;
    vAlpha = size < 0.2 ? mix(0.5, 0.3, uDay) : (line ? mix(1.0, 0.5, uDay) : 1.0);
    if (line) size *= mix(1.0, 0.78, uDay);
    float twinkle = 1.0 + 0.18 * sin(uTime * 2.2 + aDelay * 60.0) * uMotion;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * twinkle * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

/* Night: glowing light (additive). Day: printed ink dots, big stars get an ink ring like the app's chart. */
const FIGURE_FRAGMENT = /* glsl */ `
  uniform float uDay;
  uniform vec3 uInk;
  varying vec3 vColor;
  varying float vBig;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    if (uDay > 0.5) {
      float edge = smoothstep(0.5, 0.44, d);
      float ring = smoothstep(0.3, 0.36, d) * vBig;
      gl_FragColor = vec4(mix(vColor, uInk, ring), edge * vAlpha);
    } else {
      // Additive light on a transparent canvas: the alpha must fade with the glow, or the edge reads as a dark disc.
      float light = (smoothstep(0.2, 0.0, d) * 0.9 + exp(-d * d * 22.0) * 0.75) * vAlpha;
      gl_FragColor = vec4(vColor, min(1.0, light));
    }
  }
`

const FIELD_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uScale;
  uniform float uMotion;
  varying float vAlpha;

  void main() {
    vAlpha = 0.35 + 0.65 * fract(aSeed * 7.31);
    vAlpha *= 0.75 + 0.25 * sin(uTime * (0.6 + fract(aSeed * 3.7) * 1.6) + aSeed * 50.0) * uMotion;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (0.12 + 0.22 * fract(aSeed * 13.1)) * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const FIELD_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uDay;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = uDay > 0.5 ? smoothstep(0.5, 0.35, d) * vAlpha * 0.55 : exp(-d * d * 18.0) * vAlpha;
    gl_FragColor = vec4(uColor, a);
  }
`

/**
 * The welcome's sky: a slowly turning star field and a flock of stars that gathers into each step's figure
 * (brand → chord chart → constellation → hallazgos). Returns null when WebGL is not available.
 */
export function createWelcomeScene(canvas: HTMLCanvasElement, options: { reduced: boolean; palette: Palette; day: boolean }): WelcomeScene | null {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' })
  } catch {
    return null
  }
  const motion = options.reduced ? 0 : 1
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

  const scene = new Scene()
  const camera = new PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.set(0, 0, 12)

  const random = seeded(20261013)
  const colors = new Map<Hue, Color>()
  let ink = new Color()
  let day = options.day

  // ---------- star field ----------
  const fieldPositions = new Float32Array(FIELD * 3)
  const fieldSeeds = new Float32Array(FIELD)
  for (let i = 0; i < FIELD; i += 1) {
    const u = random() * 2 - 1
    const angle = random() * Math.PI * 2
    const radius = 14 + random() * 18
    const ring = Math.sqrt(1 - u * u)
    fieldPositions.set([Math.cos(angle) * ring * radius, u * radius, Math.sin(angle) * ring * radius - 6], i * 3)
    fieldSeeds[i] = random()
  }
  const fieldGeometry = new BufferGeometry()
  fieldGeometry.setAttribute('position', new BufferAttribute(fieldPositions, 3))
  fieldGeometry.setAttribute('aSeed', new BufferAttribute(fieldSeeds, 1))
  const fieldMaterial = new ShaderMaterial({
    vertexShader: FIELD_VERTEX,
    fragmentShader: FIELD_FRAGMENT,
    uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uMotion: { value: motion }, uColor: { value: new Color() }, uDay: { value: 0 } },
    transparent: true,
    depthWrite: false,
  })
  const field = new Points(fieldGeometry, fieldMaterial)
  scene.add(field)

  // ---------- figure ----------
  const halo = Array.from({ length: FIGURE }, () => {
    const angle = random() * Math.PI * 2
    const radius = 3.4 + random() * 3.2
    return [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.75, (random() - 0.5) * 4] as const
  })
  const attr = (size: number) => new BufferAttribute(new Float32Array(FIGURE * size), size)
  const figureGeometry = new BufferGeometry()
  const from = attr(3)
  const to = attr(3)
  const colorFrom = attr(3)
  const colorTo = attr(3)
  const sizes = attr(2)
  const delays = attr(1)
  for (let i = 0; i < FIGURE; i += 1) delays.setX(i, random())
  figureGeometry.setAttribute('position', to)
  figureGeometry.setAttribute('aFrom', from)
  figureGeometry.setAttribute('aTo', to)
  figureGeometry.setAttribute('aColorFrom', colorFrom)
  figureGeometry.setAttribute('aColorTo', colorTo)
  figureGeometry.setAttribute('aSize', sizes)
  figureGeometry.setAttribute('aDelay', delays)
  const figureMaterial = new ShaderMaterial({
    vertexShader: FIGURE_VERTEX,
    fragmentShader: FIGURE_FRAGMENT,
    uniforms: {
      uProgress: { value: 1 },
      uTime: { value: 0 },
      uScale: { value: 1 },
      uMotion: { value: motion },
      uDay: { value: 0 },
      uInk: { value: new Color() },
    },
    transparent: true,
    depthWrite: false,
  })
  const figure = new Points(figureGeometry, figureMaterial)
  figure.frustumCulled = false

  // ---------- shooting star ----------
  const trailGeometry = new BufferGeometry()
  trailGeometry.setAttribute('aFrom', new BufferAttribute(new Float32Array(TRAIL * 3), 3))
  const trailPositions = new BufferAttribute(new Float32Array(TRAIL * 3), 3)
  trailGeometry.setAttribute('position', trailPositions)
  trailGeometry.setAttribute('aTo', trailPositions)
  const trailColors = new BufferAttribute(new Float32Array(TRAIL * 3), 3)
  trailGeometry.setAttribute('aColorFrom', trailColors)
  trailGeometry.setAttribute('aColorTo', trailColors)
  const trailSizes = new BufferAttribute(new Float32Array(TRAIL * 2), 2)
  trailGeometry.setAttribute('aSize', trailSizes)
  trailGeometry.setAttribute('aDelay', new BufferAttribute(new Float32Array(TRAIL), 1))
  const trailMaterial = figureMaterial.clone()
  trailMaterial.uniforms.uMotion.value = 0
  const trail = new Points(trailGeometry, trailMaterial)
  trail.frustumCulled = false
  trail.visible = false

  const group = new Group()
  group.add(figure, trail)
  scene.add(group)

  // ---------- morphing ----------
  let step = 0
  let morphStart = -Infinity
  const current = { positions: new Float32Array(FIGURE * 3), sizes: new Float32Array(FIGURE), hues: [] as Hue[] }

  const progressNow = (now: number) => (motion ? clamp01((now - morphStart) / MORPH_MS) : 1)

  /** Where each particle is right now, so an interrupted morph continues from there. */
  function snapshot(now: number) {
    const p = progressNow(now)
    for (let i = 0; i < FIGURE; i += 1) {
      const local = ease(clamp01(p * 1.5 - delays.getX(i) * 0.5))
      for (let axis = 0; axis < 3; axis += 1) {
        const a = from.array[i * 3 + axis]
        const b = to.array[i * 3 + axis]
        from.array[i * 3 + axis] = a + (b - a) * local
      }
      const sa = sizes.getX(i)
      const sb = sizes.getY(i)
      sizes.setX(i, sa + (sb - sa) * local)
      for (let c = 0; c < 3; c += 1) {
        const a = colorFrom.array[i * 3 + c]
        const b = colorTo.array[i * 3 + c]
        colorFrom.array[i * 3 + c] = a + (b - a) * local
      }
    }
  }

  function target(index: number) {
    const placements = place(FIGURES[index], FIGURE)
    // Shuffle which particle takes which place, so the flock mixes when it changes figure.
    const order = placements.map((_, i) => i)
    const shuffle = seeded(index * 97 + 5)
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(shuffle() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    current.hues = []
    order.forEach((slot, i) => {
      const placement = placements[slot]
      const spare = placement.size === 0
      const [hx, hy, hz] = halo[i]
      to.setXYZ(i, spare ? hx : placement.x, spare ? hy : placement.y, spare ? hz : 0)
      sizes.setY(i, spare ? 0.1 : placement.size)
      current.hues[i] = spare ? 'ink' : placement.hue
    })
    paintTargets()
  }

  function paintTargets() {
    current.hues.forEach((hue, i) => {
      const color = colors.get(hue) ?? ink
      colorTo.setXYZ(i, color.r, color.g, color.b)
    })
    colorTo.needsUpdate = true
  }

  function show(index: number) {
    const now = performance.now()
    snapshot(now)
    step = Math.max(0, Math.min(FIGURES.length - 1, index))
    target(step)
    from.needsUpdate = true
    to.needsUpdate = true
    sizes.needsUpdate = true
    colorFrom.needsUpdate = true
    morphStart = now
    nextShootingStar = now + 1600
  }

  function setPalette(palette: Palette, isDay: boolean) {
    day = isDay
    for (const hue of ['ink', 'accent', 'tonic', 'sub', 'dom', 'borrowed'] as Hue[]) colors.set(hue, new Color(palette[hue]))
    ink = new Color(palette.ink)
    const blending = day ? NormalBlending : AdditiveBlending
    for (const material of [figureMaterial, trailMaterial, fieldMaterial]) {
      material.blending = blending
      material.uniforms.uDay.value = day ? 1 : 0
      material.needsUpdate = true
    }
    figureMaterial.uniforms.uInk.value.copy(ink)
    trailMaterial.uniforms.uInk.value.copy(ink)
    fieldMaterial.uniforms.uColor.value.copy(ink)
    // Recolour in place: once a morph has settled, the new colours apply at once.
    paintTargets()
    if (progressNow(performance.now()) >= 1) colorFrom.copyArray(colorTo.array)
    colorFrom.needsUpdate = true
  }

  // First figure: rise out of the halo.
  for (let i = 0; i < FIGURE; i += 1) {
    const [hx, hy, hz] = halo[i]
    from.setXYZ(i, hx * 1.6, hy * 1.6, hz - 4)
  }
  setPalette(options.palette, options.day)
  for (let i = 0; i < FIGURE; i += 1) colorFrom.setXYZ(i, ink.r, ink.g, ink.b)
  target(0)
  morphStart = performance.now()

  // ---------- shooting stars (only on the last steps, and only with motion) ----------
  let nextShootingStar = performance.now() + 2500
  let shooting: { start: number; x: number; y: number; dx: number; dy: number } | null = null

  function updateShootingStar(now: number) {
    if (!motion || step < 2) {
      trail.visible = false
      return
    }
    if (!shooting && now > nextShootingStar) {
      const fromLeft = random() < 0.5
      shooting = { start: now, x: fromLeft ? -7 : 7, y: 3 + random() * 1.5, dx: fromLeft ? 1 : -1, dy: -0.42 - random() * 0.2 }
    }
    if (!shooting) return
    const t = (now - shooting.start) / 1100
    if (t > 1) {
      shooting = null
      trail.visible = false
      nextShootingStar = now + 3500 + random() * 3500
      return
    }
    trail.visible = true
    const head = t * 14
    const accent = colors.get('accent') ?? ink
    for (let i = 0; i < TRAIL; i += 1) {
      const back = head - i * 0.09
      trailPositions.setXYZ(i, shooting.x + shooting.dx * back, shooting.y + shooting.dy * back, 1)
      const fade = (1 - i / TRAIL) * Math.sin(t * Math.PI)
      trailSizes.setXY(i, 0.55 * fade, 0.55 * fade)
      trailColors.setXYZ(i, accent.r, accent.g, accent.b)
    }
    trailPositions.needsUpdate = true
    trailSizes.needsUpdate = true
    trailColors.needsUpdate = true
  }

  // ---------- layout, pointer, loop ----------
  const pointer = { x: 0, y: 0 }
  const onPointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1
  }
  if (motion) window.addEventListener('pointermove', onPointer)

  function resize() {
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    const scale = height * renderer.getPixelRatio() * 0.24
    for (const material of [figureMaterial, trailMaterial, fieldMaterial]) material.uniforms.uScale.value = scale
    // Side by side (as the CSS lays out the text): the figure fills the right half. Otherwise it sits above the text.
    const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
    const halfWidth = halfHeight * camera.aspect
    if (sideBySide(width, height)) {
      const scale = Math.min(1.15, (halfWidth * 0.5) / 3.1, halfHeight / 3.0)
      group.position.set(halfWidth * 0.48, 0, 0)
      group.scale.setScalar(scale)
    } else {
      const scale = Math.min(1, halfWidth / 3.4, (halfHeight * 0.4) / 2.7)
      group.position.set(0, halfHeight * 0.52, 0)
      group.scale.setScalar(scale)
    }
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  let frame = 0
  let stopped = false
  const startedAt = performance.now()
  function tick(now: number) {
    if (stopped) return
    frame = requestAnimationFrame(tick)
    if (document.hidden) return
    const time = motion ? (now - startedAt) / 1000 : 0
    figureMaterial.uniforms.uProgress.value = progressNow(now)
    figureMaterial.uniforms.uTime.value = time
    fieldMaterial.uniforms.uTime.value = time
    if (motion) {
      field.rotation.y = time * 0.012
      field.rotation.x = Math.sin(time * 0.05) * 0.04
      group.rotation.y += (pointer.x * 0.2 + Math.sin(time * 0.3) * 0.05 - group.rotation.y) * 0.04
      group.rotation.x += (pointer.y * 0.12 - group.rotation.x) * 0.04
    }
    updateShootingStar(now)
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(tick)

  return {
    show,
    setPalette,
    dispose() {
      stopped = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('pointermove', onPointer)
      fieldGeometry.dispose()
      figureGeometry.dispose()
      trailGeometry.dispose()
      fieldMaterial.dispose()
      figureMaterial.dispose()
      trailMaterial.dispose()
      renderer.dispose()
    },
  }
}
