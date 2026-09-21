---
version: 1
slug: "src-views-dictionaryview-tsx"
primary_target: "src/views/DictionaryView.tsx"
related_targets: ["src/App.tsx"]
---

# Surface brief — Dictionary home (SERENDIPIA)

Scope: the app's first surface, the chord dictionary home, plus the shared shell it lives in. Visitor mode: Operate.

Audience, job, action: one guitarist at a desktop with the guitar in hand; job is to turn a chord name into playable positions and sound fast, then carry chords into a progression. Primary action: type or pick a chord and hear it; secondary: punch chords into the step row and run the loop. Theory depth is user-controlled, from beginner to advanced, never assumed.

Proof/content: factual music data authored in-app (chord names, voicings, intervals, progressions). No commercial claims. Audio is synthesized, no assets. Bilingual ES/EN with Anglo notation primary and Latin visible.

Constraints: desktop-first responsive; keyboard-first, no mouse-only path; dark professional-instrument aesthetic; turquoise #40E0D0 as the only glow; no cards-of-diagrams list, no SaaS dashboard language, no gamification.

Memorable moment: the turquoise chase light running the progression while the fretboard cells stay lit under it.

Unresolved: deploy target; capo; alternate tunings UI; metronome; export/share.

## Direction contract

THESIS: SERENDIPIA is a practice instrument, not a chord website: one dark panel where the chord symbol is monumental type, the fretboard is a step grid of lit cells, and progressions are patterns punched into a step row and run under a turquoise chase light; it refuses the category's card list of diagrams.

OWN-WORLD: Elegant near-black panel #0F1214, silkscreen off-white #E9E6DF, turquoise #40E0D0 as the only glow, deep teal #1E6F66 for armed states, muted brass #C0A062 for tempo and secondary readouts, graphite keys #2A2F34. Component language: silkscreen-labeled rows, key caps with hairline gaps, segmented readouts, engraved hairlines, chase-light strip.

STORY: The visitor types a chord and sees it as the largest object on the panel; positions light as step grids with mono labels; tapping a pad auditions a voicing; punching chords into the step row and hitting run plays the progression under a turquoise chase light; ghost keys past the playhead name the next chords and why.

FIRST VIEWPORT: One instrument panel at desktop width: transport strip across the top (run, tempo in segmented brass readout, loop, key, notation ES/EN, language); at left the chord symbol at specimen scale with its Latin reading and a mono fact readout; at center the six-string step grid of the current voicing with silkscreen string labels and turquoise-lit cells; below it a row of voicing pads; at the bottom the step row with ghost suggestion keys. Primary action is the chord input at top-left, focused on load.

FORM: Early-80s rhythm-machine step row (step keys, chase light, silkscreen panel), position 1 of 7 grounded directions; seed key 55537ada.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
