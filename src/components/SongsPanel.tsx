import { useState } from 'react'
import { songsText } from '../i18n/songs'
import { MAX_REPEATS, MAX_SECTIONS, SECTION_LABELS, SONGS_LIMIT, songId, type SectionLabel, type Song, type SongSection } from '../state/songs'
import type { SharedProgression } from '../state/share'
import { useStore } from '../state/store'
import { CloseIcon, MinusIcon, PlusIcon } from './icons'

const CURRENT = '__current'

/** Songs: saved progressions joined as sections (Intro, Verso ×2, Coro…), edited and played through from the strip menu. */
export function SongsPanel({ onAnnounce }: { onAnnounce: (message: string) => void }) {
  const { songs, saveSong, deleteSong, playSong, songPlay, playing, stopPlayback, library, progression, tempo, beatsPerChord, capo, strum, notation, lang } = useStore()
  const x = songsText[lang]
  const [draft, setDraft] = useState<Song | null>(null)
  const [source, setSource] = useState(CURRENT)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const chords = (progression: SharedProgression) => progression.steps.map((step) => (notation === 'latin' ? step.latin : step.anglo)).join(' · ')
  const summary = (song: Song) => song.sections.map((section) => `${x.labels[section.label]}${section.repeats > 1 ? ` ×${section.repeats}` : ''}`).join(' · ')

  const updateSection = (index: number, patch: Partial<SongSection>) =>
    setDraft((current) => current && { ...current, sections: current.sections.map((section, position) => (position === index ? { ...section, ...patch } : section)) })

  const moveSection = (index: number, by: number) =>
    setDraft((current) => {
      if (!current) return current
      const target = index + by
      if (target < 0 || target >= current.sections.length) return current
      const sections = [...current.sections]
      ;[sections[index], sections[target]] = [sections[target], sections[index]]
      return { ...current, sections }
    })

  const addSection = () => {
    if (!draft || draft.sections.length >= MAX_SECTIONS) return
    const entry = library.find((item) => item.id === source)
    const progressionData: SharedProgression = entry
      ? entry.progression
      : { steps: progression.map(({ id: _id, ...step }) => step), tempo, beatsPerChord, capo, strum }
    if (progressionData.steps.length === 0) return
    // A new section guesses its label from the order: first Intro-less verse, then chorus, then bridge.
    const used = draft.sections.map((section) => section.label)
    const label: SectionLabel = !used.includes('verse') ? 'verse' : !used.includes('chorus') ? 'chorus' : !used.includes('bridge') ? 'bridge' : 'verse'
    const section: SongSection = { id: songId('sec'), label, repeats: 1, source: entry?.name ?? x.current, progression: progressionData }
    setDraft({ ...draft, sections: [...draft.sections, section] })
  }

  if (draft) {
    const canSave = draft.name.trim().length > 0 && draft.sections.length > 0
    return (
      <form
        className="songs"
        onSubmit={(event) => {
          event.preventDefault()
          if (!canSave) return
          saveSong(draft)
          onAnnounce(x.saved)
          setDraft(null)
        }}
      >
        <label className="sr-only" htmlFor="song-name">
          {x.name}
        </label>
        <input
          id="song-name"
          className="strip-field"
          value={draft.name}
          maxLength={60}
          autoComplete="off"
          placeholder={x.namePlaceholder}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />

        <span className="cc-label">{x.sections}</span>
        {draft.sections.length === 0 ? (
          <p className="strip-menu__note">{x.noSections}</p>
        ) : (
          <ol className="songs__sections">
            {draft.sections.map((section, index) => (
              <li key={section.id}>
                <div className="songs__row">
                  <select
                    className="cc-select songs__label"
                    aria-label={`${x.label} ${index + 1}`}
                    value={section.label}
                    onChange={(event) => updateSection(index, { label: event.target.value as SectionLabel })}
                  >
                    {SECTION_LABELS.map((label) => (
                      <option key={label} value={label}>
                        {x.labels[label]}
                      </option>
                    ))}
                  </select>
                  <div className="songs__repeats" role="group" aria-label={x.repeats}>
                    <button type="button" className="cc-btn cc-btn--icon strip__btn" aria-label={x.fewer} disabled={section.repeats <= 1} onClick={() => updateSection(index, { repeats: section.repeats - 1 })}>
                      <MinusIcon size={14} />
                    </button>
                    <span className="cc-num" aria-label={`${x.repeats}: ${section.repeats}`}>
                      ×{section.repeats}
                    </span>
                    <button type="button" className="cc-btn cc-btn--icon strip__btn" aria-label={x.more} disabled={section.repeats >= MAX_REPEATS} onClick={() => updateSection(index, { repeats: section.repeats + 1 })}>
                      <PlusIcon size={14} />
                    </button>
                  </div>
                  <button type="button" className="cc-btn cc-btn--icon cc-btn--ghost strip__btn" aria-label={`${x.removeSection} ${index + 1}`} onClick={() => setDraft({ ...draft, sections: draft.sections.filter((_, position) => position !== index) })}>
                    <CloseIcon size={14} />
                  </button>
                </div>
                <div className="songs__row">
                  <span className="songs__chords" title={section.source}>
                    {chords(section.progression)}
                  </span>
                  <button type="button" className="cc-btn cc-btn--icon cc-btn--ghost strip__btn" aria-label={`${x.up} ${index + 1}`} disabled={index === 0} onClick={() => moveSection(index, -1)}>
                    ↑
                  </button>
                  <button type="button" className="cc-btn cc-btn--icon cc-btn--ghost strip__btn" aria-label={`${x.down} ${index + 1}`} disabled={index === draft.sections.length - 1} onClick={() => moveSection(index, 1)}>
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="songs__add">
          <label className="sr-only" htmlFor="song-source">
            {x.addFrom}
          </label>
          <select id="song-source" className="cc-select" value={source} onChange={(event) => setSource(event.target.value)}>
            <option value={CURRENT} disabled={progression.length === 0}>
              {x.current}
            </option>
            {library.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
          <button type="button" className="cc-btn strip__btn" onClick={addSection} disabled={draft.sections.length >= MAX_SECTIONS}>
            {x.add}
          </button>
        </div>

        <div className="songs__actions">
          <button type="button" className="cc-btn cc-btn--ghost strip__btn" onClick={() => setDraft(null)}>
            {x.cancel}
          </button>
          <button type="submit" className="cc-btn cc-btn--primary strip__btn" disabled={!canSave}>
            {x.save}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="songs">
      {songs.length === 0 ? (
        <p className="strip-menu__empty">{x.empty}</p>
      ) : (
        <ul className="strip-menu__library">
          {songs.map((song) => {
            const live = playing && songPlay?.songId === song.id
            const section = live ? song.sections[songPlay.section] : null
            return (
              <li key={song.id}>
                <div className="min-w-0">
                  <span className="strip-menu__name">{song.name}</span>
                  <span className="strip-menu__steps">
                    {live && section
                      ? `${x.playing}: ${x.labels[section.label]}${section.repeats > 1 ? ` ${songPlay.pass + 1}/${section.repeats}` : ''}`
                      : summary(song)}
                  </span>
                </div>
                <button
                  type="button"
                  className={live ? 'cc-btn cc-btn--primary strip__btn' : 'cc-btn strip__btn'}
                  aria-pressed={live}
                  onClick={() => (live ? stopPlayback() : playSong(song))}
                >
                  {live ? x.stop : x.play}
                </button>
                <button type="button" className="cc-btn cc-btn--ghost strip__btn" onClick={() => setDraft(song)} aria-label={`${x.edit}: ${song.name}`}>
                  {x.edit}
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--ghost strip__btn"
                  aria-label={`${confirmId === song.id ? x.removeConfirm : x.remove}: ${song.name}`}
                  onBlur={() => setConfirmId((current) => (current === song.id ? null : current))}
                  onClick={() => {
                    if (confirmId !== song.id) {
                      setConfirmId(song.id)
                      return
                    }
                    if (live) stopPlayback()
                    deleteSong(song.id)
                    setConfirmId(null)
                    onAnnounce(`${x.removed}: ${song.name}`)
                  }}
                >
                  {confirmId === song.id ? x.removeConfirm : x.remove}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <button
        type="button"
        className="cc-btn strip__btn songs__new"
        disabled={songs.length >= SONGS_LIMIT}
        title={songs.length >= SONGS_LIMIT ? x.full : undefined}
        onClick={() => {
          setSource(progression.length > 0 ? CURRENT : (library[0]?.id ?? CURRENT))
          setDraft({ id: songId(), name: '', savedAt: '', sections: [] })
        }}
      >
        <PlusIcon size={14} /> {x.create}
      </button>
    </div>
  )
}
