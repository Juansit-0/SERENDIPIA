import { execFile } from 'node:child_process'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { promisify } from 'node:util'
import path from 'node:path'

const run = promisify(execFile)

const ROOT = path.resolve(import.meta.dirname, '..')
const TMP = path.join(ROOT, '.samples-tmp')
const OUT = path.join(ROOT, 'src/assets/samples')

const BASE = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite'

const INSTRUMENTS = [
  { id: 'nylon', soundfont: 'acoustic_guitar_nylon' },
  { id: 'steel', soundfont: 'acoustic_guitar_steel' },
  { id: 'electric', soundfont: 'electric_guitar_clean' },
  { id: 'jazz', soundfont: 'electric_guitar_jazz' },
]

const WANTED = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'E3', 'A3', 'D4', 'G4', 'B4', 'E5']

const FRET_NOISE = { id: 'fret-noise', soundfont: 'guitar_fret_noise', notes: ['E3', 'B3', 'E4'], duration: 0.28 }

async function fetchSoundfont(name) {
  const url = `${BASE}/${name}-mp3.js`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`fetch ${url} -> ${response.status}`)
  const text = await response.text()
  const samples = {}
  const pattern = /"([A-G][#b]?\d)":\s*"data:audio\/mp3;base64,([^"]+)"/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    samples[match[1]] = match[2]
  }
  return samples
}

function nearestAvailable(samples, wanted) {
  const names = Object.keys(samples)
  if (names.length === 0) return null
  const toMidi = (note) => {
    const letters = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
    const letter = note[0].toUpperCase()
    const accidental = note.includes('#') ? 1 : note.includes('b') ? -1 : 0
    const octave = Number(note.replace(/[^0-9-]/g, ''))
    return letters[letter] + accidental + (octave + 1) * 12
  }
  const target = toMidi(wanted)
  let best = names[0]
  let bestDistance = Infinity
  for (const name of names) {
    const distance = Math.abs(toMidi(name) - target)
    if (distance < bestDistance) {
      best = name
      bestDistance = distance
    }
  }
  return best
}

async function convert(input, output, duration) {
  await run('ffmpeg', [
    '-y',
    '-i', input,
    '-t', String(duration),
    '-ac', '1',
    '-ar', '44100',
    '-c:a', 'libmp3lame',
    '-q:a', '6',
    '-af', `afade=t=out:st=${Math.max(0, duration - 0.35)}:d=0.35`,
    output,
  ])
}

async function main() {
  await rm(TMP, { recursive: true, force: true })
  await mkdir(TMP, { recursive: true })
  await mkdir(OUT, { recursive: true })

  const manifest = {}

  for (const instrument of INSTRUMENTS) {
    const samples = await fetchSoundfont(instrument.soundfont)
    const available = Object.keys(samples)
    console.log(`${instrument.soundfont}: ${available.length} notas disponibles (${available[0]}..${available[available.length - 1]})`)
    const dir = path.join(OUT, instrument.id)
    await mkdir(dir, { recursive: true })
    const entries = {}

    for (const wanted of WANTED) {
      const source = samples[wanted] ? wanted : nearestAvailable(samples, wanted)
      if (!source) continue
      const raw = path.join(TMP, `${instrument.id}-${wanted}.mp3`)
      await writeFile(raw, Buffer.from(samples[source], 'base64'))
      const target = path.join(dir, `${wanted.replace('#', 's')}.mp3`)
      await convert(raw, target, 1.7)
      entries[wanted] = { file: `${wanted.replace('#', 's')}.mp3`, source }
    }

    manifest[instrument.id] = { soundfont: instrument.soundfont, samples: entries }
    console.log(`  ${instrument.id}: ${Object.keys(entries).length} muestras`)
  }

  const noiseSamples = await fetchSoundfont(FRET_NOISE.soundfont)
  const noiseDir = path.join(OUT, 'fret-noise')
  await mkdir(noiseDir, { recursive: true })
  const noiseEntries = {}
  for (const wanted of FRET_NOISE.notes) {
    const source = noiseSamples[wanted] ? wanted : nearestAvailable(noiseSamples, wanted)
    if (!source) continue
    const raw = path.join(TMP, `fret-noise-${wanted}.mp3`)
    await writeFile(raw, Buffer.from(noiseSamples[source], 'base64'))
    const target = path.join(noiseDir, `${wanted.replace('#', 's')}.mp3`)
    await convert(raw, target, FRET_NOISE.duration)
    noiseEntries[wanted] = { file: `${wanted.replace('#', 's')}.mp3`, source }
  }
  manifest['fret-noise'] = { soundfont: FRET_NOISE.soundfont, samples: noiseEntries }

  await writeFile(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await rm(TMP, { recursive: true, force: true })
  console.log('manifest.json escrito')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
