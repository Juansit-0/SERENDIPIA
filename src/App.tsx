import { useEffect } from 'react'
import { TransportStrip } from './components/TransportStrip'
import { StoreProvider, useStore } from './state/store'
import { DetectorView } from './views/DetectorView'
import { DictionaryView } from './views/DictionaryView'
import { PracticeView } from './views/PracticeView'
import { TheoryView } from './views/TheoryView'

function Shell() {
  const { view, togglePlay, undo, redo } = useStore()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // The practice view uses Space for its own tap counter.
      if (event.code !== 'Space' || event.repeat || event.defaultPrevented || view === 'practice') return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      if (tag === 'BUTTON' || tag === 'A') return
      event.preventDefault()
      togglePlay()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay, view])

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
    <div className="grain min-h-screen bg-paper text-ink">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-3 py-3 sm:px-5 sm:py-4">
        <TransportStrip />
        <main className="contents">
          {view === 'dictionary' && <DictionaryView />}
          {view === 'detector' && <DetectorView />}
          {view === 'theory' && <TheoryView />}
          {view === 'practice' && <PracticeView />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
