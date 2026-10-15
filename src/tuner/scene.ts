import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  NormalBlending,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

export interface TunerPalette {
  ink: string
  accent: string
  /** In tune. */
  tune: string
  /** Flat (below the note). */
  flat: string
  /** Sharp (above the note). */
  sharp: string
}

export interface TunerState {
  /** Cents off the note, −50…50 (null when nothing is heard). */
  cents: number | null
  inTune: boolean
}

export interface TunerScene {
  /** The ring's radius in CSS pixels, centred on the canvas (the page draws the dial over it at the same size). */
  layout: (radius: number) => void
  update: (state: TunerState) => void
  setPalette: (palette: TunerPalette, day: boolean) => void
  dispose: () => void
}

const RING = 2600
const FIELD = 520

/*
 * The ring of stars: a string seen end-on. Off pitch it vibrates in lobes (more lobes and wider the further off),
 * turning one way when flat and the other when sharp; in tune it settles into a crisp circle that sends ripples out.
 */
const RING_VERTEX = /* glsl */ `
  attribute float aAngle;
  attribute float aSeed;
  uniform float uTime;
  uniform float uDetune;
  uniform float uSignal;
  uniform float uLock;
  uniform float uRadius;
  uniform float uDpr;
  uniform float uMotion;
  varying float vAlpha;
  varying float vDetune;

  void main() {
    float d = uDetune * uSignal;
    float ad = abs(d);
    float t = uTime * uMotion;
    float a = aAngle + t * (0.05 + d * 0.8);
    float lobes = 3.0 + floor(ad * 7.0);
    float idle = (1.0 - uSignal) * 0.018 * sin(t * 0.8 + aAngle * 2.0);
    float amp = 0.008 + ad * 0.09;
    float wobble = sin(a * lobes + t * (1.2 + ad * 7.0)) * amp + idle;
    float spread = (fract(aSeed * 91.7) - 0.5) * (0.03 + ad * 0.05) * (1.0 - uLock * 0.75);
    float r = uRadius * (1.0 + wobble + spread);
    // One star in six belongs to the ripples that leave the ring while it is in tune.
    float ripple = step(0.83, fract(aSeed * 13.37));
    float pulse = fract(t * 0.55 + fract(aSeed * 5.1) * 0.35) * uLock * uMotion;
    r += ripple * pulse * uRadius * 0.75;
    vAlpha = (0.45 + 0.55 * fract(aSeed * 7.13)) * (1.0 - ripple * pulse);
    vAlpha *= 0.8 + 0.2 * sin(t * 2.0 + aSeed * 40.0);
    vDetune = d;
    gl_PointSize = (1.6 + 2.4 * fract(aSeed * 3.31) + uLock * 1.4 + ad * 1.2) * uDpr;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(cos(a) * r, sin(a) * r, 0.0, 1.0);
  }
`

const RING_FRAGMENT = /* glsl */ `
  uniform vec3 uIdle;
  uniform vec3 uTune;
  uniform vec3 uFlat;
  uniform vec3 uSharp;
  uniform float uSignal;
  uniform float uDay;
  varying float vAlpha;
  varying float vDetune;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;
    vec3 off = vDetune < 0.0 ? uFlat : uSharp;
    vec3 color = mix(uTune, off, smoothstep(0.06, 0.5, abs(vDetune)));
    color = mix(uIdle, color, uSignal);
    if (uDay > 0.5) {
      gl_FragColor = vec4(color, smoothstep(0.5, 0.38, dist) * vAlpha);
    } else {
      float light = (smoothstep(0.22, 0.0, dist) * 0.9 + exp(-dist * dist * 20.0) * 0.7) * vAlpha;
      gl_FragColor = vec4(color, min(1.0, light));
    }
  }
`

const FIELD_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uDpr;
  uniform float uMotion;
  varying float vAlpha;

  void main() {
    vAlpha = 0.25 + 0.6 * fract(aSeed * 7.31);
    vAlpha *= 0.7 + 0.3 * sin(uTime * uMotion * (0.5 + fract(aSeed * 3.7) * 1.5) + aSeed * 50.0);
    gl_PointSize = (1.0 + 2.0 * fract(aSeed * 13.1)) * uDpr;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FIELD_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uDay;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = uDay > 0.5 ? smoothstep(0.5, 0.3, d) * vAlpha * 0.5 : exp(-d * d * 16.0) * vAlpha;
    gl_FragColor = vec4(uColor, a);
  }
`

/** The tuner's sky. Returns null when WebGL is not available (the dial still works without it). */
export function createTunerScene(
  canvas: HTMLCanvasElement,
  options: { reduced: boolean; palette: TunerPalette; day: boolean },
): TunerScene | null {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  } catch {
    return null
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x000000, 0)
  const motion = options.reduced ? 0 : 1

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, -10, 10)

  // ---------- the ring ----------
  const ringGeometry = new BufferGeometry()
  const angles = new Float32Array(RING)
  const seeds = new Float32Array(RING)
  for (let i = 0; i < RING; i += 1) {
    angles[i] = (i / RING) * Math.PI * 2
    seeds[i] = Math.random() * 100
  }
  ringGeometry.setAttribute('position', new BufferAttribute(new Float32Array(RING * 3), 3))
  ringGeometry.setAttribute('aAngle', new BufferAttribute(angles, 1))
  ringGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
  const ringMaterial = new ShaderMaterial({
    vertexShader: RING_VERTEX,
    fragmentShader: RING_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uDetune: { value: 0 },
      uSignal: { value: 0 },
      uLock: { value: 0 },
      uRadius: { value: 100 },
      uDpr: { value: dpr },
      uMotion: { value: motion },
      uIdle: { value: new Color() },
      uTune: { value: new Color() },
      uFlat: { value: new Color() },
      uSharp: { value: new Color() },
      uDay: { value: 0 },
    },
  })
  const ring = new Points(ringGeometry, ringMaterial)
  ring.frustumCulled = false
  scene.add(ring)

  // ---------- the field ----------
  const fieldGeometry = new BufferGeometry()
  const fieldPositions = new Float32Array(FIELD * 3)
  const fieldSeeds = new Float32Array(FIELD)
  const unit = new Float32Array(FIELD * 2)
  for (let i = 0; i < FIELD; i += 1) {
    unit[i * 2] = Math.random() * 2 - 1
    unit[i * 2 + 1] = Math.random() * 2 - 1
    fieldSeeds[i] = Math.random() * 100
  }
  fieldGeometry.setAttribute('position', new BufferAttribute(fieldPositions, 3))
  fieldGeometry.setAttribute('aSeed', new BufferAttribute(fieldSeeds, 1))
  const fieldMaterial = new ShaderMaterial({
    vertexShader: FIELD_VERTEX,
    fragmentShader: FIELD_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uDpr: { value: dpr }, uMotion: { value: motion }, uColor: { value: new Color() }, uDay: { value: 0 } },
  })
  const field = new Points(fieldGeometry, fieldMaterial)
  field.frustumCulled = false
  scene.add(field)

  function setPalette(palette: TunerPalette, day: boolean) {
    const u = ringMaterial.uniforms
    u.uIdle.value.set(palette.accent)
    u.uTune.value.set(palette.tune)
    u.uFlat.value.set(palette.flat)
    u.uSharp.value.set(palette.sharp)
    u.uDay.value = day ? 1 : 0
    fieldMaterial.uniforms.uColor.value.set(palette.ink)
    fieldMaterial.uniforms.uDay.value = day ? 1 : 0
    const blending = day ? NormalBlending : AdditiveBlending
    ringMaterial.blending = blending
    fieldMaterial.blending = blending
    ringMaterial.needsUpdate = true
    fieldMaterial.needsUpdate = true
  }
  setPalette(options.palette, options.day)

  let width = 1
  let height = 1
  function resize() {
    width = canvas.clientWidth || 1
    height = canvas.clientHeight || 1
    renderer.setSize(width, height, false)
    camera.left = -width / 2
    camera.right = width / 2
    camera.top = height / 2
    camera.bottom = -height / 2
    camera.updateProjectionMatrix()
    for (let i = 0; i < FIELD; i += 1) fieldPositions.set([(unit[i * 2] * width) / 2, (unit[i * 2 + 1] * height) / 2, -1], i * 3)
    fieldGeometry.attributes.position.needsUpdate = true
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  // Targets from the microphone; the frame loop eases towards them so the ring never jumps.
  const target = { detune: 0, signal: 0, lock: 0 }
  const now = { detune: 0, signal: 0, lock: 0 }

  let frame = 0
  let stopped = false
  const startedAt = performance.now()
  function tick(time: number) {
    if (stopped) return
    frame = requestAnimationFrame(tick)
    if (document.hidden) return
    const ease = motion ? 0.12 : 1
    now.detune += (target.detune - now.detune) * ease
    now.signal += (target.signal - now.signal) * (motion ? 0.08 : 1)
    now.lock += (target.lock - now.lock) * (motion ? 0.06 : 1)
    const u = ringMaterial.uniforms
    const seconds = (time - startedAt) / 1000
    u.uTime.value = seconds
    u.uDetune.value = now.detune
    u.uSignal.value = now.signal
    u.uLock.value = now.lock
    fieldMaterial.uniforms.uTime.value = seconds
    if (motion) field.rotation.z = seconds * 0.004
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(tick)

  return {
    layout(radius: number) {
      ringMaterial.uniforms.uRadius.value = radius
    },
    update(state: TunerState) {
      target.signal = state.cents === null ? 0 : 1
      if (state.cents !== null) target.detune = Math.max(-1, Math.min(1, state.cents / 50))
      target.lock = state.inTune ? 1 : 0
    },
    setPalette,
    dispose() {
      stopped = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      ringGeometry.dispose()
      fieldGeometry.dispose()
      ringMaterial.dispose()
      fieldMaterial.dispose()
      renderer.dispose()
    },
  }
}
