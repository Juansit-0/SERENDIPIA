import { beforeEach, describe, expect, it, vi } from 'vitest'

const tone = vi.hoisted(() => {
  const state = {
    toneStartCalls: 0,
    samplersCreated: 0,
    disposed: 0,
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
    triggerAttackRelease() {}
    triggerAttack() {}
    async generate() {}
  }

  class FakeSampler extends FakeNode {
    constructor() {
      super()
      state.samplersCreated += 1
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
  getDestination: () => new tone.FakeNode(),
  getTransport: () => tone.transport,
  getDraw: () => ({ schedule: (callback: () => void) => callback() }),
  loaded: () => tone.state.loaded(),
  now: () => 0,
  Frequency: () => ({ toNote: () => 'C4' }),
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

async function freshEngine() {
  vi.resetModules()
  tone.state.toneStartCalls = 0
  tone.state.samplersCreated = 0
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
