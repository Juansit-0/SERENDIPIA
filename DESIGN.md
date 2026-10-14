---
name: SERENDIPIA
description: Carta celeste — an observatory of chance where the fretboard is a sky chart, chords are stars and the progression is a constellation; one system in two themes (night, day).
colors:
  night-ground: "#0d0b14"
  night-ground-2: "#1d1829"
  night-ground-3: "#2a2440"
  night-line: "#75689a"
  night-line-strong: "#a596cc"
  night-ink: "#ece5f8"
  night-ink-soft: "#c2b7da"
  night-ink-faint: "#9b90b5"
  night-accent: "#c7b3e8"
  night-accent-ink: "#120f1a"
  night-accent-deep: "#d6c6f0"
  night-danger: "#ff8f8f"
  night-focus: "#40e0d0"
  day-ground: "#e3e2e8"
  day-ground-2: "#f6f5f9"
  day-ground-3: "#ffffff"
  day-line: "#7e7a8c"
  day-line-strong: "#4a4656"
  day-ink: "#15131c"
  day-ink-soft: "#37343f"
  day-ink-faint: "#595565"
  day-accent: "#40e0d0"
  day-accent-ink: "#0b1716"
  day-accent-deep: "#0a6f68"
  day-danger: "#b3261e"
  day-focus: "#0a6f68"
  day-band-ground: "#2a2a2f"
  day-band-ground-2: "#34343b"
  day-band-ground-3: "#43434d"
  fn-tonic-night: "#c7b3e8"
  fn-sub-night: "#40e0d0"
  fn-dom-night: "#e8c37a"
  fn-borrowed-night: "#e2a4bf"
  fn-tonic-day: "#5d43a3"
  fn-sub-day: "#0a6f68"
  fn-dom-day: "#8a5d0c"
  fn-borrowed-day: "#9c3f66"
  fn-tonic-fill-day: "#b7a1e6"
  fn-sub-fill-day: "#40e0d0"
  fn-dom-fill-day: "#e9b949"
  fn-borrowed-fill-day: "#e6a2c0"
  role-root-night: "#d8c9f5"
  role-third-night: "#9a93ee"
  role-seventh-night: "#ece5f8"
  role-other-night: "#8b82b8"
  role-root-day: "#40e0d0"
  role-third-day: "#5d43a3"
  role-seventh-day: "#15131c"
  role-other-day: "#55505f"
typography:
  display:
    fontFamily: "'IM Fell English', 'Iowan Old Style', Georgia, serif"
    fontSize: "min(7.5rem, container-fit)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  gloss:
    fontFamily: "'EB Garamond', 'Iowan Old Style', Georgia, serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: "'Jost Variable', 'Avenir Next', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.3
  label:
    fontFamily: "'Jost Variable', 'Avenir Next', system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.16em"
rounded:
  module: "3px"
  band: "2px"
  popover: "6px"
  pill: "999px"
spacing:
  gap-collage: "6px"
  gap-desk: "8px"
  topbar-height: "52px"
  control-desk: "32px"
  control-touch: "44px"
components:
  module:
    backgroundColor: "{colors.night-ground-2}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.module}"
  button:
    backgroundColor: "{colors.night-ground-3}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 0.85rem"
    height: "32px"
  button-primary:
    backgroundColor: "{colors.night-accent}"
    textColor: "{colors.night-accent-ink}"
    rounded: "{rounded.pill}"
  button-primary-day:
    backgroundColor: "{colors.day-accent}"
    textColor: "{colors.day-accent-ink}"
  button-lg:
    rounded: "{rounded.pill}"
    padding: "0.5rem 1.4rem"
    height: "48px"
  button-icon:
    rounded: "{rounded.pill}"
    width: "32px"
    height: "32px"
  segmented:
    backgroundColor: "{colors.night-ground}"
    rounded: "{rounded.pill}"
    padding: "2px"
  chip:
    textColor: "{colors.night-ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.55rem"
  popover:
    backgroundColor: "{colors.night-ground-2}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.popover}"
  section-label:
    backgroundColor: "{colors.night-accent-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.band}"
    padding: "0.18rem 0.5rem"
---

# Design System: SERENDIPIA

## Overview

**Creative North Star: "Carta celeste"**

SERENDIPIA is an observatory of chance, not a chord website. The fretboard is a sky chart, each chord is a star, the progression is a constellation the player traces, and suggestions are "hallazgos". One system lives in two themes on `html[data-theme="night|day"]`. Night is a near-black violet ground with print grain and lilac ink. Day is a silver-grey ground with near-black ink, vivid turquoise fills and deep-turquoise strokes. The theme follows the operating system until the player chooses, and the choice is stored.

The surface is a poster collage: clearly bounded modules with hairline frames and corner ticks, small spaced-caps section headers, dashed hatch bars, a barcode, a warped mesh, concentric ripples, orbit ellipses. Type is engraved: a Fell serif for the chord name, a Garamond serif for dictionary-style glosses, a geometric sans for everything you operate. Density is high and exact: on a desk the whole app fits one screen with no page scroll.

Color is information. Function colors and note-role shapes mean the same thing in both themes, and ornament never sits on data.

**Key Characteristics:**
- Two themes, one meaning: the same function names and note roles resolve to a lilac/turquoise/gold/rose set at night and a darker, legible set by day.
- Sections and controls must read as such: framed, raised, with a visible pressed state.
- Flat tonal layering (ground, ground-2, ground-3) with hairline frames; shadows are small and structural.
- Engraved serif display, distressed at night and clean by day.
- Desk shell with no page scroll at 1024x640 and up; phones flow normally.

## Colors

A violet-black night and a silver day, joined by one lilac-or-turquoise accent and four function hues that never change meaning. Token names in the frontmatter are the normative values; each theme's `--cc-*` set is switched by the `data-theme` attribute.

### Primary
- **Lilac Accent (night)** (night-accent): the filled state of primary buttons, pressed segments, selection highlight. Its ink is near-black violet (night-accent-ink).
- **Turquoise Accent (day)** (day-accent): the same roles by day, with near-black text. Because turquoise is too light for text on the silver ground, text and strokes use the Deep Turquoise (day-accent-deep) instead.
- **Accent Deep** (night-accent-deep / day-accent-deep): section labels, the hero chord name, hover borders. Lighter lilac at night, deep turquoise by day.

### Secondary: function colors
- **Tonic** (fn-tonic-*): lilac at night, violet by day.
- **Subdominant** (fn-sub-*): turquoise at night, deep turquoise by day.
- **Dominant** (fn-dom-*): starlight gold at night, ochre by day.
- **Borrowed** (fn-borrowed-*): muted rose at night, plum-rose by day.
- Each has a `-fill` partner for shapes and areas. At night the fill equals the stroke; by day the fill is lighter (violet-lilac, turquoise, amber, pink) so text on top stays legible.

### Tertiary: note roles on the chart
- **Root** (role-root-*): lilac-white star at night; turquoise star with a near-black outline by day.
- **Third** (role-third-*): periwinkle at night; violet by day.
- **Seventh** (role-seventh-*): ink-colored at both themes.
- **Extension** uses the ink color as a stroke only; **other tones** use a muted violet (night) or grey (day).

### Neutral
- **Ground / Ground-2 / Ground-3**: page, section and control surfaces, stepping up so frames and controls clear 3:1 against the ground.
- **Line / Line-strong**: hairline frames and stronger control borders. Line-strong also colors the corner ticks and the hatch.
- **Ink / Ink-soft / Ink-faint**: primary, secondary and tertiary text. Ink-faint is the floor for meaningful text.
- **Danger** and **Focus**: danger is salmon at night and brick by day; focus is turquoise at night and deep turquoise by day (2px outline, 2px offset).
- **Strip band**: in both themes the progression strip is a section one step up from the page (`ground-2`) under an 8px diamond checker band — turquoise on dark ink by day, lilac on the night ground by night (the earlier charcoal day band and the borderless night strip were both rejected by the user). `.on-dark` remains available in celeste.css but the strip no longer uses it.

### Named Rules
**The Color-Is-Information Rule.** Hue is reserved for harmonic function (tonic, subdominant, dominant, borrowed) and note role. Never use a function hue as decoration, and never change what a hue means between themes.
**The Print-Grain Rule.** A fixed overlay of fractal noise sits over the page (overlay blend, 9% at night, 6% by day). It is texture only and never carries meaning.

## Typography

**Display Font:** IM Fell English (with Iowan Old Style, Georgia, serif)
**Gloss Font:** EB Garamond (with Iowan Old Style, Georgia, serif)
**UI Font:** Jost Variable (with Avenir Next, system-ui, sans-serif)

**Character:** An old star atlas annotated by a modern hand. The Fell serif is engraved and slightly irregular, the Garamond reads like dictionary entries, and Jost keeps every control unambiguous. All three are self-hosted through @fontsource.

### Hierarchy
- **Display / hero chord name** (400, fitted, 0.95): the chord name set as large as its box allows, capped at 7.5rem on the desk. Size is the minimum of the cap and a container-width fit based on character count, and it never wraps. Filtered with a distress effect at night, clean by day. Color: accent-deep.
- **Card chord names** (400, up to 3.6rem in theory cards, 3rem in practice slots, line-height 1): the same display face fitted to the card.
- **Gloss** (EB Garamond 400, 0.9375rem, ink-soft): dictionary-style explanations, Latin name, hallazgo text.
- **Body / control** (Jost 500, 0.8125-0.875rem): buttons, segments, readouts.
- **Label** (Jost 600, 0.6875rem, 0.16em tracking, uppercase, accent-deep): section headers. Meaningful text is never below 11px.

### Named Rules
**The Numeral Rule.** Readouts (tempo, fret, beat, counts) use tabular numerals through `.cc-num`. Chord names in the display serif use lining numerals so extensions (7, 9, 13) read as numbers. The build sets no oldstyle numerals anywhere.
**The Serif-For-Names Rule.** Engraved serif is for chord names and glosses only; anything you click is Jost.

## Layout

The Acorde view is a poster collage on a fixed grid. Top bar: one row, 52px, no wrapping on the desk. Below it, the app fills the viewport height (`h-dvh`, overflow hidden) from 1024px wide and 640px tall (the `desk` condition). The main view and the progression strip share the remaining height; there is no page scroll on the desk. Content max width is 1560px, 1840px from 1600px wide.

Acorde at desk size is a four-row grid with 6px gaps: hero row (height clamp(108px, 13.5vh + 28px, 220px)) holding the hero module and the 38px moon/sun phase column; a 40px info row (input, "suena" with capo, probable key, glyph row); a flexible row with the positions column (188px, 224px from 1600px) beside the full-width 12-fret chart; and an auto row for notes and intervals, Escuchar plus Añadir, alternatives, hallazgos and the barcode. The chart rows flex between 25px and 72px (96px from 1600px wide) and compress to 22px at heights under 700px.

Below the desk condition, everything flows in one column with normal page scroll. Teoría is a card grid (2 columns, 4 from 640px, 7 for the degree row on the desk); Práctica is a slot grid of 1 to 4 columns. The progression strip is 16 columns of at least 80px each and scrolls horizontally inside its own frame. It is shown in Acorde and Teoría and not in Práctica.

Control sizing: 32px on the desk, 28px for segmented options, 44px for coarse pointers, 48px for the large primary.

### Named Rules
**The Desk-Fits Rule.** On the desk nothing may push the page into scroll. New content must fit a row budget or live in a popover.
**The Ornament-Never-On-Data Rule.** Mesh, ripples, orbits, hatch, barcode and checker bands sit behind or beside content, with no pointer events, and never overlap a fret position, a note, a chord name or a number.

## Elevation & Depth

Depth is tonal first: ground, ground-2 (modules, popovers) and ground-3 (controls) step up in lightness, and hairline frames mark every edge. Shadows are small and structural.

- **Control rest** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 5px -2px rgba(0,0,0,0.45)`): every button reads as raised.
- **Hover halo** (`0 0 0 3px var(--cc-accent-soft)`; primary `0 0 0 4px` plus `0 6px 18px -8px rgba(0,0,0,0.5)`): an accent glow, not a drop.
- **Popover** (`0 18px 40px -16px rgba(0,0,0,0.55)`): menus lifted off the page.

### Named Rules
**The Sections-And-Buttons-Must-Read Rule.** Every section has a visible header and a framed edge; every control is a filled or framed shape with a visible pressed or active state. Pressed, current and expanded states all fill with the accent.

## Shapes

Sections are nearly square: a 3px radius, a 1px hairline, and 7px L-shaped corner ticks at the top-left and bottom-right. Controls are pills (999px). Popovers are 6px. Section header bands are 2px. Note roles on the chart are geometry, not color alone:

- **Root:** four-point star.
- **Third:** filled circle.
- **Seventh:** diamond.
- **Extension:** ring (stroke only).
- **Other tones:** small dot.

Ornament vocabulary: dashed "/////" hatch (6px, 60-degree), diamond checker band (12px, accent on ink), warped mesh, concentric ripples, orbit ellipses around the hero, four-point stars.

## Components

### Modules
Poster cells. Ground-2 fill, 1px line border, 3px radius, corner ticks. The only way to group content on the page.

### Section label
Jost 600, 11px, uppercase, 0.16em tracking, accent-deep. Header elements (h1 to h4, legend) get a filled band (accent-soft) with 2px radius; inline labels stay plain text.

### Buttons
- **Default / ghost:** ground-3 fill, line-strong border, pill, 32px minimum height, Jost 500 at 0.875rem, raised at rest.
- **Hover:** border shifts to accent-deep with a 3px accent-soft halo. Active moves 1px down.
- **Pressed / current / expanded:** accent fill, accent-ink text.
- **Primary:** accent fill at rest, weight 600. **Large:** 48px, 1.125rem; used for Escuchar. **Icon:** 32px square.
- **Disabled:** 40% opacity, no shadow.
- Icons are inline SVG line icons in the app's own icon set.

### Segmented control
A framed pill group on the ground, 2px padding. Options are 28px minimum; the selected one fills with the accent; hover tints with accent-soft.

### Chips
Information, not controls: hairline pill, 12px text in ink-soft, no hover.

### Popovers
Ground-2, line-strong border, 6px radius, large soft shadow. Used for the key grid (4-column), Reproducción, Sonido and strip tools.

### Hero chord name
Engraved display serif inside an orbit, accent-deep, fitted to its module. Distress filter at night only.

### Gloss
Garamond, ink-soft, dictionary-style entries.

### Fretboard
12 frets, always interactive. Strings read as the main lines and frets recede. Marks use the note-role shapes and colors.

### Constellation strip
The progression as a row of stars (16 columns). Stars take the function color and light up in turn while playing. It sits on a `ground-2` band under the diamond checker (turquoise by day, lilac by night); the constellation lines join the stars only (the lines layer spans roman + star height, never the tiles).

Motion (only with motion allowed): a new chord lands as a star turning into place (520ms) and its line fades in after it; the playhead flares as it reaches each star; hallazgo stars breathe out of step with each other.

### Oír (hearing the guitar)
A microphone button sits at the end of the chord input. While on, the context module becomes the readout: a twinkling dot, «Oigo» + the chord in IM Fell English (settling in like the hero), the two runner-up names faint, a thin confidence bar and «+ Añadir». A chord heard three times in a row with ≥62% confidence becomes the Acorde view's chord (as a shape under the capo). Engine: `src/music/listen.ts` (spectral peaks → notes, overtones ×3/×5/×6/×7 dropped → the fretboard's own naming via `detectFromMidi`); mic plumbing shared with the tuner in `src/audio/mic.ts`.

### Práctica · Oído (ear training)
Práctica has a segmented switch «Cambios | Oído». Oído: a setup module (what to name: Acordes / Intervalos; level 1–4, each adding answers; chords played together or as an arpeggio), a stats module (Racha, Aciertos, Mejor racha per mode and level, `serendipia.ear.v1`), and a stage with a big round «Empezar / Otra vez» button in the accent, the question in IM Fell English and the answers as large buttons numbered for the keyboard. A right answer fills turquoise with a pop and moves on after ~1s; a wrong one shakes, is struck through, names the right answer and offers «Oír la diferencia» (what sounded, then what was said, from the same root). Space hears again, 1–9 answer (the hint shows only with a precise pointer). Engine: `src/music/ear.ts`, played through `audioEngine.playNotes`.

### Teoría · Escalas
Teoría's head carries «Acordes | Escalas» (Tríadas/Séptimas shows only under Acordes). Escalas: scale select (Mayor, Menor, Pentatónica mayor/menor, Blues, Menor armónica; defaults to the key's own), Posición «Todo | 1…n» (one box per scale note on the low string, four frets wide, washed in accent-soft; the rest dims to 22%), and Grados/Notas labels. The neck (frets 0–15, high e on top) is a grid whose cells draw their piece of string and fret wire; scale notes are round stones, the root a squared stone with a heavier rim, and the tones of the chord to play over — the progression step under the playhead, else the Acorde view's chord — are filled in the accent. Chord tones outside the scale are named in the borrowed pink. A tap plays the note. Logic: `src/music/scaleBoard.ts`.

### Práctica · Progreso
Third tab of Práctica. Stat tiles (Racha in days, last 30 days and total minutes, ear accuracy) in ink, never in the series color; «Minutos por día · últimas 4 semanas» as one-series bars (4px rounded data ends, square at the baseline, 2px gaps; one dashed ceiling gridline labelled in minutes; today brighter; per-day hover tooltip over full-height targets; a visually hidden table carries the same data) in `--pg-bar` — #9d7cf0 by night, #0f9488 by day, both passing the dataviz palette checks on their module surface; and each chord pair's changes per minute as a 2px sparkline with the latest point marked and «última · mejor» beside it. Data: `src/music/history.ts` (`serendipia.history.v1`), logged by finished Cambios rounds and every Oído answer (up to 30s each), carried in the library backup and merged without double counting.

### Ready to play
Installable (site.webmanifest, 192/512 icons) and offline after the first visit: the build emits `sw.js` (`scripts/offline.ts`) precaching every built file (latin font subsets only), network-first for the page. The screen stays on (Wake Lock) while music plays and in Práctica. While stopped, a page-turner pedal (PageDown/PageUp) or ←/→ with nothing focused walks the progression: the chord shows in Acorde, strums once, and its strip tile is framed in the accent (`.is-cursor`). Ajustes lists the shortcuts as key caps.

### Welcome
First visit only (not when arriving by a shared link); Ajustes ⚙ → «Ver la bienvenida» shows it again. A full-screen three.js sky (`src/welcome/scene.ts`, lazy chunk) where ~1700 stars gather into one figure per step: the brand mark, an Am chord chart, the C–G–Am–F constellation in function colors, and the same constellation with dotted hallazgos and shooting stars. Night: additive light; day: printed ink dots, chord stars with an ink ring. Text sits left of the sky (≥640px wide and ≥5:4) or under it, in IM Fell English / EB Garamond. Reduced motion: figures appear without travel, no drift or shooting stars. Without WebGL the text stands alone, centred. Skip, Escape, ←/→ and the diamond step marks all work. Leaving (Saltar, Escape or «Empezar a tocar»): the stars jump to warp, rushing out and past the viewer, while a circle with a ring of light opens from the pressed button onto the app (≈1.05s; `@property --welcome-hole` drives the mask). As it opens, `html[data-entrance]` makes the app assemble itself: top bar down, modules rising out of a blur in turn, the strip up and its stars landing one after another. Reduced motion: the welcome just closes.

### Motion
`src/styles/motion.css`, all inside `prefers-reduced-motion: no-preference` and with `backwards` fill so nothing keeps a transform once played (no stray stacking contexts). Views fade up on switch (380ms); a new chord name arrives out of focus and settles (520ms, an inner keyed span so the live region stays put); fretboard marks pop in turning; «Puede seguir» ideas rise in one after another; popovers unfold (190ms; the strip menu from its foot on desk); buttons give to 0.96 under the finger; the ☾/☀ icon turns as the eclipse passes; the tuner's needle star glows while in tune; the song chip pops in. Struck strings ring on the fretboard — a damped vibration with an accent glow, low strings longer, staggered like a strum (`src/state/pluck.ts` signals which strings sounded). Teoría deals its degree cards in one after another with the orbit fading in behind, and names settle again when switching triads/sevenths. Práctica sends a ring out from «¡Cambio!» on every counted change, its counters tick, and the target rings breathe while a round runs.

The ⋯ menu holds Vaciar, Guardar, Transponer (±1 semitone or «Llevar a» any of 12 keys by the shortest way, one undo step each; barre shapes slide along the neck, open shapes return to automatic), Mis progresiones (with a two-tap delete and JSON backup download/import; the backup carries songs too), Canciones (songs: saved or current progressions as labelled sections — Intro, Verso, Pre-coro, Coro, Puente, Solo, Outro — with ×1–×8 repeats; playing one walks the sections back to back without a gap, the strip shows the section under the playhead and a ♪ chip names song, section and repeat; stopping gives the player's own progression back, outside the undo history), Compartir enlace and Imprimir hoja: a print-only sheet (`src/components/print`, `src/styles/print.css`) in ink on white whatever the theme — header with key, tempo, beats, capo and tuning; the sequence with numerals; one diagram per chord under a band in its function color; the comments between chords; the share link. «Guardar como PDF» comes from the browser's print dialog.

### Top bar
One row, 52px: views, Correr plus moon-phase beat and tempo, capo, key popover, Reproducción, Sonido, Afinador, settings, theme toggle. Below 1500px wide the popover triggers show icons only, so the row never overflows.

Reproducción's Ritmo list ends with «Mi patrón»: choosing it opens eight eighth-note slots (1 y 2 y 3 y 4 y, downbeats with a stronger rim), each tapped through rest «·» → down «↓» → up «↑»; struck slots fill in the accent. «Probar» strums one bar on the chord in view (and the fretboard strings ring). The pattern is a string like "D.DU.UDU" in the settings, travels in share links (`cs=`) and saved progressions when used, and any step can take it in the step picker.

The Afinador popover holds the tuning choice (it sets the tuning for the whole app), a ±50-cent gauge whose needle carries a star (turquoise/lilac when within ±5 cents), the note in IM Fell English, the peg advice (tensa/afloja) and six string buttons: tapping one fixes it as the target and plays its reference note. The microphone opens only on «Activar micrófono» and closes with the popover. The beat is shown as moon phases advancing per beat.

### Eclipse (theme switch)
View Transitions reveal: the new theme grows as a circle (clip-path, 700ms, cubic-bezier(0.65, 0, 0.35, 1)) out of the toggle's center. With reduced motion or no API the switch is instant. `.cc-twinkle` pulses opacity between 0.55 and 1 over 3.2s, only when motion is allowed.

### Named Rules
**The Day/Night Eclipse Rule.** The two themes differ in ground, ink, accent and grain, never in meaning. Switching always goes through `setThemePreference` (`src/state/theme.ts`), with the circle origin at the control that was pressed (the ☾/☀ toggle or the Ajustes option).

**The Theme Preference Rule.** The preference is «Automático» (default: follows the system's light/dark mode live, e.g. macOS switching at sunset), «Día» or «Noche»; it is chosen in Ajustes ⚙ → Tema and remembered per browser. The ☾/☀ toggle fixes the opposite theme; choosing «Automático» again forgets the fixed choice. Live system changes swap instantly, without the eclipse.

## Do's and Don'ts

### Do:
- **Do** express harmonic function with the four function hues and note roles with their shapes; keep both identical in meaning across themes.
- **Do** frame every section as a module with a header, and give every control a raised or filled shape with a visible pressed state.
- **Do** use tabular numerals for readouts and lining numerals for chord names.
- **Do** keep meaningful text at 11px or larger, controls at 28px or larger on the desk and 44px on touch, and visible 2px focus outlines.
- **Do** respect reduced motion: twinkle, ripples and the eclipse become static or instant.
- **Do** add tokens as `--cc-*` pairs for both themes at once.

### Don't:
- **Don't** put ornament (mesh, ripples, hatch, orbit, barcode) over data or give it pointer events.
- **Don't** use a function hue decoratively, or encode a note role by color alone.
- **Don't** use turquoise as text on the day ground; use the deep turquoise.
- **Don't** add page scroll to the desk shell, or wrap the top bar.
- **Don't** reintroduce the retired Riso Studio tokens (paper, riso blue, orange, yellow, Archivo, Martian Mono); `tailwind.css` now only imports Tailwind and `celeste.css`, declares the `desk` variant and sets page defaults on Carta celeste tokens.
- **Don't** build white-card diagram grids or generic dark neon DAW chrome.
