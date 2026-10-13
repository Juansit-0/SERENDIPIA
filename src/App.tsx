import { useEffect } from 'react'
import { StepRow } from './components/StepRow'
import { TopBar } from './components/TopBar'
import { StoreProvider, useStore } from './state/store'
import { ChordView } from './views/ChordView'
import { PracticeView } from './views/PracticeView'
import { TheoryView } from './views/TheoryView'
import { Welcome } from './welcome/Welcome'
import { useWelcomeOpen } from './welcome/state'

function Shell() {
  const { view, togglePlay, undo, redo } = useStore()
  const welcome = useWelcomeOpen()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // The practice view uses Space for its own tap counter.
      if (event.code !== 'Space' || event.repeat || event.defaultPrevented || view === 'practice' || welcome) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      if (tag === 'BUTTON' || tag === 'A') return
      event.preventDefault()
      togglePlay()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay, view, welcome])

  // ⌘Z / Ctrl+Z undoes a progression edit; ⌘⇧Z / Ctrl+Y redoes it. Text fields keep their own undo.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement | null)?.isContentEditable) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  return (
    <div className="cc-ground min-h-dvh desk:flex desk:h-dvh desk:flex-col desk:overflow-hidden">
      <DistressFilter />
      {/* On `desk` screens the shell is exactly one viewport tall: top bar (52px), the view (fills the rest), strip. */}
      <TopBar />
      <div className="mx-auto flex w-full max-w-[1560px] min-[1600px]:max-w-[1840px] min-[1600px]:px-8 flex-col gap-4 px-3 py-3 sm:px-5 sm:py-4 desk:min-h-0 desk:flex-1 desk:gap-2 desk:py-2">
        <main className="flex min-w-0 flex-col desk:min-h-0 desk:flex-1">
          {view === 'chord' && <ChordView />}
          {view === 'theory' && <TheoryView />}
          {view === 'practice' && <PracticeView />}
        </main>
      </div>
      {view !== 'practice' && <StepRow />}
      {welcome && <Welcome />}
    </div>
  )
}

/** Ink wear for `.cc-hero` at night (the CSS reads it through --cc-hero-filter). */
function DistressFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="cc-distress" x="-3%" y="-6%" width="106%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="2" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="4" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11" result="n1" />
          <feColorMatrix in="n1" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 11 0 0 0 -3.4" result="m1" />
          <feTurbulence type="fractalNoise" baseFrequency=".012 .55" numOctaves="2" seed="7" result="n2" />
          <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 13 0 0 0 -3.9" result="m2" />
          <feComposite in="d" in2="m1" operator="in" result="a" />
          <feComposite in="a" in2="m2" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
