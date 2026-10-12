import { describe, expect, it } from 'vitest'
import { analyzeChord, analyzeTransition, detectProgressionKey, keyName, suggestNextChords, type Key } from './analysis'
import { parseChord } from './parseChord'

const steps = (...names: string[]) =>
  names.map((name) => {
    const parsed = parseChord(name)!
    return { rootPc: parsed.rootPc, qualityId: parsed.quality.id, anglo: parsed.anglo, latin: parsed.latin }
  })

const C_MAJOR: Key = { rootPc: 0, mode: 'major' }
const A_MINOR: Key = { rootPc: 9, mode: 'minor' }

describe('detectProgressionKey', () => {
  it('finds the key of common progressions', () => {
    expect(detectProgressionKey(steps('C', 'G', 'Am', 'F'))).toMatchObject(C_MAJOR)
    expect(detectProgressionKey(steps('G', 'D', 'Em', 'C'))).toMatchObject({ rootPc: 7, mode: 'major' })
    expect(detectProgressionKey(steps('Dm7', 'G7', 'Cmaj7'))).toMatchObject(C_MAJOR)
  })

  it('recognises minor keys, including the harmonic V', () => {
    expect(detectProgressionKey(steps('Am', 'Dm', 'E7', 'Am'))).toMatchObject(A_MINOR)
    expect(detectProgressionKey(steps('Am', 'G', 'F', 'E'))).toMatchObject(A_MINOR)
  })

  it('returns null with no chords', () => {
    expect(detectProgressionKey([])).toBeNull()
  })
})

describe('analyzeChord', () => {
  it('labels diatonic chords with roman numerals', () => {
    const [c, dm7, g7, bdim] = steps('C', 'Dm7', 'G7', 'Bdim')
    expect(analyzeChord(c, C_MAJOR)).toMatchObject({ roman: 'I', status: 'diatonic' })
    expect(analyzeChord(dm7, C_MAJOR)).toMatchObject({ roman: 'ii7', status: 'diatonic' })
    expect(analyzeChord(g7, C_MAJOR)).toMatchObject({ roman: 'V7', status: 'diatonic' })
    expect(analyzeChord(bdim, C_MAJOR)).toMatchObject({ roman: 'vii°', status: 'diatonic' })
  })

  it('explains secondary dominants', () => {
    const [d7, e] = steps('D7', 'E')
    expect(analyzeChord(d7, C_MAJOR)).toMatchObject({ roman: 'V7/V', status: 'secondary', targetPc: 7 })
    expect(analyzeChord(d7, C_MAJOR).noteEs).toMatch(/dominante de G/)
    expect(analyzeChord(e, C_MAJOR)).toMatchObject({ roman: 'V/vi', status: 'secondary' })
  })

  it('explains chords borrowed from the parallel minor', () => {
    const [fm, bb, ab] = steps('Fm', 'Bb', 'Ab')
    expect(analyzeChord(fm, C_MAJOR)).toMatchObject({ roman: 'iv', status: 'borrowed' })
    expect(analyzeChord(bb, C_MAJOR)).toMatchObject({ roman: '♭VII', status: 'borrowed' })
    expect(analyzeChord(ab, C_MAJOR)).toMatchObject({ roman: '♭VI', status: 'borrowed' })
  })

  it('treats the major V as diatonic in a minor key', () => {
    const [e7] = steps('E7')
    expect(analyzeChord(e7, A_MINOR)).toMatchObject({ roman: 'V7', status: 'diatonic' })
  })

  it('flags truly distant chords', () => {
    const [fs] = steps('F#')
    expect(analyzeChord(fs, C_MAJOR).status).toBe('chromatic')
  })
})

describe('analyzeTransition', () => {
  const pair = (a: string, b: string, key = C_MAJOR) => {
    const [x, y] = steps(a, b)
    return analyzeTransition(x, y, key)
  }

  it('names the classic cadences', () => {
    expect(pair('G', 'C')).toMatchObject({ mark: '✓', tone: 'resolve', titleEs: 'Cadencia auténtica' })
    expect(pair('G7', 'Am')).toMatchObject({ mark: '↪', titleEs: 'Cadencia rota' })
    expect(pair('F', 'C')).toMatchObject({ tone: 'resolve', titleEs: 'Cadencia plagal' })
    expect(pair('Fm', 'C')).toMatchObject({ titleEs: 'Cadencia plagal menor' })
    expect(pair('Bdim', 'C')).toMatchObject({ titleEs: 'Resuelve la sensible' })
    expect(pair('E7', 'Am', A_MINOR)).toMatchObject({ titleEs: 'Cadencia auténtica' })
  })

  it('describes tension and color', () => {
    expect(pair('Dm', 'G')).toMatchObject({ tone: 'tension', titleEs: 'ii → V' })
    expect(pair('C', 'G')).toMatchObject({ titleEs: 'Semicadencia' })
    expect(pair('C', 'D7')).toMatchObject({ titleEs: 'Dominante secundaria' })
    expect(pair('D7', 'G')).toMatchObject({ titleEs: 'Resuelve la dominante secundaria' })
    expect(pair('C', 'Bb')).toMatchObject({ tone: 'color' })
    expect(pair('C', 'F#')).toMatchObject({ mark: '⚡', tone: 'surprise' })
  })

  it('describes smooth diatonic motion and counts common tones', () => {
    expect(pair('Am', 'Dm')).toMatchObject({ titleEs: 'Movimiento por quintas' })
    const relative = pair('C', 'Am')
    expect(relative.titleEs).toBe('Cambio suave')
    expect(relative.commonTones.sort()).toEqual([0, 4])
    expect(pair('C', 'C')).toMatchObject({ tone: 'repeat' })
  })

  it('writes both languages with the chord names', () => {
    const result = pair('G', 'C')
    expect(result.detailEs).toMatch(/^G → C: /)
    expect(result.detailEn).toMatch(/^G → C: .*ending/)
  })
})

describe('suggestNextChords', () => {
  const next = (key: Key, ...names: string[]) =>
    suggestNextChords(steps(...names), key).map((item) => item.anglo)

  it('closes a ii–V on the tonic', () => {
    expect(next(C_MAJOR, 'Dm', 'G')[0]).toBe('C')
  })

  it('continues a known progression from the last chords', () => {
    const suggestions = suggestNextChords(steps('C', 'G', 'Am'), C_MAJOR)
    expect(suggestions[0].anglo).toBe('F')
    expect(suggestions[0].reasonEs).toMatch(/Completa «Pop I–V–vi–IV»/)
  })

  it('resolves a secondary dominant to its target', () => {
    expect(next(C_MAJOR, 'C', 'D7')[0]).toBe('G')
  })

  it('works in minor keys and never repeats the last chord', () => {
    const suggestions = next(A_MINOR, 'Am', 'E7')
    expect(suggestions[0]).toBe('Am')
    expect(suggestions).not.toContain('E7')
  })

  it('returns nothing for an empty progression', () => {
    expect(suggestNextChords([], C_MAJOR)).toEqual([])
  })
})

describe('keyName', () => {
  it('prints the key in both languages', () => {
    expect(keyName({ rootPc: 10, mode: 'major' }, 'es')).toBe('Bb mayor')
    expect(keyName(A_MINOR, 'en')).toBe('A minor')
  })
})
