---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/views/TheoryView.tsx","src/views/PracticeView.tsx","src/components/StepRow.tsx","src/components/TransportStrip.tsx"]
---

# Surface brief — SERENDIPIA app shell (redesign «Carta celeste»)

Scope: the whole app shell and its three views — Acorde (Diccionario + Detector merged), Teoría, Práctica — plus the progression strip. Visitor mode: Operate.

Audience, job, action: one guitarist at a desktop with the guitar in hand, lighting that varies (day/night). Job: name ↔ fretboard both ways, hear it, carry chords into a progression and read how it moves. Primary actions: type or mark a chord, Escuchar, Correr. Information architecture is fixed by docs/rediseno/01-arquitectura.md (approved): one-row 52px top bar (views, Correr + moon-phase beat + tempo, capo, «C mayor ▾» key grid popover, Reproducción▾, Sonido▾, theme toggle, ⚙); Acorde view with one 12-fret interactive fretboard; constellation strip ~130px always at the bottom (not in Práctica); desktop no page scroll at ≥1024×640, phones flow.

Constraints: color is information (functions and note roles) and identical in both themes; ornament never sits on data; keyboard-first; meaningful text ≥ 11px, controls ≥ 28px on desktop, 44px on touch. User note on approval: buttons and sections must be clearly distinguishable — every control reads as a control (filled or framed shape, clear pressed/active state), every section has a visible header and edge.

Memorable moment: the eclipse — toggling day/night sweeps a circle out of the toggle and the whole chart changes character; and the progression drawn as a constellation whose stars light up as it plays.

Unresolved: exact fonts licensing via @fontsource; illustration beyond line geometry (user may supply art later).

## Direction contract

THESIS: SERENDIPIA is an observatory of chance, not a chord website: the fretboard is a sky chart, chords are stars, the progression is a constellation you trace, suggestions are «hallazgos»; it refuses the category's white cards of diagrams and the generic dark-neon DAW.

OWN-WORLD: Two themes of one system. Night: near-black violet ground with print grain, lilac ink, hairline-ruled poster modules with corner ticks, dashed «/////» bars, glyph rows, barcode, vertical captions, warped mesh, concentric ripples, 4-point stars, orbit ellipses. Day: silver-grey ground, near-black ink, vivid turquoise fills with dark text and deep turquoise strokes, diamond checker band, charcoal strip band. Function colors in both: tonic lilac, subdominant turquoise, dominant starlight gold, borrowed muted rose. Note roles: root 4-point star, 3rd filled circle, 7th diamond, extension ring. Type: engraved serif display (IM Fell, distressed at night, clean by day), classic serif glosses (EB Garamond), legible sans UI (Jost), tabular numbers.

STORY: The visitor types a chord or marks the chart; the name sets huge in engraved serif inside an orbit, the chart shows each note by role, Escuchar sounds it, «Añadir» places a star in the constellation; Correr lights the stars in turn while the moon phases mark the beat; the strip footer explains each change.

FIRST VIEWPORT: Top bar one row. Acorde view as a poster collage: hero module (kicker, huge chord name with orbit, Latin name), moon/sun phase column, «Hallazgo» gloss and «Pulso»/«Luz» modules; info row (input, «suena» with capo, probable key, glyph row); positions column with warped mesh left of the full-width 12-fret chart; bottom row notes·intervals, Escuchar (primary, largest) + Añadir, alternatives and 3 hallazgos, barcode module. Constellation strip at the bottom.

FORM: «Carta celeste», user-pinned fusion of the user's references (.impeccable/references/ref-magic-poster.png, ref-background-color-theory.png) over the transit-map color logic from roll 6dc8a66b (assigned direction, day/night challenger); approved mockup .impeccable/mocks/decision/carta-celeste-demo.html (night v2 + day) — code-led build; seed key 6dc8a66b.

SIGNATURE INTERACTION: the eclipse theme switch (View Transitions circular reveal from the toggle, reduced-motion instant), moon phase advancing per beat, stars lighting along the constellation as the progression plays.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
