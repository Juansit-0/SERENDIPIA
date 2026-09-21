---
name: SERENDIPIA
description: Riso-print chord lab — paper ground, flat spot inks, registration marks, overprinted turquoise.
colors:
  paper: "#f4f1ea"
  paper-deep: "#eae4d6"
  paper-shade: "#e0d8c6"
  ink: "#1a1a1a"
  ink-soft: "#4c4a44"
  ink-faint: "#6f6b60"
  rule: "#cbc2ae"
  rule-strong: "#a79c84"
  blue: "#0078bf"
  blue-ink: "#005f96"
  orange: "#ff6c2f"
  yellow: "#ffe800"
  turquoise: "#40e0d0"
  red: "#d8452f"
  ink-deep: "#0b0b0b"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.5rem, 5.5vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 104, 'wght' 800"
  headline:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    fontVariation: "'wdth' 104, 'wght' 800"
  wordmark:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    letterSpacing: "0.24em"
    fontVariation: "'wdth' 92, 'wght' 800"
  subtitle:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 800
    fontVariation: "'wdth' 92, 'wght' 800"
  title:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 520
    fontVariation: "'wdth' 100, 'wght' 520"
  body:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  field:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 100, 'wght' 600"
  control:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.1em"
    fontVariation: "'wdth' 96, 'wght' 600"
  label:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 92, 'wght' 600"
  readout:
    fontFamily: "Martian Mono Variable, ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.02em"
    fontFeature: "'tnum'"
  chip:
    fontFamily: "Martian Mono Variable, ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    fontFeature: "'tnum'"
  micro:
    fontFamily: "Martian Mono Variable, ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "0.5rem"
    fontWeight: 500
  micro-7:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "7px"
    fontWeight: 600
  micro-8:
    fontFamily: "Martian Mono Variable, ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "8px"
    fontWeight: 500
  micro-9:
    fontFamily: "Martian Mono Variable, ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "9px"
    fontWeight: 600
  micro-10:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "10px"
    fontWeight: 600
  micro-11:
    fontFamily: "Martian Mono Variable, ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "11px"
    fontWeight: 500
  micro-13:
    fontFamily: "Martian Mono Variable, ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "13px"
    fontWeight: 500
  lead:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 500
  latin-reading:
    fontFamily: "Archivo Variable, Archivo, system-ui, -apple-system, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 500
rounded:
  stamp: "2px"
  plate: "3px"
  sheet: "2px"
  cell: "1px"
  scrollbar: "6px"
  pill: "999px"
spacing:
  tight: "3px"
  snug: "6px"
  block: "8px"
  panel: "16px"
  page: "12px"
components:
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.stamp}"
    padding: "5px 11px"
    height: "32px"
  stamp-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.stamp}"
    padding: "5px 11px"
    height: "32px"
  stamp-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.stamp}"
    padding: "5px 11px"
    height: "32px"
  stamp-live:
    backgroundColor: "{colors.turquoise}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.stamp}"
    padding: "5px 11px"
    height: "32px"
  plate:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.plate}"
    padding: "16px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "8px"
  proof-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    width: "84px"
    padding: "8px"
  step-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.sheet}"
    padding: "6px"
    height: "68px"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.chip}"
    rounded: "{rounded.stamp}"
    padding: "2px 6px"
  chip-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.chip}"
    rounded: "{rounded.stamp}"
    padding: "2px 6px"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "0"
    padding: "6px 2px"
  cell:
    backgroundColor: "transparent"
    rounded: "{rounded.cell}"
    height: "30px"
  tempo-block:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.stamp}"
    padding: "2px 8px"
---

# Design System: SERENDIPIA

## Overview

**Creative North Star: "The Riso Print Shop"**

SERENDIPIA is a print shop that happens to be a chord lab. The page is one paper sheet; every working surface is a bordered plate carrying registration marks at its corners; every control is a rubber stamp pressed in ink; every chord is set as a poster screen on an ink block with a misregistered turquoise plate slipped beneath it. The progression is a strip of chained paper sheets that advances under an ink wipe while the notes two neighbouring chords share overprint in turquoise. Nothing floats, nothing glows, nothing is glass.

The material logic is flat and physical throughout: riso spot inks on paper, soft neutral paper shadows, 1px ink rules, dashed cut lines, corner crop marks, a halftone screen over the ink-block chord names, and a fixed print grain over the whole page. The world's own palette (paper, ink, riso blue, orange, yellow) does the work; turquoise #40E0D0 rides only as an accent ink and is always printed as material — a plate, a dot, a band, a selection — through `mix-blend-mode: multiply`. Type is one variable grotesque for words (Archivo) and one variable mono rationed to measurements (Martian Mono). Motion exists for two jobs only: state transitions and the 0.5s wipe that reveals the step being played.

**Key Characteristics:**
- Paper #F4F1EA ground; plates with 1px ink borders, 3px radius and registration marks.
- Flat spot inks: blue #0078BF, orange #FF6C2F, yellow #FFE800, turquoise accent #40E0D0, red #D8452F signals.
- Soft neutral paper shadows only; depth is paper, never glow (ink at 10–12% alpha).
- The misregistration device: a solid colored plate offset 4–5px behind selected objects and the monumental chord name.
- Ink-stamp controls with `aria-pressed` ink fill, pressed inset, and a turquoise live state.
- Print texture: fixed grain overlay, halftone dot screens on ink blocks, dashed cut lines, 9px crop marks, 11px registration marks.
- One viewport, max 1560px; views fold to a single column below 1280px; the 16-slot strip and 12-fret detector grid scroll internally.

## Colors

Flat riso spot inks on paper: two papers, three inks in the black-brown family, two rule tones, and five chromatic inks — with turquoise reserved as the state accent.

### Primary
- **Riso Blue** (#0078BF): the working ink that letters words — every structural label and section head (via **Blue Ink** #005F96 for legibility), the interval symbols inside chord chips, the field's focus underline, and the dominant-function rule. Never decorative.
- **Riso Orange** (#FF6C2F): the dominant-function ink rule, the marker dots over frets 3/5/7/9/12/15/17/19/21/24 in the grid head, and the hover replacement for a lit cell's turquoise dot.
- **Riso Yellow** (#FFE800): the tempo block only — one solid yellow ink block behind the tempo digits.
- **Riso Blue Ink** (#005F96): the label-weight blue for small type and the loading chip's border and text.

### Secondary
- **Turquoise Accent** (#40E0D0): the user's own ink. It prints as a misregistered plate behind the chord name and the active step, as the 15px pressed-note dot inside grid cells (multiply), as the shared-note overprint band and the selected proof label (multiply), as the global text selection, as the tonic-function rule, and as the fill of the live stamp state.

### Tertiary
- **Signal Red** (#D8452F): error only — the invalid chord underline and message, the × on muted strings in grid cells and mini plates, and the muted legend mark.

### Neutral
- **Paper** (#F4F1EA): page ground, every plate face, every sheet, chips, selects, the sheet thumb border.
- **Paper Deep** (#EAE4D6): empty progression slots, printed at 40% opacity.
- **Paper Shade** (#E0D8C6): a declared third paper step; no shipped surface currently uses it.
- **Ink** (#1A1A1A): body text, plate borders, cell lit borders, the ink block behind chord names, the field underline, fat 2px rules, pressed-stamp fill.
- **Ink Soft** (#4C4A44): the label class's base color, readout secondary text, registration-mark strokes, cell hover border.
- **Ink Faint** (#6F6B60): field placeholders, fret/step indices, difficulty tags, empty-slot hints, the free-fret dot glyph.
- **Rule** (#CBC2AE): 1px cell borders, divider rules above chip lists, empty strip slots.
- **Rule Strong** (#A79C84): sheet and chip borders, dashed cut lines, 9px crop marks, mini-plate string/fret strokes, scrollbar thumbs.

### Named Rules
**The Ink-Is-Material Rule.** Chromatic ink is a material before it is a color: it appears as plates, bands, dots, rules and fills. Turquoise and orange never letter a word; the only non-material turquoise in the build is the 13px legend glyph. Blue letters labels, red letters errors — nothing else sets colored type below display size.

**The Multiply-Overprint Rule.** Every turquoise state mark that sits on paper prints with `mix-blend-mode: multiply` (lit cell dot, selected proof label, shared-note band). It is never translucent, never glowing; where inks meet, they darken like overprint.

**The Paper-Only Rule.** No dark mode, no colored shadow, no gradient, no glow. Chromatic inks are opaque matte fills; depth comes from paper shadows and ink rules.

## Typography

**Display Font:** Archivo Variable (fallback Archivo, system-ui, sans-serif) — self-hosted woff2, variable weight 100–900, variable width 62%–125%.
**Body Font:** Archivo Variable.
**Label/Mono Font:** Martian Mono Variable (fallback ui-monospace, SF Mono, Menlo) — self-hosted woff2, variable weight 100–800, variable width 75%–112.5%.

**Character:** Archivo is the printer's grotesque: widened and heavy for the monumental chord name and the wordmark, neutral for UI text. Martian Mono is rationed to data and readouts so the interface reads like a press sheet — it never sets a sentence.

### Hierarchy
- **Display** (wght 800, wdth 104, clamp(2.5rem, 5.5vw, 5rem), 0.92, −0.02em): the dictionary chord symbol, screen-printed paper-on-ink inside a halftone block.
- **Headline** (wght 800, wdth 104, clamp(2.25rem, 4vw, 3.5rem), 0.95): the detector's detected chord name.
- **Wordmark** (wght 800, wdth 92, 17px, 0.24em tracking): SERENDIPIA in the transport strip.
- **Subtitle** (wght 800, wdth 92, 1.15rem): the Latin reading under the chord when notation is "both".
- **Title** (wght 520, wdth 100, 16px; 15px in template rows): chord names in chips, suggestions, degree cards and step sheets (`fv-ui`).
- **Body** (400, 15px / 0.9375rem, 1.45): default UI text, note comments, error copy.
- **Field** (600, wdth 100, 20px, 0.01em): the chord input value.
- **Control** (600, wdth 96, 11px, 0.1em, uppercase): every stamp label.
- **Label** (600, wdth 92, 10px, 0.16em, uppercase): section and field headings, printed in blue ink.
- **Readout** (Martian Mono 500, 12px, 0.02em, tabular numerals): the readout class — position/span lines, counts, hints, empty states.
- **Chip** (Martian Mono 500, 11px, tabular): chip and stamp-adjacent data (quality names, bass, inversion, alternatives).
- **Micro** (Martian Mono 500, 8px; 7px in-cell and Latin step lines): step indices, fret strings under proofs, roman numerals on ghost slots.

### Named Rules
**The Rationed-Mono Rule.** Martian Mono appears only where something is measured, counted or marked: fret strings, step indices, roman numerals, chip data, difficulty tags, tempo digits, readouts. Prose, labels and chord names are Archivo.

**The Width-Axis Rule.** The display voice is Archivo's width and weight axes: chord name wdth 104/wght 800, wordmark and Latin reading wdth 92/wght 800, UI chord names wdth 100/wght 520. Nothing wider or heavier than wdth 104/wght 800.

**The Silkscreen-Label Rule.** Structural headings are 10px uppercase, 0.16em tracking, wdth 92/wght 600, lettered in blue ink. Sentences are never uppercased or letterspaced.

## Layout

The app is one paper sheet: `.grain` wraps a centered column of max-width 1560px with 12px padding (20px horizontal, 16px vertical from `sm` up) and 16px gaps between the transport strip and the view. Every view ends with the progression plate spanning all columns.

- **Transport strip** (plate across the top): below 640px it stacks vertically as a flex column; from `sm` up it becomes a wrapping row with 20px column gaps. Left group = wordmark + tab stamps; middle = run, tempo block with −/+, beats, loop; right group (pushed with auto margin, full-width until `sm`) = timbre select, key select + major/minor, notation stamps, volume slider, ES/EN, audio chips.
- **Dictionary**: one column until 1280px, then `minmax(280px,1fr) minmax(420px,1.7fr) minmax(250px,0.9fr)` — symbol plate / board + proofs plate / root + suggestions column — plus the full-width strip after it.
- **Detector**: one column until 1280px, then `minmax(420px,1.6fr) minmax(280px,1fr)` — interactive grid plate / result plate — then the strip.
- **Theory**: one column until 1280px, then `minmax(320px,1.1fr) minmax(320px,1fr)` — diatonic plate (with progression templates below it) / suggestions plate, then the strip.
- **Fret grid**: `24px` string-label column + `34px` open-string column + N equal fret columns, 3px gaps, 30px cells; window 5 frets in the dictionary, 12 in the detector.
- **Root grids**: six equal columns, 6px gaps. **Diatonic degrees**: 2 columns below `sm`, 4 above, 8px gaps.
- **Progression strip**: 16 equal slots with 6px gaps; 68px sheets; a "Swipe →" hint shows below `sm`.

### Named Rules
**The Fold-At-XL Rule.** Every view is a single column until 1280px. Panels reflow and reorder; they do not shrink into unreadable grids.

**The Internal-Scroll Rule.** Wide print surfaces scroll inside their plate, never the page: the 16-slot strip has a 760px minimum width below `sm` inside an `overflow-x-auto` with `snap-x snap-mandatory` and start snapping on each sheet, dropping the floor from `sm` up; the 12-fret detector grid has a 560px minimum inside its own scroller.

## Elevation & Depth

Depth is paper, not light: two soft neutral shadows built from ink at 10–12% alpha, an inset ink press for stamps, and the colored plate offset that simulates a misregistered second pass. There is no glow, no gradient, no glass, and no colored shadow anywhere in the build.

### Shadow Vocabulary
- **Sheet rest** (`box-shadow: 0 1px 2px rgba(26, 26, 26, 0.1), 0 5px 12px rgba(26, 26, 26, 0.07)`): every `.sheet` at rest — proof sheets, suggestion slips, step sheets, degree cards.
- **Sheet lift** (`box-shadow: 0 2px 4px rgba(26, 26, 26, 0.12), 0 12px 22px rgba(26, 26, 26, 0.12)`): sheet hover, paired with `translateY(-2px)`.
- **Stamp press** (`box-shadow: inset 0 2px 0 rgba(26, 26, 26, 0.28)`): a stamp while active.

### Named Rules
**The Paper-Shadows Rule.** Only paper casts shadow, and only in neutral ink tones. Sheets use the rest shadow; hover swaps to the lift shadow and straightens the sheet to 0°; stamps never lift — they press in.

**The Misregistration Rule.** Selection and highlight are printed as a second pass: a solid turquoise plate sits 4px behind a selected proof sheet or the active step, and 5px behind the monumental chord name and the detected chord name. The device is only ever turquoise in the shipped build (the component also declares orange and blue tones).

## Shapes

Square print geometry with hairline rules. Radii are near-zero: stamps, sheets and chips 2px; plates 3px; grid cells 1px. Nothing is a pill; the only round things are the 15px pressed-note dot in a lit cell, the 3px fret-marker dots, the 11px registration circles, the 3.4–4.4px note marks in voicing mini plates, the 6px scrollbar thumb, and the range slider.

Structure is drawn with borders and gaps, never with fill contrast alone: 1px ink on plates, 1px rule on cells and empty slots, 1.5px ink on stamps, 2px ink on the chord field underline and the 2px ink rule under the grid head. Sheets and proof sheets carry a solid or dashed 1px outline; ghost strip slots use a dashed cut line. Distinctive print marks: 11px registration marks (circle + cross) at plate corners, 9px L-shaped crop marks framing the proof-sheet field, and a 4px-pitch halftone dot screen on ink blocks.

### Named Rules
**The Square-Corner Rule.** 3px is the largest radius a working surface may take. Plates are 3px, stamps and sheets 2px, cells 1px. Circles exist only as print marks, dots and controls.

**The Rule-Plus-Gap Rule.** Separation is a 1px rule plus a 3–8px gap. Fill contrast never replaces a border.

## Components

### Buttons — Ink Stamps
- **Character:** rubber stamps: uppercase, letterspaced, pressed in on click.
- **Shape:** 2px radius, 1.5px ink border, transparent face, 32px min-height, 5px/11px padding, 11px uppercase label at 0.1em (wdth 96/wght 600).
- **Sizes:** inline variants collapse padding to 2px/6px for tempo ±, beats, notation, mode and language; the Run stamp holds an 86px minimum width; the timbre and key selects wear the stamp face with `appearance: none` and a pointer cursor.
- **Hover:** 8% ink wash over the paper. **Active:** inset 2px ink press shadow.
- **Pressed state (`aria-pressed="true"`):** ink fill with paper text — tabs, notation, loop, beats-per-chord, major/minor, sevenths, root keys.
- **Live:** turquoise fill with ink text (`stamp--live`) — the Run stamp while playing and the "Activar sonido" prompt.
- **Ink:** permanently ink-filled (`stamp--ink`) — Escuchar and the detector's play action; hover darkens to pure black.
- **Disabled:** opacity 0.35, no shadow, `not-allowed` — the Run stamp when the progression is empty.
- **Focus:** global 2px blue outline, 2px offset.

### Chips
- **Style:** Martian Mono 11px, ink-soft text on paper, 1px rule-strong border, 2px radius, 2px/6px padding; chord-note chips mix in a 10px blue interval symbol and a 16px/520 Archivo note name.
- **Variants:** `chip--ink` (ink fill, paper text) marks the detected chord quality; `chip--blue` (blue-ink border and text) is the audio loading chip.
- **State:** chips are labels, not controls — no hover or pressed behavior. The loading chip (blue, "Imprimiendo…") and the fallback chip (plain paper, "Modo síntesis") appear in the transport only while audio is loading or degraded.

### Plates and Sheets
- **Plates:** paper face, 1px ink border, 3px radius, 16px padding — transport strip, symbol plate, board plate, side columns, result plate, theory columns, strip plate. Three carry registration corners: the transport strip, the dictionary board plate and the detector grid plate print four 11px marks inset 6px.
- **Sheets:** paper face, 1px rule-strong border, 2px radius, rest shadow, 2px radius hover-straightening lift — suggestion slips, degree cards, proof sheets, step sheets.
- **Proof sheets (signature):** 84px-wide sheets stacked under the board inside a dashed cut-line field with four 9px crop marks; each rests at a staggered `translateY` of 0/4/8px following its index mod 3, holds a 40×46 mini fret plate (0.7 rule-strong strokes, turquoise r2.2 dots with a 0.6 ink stroke, ink open rings, red ×), a label band, a mono difficulty tag and a mono fret string. The selected proof gets an ink border and its label band prints turquoise with multiply; it is also the one wrapped in the offset plate.

### Inputs and Fields
- **Style:** transparent background, no box, 2px ink underline, 20px chord value (wdth 100/wght 600), 10px blue label above it, ink-faint placeholder, autofocused on load.
- **Focus:** the global outline is removed and the underline turns blue.
- **Error:** underline turns red and an 11px Martian Mono red line reads "No reconozco ese acorde".
- **Range:** 80px wide, ink accent color. **Selects:** paper face, ink text, stamp styling on the two transport selects.

### Navigation
Three tab stamps (Diccionario / Detector / Teoría) in a 6px-gap row after the wordmark. The active tab is the pressed-ink state — ink fill, paper text. No underline, no indicator animation. The current view is mirrored to the URL hash.

### Tempo Block
A yellow ink block with 2px radius, 2px/8px padding, holding 1.05rem semibold mono tempo digits with tabular numerals, flanked by two compact stamps (− / +) bound to 40–208 BPM.

### Step Grid (signature)
A `24px + 34px + N` column grid at 3px gaps inside the board plate, built from 1px-rule `.cell` buttons 30px tall, rows reversed so the highest string sits on top, under a head row of fret numerals and a 2px ink rule. Marker frets print a 3px orange dot above the numeral. Each cell holds one mono glyph: ○ ink for open, × red for muted, · ink-faint for free; open cells take an ink border. A pressed note prints a 15px turquoise dot with multiply centered in the cell and takes an ink border; hovering that lit cell swaps the dot to orange. The dictionary grid is a 5-fret window with per-string playback; the detector grid is a 12-fret interactive window that also prints 7px note names inside lit cells and under open strings, and scrolls inside the plate below 560px.

### Progression Strip (signature)
A 16-slot grid of paper sheets at 6px gaps, 68px tall. A filled sheet carries a 3px function ink rule at its top (turquoise tonic, blue subdominant, orange dominant, rule-strong for non-diatonic), a mono step index, the chord name at clamp(9px, 0.72vw, 13px), the Latin line in mono 8px when notation is "both", and a bottom band printing the notes shared with the next chord — turquoise, multiply, mono 9px, em-dash when there is no overlap. Filled sheets remove their chord on click and disable while playing; the strip header holds a Clear stamp (only when non-empty) and an n/16 readout. Ghost slots are dashed cut lines with a "+" index, a faint chord name, a roman numeral and a tooltip reason; hover turns border and text blue. Remaining slots are empty paper-deep/40 wells. The active step is wrapped in an offset plate, takes an ink border, and re-enters via the wipe.

### Registration and Print Marks
- **Registration marks:** 11×11 SVG circle-and-cross at 0.8 stroke in ink-soft at 85% opacity, inset 6px at the four corners of the transport strip, the dictionary board plate and the detector grid plate.
- **Crop marks:** 9×9 L-shaped rule-strong borders inset 4px at the four corners of the proof field.
- **Cut lines:** 1px dashed rule-strong — the proof field frame and ghost strip slots.
- **Halftone:** 1px paper dots at 16% alpha on a 4px pitch, printed over the ink-block chord name.
- **Grain:** a fixed, pointer-transparent SVG noise layer at 80% opacity in multiply over the whole page — the press's paper grain.

### Browser Surface
- **Selection:** turquoise background, ink text.
- **Focus:** one global `:focus-visible` — 2px solid blue, 2px offset. Nothing suppresses it except the chord field, which replaces it with its blue underline.
- **Scrollbars:** thin; WebKit bars are 10px with a rule-strong thumb, a 3px paper border and a 6px radius.
- **Numerals:** `.readout` sets tabular numerals; the tempo block also sets `tabular-nums`.
- **Color scheme:** `color-scheme: light` on `html` and a matching meta tag, so selects and scrollbars render light.
- **Motion:** `--ease-print` (cubic-bezier(0.16, 1, 0.3, 1)) is the easing for every state transition — sheets 0.18s, stamps 0.15s, cells 0.14s. The active step enters with a 0.5s clip-path wipe. A lift animation (0.35s) is declared in the theme but not applied by any shipped component.

### Implemented States
- **Hover:** stamps take an 8% ink wash; sheets lift 2px, straighten to 0° and take the lift shadow plus an ink border; grid cells take an ink-soft border and a 5% ink wash; a hovered lit cell swaps its turquoise dot to orange; dashed ghost steps turn blue in border and text.
- **Pressed:** stamps drop into an inset 2px ink shadow while held; grid cells and sheets take no press styling.
- **Pressed state (`aria-pressed="true"`):** ink fill with paper text on tabs, notation, loop, beats, major/minor, sevenths and root keys; proof sheets take an ink border with a multiply turquoise label band; interactive grid cells report their lit state.
- **Live turquoise:** the Run stamp while playing and the "Activar sonido" prompt fill turquoise with ink text.
- **Disabled:** stamps at opacity 0.35 with no shadow and a not-allowed cursor (Run with an empty progression); step sheets disable while playing with a stop tooltip.
- **Empty:** readout lines print in ink-faint — no voicings in range, no suggestions yet, empty progression hint, and the detector's "Ningún acorde reconocible" at 1.05rem in ink-soft; empty strip slots print as paper-deep/40 wells with a rule border.
- **Error:** the chord field underline turns red with an 11px mono red message; no other field errors exist.
- **Loading / fallback:** the blue loading chip and the neutral fallback chip in the transport; the enable prompt is a live stamp until audio starts.
- **Active step:** the playing sheet is wrapped in a turquoise offset plate, takes an ink border, and re-enters under the 0.5s wipe on each pass.

## Do's and Don'ts

### Do:
- **Do** print turquoise as material: offset plate behind selection, multiply dot in lit cells, multiply band for shared notes and selected proof labels, live stamp fill, selection background. Never let it letter a word.
- **Do** set every label with the silkscreen style — 10px uppercase, 0.16em tracking, wdth 92/wght 600 — and print it in blue ink.
- **Do** keep Martian Mono for measurement only: fret strings, indices, roman numerals, chips, difficulty tags, tempo and readouts, always with tabular numerals.
- **Do** keep the misregistration offsets — 4px behind a selected proof or active step, 5px behind the monumental chord name and detected chord name.
- **Do** stack proof sheets at 84px wide with the 0–4–8px resting stagger and the 40×46 mini plate; hover lifts a sheet 2px and straightens it.
- **Do** keep the sheet shadow, lift shadow and stamp press exactly as the theme declares them, in neutral ink tones.
- **Do** keep the print texture: grain overlay, halftone screens on ink blocks, registration marks at plate corners, crop marks and dashed cut lines around the proof field.
- **Do** keep the function ink rules on step sheets and degree cards — turquoise tonic, blue subdominant, orange dominant — and the turquoise overprint band for shared notes.
- **Do** keep the 16-slot strip (dashed ghosts, paper-deep/40 empties, snap scrolling below the fold) and the 12-fret detector grid with internal scroll.

### Don't:
- **Don't** add a third typeface, a serif, or a second sans; Archivo and Martian Mono are the whole press.
- **Don't** use chromatic ink as small-size text; turquoise and orange are material, and red is reserved for errors and muted strings.
- **Don't** exceed 3px of radius on plates or 2px on stamps and sheets, and never introduce pills.
- **Don't** replace borders and gaps with fill contrast, gradients, glows, glass or colored shadows.
- **Don't** reintroduce a dark theme: `color-scheme: light` and the paper ground are committed.
- **Don't** drop the grain, halftone, registration or crop marks — they are the print identity, not decoration.
- **Don't** put Martian Mono into sentences or chord names.
- **Don't** animate beyond state transitions and the active-step wipe.

Reduced motion: `@media (prefers-reduced-motion: reduce)` in `@layer base` collapses every animation and transition to 0.001ms, so the strip wipe, sheet lifts, and state changes resolve instantly.
