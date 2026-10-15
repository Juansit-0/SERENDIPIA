// Builds the backing band's samples: a few one-shots from Karoryfer's Big Rusty Drums (CC0) and bass notes
// from the MusyngKite soundfonts (CC BY-SA 3.0, like the guitars). Requires ffmpeg on the PATH.
//   node scripts/fetch-band.mjs
import { execFile } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const ROOT = path.resolve(import.meta.dirname, '..')
const TMP = path.join(ROOT, '.samples-tmp', 'band')
const OUT = path.join(ROOT, 'src/assets/samples/band')
const DRUMS = 'https://raw.githubusercontent.com/sfzinstruments/karoryfer.big-rusty-drums/main/Samples'
const SOUNDFONTS = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite'

/**
 * Each drum sound mixes the close microphone with the overheads (a natural kit, not a dry click).
 * `duration` trims the tail; `group` shares one gain so soft and hard layers keep their real difference.
 */
const DRUM_SOUNDS = [
  { id: 'kick-soft', group: 'kick', close: 'kick_24/kick/kick/k_vl6_rr1.flac', room: 'kick_24/kick/oh/k_vl6_rr1.flac', duration: 0.9 },
  { id: 'kick-hard', group: 'kick', close: 'kick_24/kick/kick/k_vl12_rr1.flac', room: 'kick_24/kick/oh/k_vl12_rr1.flac', duration: 0.9 },
  { id: 'snare-soft', group: 'snare', close: 'snare_14/center/top/sn_center_vl4_rr1.flac', room: 'snare_14/center/oh/sn_center_vl4_rr1.flac', duration: 0.8 },
  { id: 'snare-hard', group: 'snare', close: 'snare_14/center/top/sn_center_vl9_rr1.flac', room: 'snare_14/center/oh/sn_center_vl9_rr1.flac', duration: 0.9 },
  { id: 'snare-hard-2', group: 'snare', close: 'snare_14/center/top/sn_center_vl9_rr2.flac', room: 'snare_14/center/oh/sn_center_vl9_rr2.flac', duration: 0.9 },
  { id: 'sidestick', group: 'sidestick', close: 'snare_14/sidestick/top/sn_ss_vl3_rr1.flac', room: 'snare_14/sidestick/oh/sn_ss_vl3_rr1.flac', duration: 0.5 },
  { id: 'sidestick-2', group: 'sidestick', close: 'snare_14/sidestick/top/sn_ss_vl3_rr2.flac', room: 'snare_14/sidestick/oh/sn_ss_vl3_rr2.flac', duration: 0.5 },
  { id: 'brush', group: 'brush', close: 'snare_14/brush/top/sn_b_vl5_rr1.flac', room: 'snare_14/brush/oh/sn_b_vl5_rr1.flac', duration: 0.7 },
  { id: 'hat-soft', group: 'hat', close: 'hihat_14/cl/cl/ht_cl_vl2_rr1.flac', room: 'hihat_14/cl/oh/ht_cl_vl2_rr1.flac', duration: 0.35 },
  { id: 'hat-soft-2', group: 'hat', close: 'hihat_14/cl/cl/ht_cl_vl2_rr2.flac', room: 'hihat_14/cl/oh/ht_cl_vl2_rr2.flac', duration: 0.35 },
  { id: 'hat-hard', group: 'hat', close: 'hihat_14/cl/cl/ht_cl_vl5_rr1.flac', room: 'hihat_14/cl/oh/ht_cl_vl5_rr1.flac', duration: 0.4 },
  { id: 'hat-open', group: 'hat', close: 'hihat_14/open/cl/ht_open_vl3_rr1.flac', room: 'hihat_14/open/oh/ht_open_vl3_rr1.flac', duration: 1.1 },
  { id: 'hat-brush', group: 'hat', close: 'hihat_14/cl_brush/cl/ht_cl_b_vl3_rr1.flac', room: 'hihat_14/cl_brush/oh/ht_cl_b_vl3_rr1.flac', duration: 0.4 },
]

/** Bass notes a bass player reaches (E1–E3); the sampler fills the semitones between. */
const BASSES = [
  { id: 'electric', soundfont: 'electric_bass_finger' },
  { id: 'upright', soundfont: 'acoustic_bass' },
]
const BASS_NOTES = ['E1', 'A1', 'D2', 'G2', 'C3', 'E3']

async function download(url, file) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`fetch ${url} -> ${response.status}`)
  await writeFile(file, Buffer.from(await response.arrayBuffer()))
}

async function peakDb(file) {
  const { stderr } = await run('ffmpeg', ['-i', file, '-af', 'volumedetect', '-f', 'null', '-'])
  return Number(stderr.match(/max_volume: (-?[\d.]+) dB/)?.[1] ?? 0)
}

async function mix(close, room, output, duration, gainDb) {
  await run('ffmpeg', [
    '-y', '-i', close, '-i', room,
    '-filter_complex', `[0][1]amix=inputs=2:weights=1 0.8:normalize=0,volume=${gainDb}dB,atrim=0:${duration},afade=t=out:st=${Math.max(0, duration - 0.12)}:d=0.12`,
    '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '5', output,
  ])
}

async function main() {
  await rm(TMP, { recursive: true, force: true })
  await mkdir(TMP, { recursive: true })
  await rm(OUT, { recursive: true, force: true })
  await mkdir(path.join(OUT, 'drums'), { recursive: true })

  // Drums: download both microphones, find each group's loudest raw mix, and bring it to -3 dBFS.
  const raw = {}
  for (const sound of DRUM_SOUNDS) {
    const close = path.join(TMP, `${sound.id}-close.flac`)
    const room = path.join(TMP, `${sound.id}-room.flac`)
    await download(`${DRUMS}/${sound.close}`, close)
    await download(`${DRUMS}/${sound.room}`, room)
    const probe = path.join(TMP, `${sound.id}-probe.wav`)
    await run('ffmpeg', ['-y', '-i', close, '-i', room, '-filter_complex', '[0][1]amix=inputs=2:weights=1 0.8:normalize=0', '-ac', '1', probe])
    raw[sound.id] = { close, room, peak: await peakDb(probe) }
  }
  const groupPeak = {}
  for (const sound of DRUM_SOUNDS) groupPeak[sound.group] = Math.max(groupPeak[sound.group] ?? -Infinity, raw[sound.id].peak)
  for (const sound of DRUM_SOUNDS) {
    const gain = -3 - groupPeak[sound.group]
    await mix(raw[sound.id].close, raw[sound.id].room, path.join(OUT, 'drums', `${sound.id}.mp3`), sound.duration, gain.toFixed(2))
    console.log(`drum ${sound.id} (gain ${gain.toFixed(1)} dB)`)
  }

  // Bass: notes straight from the soundfonts, trimmed to 2.4 s with a short fade.
  for (const bass of BASSES) {
    const response = await fetch(`${SOUNDFONTS}/${bass.soundfont}-mp3.js`)
    if (!response.ok) throw new Error(`fetch ${bass.soundfont} -> ${response.status}`)
    const text = await response.text()
    await mkdir(path.join(OUT, bass.id), { recursive: true })
    for (const note of BASS_NOTES) {
      const data = text.match(new RegExp(`"${note}":\\s*"data:audio/mp3;base64,([^"]+)"`))?.[1]
      if (!data) throw new Error(`${bass.soundfont} has no ${note}`)
      const input = path.join(TMP, `${bass.id}-${note}.mp3`)
      await writeFile(input, Buffer.from(data, 'base64'))
      await run('ffmpeg', ['-y', '-i', input, '-t', '2.4', '-ac', '1', '-ar', '44100', '-af', 'afade=t=out:st=2.0:d=0.4', '-c:a', 'libmp3lame', '-q:a', '5', path.join(OUT, bass.id, `${note}.mp3`)])
    }
    console.log(`bass ${bass.id}: ${BASS_NOTES.join(' ')}`)
  }

  // The import map the engine loads from (Vite fingerprints each file).
  const lines = ['// Generated by scripts/fetch-band.mjs. Do not edit by hand.', '']
  const drums = DRUM_SOUNDS.map((sound, index) => {
    lines.push(`import d${index} from './band/drums/${sound.id}.mp3'`)
    return `  '${sound.id}': d${index},`
  })
  const basses = BASSES.map((bass, b) =>
    `  ${bass.id}: {\n${BASS_NOTES.map((note, n) => {
      lines.push(`import b${b}_${n} from './band/${bass.id}/${note}.mp3'`)
      return `    ${note}: b${b}_${n},`
    }).join('\n')}\n  },`,
  )
  lines.push('', 'export const DRUM_FILES = {', ...drums, '} as const', '', 'export const BASS_FILES = {', ...basses, '} as const', '')
  await writeFile(path.join(ROOT, 'src/assets/samples/band.ts'), lines.join('\n'))
  await rm(TMP, { recursive: true, force: true })
}

await main()
