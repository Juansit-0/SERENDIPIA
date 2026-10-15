import { beforeEach, describe, expect, it, vi } from 'vitest'

const tone = vi.hoisted(() => {
  const state = {
    contextOptions: null as unknown,
    toneStartCalls: 0,
    samplersCreated: 0,
    disposed: 0,
    notes: [] as unknown[][],
    attacks: [] as unknown[][],
    samplerOptions: [] as Array<{ urls?: Record<string, string>; onload?: () => void }>,
    loaded: () => Promise.resolve() as Promise<void>,
  }

  class FakeNode {
    volume = { value: 0 }
    gain = { rampTo: () => undefined }
    loaded = true
    connect() {
      return this
    }
    chain() {
      return this
    }
    dispose() {
      state.disposed += 1
    }
    triggerAttackRelease(...args: unknown[]) {
      state.notes.push(args)
    }
    triggerAttack(...args: unknown[]) {
      state.attacks.push(args)
    }
    triggerRelease() {}
    releaseAll() {}
    async generate() {}
  }

  class FakeSampler extends FakeNode {
    constructor(options?: { urls?: Record<string, string>; onload?: () => void }) {
      super()
      state.samplersCreated += 1
      state.samplerOptions.push(options ?? {})
    }
  }

  class FakeLoop {
    constructor(
      public callback: (time: number) => void,
      public interval: string,
    ) {}
    start() {
      return this
    }
    dispose() {}
  }

  const scheduled = new Map<number, { callback: (time: number) => void; time: string }>()
  let nextId = 0
  const transport = {
    PPQ: 192,
    ticks: 0,
    bpm: { value: 120, rampTo: () => undefined },
    timeSignature: 4,
    loop: false,
    loopStart: 0 as number | string,
    loopEnd: '' as number | string,
    position: 0 as number | string,
    state: 'stopped',
    scheduleOnce(callback: (time: number) => void, time: string) {
      nextId += 1
      scheduled.set(nextId, { callback, time })
      return nextId
    },
    clear(id: number) {
      scheduled.delete(id)
    },
    start() {
      this.state = 'started'
    },
    stop() {
      this.state = 'stopped'
    },
  }

  const context = { state: 'running', resume: async () => undefined }

  return { state, scheduled, transport, context, FakeNode, FakeSampler, FakeLoop }
})

vi.mock('tone', () => ({
  start: async () => {
    tone.state.toneStartCalls += 1
    await new Promise((resolve) => setTimeout(resolve, 5))
  },
  getContext: () => tone.context,
  // The engine swaps in a low-latency context at boot; the fake keeps the same context and records the options.
  setContext: (context: { options: unknown }) => {
    tone.state.contextOptions = context.options
  },
  Context: class {
    options: unknown
    constructor(options: unknown) {
      this.options = options
    }
  },
  immediate: () => 0,
  getDestination: () => new tone.FakeNode(),
  getTransport: () => tone.transport,
  getDraw: () => ({ schedule: (callback: () => void) => callback() }),
  loaded: () => tone.state.loaded(),
  now: () => 0,
  Frequency: () => ({ toNote: () => 'C4' }),
  Time: () => ({ toSeconds: () => 0.25 }),
  Gain: tone.FakeNode,
  Filter: tone.FakeNode,
  Compressor: tone.FakeNode,
  Reverb: tone.FakeNode,
  Limiter: tone.FakeNode,
  Synth: tone.FakeNode,
  Panner: tone.FakeNode,
  PluckSynth: tone.FakeNode,
  Analyser: tone.FakeNode,
  Sampler: tone.FakeSampler,
  Loop: tone.FakeLoop,
}))

vi.mock('../assets/samples/generated', () => ({
  SAMPLE_FILES: {
    nylon: { E2: 'e2.mp3' },
    steel: { E2: 'e2.mp3' },
    electric: { E2: 'e2.mp3' },
    jazz: { E2: 'e2.mp3' },
    'fret-noise': {},
  },
}))

vi.mock('../assets/samples/band', () => ({
  DRUM_FILES: Object.fromEntries(
    [
      'kick-soft',
      'kick-hard',
      'snare-soft',
      'snare-hard',
      'snare-hard-2',
      'sidestick',
      'sidestick-2',
      'brush',
      'hat-soft',
      'hat-soft-2',
      'hat-hard',
      'hat-open',
      'hat-brush',
    ].map((id) => [id, `${id}.mp3`]),
  ),
  BASS_FILES: { electric: { E1: 'e1.mp3' }, upright: { E1: 'e1.mp3' } },
}))

async function freshEngine() {
  vi.resetModules()
  tone.state.toneStartCalls = 0
  tone.state.samplersCreated = 0
  tone.state.samplerOptions = []
  tone.state.disposed = 0
  tone.state.loaded = () => Promise.resolve()
  tone.scheduled.clear()
  tone.transport.ticks = 0
  tone.transport.loop = false
  const { audioEngine } = await import('./engine')
  return audioEngine
}

const baseOptions = {
  stepCount: 4,
  tempo: 120,
  loop: false,
  beatsPerChord: 4,
  tuning: [40, 45, 50, 55, 59, 64],
  getFrets: () => [0, 2, 2, 1, 0, 0],
  onStep: () => undefined,
}

describe('audioEngine.start', () => {
  beforeEach(() => {
    tone.context.state = 'running'
  })

  it('builds the audio graph once when started twice concurrently', async () => {
    const engine = await freshEngine()
    await Promise.all([engine.start(), engine.start()])
    expect(tone.state.toneStartCalls).toBe(1)
    expect(tone.state.samplersCreated).toBe(2)
    expect(engine.isStarted).toBe(true)
  })

  it('resumes a suspended context on later starts', async () => {
    const engine = await freshEngine()
    await engine.start()
    const resume = vi.fn(async () => undefined)
    tone.context.resume = resume
    tone.context.state = 'interrupted'
    await engine.start()
    expect(resume).toHaveBeenCalledOnce()
  })
})

describe('audioEngine timbre loading', () => {
  it('shares one load when the same timbre is requested twice', async () => {
    const engine = await freshEngine()
    await engine.start()
    await Promise.all([engine.setTimbre('steel'), engine.setTimbre('steel')])
    expect(tone.state.samplersCreated).toBe(4)
    expect(engine.loading).toBeNull()
  })

  it('disposes failed samplers and recovers on a later successful load', async () => {
    const engine = await freshEngine()
    await engine.start()
    tone.state.loaded = () => Promise.reject(new Error('network'))
    await engine.setTimbre('jazz')
    expect(engine.usingFallback).toBe(true)
    expect(tone.state.disposed).toBeGreaterThanOrEqual(4)

    tone.state.loaded = () => Promise.resolve()
    await engine.setTimbre('jazz')
    expect(engine.usingFallback).toBe(false)
  })
})

describe('audioEngine.playProgression', () => {
  it('sizes the loop by beats per chord, not by bars', async () => {
    const engine = await freshEngine()
    await engine.start()
    engine.playProgression({ ...baseOptions, loop: true, beatsPerChord: 8 })
    expect(tone.transport.loopEnd).toBe(`${4 * 8 * 192}i`)
    engine.playProgression({ ...baseOptions, loop: true, beatsPerChord: 1 })
    expect(tone.transport.loopEnd).toBe(`${4 * 1 * 192}i`)
  })

  it('calls onEnd when a non-looping progression finishes', async () => {
    const engine = await freshEngine()
    await engine.start()
    const onEnd = vi.fn()
    engine.playProgression({ ...baseOptions, beatsPerChord: 2, onEnd })
    const [end] = [...tone.scheduled.values()]
    expect(end.time).toBe(`${4 * 2 * 192 - 1}i`)
    end.callback(0)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(onEnd).toHaveBeenCalledOnce()
    expect(tone.transport.state).toBe('stopped')
  })

  it('cancels the scheduled end when loop is turned on mid-play', async () => {
    const engine = await freshEngine()
    await engine.start()
    engine.playProgression({ ...baseOptions })
    expect(tone.scheduled.size).toBe(1)
    engine.updateProgression({ loop: true })
    expect(tone.scheduled.size).toBe(0)
    expect(tone.transport.loop).toBe(true)
  })

  it('schedules an end when loop is turned off mid-play', async () => {
    const engine = await freshEngine()
    await engine.start()
    engine.playProgression({ ...baseOptions, loop: true })
    expect(tone.scheduled.size).toBe(0)
    tone.transport.ticks = 500
    engine.updateProgression({ loop: false })
    const [end] = [...tone.scheduled.values()]
    expect(end.time).toBe(`${4 * 4 * 192 - 1}i`)
  })

  it('ends right away when the progression shrinks behind the playhead', async () => {
    const engine = await freshEngine()
    await engine.start()
    engine.playProgression({ ...baseOptions })
    tone.transport.ticks = 2000
    engine.updateProgression({ stepCount: 2 })
    const [end] = [...tone.scheduled.values()]
    expect(end.time).toBe('2001i')
  })
})

describe('strumming', () => {
  const runFirstStep = async (strum?: 'single' | 'folk' | 'arpeggio') => {
    const engine = await freshEngine()
    await engine.start()
    tone.state.notes = []
    engine.playProgression({ ...baseOptions, loop: true, ...(strum ? { getStrum: () => strum } : {}) })
    const loop = (engine as unknown as { loopEvent: { callback: (time: number) => void } }).loopEvent
    loop.callback(10)
    // [note, duration, time, velocity]
    return tone.state.notes as Array<[string, number, number, number]>
  }

  it('plays one ringing strum by default', async () => {
    const notes = await runFirstStep()
    expect(notes).toHaveLength(6)
    expect(notes.every(([, duration]) => duration === 1.9)).toBe(true)
  })

  it('spreads the folk pattern over the bar with softer upstrokes', async () => {
    const notes = await runFirstStep('folk')
    // 3 downstrokes x 6 strings + 3 upstrokes x 4 treble strings
    expect(notes).toHaveLength(3 * 6 + 3 * 4)
    const starts = [...new Set(notes.map(([, , time]) => Math.floor((time - 10) / 0.25 + 0.05)))].sort((a, b) => a - b)
    expect(starts).toEqual([0, 2, 3, 5, 6, 7])
  })

  it('arpeggiates one note per eighth', async () => {
    const notes = await runFirstStep('arpeggio')
    expect(notes).toHaveLength(8)
  })
})

describe('latency', () => {
  it('runs in a low-latency context and plays a tapped chord right away, not after Tone’s lookahead', async () => {
    const engine = await freshEngine()
    await engine.start()
    expect(tone.state.contextOptions).toEqual({ latencyHint: 'interactive', lookAhead: 0.05 })
    tone.state.notes = []
    engine.playFrets([null, 3, 2, 0, 1, 0], [40, 45, 50, 55, 59, 64])
    const times = (tone.state.notes as Array<[string, number, number, number]>).map(([, , time]) => time)
    // The first string within ~10 ms of the tap (jitter included), the strum spread after it.
    expect(Math.min(...times)).toBeLessThan(0.012)
    expect(Math.max(...times)).toBeLessThan(0.15)
  })
})

describe('backing band', () => {
  it('plays recorded drums and a bass that walks into the next chord, once the recordings are loaded', async () => {
    const engine = await freshEngine()
    await engine.start()
    const basses = [0, 7, 9, 5]
    const options = { ...baseOptions, loop: true, getBacking: () => 'pop' as const, getBass: (index: number) => basses[index] }
    engine.playProgression(options)
    const band = tone.state.samplerOptions.filter((sampler) => sampler.urls && ('C2' in sampler.urls || 'E1' in sampler.urls))
    expect(band).toHaveLength(2)
    const loop = (engine as unknown as { loopEvent: { callback: (time: number) => void } }).loopEvent

    // Not loaded yet: the band stays silent instead of failing.
    tone.state.attacks = []
    tone.state.notes = []
    loop.callback(10)
    expect(tone.state.attacks).toHaveLength(0)

    for (const sampler of band) sampler.onload?.()
    tone.state.attacks = []
    tone.state.notes = []
    loop.callback(12)
    // One drum key per one-shot: kick and hat on the first eighth.
    expect(tone.state.attacks.filter(([, time]) => time === 12)).toHaveLength(2)
    // Bass notes are frequencies below the guitar; the last one is a semitone from G (the next chord).
    const bass = (tone.state.notes as Array<[number, number, number, number]>).filter(([note]) => typeof note === 'number' && note < 80)
    expect(bass.length).toBeGreaterThan(0)
    const lastFreq = bass[bass.length - 1][0]
    const midi = Math.round(69 + 12 * Math.log2(lastFreq / 440))
    expect(Math.abs((midi % 12) - 7)).toBe(1)
  })
})
