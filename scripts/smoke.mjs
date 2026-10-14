// After each deploy: the published page answers, carries its preview tags, and every script and stylesheet it
// links loads. Usage: node scripts/smoke.mjs https://juansit-0.github.io/SERENDIPIA/
const base = process.argv[2]
if (!base) throw new Error('usage: node scripts/smoke.mjs <url>')

async function get(url) {
  // GitHub Pages can take a few seconds to serve a fresh deploy everywhere.
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
      // Read the body: an unread response keeps its connection busy.
      const body = await response.text()
      if (response.ok) return body
      console.log(`retry ${response.status} ${url}`)
    } catch (error) {
      console.log(`retry ${error.message} ${url}`)
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 5000))
  }
  throw new Error(`${url} did not answer 200`)
}

const html = await get(base)
const checks = [
  ['title', /<title>SERENDIPIA/],
  ['preview image', /property="og:image"/],
  ['app root', /id="root"/],
]
for (const [name, pattern] of checks) if (!pattern.test(html)) throw new Error(`missing ${name}`)

const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|webmanifest|png|ico|svg)[^"]*)"/g)].map((match) => new URL(match[1], base).href)
for (const asset of assets) await get(asset)
await get(new URL('sw.js', base).href)
await get(new URL('og-image.png', base).href)
console.log(`ok: ${base} and ${assets.length + 2} files`)
