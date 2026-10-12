import { useMemo, useState } from 'react'
import { useViewsText } from '../i18n/views'
import { latinName, pitchName, keyAccidental } from '../music/notes'
import { parseChord } from '../music/parseChord'
import { PROGRESSIONS, resolveProgression } from '../music/progressions'
import { diatonicChords, functionLabelKey } from '../music/scales'
import { useStore } from '../state/store'
import { DegreeCard } from './theory/DegreeCard'
import { Orbit } from './theory/Orbit'
import '../styles/views.css'

export function TheoryView() {
  const { keyRootPc, keyMode, t, lang, notation, chord, setChord, addToProgression, loadProgression } = useStore()
  const v = useViewsText()
  const [sevenths, setSevenths] = useState(false)

  const diatonic = useMemo(() => diatonicChords(keyRootPc, keyMode, sevenths), [keyRootPc, keyMode, sevenths])
  const progressions = useMemo(() => PROGRESSIONS.filter((item) => item.mode === keyMode), [keyMode])
  const isCurrent = (rootPc: number, qualityId: string) =>
    chord.bassPc === null && chord.rootPc === rootPc && chord.quality.id === qualityId

  const accidental = keyAccidental(keyRootPc, keyMode)
  const keyName = `${notation === 'latin' ? latinName(keyRootPc, accidental) : pitchName(keyRootPc, accidental)} ${v(keyMode === 'major' ? 'theory.major' : 'theory.minor')}`

  return (
    <div className="tv flex flex-col gap-3 desk:h-full desk:min-h-0 desk:gap-2">
      <section className="cc-module tv-head" aria-label={v('theory.key')}>
        <div className="tv-head__key">
          <span className="cc-label">{v('theory.key')}</span>
          <h2 className="tv-head__title" aria-label={`${v('theory.key')}: ${keyName}`}>
            {keyName}
          </h2>
        </div>
        <p className="tv-head__hint cc-gloss">{v('theory.keyHint')}</p>
        <div className="cc-seg" role="group" aria-label={v('theory.chordType')}>
          <button type="button" aria-pressed={!sevenths} onClick={() => setSevenths(false)}>
            {v('theory.triads')}
          </button>
          <button type="button" aria-pressed={sevenths} onClick={() => setSevenths(true)}>
            {v('theory.sevenths')}
          </button>
        </div>
      </section>

      <section className="cc-module tv-degrees" aria-label={v('theory.degrees')}>
        <Orbit />
        <h3 className="cc-label tv-degrees__label">{t('theory.diatonic')}</h3>
        <ul className="tv-degrees__grid">
          {diatonic.map((degree) => {
            const name = notation === 'latin' ? degree.latin : degree.anglo
            return (
              <DegreeCard
                key={`${degree.roman}-${degree.rootPc}`}
                degree={degree}
                name={name}
                gloss={v(`theory.gloss.${degree.harmonicFunction}` as const)}
                functionLabel={t(functionLabelKey(degree.harmonicFunction))}
                current={isCurrent(degree.rootPc, degree.qualityId)}
                addLabel={v('theory.add', { chord: name })}
                onSelect={() => {
                  const parsed = parseChord(degree.anglo)
                  if (parsed) setChord(parsed)
                }}
                onAdd={() =>
                  addToProgression({ rootPc: degree.rootPc, qualityId: degree.qualityId, anglo: degree.anglo, latin: degree.latin })
                }
              />
            )
          })}
        </ul>
      </section>

      <section className="cc-module tv-classics" aria-label={v('theory.classics')}>
        <div className="tv-classics__head">
          <h3 className="cc-label">{v('theory.classics')}</h3>
          <span className="tv-classics__hint cc-gloss">{v('theory.classicsHint')}</span>
        </div>
        <ul className="tv-classics__list">
          {progressions.map((template) => {
            const steps = resolveProgression(template, keyRootPc)
            const name = lang === 'es' ? template.nameEs : template.nameEn
            return (
              <li className="tv-classic" key={template.id}>
                <div className="tv-classic__text">
                  <span className="tv-classic__name">{name}</span>
                  <span className="tv-classic__seq">{steps.map((step) => (notation === 'latin' ? step.latin : step.anglo)).join(' · ')}</span>
                </div>
                <button
                  type="button"
                  className="cc-btn cc-btn--ghost tv-classic__use"
                  aria-label={v('theory.useAria', { name })}
                  onClick={() =>
                    loadProgression(
                      steps.map((step) => ({ rootPc: step.rootPc, qualityId: step.qualityId, anglo: step.anglo, latin: step.latin })),
                    )
                  }
                >
                  {v('theory.use')}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
