import { chordTones, qualityById, type Quality, type QualityId } from './chords'
import { keyAccidental, pitchName } from './notes'
import { formatChord } from './parseChord'
import { PROGRESSIONS, resolveProgression, nextChordSuggestions, type Suggestion } from './progressions'
import { diatonicChords, type Mode } from './scales'

export interface AnalyzedChordInput {
  rootPc: number
  qualityId: QualityId
  anglo: string
  latin: string
}

export interface Key {
  rootPc: number
  mode: Mode
}

export interface DetectedKey extends Key {
  confidence: number
}

type TriadClass = 'maj' | 'min' | 'dim' | 'aug' | 'sus' | 'power'

export type ChordStatus = 'diatonic' | 'secondary' | 'borrowed' | 'chromatic'

export interface ChordAnalysis {
  roman: string
  /** Semitones above the key tonic. */
  interval: number
  status: ChordStatus
  /** For secondary dominants: the chord they point to. */
  targetPc: number | null
  noteEs: string | null
  noteEn: string | null
}

export type TransitionTone = 'resolve' | 'tension' | 'color' | 'smooth' | 'surprise' | 'repeat' | 'neutral'

export interface TransitionAnalysis {
  mark: string
  tone: TransitionTone
  titleEs: string
  titleEn: string
  detailEs: string
  detailEn: string
  commonTones: number[]
}

const mod12 = (value: number) => ((value % 12) + 12) % 12

function triadClass(quality: Quality): TriadClass {
  const intervals = quality.intervals
  if (intervals.includes(3) && intervals.includes(6)) return 'dim'
  if (intervals.includes(4) && intervals.includes(8)) return 'aug'
  if (intervals.includes(3)) return 'min'
  if (intervals.includes(4)) return 'maj'
  return quality.family === 'power' ? 'power' : 'sus'
}

function compatible(actual: TriadClass, expected: TriadClass): boolean {
  if (actual === expected) return true
  return (actual === 'sus' || actual === 'power') && (expected === 'maj' || expected === 'min')
}

const classOf = (qualityId: QualityId) => triadClass(qualityById(qualityId))

/** Harmonic minor lends a major V and a diminished vii° to minor keys. */
function harmonicMinorDegree(interval: number, cls: TriadClass, mode: Mode): boolean {
  return mode === 'minor' && ((interval === 7 && cls === 'maj') || (interval === 11 && cls === 'dim'))
}

function diatonicMatch(chord: AnalyzedChordInput, key: Key) {
  const degree = diatonicChords(key.rootPc, key.mode).find((item) => item.rootPc === chord.rootPc)
  if (!degree) return null
  return compatible(classOf(chord.qualityId), classOf(degree.qualityId)) ? degree : null
}

function isDominantQuality(qualityId: QualityId): boolean {
  const quality = qualityById(qualityId)
  return triadClass(quality) === 'maj' && !quality.intervals.includes(11) && !quality.intervals.includes(9)
}

// ---------------------------------------------------------------------------
// Key detection

export function detectProgressionKey(steps: AnalyzedChordInput[]): DetectedKey | null {
  if (steps.length === 0) return null
  const scored: Array<{ key: Key; score: number }> = []
  for (const mode of ['major', 'minor'] as Mode[]) {
    for (let rootPc = 0; rootPc < 12; rootPc += 1) {
      const key = { rootPc, mode }
      const diatonic = diatonicChords(rootPc, mode)
      let score = 0
      steps.forEach((step) => {
        const cls = classOf(step.qualityId)
        const interval = mod12(step.rootPc - rootPc)
        if (diatonicMatch(step, key)) score += 2
        else if (harmonicMinorDegree(interval, cls, mode)) score += 1.6
        else if (isDominantQuality(step.qualityId) && diatonic.some((d) => d.rootPc === mod12(step.rootPc + 5) && classOf(d.qualityId) !== 'dim'))
          score += 0.4
        else if (diatonic.some((d) => d.rootPc === step.rootPc)) score += 0.2
        else score -= 1
      })
      const tonicClass: TriadClass = mode === 'major' ? 'maj' : 'min'
      const isTonic = (step: AnalyzedChordInput) => step.rootPc === rootPc && compatible(classOf(step.qualityId), tonicClass)
      if (isTonic(steps[0])) score += 1.5
      if (isTonic(steps[steps.length - 1])) score += 1.5
      for (let index = 1; index < steps.length; index += 1) {
        if (isTonic(steps[index]) && mod12(steps[index - 1].rootPc - rootPc) === 7) score += 1
      }
      scored.push({ key, score })
    }
  }
  scored.sort((a, b) => b.score - a.score)
  const [best, second] = scored
  return { ...best.key, confidence: best.score - (second?.score ?? 0) }
}

// ---------------------------------------------------------------------------
// Roman numerals and chord status

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
// Interval above the tonic -> [numeral index, accidental] for chromatic roots.
const CHROMATIC: Record<number, [number, string]> = {
  0: [0, ''], 1: [1, '♭'], 2: [1, ''], 3: [2, '♭'], 4: [2, ''], 5: [3, ''],
  6: [4, '♭'], 7: [4, ''], 8: [5, '♭'], 9: [5, ''], 10: [6, '♭'], 11: [6, ''],
}
const MINOR_NATURAL: Record<number, [number, string]> = {
  ...CHROMATIC, 3: [2, ''], 8: [5, ''], 10: [6, ''], 4: [2, '♮'], 9: [5, '♮'], 11: [6, '♮'],
}

function romanSuffix(qualityId: QualityId): string {
  switch (qualityId) {
    case 'dim':
      return '°'
    case 'dim7':
      return '°7'
    case 'm7b5':
      return 'ø7'
    case 'aug':
      return '+'
    case '7':
    case 'm7':
      return '7'
    case 'maj7':
    case 'mMaj7':
      return 'maj7'
    case '9':
    case 'm9':
      return '9'
    default:
      return ''
  }
}

function romanFor(interval: number, qualityId: QualityId, mode: Mode): string {
  const [index, accidental] = (mode === 'minor' ? MINOR_NATURAL : CHROMATIC)[mod12(interval)]
  const cls = classOf(qualityId)
  const numeral = cls === 'min' || cls === 'dim' ? NUMERALS[index].toLowerCase() : NUMERALS[index]
  return `${accidental}${numeral}${romanSuffix(qualityId)}`
}

const BORROWED_FROM_MINOR: Record<number, TriadClass> = { 5: 'min', 8: 'maj', 10: 'maj', 3: 'maj', 2: 'dim', 7: 'min', 0: 'min' }
const BORROWED_FROM_MAJOR: Record<number, TriadClass> = { 5: 'maj', 0: 'maj', 2: 'min' }

export function analyzeChord(chord: AnalyzedChordInput, key: Key): ChordAnalysis {
  const interval = mod12(chord.rootPc - key.rootPc)
  const cls = classOf(chord.qualityId)
  const roman = romanFor(interval, chord.qualityId, key.mode)
  const base = { roman, interval, targetPc: null, noteEs: null, noteEn: null }

  if (diatonicMatch(chord, key) || harmonicMinorDegree(interval, cls, key.mode)) {
    return { ...base, status: 'diatonic' }
  }

  if (isDominantQuality(chord.qualityId)) {
    const targetPc = mod12(chord.rootPc + 5)
    const target = diatonicChords(key.rootPc, key.mode).find(
      (degree) => degree.rootPc === targetPc && classOf(degree.qualityId) !== 'dim',
    )
    if (target && targetPc !== key.rootPc) {
      const head = chord.qualityId === '7' ? 'V7' : 'V'
      return {
        ...base,
        roman: `${head}/${target.roman}`,
        status: 'secondary',
        targetPc,
        noteEs: `${chord.anglo} es la dominante de ${target.anglo} (${head}/${target.roman}): empuja hacia ese acorde.`,
        noteEn: `${chord.anglo} is the dominant of ${target.anglo} (${head}/${target.roman}): it pulls toward that chord.`,
      }
    }
  }

  const borrowed = key.mode === 'major' ? BORROWED_FROM_MINOR[interval] : BORROWED_FROM_MAJOR[interval]
  if (borrowed && compatible(cls, borrowed)) {
    const fromEs = key.mode === 'major' ? 'del modo menor' : 'del modo mayor'
    const fromEn = key.mode === 'major' ? 'from the parallel minor' : 'from the parallel major'
    const moodEs = key.mode === 'major' ? 'oscurece el color' : 'ilumina el color'
    const moodEn = key.mode === 'major' ? 'darkens the color' : 'brightens the color'
    return {
      ...base,
      status: 'borrowed',
      noteEs: `${chord.anglo} (${roman}) es un acorde prestado ${fromEs}: ${moodEs} sin cambiar de tonalidad.`,
      noteEn: `${chord.anglo} (${roman}) is borrowed ${fromEn}: it ${moodEn} without changing key.`,
    }
  }

  return {
    ...base,
    status: 'chromatic',
    noteEs: `${chord.anglo} está fuera de la tonalidad: suena lejano o sorprendente.`,
    noteEn: `${chord.anglo} is outside the key: it sounds distant or surprising.`,
  }
}

// ---------------------------------------------------------------------------
// Transitions

function commonTones(a: AnalyzedChordInput, b: AnalyzedChordInput): number[] {
  const bTones = chordTones(b.rootPc, qualityById(b.qualityId))
  return [...new Set(chordTones(a.rootPc, qualityById(a.qualityId)))].filter((pc) => bTones.includes(pc))
}

function transition(
  mark: string,
  tone: TransitionTone,
  titleEs: string,
  titleEn: string,
  detailEs: string,
  detailEn: string,
  shared: number[],
): TransitionAnalysis {
  return { mark, tone, titleEs, titleEn, detailEs, detailEn, commonTones: shared }
}

export function analyzeTransition(a: AnalyzedChordInput, b: AnalyzedChordInput, key: Key): TransitionAnalysis {
  const from = analyzeChord(a, key)
  const to = analyzeChord(b, key)
  const shared = commonTones(a, b)
  const motion = mod12(b.rootPc - a.rootPc)
  const minorKey = key.mode === 'minor'
  const isV = (analysis: ChordAnalysis, chord: AnalyzedChordInput) =>
    analysis.interval === 7 && classOf(chord.qualityId) === 'maj'
  const isTonic = (analysis: ChordAnalysis, chord: AnalyzedChordInput) =>
    analysis.interval === 0 && compatible(classOf(chord.qualityId), minorKey ? 'min' : 'maj')
  const pair = `${a.anglo} → ${b.anglo}`

  if (a.rootPc === b.rootPc && a.qualityId === b.qualityId) {
    return transition('=', 'repeat', 'Repite', 'Repeat', `${pair}: repite el acorde y sostiene la armonía.`, `${pair}: repeats the chord and holds the harmony.`, shared)
  }
  if (from.status === 'secondary' && from.targetPc === b.rootPc) {
    return transition('✓', 'resolve', 'Resuelve la dominante secundaria', 'Secondary dominant resolves', `${pair}: ${a.anglo} resuelve en ${b.anglo} como si fuera su tónica. Suena natural.`, `${pair}: ${a.anglo} resolves to ${b.anglo} as if it were its tonic. Sounds natural.`, shared)
  }
  if (isV(from, a) && isTonic(to, b)) {
    return transition('✓', 'resolve', 'Cadencia auténtica', 'Authentic cadence', `${pair}: la dominante resuelve en la tónica. Es el cierre más fuerte; suena a final.`, `${pair}: the dominant resolves to the tonic. The strongest close; it sounds like an ending.`, shared)
  }
  if (isV(from, a) && to.interval === (minorKey ? 8 : 9)) {
    return transition('↪', 'surprise', 'Cadencia rota', 'Deceptive cadence', `${pair}: se espera la tónica y llega el ${to.roman}. Sorprende sin romper la tonalidad.`, `${pair}: the tonic is expected and the ${to.roman} arrives instead. A surprise that stays in key.`, shared)
  }
  if (from.interval === 11 && classOf(a.qualityId) === 'dim' && isTonic(to, b)) {
    return transition('✓', 'resolve', 'Resuelve la sensible', 'Leading-tone resolution', `${pair}: el séptimo grado sube medio tono a la tónica. Cierre suave pero claro.`, `${pair}: the seventh degree rises a half step to the tonic. A soft but clear close.`, shared)
  }
  if (from.interval === 5 && isTonic(to, b)) {
    return from.status === 'borrowed'
      ? transition('✓', 'resolve', 'Cadencia plagal menor', 'Minor plagal cadence', `${pair}: el iv prestado vuelve a la tónica. Final nostálgico, muy usado en baladas.`, `${pair}: the borrowed iv returns home. A wistful ending, common in ballads.`, shared)
      : transition('✓', 'resolve', 'Cadencia plagal', 'Plagal cadence', `${pair}: la subdominante vuelve a la tónica, el cierre del «amén». Más suave que V→I.`, `${pair}: the subdominant returns home, the "amen" close. Softer than V→I.`, shared)
  }
  if (from.interval === 2 && isV(to, b)) {
    return transition('↗', 'tension', 'ii → V', 'ii → V', `${pair}: la preparación más usada; ahora el oído espera la tónica.`, `${pair}: the most common setup; now the ear expects the tonic.`, shared)
  }
  if (isV(to, b)) {
    return transition('↗', 'tension', 'Semicadencia', 'Half cadence', `${pair}: llegar al V deja la frase en suspenso, pidiendo resolver.`, `${pair}: landing on V leaves the phrase hanging, asking to resolve.`, shared)
  }
  if (to.status === 'secondary') {
    return transition('↗', 'tension', 'Dominante secundaria', 'Secondary dominant', `${pair}: ${to.noteEs}`, `${pair}: ${to.noteEn}`, shared)
  }
  if (to.status === 'borrowed') {
    return transition('◐', 'color', 'Color prestado', 'Borrowed color', `${pair}: ${to.noteEs}`, `${pair}: ${to.noteEn}`, shared)
  }
  if (to.status === 'chromatic') {
    return transition('⚡', 'surprise', 'Salto fuera de la tonalidad', 'Out-of-key jump', `${pair}: ${to.noteEs}`, `${pair}: ${to.noteEn}`, shared)
  }
  if (motion === 5) {
    return transition('→', 'smooth', 'Movimiento por quintas', 'Motion by fifths', `${pair}: la raíz baja una quinta, el movimiento más natural de la armonía.`, `${pair}: the root falls a fifth, the most natural motion in harmony.`, shared)
  }
  if (shared.length >= 2) {
    return transition('~', 'smooth', 'Cambio suave', 'Smooth change', `${pair}: comparten ${shared.length} notas, así que el cambio casi no se nota.`, `${pair}: they share ${shared.length} notes, so the change is barely felt.`, shared)
  }
  if (motion === 7) {
    return transition('→', 'neutral', 'Sube una quinta', 'Up a fifth', `${pair}: la raíz sube una quinta; abre la frase y da energía.`, `${pair}: the root rises a fifth; it opens the phrase and adds energy.`, shared)
  }
  if (motion === 1 || motion === 2 || motion === 10 || motion === 11) {
    return transition('→', 'neutral', 'Por grado conjunto', 'Stepwise', `${pair}: la raíz se mueve por paso; suena a avance continuo.`, `${pair}: the root moves by step; it feels like steady motion.`, shared)
  }
  return transition('·', 'neutral', 'Cambio dentro de la tonalidad', 'Change within the key', `${pair}: ambos acordes pertenecen a la tonalidad; funciona sin sorpresas.`, `${pair}: both chords belong to the key; it works without surprises.`, shared)
}

// ---------------------------------------------------------------------------
// Context-aware next-chord suggestions

function suggestion(
  rootPc: number,
  qualityId: QualityId,
  key: Key,
  roman: string | null,
  reasonEs: string,
  reasonEn: string,
  weight: number,
): Suggestion {
  const labels = formatChord(rootPc, qualityId, { accidental: keyAccidental(key.rootPc, key.mode) })
  return { rootPc, qualityId, anglo: labels.anglo, latin: labels.latin, roman, reasonEs, reasonEn, weight }
}

// When the player uses plain triads, suggest triads too (but keep dominant 7ths).
const TRIAD_OF: Partial<Record<QualityId, QualityId>> = { maj7: 'maj', m7: 'min', m7b5: 'dim', '6': 'maj', m6: 'min' }

export function suggestNextChords(steps: AnalyzedChordInput[], key: Key, limit = 6): Suggestion[] {
  if (steps.length === 0) return []
  const usesTriads = steps.slice(-3).every((step) => qualityById(step.qualityId).intervals.length <= 3)
  const fit = (qualityId: QualityId) => (usesTriads ? (TRIAD_OF[qualityId] ?? qualityId) : qualityId)
  const last = steps[steps.length - 1]
  const lastAnalysis = analyzeChord(last, key)
  const out: Suggestion[] = []
  const tonicQuality: QualityId = key.mode === 'major' ? 'maj' : 'min'

  // 1. Continue a known progression that matches the last two or three chords.
  for (const template of PROGRESSIONS.filter((item) => item.mode === key.mode)) {
    const resolved = resolveProgression(template, key.rootPc)
    for (let span = Math.min(3, steps.length); span >= 2; span -= 1) {
      const tail = steps.slice(-span)
      let matched = false
      for (let start = 0; start < resolved.length; start += 1) {
        const fits = tail.every((step, offset) => {
          const expected = resolved[(start + offset) % resolved.length]
          return expected.rootPc === step.rootPc && compatible(classOf(step.qualityId), classOf(expected.qualityId))
        })
        if (!fits) continue
        const next = resolved[(start + span) % resolved.length]
        const qualityId = fit(next.qualityId)
        out.push(
          suggestion(
            next.rootPc,
            qualityId,
            key,
            qualityId === next.qualityId ? next.roman : romanFor(mod12(next.rootPc - key.rootPc), qualityId, key.mode),
            `Completa «${template.nameEs}»`,
            `Continues “${template.nameEn}”`,
            1.15 + span * 0.1,
          ),
        )
        matched = true
        break
      }
      if (matched) break
    }
  }

  // 2. Cadential pulls from the last chord.
  const interval = lastAnalysis.interval
  const lastClass = classOf(last.qualityId)
  if (lastAnalysis.status === 'secondary' && lastAnalysis.targetPc !== null) {
    const target = diatonicChords(key.rootPc, key.mode).find((degree) => degree.rootPc === lastAnalysis.targetPc)
    if (target) out.push(suggestion(target.rootPc, target.qualityId, key, target.roman, `Resuelve ${last.anglo}: es su destino natural`, `Resolves ${last.anglo}: its natural goal`, 1.3))
  }
  if (interval === 7 && lastClass === 'maj') {
    out.push(suggestion(key.rootPc, tonicQuality, key, key.mode === 'major' ? 'I' : 'i', 'Cadencia auténtica: cierra en la tónica', 'Authentic cadence: closes on the tonic', 1.25))
    const deceptive = mod12(key.rootPc + (key.mode === 'major' ? 9 : 8))
    out.push(suggestion(deceptive, key.mode === 'major' ? 'min' : 'maj', key, key.mode === 'major' ? 'vi' : 'VI', 'Cadencia rota: sorprende y sigue', 'Deceptive cadence: surprises and keeps going', 0.95))
  }
  if (interval === 2 && (lastClass === 'min' || lastClass === 'dim')) {
    out.push(suggestion(mod12(key.rootPc + 7), '7', key, 'V7', 'ii–V: sigue la dominante', 'ii–V: the dominant comes next', 1.2))
  }
  if (interval === 5) {
    out.push(suggestion(mod12(key.rootPc + 7), 'maj', key, 'V', 'IV–V: prepara la cadencia', 'IV–V: sets up the cadence', 1.0))
    out.push(suggestion(key.rootPc, tonicQuality, key, key.mode === 'major' ? 'I' : 'i', 'Cadencia plagal: vuelve a casa', 'Plagal cadence: returns home', 0.95))
  }
  if (interval === 11 && lastClass === 'dim') {
    out.push(suggestion(key.rootPc, tonicQuality, key, key.mode === 'major' ? 'I' : 'i', 'La sensible resuelve en la tónica', 'The leading tone resolves to the tonic', 1.2))
  }

  // 3. Generic diatonic options from the last chord.
  out.push(...nextChordSuggestions(last.rootPc, key.rootPc, key.mode))

  const best = new Map<string, Suggestion>()
  for (const item of out) {
    if (item.rootPc === last.rootPc && item.qualityId === last.qualityId) continue
    const id = `${item.rootPc}:${classOf(item.qualityId)}`
    const current = best.get(id)
    if (!current || item.weight > current.weight) best.set(id, item)
  }
  return [...best.values()].sort((a, b) => b.weight - a.weight).slice(0, limit)
}

export function keyName(key: Key, lang: 'es' | 'en'): string {
  const name = pitchName(key.rootPc, keyAccidental(key.rootPc, key.mode))
  if (lang === 'es') return `${name} ${key.mode === 'major' ? 'mayor' : 'menor'}`
  return `${name} ${key.mode}`
}
