# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript, Tailwind CSS v4 (theming via `@theme`), Tone.js + self-hosted guitar samples (audio), Vitest (tests). Chosen by the user; no router or UI component libraries.

## Users

One user: Juan, Systems Engineering student and guitarist, working on a desktop PC with the guitar in hand. Personal learning and practice tool, not built for the public. His theory level is mixed and variable: the app must serve from beginner-level explanations to advanced functional analysis without locking itself to a single level.

## Product Purpose

SERENDIPIA turns chord names into fretboard positions and fretboard positions back into chord names, and explains how chords relate inside a key so the user can build and hear progressions. Success means the user reaches for it during practice to explore chords and progressions both by ear and by theory, without a paper chord book or a separate tab site. The user's brief for the current visual world: striking, intuitive, easy to use, and beautiful.

## Positioning

A bilingual (ES/EN) chord lab that shows Anglo notation with Latin notation alongside, detects chords from positions with honest ambiguity (C6 ≡ Am7), and layers theory at a chosen depth — from "what is a ii–V–I" to substitutions — over a playable synthesized-guitar engine that needs no audio assets.

## Operating Context

Desktop browser at home, guitar in hand, speakers on. Sessions are exploratory practice: look up a chord, try positions, hear it, test a progression, ask what could come next. No account, no cloud, no sharing required for the MVP.

## Capabilities and Constraints

Confirmed MVP: (1) chord dictionary — pick or type a chord, see multiple voicings as diagrams, hear them; (2) detector — enter a fretboard position, get chord name, inversions, and alternatives; (3) theory and recommendations — diatonic chords per key, preset progressions transposable and playable in loop, next-chord suggestions with reasons. The drag-and-drop progression editor is Phase 2. UI is bilingual ES/EN. Anglo chord notation is primary with Latin notation visible alongside. Audio uses self-hosted guitar samples (nylon, steel, clean electric, jazz) extracted from MusyngKite soundfonts, trimmed to 12 notes per timbre plus fret noise, with a synthesized fallback when samples cannot load; the audio works offline from the repository's own assets. No backend; preferences persist in localStorage. Music-theory logic is pure TypeScript covered by Vitest.

Explicitly undecided: deploy target, capo support, alternate-tunings UI, metronome, export/share.

## Brand Commitments

Name: SERENDIPIA, an acronym for "Sistema de Encuentro y Recomendación de Escalas, Notación, Detección e Identificación de Progresiones Interactivas de Acordes" (English reading: "Serendipitous Engine for Recommendations, Ear-training, Notation, Diagrams, Inversion detection, Progressions, Interactive Audio"). Chosen visual world (seed 06d8a1d9): the Riso Studio — music print culture (gig posters, zines, 7" sleeves), flat spot inks, overprint, print grain, registration marks. The palette is the world's own (paper, ink black, riso blue, orange, yellow); the user's favorite turquoise #40E0D0 rides as an accent ink. Not generic is binding; the previous dark-panel world is superseded.

## Evidence on Hand

None. Greenfield project with no user-provided imagery, testimonials, or data. Music data (chords, scales, progressions) is factual and authored in-app; nothing commercial may be fabricated.

## Product Principles

1. Sound first: every chord, voicing, and progression is audible in one click.
2. Both directions always: name→positions and positions→name, honest about ambiguity instead of forcing one answer.
3. Depth on demand: theory can be read at any level without the app committing to one.
4. Two notations, one truth: Anglo primary, Latin always visible, never a duplicated data model.
5. A practice instrument, not a reference document: fast to type into, keyboard-friendly, no clutter.
