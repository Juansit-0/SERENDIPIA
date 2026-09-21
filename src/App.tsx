import { TransportStrip } from './components/TransportStrip'
import { StoreProvider, useStore } from './state/store'
import { DetectorView } from './views/DetectorView'
import { DictionaryView } from './views/DictionaryView'
import { TheoryView } from './views/TheoryView'

function Shell() {
  const { view } = useStore()
  return (
    <div className="grain min-h-screen bg-paper text-ink">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-4 px-3 py-3 sm:px-5 sm:py-4">
        <TransportStrip />
        {view === 'dictionary' && <DictionaryView />}
        {view === 'detector' && <DetectorView />}
        {view === 'theory' && <TheoryView />}
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
