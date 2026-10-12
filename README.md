# SERENDIPIA

Sistema de Encuentro y Recomendación de Escalas, Notación, Detección e Identificación de Progresiones Interactivas de Acordes.

A personal guitar practice instrument: type a chord and see every playable position, mark a fretboard position and get the chord's name (with honest ambiguity), read the theory at whatever depth you choose, and build a progression that plays itself and reorders by drag. A metronome click runs over the progression or standalone. Bilingual ES/EN, Anglo notation with Latin alongside.

## Progression analysis

As you build a progression, SERENDIPIA reads it with music-theory rules (no AI, works offline):

- **Key detection** from all the chords (the **Auto** stamp in the transport; pick a key by hand to turn it off).
- **Roman numerals** on every step, with secondary dominants (`V7/V`), borrowed chords (`iv`, `♭VII`) and out-of-key chords set apart in color.
- **A mark between each pair of chords** (✓ resolves, ↗ tension, ↪ deceptive, ◐ borrowed color, ⚡ out of key, → / ~ smooth motion). Tap one to read the change explained, with its common tones; by default the latest change is shown.
- **Next-chord ideas from the last two or three chords**, recognising classic progressions (`C G Am` → "completes Pop I–V–vi–IV") and cadences (`Dm G` → `C`).

The logic lives in `src/music/analysis.ts`.

## Easier to play

- **Chain** (progression strip) re-voices every step so the hand moves as little as possible across the whole progression: a shortest-path search over each chord's best shapes that rewards held fingers and nearby positions, without giving up root-position, common shapes.
- **Suggested capo** appears under the strip when another capo turns the progression into clearly easier shapes (e.g. `Bb F Gm Eb` → capo 3 → `G D Em C`); **Apply** moves the capo and re-spells the steps, so the progression sounds the same.

The logic lives in `src/music/playability.ts`.

## Practice

- **Strumming patterns**: pick a **Strum** in the transport (single strum, quarters, folk `↓ ↓↑ ↑↓↑`, ballad, eighths, offbeat, arpeggio) and the progression plays it on every step; the step picker can override it per step. Patterns live in `src/audio/strums.ts`.
- **Change trainer** (**Practice** tab): two chords, shaped for the least hand movement.
  - **One minute**: tap the big button (or Space) on every clean change; the score is changes per minute and the best score per pair of chords is kept.
  - **With metronome**: the two chords alternate with the click; the tempo can ramp up by itself (+4 bpm every 8 changes) and **Slower** drops it 8 bpm. The top tempo per pair is kept.

Records stay in the browser (`localStorage`).

## Organize and share

- **Undo / redo** every progression edit with ↶ ↷ in the strip or **⌘Z / Ctrl+Z** and **⌘⇧Z / Ctrl+Y** (up to 50 steps back).
- **Library**: **Save** names the progression (with its tempo, beats, capo and strum); **Library** lists them to load or delete. Saving with an existing name replaces it.
- **Share link** copies a URL such as `?p=C_G:3-2-0-0-0-3_Am~folk_F&t=96&b=4&c=0&s=single` — chord symbols, optional pinned shape (`:frets`) and strum (`~id`) per step. Opening it loads that progression; unknown chords or values are skipped. No server involved.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: music domain, audio engine (mocked Tone.js), state and components (jsdom)
npm run typecheck
npm run lint       # oxlint, including the React hooks rules
npm run build
```

## Keyboard

- **Space**: play / stop the progression (or the metronome alone)
- **Fretboard**: one tab stop; arrows move between cells, Home / End jump along a string
- **Progression**: tap or Enter on a step opens its picker (voicing, strum, move ← / →, remove); **Alt+←/→** moves the focused step; **Alt+click** removes it; **Esc** closes the picker
- **Undo / redo**: **⌘Z / Ctrl+Z**, **⌘⇧Z / Ctrl+Y**
- **Practice tab**: **Space** counts a change in the one-minute drill

## Stack

- React 19 + Vite 8 + TypeScript, Tailwind CSS v4 (design tokens live in `@theme` in `src/styles/tailwind.css`)
- Tone.js for the audio graph, with self-hosted guitar samples; loaded as a separate chunk, prefetched when the browser is idle
- Pure TypeScript music domain in `src/music/` (notes, chord templates, parser, voicings, detector, scales, progressions), covered by Vitest

## Visual world

Riso Studio (direction seed `06d8a1d9`): music print culture — flat spot inks, overprint, print grain, registration marks. Paper `#F4F1EA`, ink `#1A1A1A`, riso blue `#0078BF`, orange `#FF6C2F`, yellow `#FFE800`, and turquoise `#40E0D0` as the accent ink. `DESIGN.md` records the built system.

## Audio

The guitar samples in `src/assets/samples/` are extracted from the pre-rendered MusyngKite soundfonts published by [gleitz/midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) (generated from the Musyng Kite soundfont, licensed **CC BY-SA 3.0**). Only twelve notes per timbre plus three fret-noise hits are kept, trimmed to ~1.7s, mono, converted with ffmpeg, and loaded lazily per timbre. If the samples fail to load the engine falls back to a synthesized plucked-string voice.

Regenerate the sample set with (requires `ffmpeg` on the PATH):

```bash
node scripts/fetch-samples.mjs
```

## Regenerating the world

The direction contract for this surface lives in `.impeccable/surfaces/src-app-tsx.md`; the product record is `PRODUCT.md` and the built design system is `DESIGN.md`.
