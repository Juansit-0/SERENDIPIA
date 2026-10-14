import * as Tone from 'tone'
import { midiToFreq } from '../music/notes'
import { beatsToNotation, isAccentBeat, progressionTicks } from './timing'
import { strumHits, type StrumId } from './strums'
import { SAMPLE_FILES } from '../assets/samples/generated'

import type { PlayPattern, ProgressionOptions, TimbreId } from './types'

export type { PlayPattern, ProgressionOptions, TimbreId } from './types'

const SAMPLE_TIMEOUT_MS = 15000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

class AudioEngine {
  private started = false
  private startPromise: Promise<void> | null = null
  private timbreLoads = new Map<TimbreId, Promise<boolean>>()
  private input: Tone.Gain | null = null
  private master: Tone.Gain | null = null
  private samplers = new Map<TimbreId, { left: Tone.Sampler; right: Tone.Sampler }>()
  private fretNoise: Tone.Sampler | null = null
  private fallbackVoices: Tone.PluckSynth[] = []
  private timbre: TimbreId = 'nylon'
  private volume = 0.8
  private loopEvent: Tone.Loop | null = null
  private endEvent: number | null = null
  private click: Tone.Synth | null = null
  private clickGain: Tone.Gain | null = null
  private metronomeEvent: Tone.Loop | null = null
  private beat = 0
  private cursor = 0
  private options: ProgressionOptions | null = null
  private loadingTimbre: TimbreId | null = null
  private loadedTimbres = new Set<TimbreId>()
  private failed = false
  onLoadingChange: ((timbre: TimbreId | null) => void) | null = null
  onFallback: ((failed: boolean) => void) | null = null

  get isStarted(): boolean {
    return this.started
  }

  get activeTimbre(): TimbreId {
    return this.timbre
  }

  get loading(): TimbreId | null {
    return this.loadingTimbre
  }

  get usingFallback(): boolean {
    return this.failed
  }

  debug(): Record<string, unknown> {
    return {
      started: this.started,
      timbre: this.timbre,
      context: Tone.getContext().state,
      samplers: this.samplers.size,
      sampleFiles: Object.keys(SAMPLE_FILES[this.timbre] ?? {}).length,
      loaded: this.loadedTimbres.has(this.timbre),
      fallbackVoices: this.fallbackVoices.length,
      metronome: this.metronomeEvent !== null,
      beat: this.beat,
    }
  }

  async start(): Promise<void> {
    if (this.started) {
      if (Tone.getContext().state !== 'running') await Tone.getContext().resume()
      return
    }
    this.startPromise ??= this.boot().catch((error) => {
      this.startPromise = null
      throw error
    })
    return this.startPromise
  }

  private async boot(): Promise<void> {
    await Tone.start()
    if (Tone.getContext().state !== 'running') {
      await Tone.getContext().resume()
    }

    const input = new Tone.Gain(1)
    const highpass = new Tone.Filter(72, 'highpass')
    const compressor = new Tone.Compressor({ threshold: -18, ratio: 2.4, attack: 0.01, release: 0.28 })
    const master = new Tone.Gain(this.volume)
    const reverb = new Tone.Reverb({ decay: 1.45, wet: 0.15 })
    await reverb.generate()
    const limiter = new Tone.Limiter(-1)

    input.chain(highpass, compressor, master, reverb, limiter, Tone.getDestination())

    const clickGain = new Tone.Gain(this.volume)
    clickGain.connect(limiter)
    const click = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.032, sustain: 0, release: 0.02 },
    })
    click.volume.value = -9
    click.connect(clickGain)

    this.input = input
    this.master = master
    this.click = click
    this.clickGain = clickGain
    this.started = true
    await this.loadTimbre(this.timbre)
    void this.loadFretNoise()
  }

  setVolume(value: number): void {
    this.volume = value
    if (this.master) this.master.gain.rampTo(value, 0.08)
    if (this.clickGain) this.clickGain.gain.rampTo(value, 0.08)
  }

  async setTimbre(id: TimbreId): Promise<void> {
    this.timbre = id
    if (this.started) await this.loadTimbre(id)
  }

  private loadTimbre(id: TimbreId): Promise<boolean> {
    if (this.samplers.has(id)) return Promise.resolve(true)
    if (!this.input) return Promise.resolve(false)
    const pending = this.timbreLoads.get(id)
    if (pending) return pending
    const load = this.createSamplers(id, this.input).finally(() => {
      this.timbreLoads.delete(id)
      const next = this.timbreLoads.keys().next()
      this.loadingTimbre = next.done ? null : next.value
      this.onLoadingChange?.(this.loadingTimbre)
    })
    this.timbreLoads.set(id, load)
    this.loadingTimbre = id
    this.onLoadingChange?.(id)
    return load
  }

  private async createSamplers(id: TimbreId, input: Tone.Gain): Promise<boolean> {
    const nodes: Tone.ToneAudioNode[] = []
    try {
      const urls = SAMPLE_FILES[id] ?? {}
      if (Object.keys(urls).length === 0) throw new Error(`no samples for ${id}`)

      const leftPan = new Tone.Panner(-0.28).connect(input)
      const rightPan = new Tone.Panner(0.28).connect(input)
      const left = new Tone.Sampler({ urls, attack: 0.002, release: 1.2 }).connect(leftPan)
      const right = new Tone.Sampler({ urls, attack: 0.002, release: 1.2 }).connect(rightPan)
      nodes.push(leftPan, rightPan, left, right)
      await withTimeout(Tone.loaded(), SAMPLE_TIMEOUT_MS)
      const loaded = [left, right].every(
        (sampler) => (sampler as unknown as { loaded?: boolean }).loaded !== false,
      )
      if (!loaded) throw new Error(`samples for ${id} did not load`)
      this.loadedTimbres.add(id)
      this.samplers.set(id, { left, right })
      if (this.failed) {
        this.failed = false
        this.onFallback?.(false)
      }
      return true
    } catch {
      for (const node of nodes) node.dispose()
      this.failed = true
      this.onFallback?.(true)
      this.ensureFallback()
      return false
    }
  }

  private async loadFretNoise(): Promise<void> {
    if (!this.input || this.fretNoise) return
    try {
      const urls = SAMPLE_FILES['fret-noise'] ?? {}
      if (Object.keys(urls).length === 0) return
      const sampler = new Tone.Sampler({ urls, attack: 0.001, release: 0.2 })
      sampler.volume.value = -22
      sampler.connect(this.input)
      await Tone.loaded()
      this.fretNoise = sampler
    } catch {
      return
    }
  }

  private ensureFallback(): void {
    if (this.fallbackVoices.length > 0 || !this.input) return
    for (let index = 0; index < 6; index += 1) {
      const voice = new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 2600 + index * 400,
        resonance: 0.94 - index * 0.01,
      })
      voice.volume.value = -7
      voice.connect(this.input)
      this.fallbackVoices.push(voice)
    }
  }

  private samplerFor(stringIndex: number): Tone.Sampler | null {
    const pair = this.samplers.get(this.timbre)
    if (!pair) return null
    return stringIndex <= 2 ? pair.left : pair.right
  }

  private triggerNote(stringIndex: number, midi: number, time: number, velocity: number, duration: number): void {
    const sampler = this.samplerFor(stringIndex)
    const note = Tone.Frequency(midi, 'midi').toNote()
    const jitter = (Math.random() - 0.5) * 0.006
    const dynamic = Math.min(1, Math.max(0.22, velocity * (0.86 + Math.random() * 0.18)))
    if (sampler) {
      sampler.triggerAttackRelease(note, duration, time + jitter, dynamic)
      return
    }
    const voice = this.fallbackVoices[stringIndex]
    if (!voice) return
    voice.volume.value = -10 + 6 * dynamic
    voice.triggerAttack(midiToFreq(midi), time + jitter)
  }

  private planNotes(frets: (number | null)[], tuning: number[]): Array<{ stringIndex: number; midi: number }> {
    const notes: Array<{ stringIndex: number; midi: number }> = []
    frets.forEach((fret, stringIndex) => {
      if (fret !== null) notes.push({ stringIndex, midi: tuning[stringIndex] + fret })
    })
    return notes
  }

  playFrets(
    frets: (number | null)[],
    tuning: number[],
    pattern: PlayPattern = 'strum-down',
    velocity = 1,
    options: { muted?: boolean; accent?: boolean } = {},
  ): void {
    if (!this.started) return
    const notes = this.planNotes(frets, tuning)
    if (notes.length === 0) return

    const start = Tone.now() + 0.04
    const spread = 0.028
    const duration = options.muted ? 0.14 : options.accent ? 2.6 : 1.9
    const gain = options.muted ? velocity * 0.65 : options.accent ? Math.min(1, velocity * 1.12) : velocity

    if (pattern === 'block') {
      for (const note of notes) this.triggerNote(note.stringIndex, note.midi, start, gain, duration)
      return
    }
    if (pattern === 'arpeggio') {
      notes.forEach((note, order) =>
        this.triggerNote(note.stringIndex, note.midi, start + order * 0.1, gain, duration),
      )
      return
    }
    const ordered = pattern === 'strum-up' ? [...notes].reverse() : notes
    ordered.forEach((note, order) =>
      this.triggerNote(note.stringIndex, note.midi, start + order * spread, gain, duration),
    )
  }

  /** One bar of `strum` on `frets` right now (the pattern editor's «Probar»), outside any progression. */
  previewStrum(frets: (number | null)[], tuning: number[], strum: StrumId, tempo: number): void {
    if (!this.started) return
    if (!this.options) Tone.getTransport().bpm.value = tempo
    this.playStrum(frets, tuning, Tone.now() + 0.05, strum, 4)
  }

  /** Any notes, low to high: together (a soft strum) or one after another. For ear training. */
  playNotes(midi: number[], arpeggio = false): void {
    if (!this.started) return
    const start = Tone.now() + 0.03
    const sorted = [...midi].sort((a, b) => a - b)
    sorted.forEach((note, order) => {
      const stringIndex = Math.min(5, Math.round((order * 5) / Math.max(1, sorted.length - 1)))
      this.triggerNote(stringIndex, note, start + order * (arpeggio ? 0.55 : 0.03), 0.8, arpeggio ? 2.4 : 2)
    })
  }

  playString(stringIndex: number, midi: number): void {
    if (!this.started) return
    this.triggerNote(stringIndex, midi, Tone.now() + 0.03, 1, 1.8)
  }

  private playStrum(frets: (number | null)[], tuning: number[], time: number, strum: StrumId, beats: number): void {
    const notes = this.planNotes(frets, tuning)
    if (notes.length === 0) return
    const eighth = Tone.Time('8n').toSeconds()
    for (const hit of strumHits(strum, beats)) {
      const at = time + hit.eighth * eighth
      // A single strum rings out; pattern hits are damped by the next stroke.
      const ring = strum === 'single' ? 1.9 : Math.max(0.12, hit.length * eighth * 0.98)
      const velocity = hit.accent ? 0.95 : 0.7
      if (hit.kind === 'arpeggio') {
        const note = notes[hit.order % notes.length]
        this.triggerNote(note.stringIndex, note.midi, at, velocity * 0.9, Math.max(ring, eighth * 3))
        continue
      }
      // Upstrokes catch only the treble strings, from high to low.
      const ordered = hit.kind === 'up' ? notes.slice(-4).reverse() : notes
      const spread = hit.kind === 'up' ? 0.018 : 0.028
      ordered.forEach((note, order) => this.triggerNote(note.stringIndex, note.midi, at + order * spread, velocity, ring))
    }
  }

  private triggerFretNoise(time: number): void {
    if (!this.fretNoise) return
    const notes = ['E3', 'B3', 'E4']
    const note = notes[Math.floor(Math.random() * notes.length)]
    this.fretNoise.triggerAttackRelease(note, 0.18, time, 0.5)
  }

  private startMetronomeLoop(): void {
    if (this.metronomeEvent || !this.click) return
    this.beat = 0
    this.metronomeEvent = new Tone.Loop((time) => {
      const accent = isAccentBeat(this.beat)
      this.click?.triggerAttackRelease(accent ? 'C6' : 'C5', 0.04, time, accent ? 1 : 0.42)
      const beat = this.beat
      this.beat += 1
      const onBeat = this.options?.onBeat
      if (onBeat) Tone.getDraw().schedule(() => onBeat(beat), time)
    }, '4n')
    this.metronomeEvent.start(0)
  }

  private stopMetronomeLoop(): void {
    if (this.metronomeEvent) {
      this.metronomeEvent.dispose()
      this.metronomeEvent = null
    }
    this.beat = 0
  }

  playProgression(options: ProgressionOptions): void {
    if (!this.started) return
    this.stopProgression()
    const transport = Tone.getTransport()
    transport.bpm.value = options.tempo
    transport.timeSignature = 4
    transport.loop = options.stepCount === 0 ? true : options.loop
    transport.loopStart = 0
    transport.loopEnd = options.stepCount === 0 ? '1m' : `${progressionTicks(options.stepCount, options.beatsPerChord, transport.PPQ)}i`
    this.cursor = 0
    this.options = options
    if (options.metronome) this.startMetronomeLoop()

    this.loopEvent = new Tone.Loop((time) => {
      const current = this.options
      if (!current || current.stepCount === 0) return
      const index = this.cursor % current.stepCount
      const frets = current.getFrets(index)
      if (frets) {
        if (index > 0 || this.cursor > 0) this.triggerFretNoise(time - 0.09)
        this.playStrum(frets, current.tuning, time, current.getStrum?.(index) ?? 'single', current.beatsPerChord)
      }
      Tone.getDraw().schedule(() => current.onStep(index), time)
      this.cursor = (this.cursor + 1) % current.stepCount
    }, beatsToNotation(options.beatsPerChord))

    this.loopEvent.start(0)
    this.scheduleEnd()
    transport.start()
  }

  private scheduleEnd(): void {
    const transport = Tone.getTransport()
    if (this.endEvent !== null) {
      transport.clear(this.endEvent)
      this.endEvent = null
    }
    const options = this.options
    if (!options || options.loop || options.stepCount === 0) return
    const endTicks = progressionTicks(options.stepCount, options.beatsPerChord, transport.PPQ)
    const at = Math.max(endTicks - 1, transport.ticks + 1)
    this.endEvent = transport.scheduleOnce((time) => {
      const onEnd = this.options?.onEnd
      this.stopProgression()
      // Not Draw: hidden tabs pause animation frames and Draw drops late events,
      // which would leave the UI stuck in "playing".
      if (onEnd) setTimeout(onEnd, Math.max(0, (time - Tone.now()) * 1000))
    }, `${at}i`)
  }

  updateProgression(patch: Partial<ProgressionOptions>): void {
    if (!this.options) return
    this.options = { ...this.options, ...patch }
    const transport = Tone.getTransport()
    if (patch.tempo !== undefined) transport.bpm.rampTo(patch.tempo, 0.06)
    if (patch.metronome !== undefined) {
      if (patch.metronome) this.startMetronomeLoop()
      else this.stopMetronomeLoop()
    }
    const { stepCount, beatsPerChord, loop } = this.options
    transport.loop = stepCount === 0 ? true : loop
    transport.loopEnd = stepCount === 0 ? '1m' : `${progressionTicks(stepCount, beatsPerChord, transport.PPQ)}i`
    if (stepCount > 0 && this.cursor >= stepCount) this.cursor = 0
    if (patch.beatsPerChord !== undefined && this.loopEvent) {
      this.loopEvent.interval = beatsToNotation(patch.beatsPerChord)
    }
    if (patch.loop !== undefined || patch.stepCount !== undefined || patch.beatsPerChord !== undefined) {
      this.scheduleEnd()
    }
  }

  stopProgression(): void {
    const transport = Tone.getTransport()
    this.stopMetronomeLoop()
    if (this.loopEvent) {
      this.loopEvent.dispose()
      this.loopEvent = null
    }
    if (this.endEvent !== null) {
      transport.clear(this.endEvent)
      this.endEvent = null
    }
    this.options = null
    transport.stop()
    transport.position = 0
  }

  get isRunning(): boolean {
    return Tone.getTransport().state === 'started'
  }
}

export const audioEngine = new AudioEngine()

if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __serendipia?: unknown }).__serendipia = { audioEngine }
}
