/** In-place radix-2 FFT (real input in `re`, zeros in `im`); returns magnitudes of the first half. */
export function magnitudeSpectrum(samples: Float32Array): Float32Array {
  const size = samples.length
  if (size & (size - 1)) throw new Error('FFT size must be a power of two')
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  // Hann window: keeps a string's partial from smearing into its neighbours.
  for (let i = 0; i < size; i += 1) re[i] = samples[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)))
  for (let i = 1, j = 0; i < size; i += 1) {
    let bit = size >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
    }
  }
  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length
    const wr = Math.cos(angle)
    const wi = Math.sin(angle)
    for (let start = 0; start < size; start += length) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < length / 2; k += 1) {
        const a = start + k
        const b = a + length / 2
        const tr = re[b] * cr - im[b] * ci
        const ti = re[b] * ci + im[b] * cr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
        const next = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = next
      }
    }
  }
  const out = new Float32Array(size / 2)
  for (let i = 0; i < size / 2; i += 1) out[i] = Math.hypot(re[i], im[i])
  return out
}
