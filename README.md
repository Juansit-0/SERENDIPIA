# SERENDIPIA

Sistema de Encuentro y Recomendación de Escalas, Notación, Detección e Identificación de Progresiones Interactivas de Acordes.

A personal guitar practice instrument: type a chord and see every playable position, mark a fretboard position and get the chord's name (with honest ambiguity), read the theory at whatever depth you choose, and build a progression that plays itself. Bilingual ES/EN, Anglo notation with Latin alongside.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 37 Vitest specs over the music domain
npm run typecheck
npm run build
```

## Stack

- React 19 + Vite 8 + TypeScript, Tailwind CSS v4 (design tokens live in `@theme` in `src/styles/tailwind.css`)
- Tone.js for the audio graph, with self-hosted guitar samples
- Pure TypeScript music domain in `src/music/` (notes, chord templates, parser, voicings, detector, scales, progressions), covered by Vitest

## Visual world

Riso Studio (direction seed `06d8a1d9`): music print culture — flat spot inks, overprint, print grain, registration marks. Paper `#F4F1EA`, ink `#1A1A1A`, riso blue `#0078BF`, orange `#FF6C2F`, yellow `#FFE800`, and turquoise `#40E0D0` as the accent ink. `DESIGN.md` records the built system.

## Audio

The guitar samples in `src/assets/samples/` are extracted from the pre-rendered MusyngKite soundfonts published by [gleitz/midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) (generated from the Musyng Kite soundfont, licensed **CC BY-SA 3.0**). Only twelve notes per timbre plus three fret-noise hits are kept, trimmed to ~1.7s, mono, converted with ffmpeg, and loaded lazily per timbre. If the samples fail to load the engine falls back to a synthesized plucked-string voice.

Regenerate the sample set with:

```bash
node scripts/fetch-samples.mjs
```

## Regenerating the world

The direction contract for this surface lives in `.impeccable/surfaces/src-app-tsx.md`; the product record is `PRODUCT.md` and the built design system is `DESIGN.md`.
