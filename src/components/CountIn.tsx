import { usePlayheadCount } from '../state/playhead'

/** The count-in, big in the middle of the screen: 4, 3, 2, 1… and the music starts. */
export function CountIn() {
  const count = usePlayheadCount()
  if (count <= 0) return null
  return (
    <div className="cc-countin" role="status" aria-live="assertive">
      <span key={count} className="cc-countin__num">
        {count}
      </span>
    </div>
  )
}
