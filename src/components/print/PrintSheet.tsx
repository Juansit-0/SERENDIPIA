import { useState } from 'react'
import { createPortal } from 'react-dom'
import { sheetText } from '../../i18n/sheet'
import { tunerText } from '../../i18n/tuner'
import { LATIN_SHARP, PITCH_SHARP } from '../../music/notes'
import { diatonicChords } from '../../music/scales'
import { resolveStepFrets } from '../../music/stepVoicing'
import { useStore } from '../../state/store'
import { SheetDiagram } from './SheetDiagram'
import '../../styles/print.css'

/**
 * The progression as a sheet for the music stand: header with key, tempo and capo, the chord sequence with its
 * numerals, one diagram per chord and the comments between chords. Rendered only while printing (to paper or PDF).
 */
export function PrintSheet() {
  const { progression, analysis, keyRootPc, keyMode, tempo, beatsPerChord, capo, tuning, tuningId, notation, lang, shareLink } = useStore()
  const x = sheetText[lang]
  const [printedOn] = useState(() => new Date().toLocaleDateString(lang === 'es' ? 'es' : 'en'))
  const diatonic = diatonicChords(keyRootPc, keyMode)
  const name = (step: { anglo: string; latin: string }) =>
    notation === 'latin' ? step.latin : notation === 'both' && step.anglo !== step.latin ? `${step.anglo} · ${step.latin}` : step.anglo
  const keyName = notation === 'latin' ? LATIN_SHARP[keyRootPc] : notation === 'both' ? `${PITCH_SHARP[keyRootPc]} · ${LATIN_SHARP[keyRootPc]}` : PITCH_SHARP[keyRootPc]
  const tuningName = tunerText[lang].tunings[tuningId as keyof (typeof tunerText)['es']['tunings']] ?? tuningId

  return createPortal(
    <article className="print-sheet" lang={lang}>
      <header className="print-sheet__head">
        <p className="print-sheet__brand">SERENDIPIA</p>
        <h1>{x.title}</h1>
        <dl className="print-sheet__meta">
          <div>
            <dt>{x.key}</dt>
            <dd>
              {keyName} {keyMode === 'minor' ? x.minor : x.major}
            </dd>
          </div>
          <div>
            <dt>{x.tempo}</dt>
            <dd>{tempo} bpm</dd>
          </div>
          <div>
            <dt>{x.beats}</dt>
            <dd>{beatsPerChord}</dd>
          </div>
          <div>
            <dt>{x.capo}</dt>
            <dd>{capo > 0 ? `${capo}${x.fret}` : x.noCapo}</dd>
          </div>
          <div>
            <dt>{x.tuning}</dt>
            <dd>{tuningName}</dd>
          </div>
        </dl>
      </header>

      <ol className="print-sheet__sequence">
        {progression.map((step, index) => (
          <li key={step.id}>
            {index > 0 && (
              <span className="print-sheet__arrow" aria-hidden="true">
                →
              </span>
            )}
            <span className="print-sheet__seq">
              <span className="print-sheet__seqname">{name(step)}</span>
              <span className="print-sheet__roman">{analysis.chords[index]?.roman ?? ''}</span>
            </span>
          </li>
        ))}
      </ol>

      <ol className="print-sheet__chords">
        {progression.map((step, index) => {
          const frets = resolveStepFrets(step, tuning)
          const fn = diatonic.find((degree) => degree.rootPc === step.rootPc)?.harmonicFunction ?? (analysis.chords[index]?.status === 'secondary' ? 'dominant' : 'borrowed')
          return (
            <li key={step.id} className="print-sheet__chord" data-fn={fn}>
              <span className="print-sheet__num">{index + 1}</span>
              <span className="print-sheet__name">{name(step)}</span>
              <span className="print-sheet__fn">
                {analysis.chords[index]?.roman} · {x.functions[fn]}
              </span>
              {frets ? <SheetDiagram frets={frets} baseLabel={x.fret} /> : <span className="print-sheet__nofrets">—</span>}
            </li>
          )
        })}
      </ol>

      {analysis.transitions.length > 0 && (
        <section className="print-sheet__changes">
          <h2>{x.changes}</h2>
          <ol>
            {analysis.transitions.map((transition, index) => (
              <li key={index}>
                <strong>{lang === 'es' ? transition.titleEs : transition.titleEn}.</strong>{' '}
                {lang === 'es' ? transition.detailEs : transition.detailEn}
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="print-sheet__foot">
        <span>
          {x.link}: {shareLink()}
        </span>
        <span>
          {x.printed} {printedOn}
        </span>
      </footer>
    </article>,
    document.body,
  )
}
