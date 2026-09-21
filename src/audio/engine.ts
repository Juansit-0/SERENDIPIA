import * as Tone from 'tone'
import { midiToFreq } from '../music/notes'
import { beatsToNotation } from './timing'
import { SAMPLE_FILES } from '../assets/samples/generated'

export type PlayPattern = 'strum-down' | 'strum-up' | 'arpeggio' | 'block'
export type TimbreId = 'nylon' | 'steel' | 'electric' | 'jazz'

export const TIMBRES: Array<{ id: TimbreId; nameEs: string; nameEn: string }> = [
  { id: 'nylon', nameEs: 'Nylon', nameEn: 'Nylon' },
  { id: 'steel', nameEs: 'Acero', nameEn: 'Steel' },
  { id: 'electric', nameEs: 'Eléctrica', nameEn: 'Clean electric' },
  { id: 'jazz', nameEs: 'Jazz', nameEn: 'Jazz' },
]

export interface ProgressionOptions {
  stepCount: number
  tempo: number
  loop: boolean
  beatsPerChord: number
  tuning: number[]
  getFrets: (index: number) => (number | null)[] | null
  onStep: (index: number) => void
  onEnd?: () => void
}

class AudioEngine {
  private started = false
  private input: Tone.Gain | null = null
  private master: Tone.Gain | null = null
  private samplers = new Map<TimbreId, { left: Tone.Sampler; right: Tone.Sampler }>()
  private fretNoise: Tone.Sampler | null = null
  private fallbackVoices: Tone.PluckSynth[] = []
  private timbre: TimbreId = 'nylon'
  private volume = 0.8
  private loopEvent: Tone.Loop | null = null
  private endEvent: number | null = null
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

  async measure(): Promise<number> {
    if (!this.master) return 0
    const analyser = new Tone.Analyser('waveform', 2048)
    this.master.connect(analyser)
    await new Promise((resolve) => setTimeout(resolve, 350))
    const values = analyser.getValue() as Float32Array
    analyser.dispose()
    const sum = values.reduce((total, value) => total + value * value, 0)
    return Math.sqrt(sum / values.length)
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
    }
  }

  async start(): Promise<void> {
    if (this.started) return
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

    this.input = input
    this.master = master
    this.started = true
    await this.loadTimbre(this.timbre)
    void this.loadFretNoise()
  }

  setVolume(value: number): void {
    this.volume = value
    if (this.master) this.master.gain.rampTo(value, 0.08)
  }

  async setTimbre(id: TimbreId): Promise<void> {
    this.timbre = id
    if (this.started) await this.loadTimbre(id)
  }

  private async loadTimbre(id: TimbreId): Promise<boolean> {
    if (this.samplers.has(id)) return true
    if (!this.input) return false
    this.loadingTimbre = id
    this.onLoadingChange?.(id)
    try {
      const urls = SAMPLE_FILES[id] ?? {}
      if (Object.keys(urls).length === 0) throw new Error(`no samples for ${id}`)

      const left = new Tone.Sampler({ urls, attack: 0.002, release: 1.2 }).connect(
        new Tone.Panner(-0.28).connect(this.input),
      )
      const right = new Tone.Sampler({ urls, attack: 0.002, release: 1.2 }).connect(
        new Tone.Panner(0.28).connect(this.input),
      )
      await Tone.loaded()
      const loaded = [left, right].every(
        (sampler) => (sampler as unknown as { loaded?: boolean }).loaded !== false,
      )
      if (loaded) this.loadedTimbres.add(id)
      this.samplers.set(id, { left, right })
      this.loadingTimbre = null
      this.onLoadingChange?.(null)
      return true
    } catch {
      this.loadingTimbre = null
      this.onLoadingChange?.(null)
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

  playString(stringIndex: number, midi: number): void {
    if (!this.started) return
    this.triggerNote(stringIndex, midi, Tone.now() + 0.03, 1, 1.8)
  }

  private triggerFrets(frets: (number | null)[], tuning: number[], time: number, velocity: number): void {
    const notes = this.planNotes(frets, tuning)
    notes.forEach((note, order) => {
      this.triggerNote(note.stringIndex, note.midi, time + order * 0.028, velocity, 1.9)
    })
  }

  private triggerFretNoise(time: number): void {
    if (!this.fretNoise) return
    const notes = ['E3', 'B3', 'E4']
    const note = notes[Math.floor(Math.random() * notes.length)]
    this.fretNoise.triggerAttackRelease(note, 0.18, time, 0.5)
  }

  playProgression(options: ProgressionOptions): void {
    if (!this.started) return
    this.stopProgression()
    const transport = Tone.getTransport()
    transport.bpm.value = options.tempo
    transport.timeSignature = 4
    transport.loop = options.loop
    transport.loopStart = 0
    transport.loopEnd = `${Math.max(1, options.stepCount)}m`
    this.cursor = 0
    this.options = options

    this.loopEvent = new Tone.Loop((time) => {
      const current = this.options
      if (!current || current.stepCount === 0) return
      const index = this.cursor % current.stepCount
      const frets = current.getFrets(index)
      if (frets) {
        if (index > 0 || this.cursor > 0) this.triggerFretNoise(time - 0.09)
        this.triggerFrets(frets, current.tuning, time, 0.95)
      }
      Tone.getDraw().schedule(() => current.onStep(index), time)
      this.cursor = (this.cursor + 1) % current.stepCount
    }, beatsToNotation(options.beatsPerChord))

    this.loopEvent.start(0)

    if (!options.loop) {
      this.endEvent = transport.scheduleOnce((time) => {
        Tone.getDraw().schedule(() => this.options?.onEnd?.(), time)
        this.stopProgression()
      }, `${Math.max(1, options.stepCount)}m`)
    }

    transport.start()
  }

  updateProgression(patch: Partial<ProgressionOptions>): void {
    if (!this.options) return
    this.options = { ...this.options, ...patch }
    const transport = Tone.getTransport()
    if (patch.tempo !== undefined) transport.bpm.rampTo(patch.tempo, 0.06)
    if (patch.loop !== undefined) transport.loop = patch.loop
    if (this.options.stepCount > 0) {
      transport.loopEnd = `${this.options.stepCount}m`
      if (this.cursor >= this.options.stepCount) this.cursor = 0
    }
    if (patch.beatsPerChord !== undefined && this.loopEvent) {
      this.loopEvent.interval = beatsToNotation(patch.beatsPerChord)
    }
  }

  stopProgression(): void {
    const transport = Tone.getTransport()
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

if (import.meta.env.DEV) {
  ;(window as unknown as { __serendipia?: unknown }).__serendipia = { audioEngine }
}
