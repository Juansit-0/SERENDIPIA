import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9333
const OUT = path.resolve(import.meta.dirname, '../.impeccable/review')

const TARGETS = [
  { name: 'desktop.png', url: 'http://localhost:5173/', width: 1440, height: 1250, dsf: 1, settings: { capo: 0 } },
  { name: 'mobile.png', url: 'http://localhost:5173/', width: 390, height: 1400, dsf: 2, settings: { capo: 0 } },
  { name: 'detector.png', url: 'http://localhost:5173/#detector', width: 1440, height: 1000, dsf: 1, settings: { capo: 0 } },
  { name: 'theory.png', url: 'http://localhost:5173/#theory', width: 1440, height: 1300, dsf: 1, settings: { capo: 0 } },
  { name: 'capo-desktop.png', url: 'http://localhost:5173/', width: 1440, height: 1250, dsf: 1, settings: { capo: 3 } },
  {
    name: 'capo-detector.png',
    url: 'http://localhost:5173/#detector',
    width: 1440,
    height: 1000,
    dsf: 1,
    settings: { capo: 3 },
    action: `(() => {
      const found = []
      const click = (label) => {
        const target = [...document.querySelectorAll('button')].find((button) =>
          (button.getAttribute('aria-label') || '').includes(label),
        )
        found.push(label + '=' + (target ? (target.getAttribute('aria-label') || '').slice(0, 24) : 'MISS'))
        target?.click()
      }
      click('F traste 5')
      setTimeout(() => click('D traste 4'), 350)
      return found.join(' | ')
    })()`,
  },
  { name: 'capo-mobile.png', url: 'http://localhost:5173/', width: 390, height: 1400, dsf: 2, settings: { capo: 3 } },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/serendipia-chrome-profile',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

async function browserSocket() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      const data = await response.json()
      if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl
    } catch {
      await sleep(250)
    }
  }
  throw new Error('chrome did not expose a debugging socket')
}

const socketUrl = await browserSocket()
const socket = new WebSocket(socketUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve)
  socket.addEventListener('error', reject)
})

let nextId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
})

function send(method, params = {}, sessionId) {
  return new Promise((resolve) => {
    const id = ++nextId
    pending.set(id, resolve)
    socket.send(JSON.stringify({ id, method, params, sessionId }))
  })
}

const { result: created } = await send('Target.createTarget', { url: 'about:blank' })
const { result: attached } = await send('Target.attachToTarget', { targetId: created.targetId, flatten: true })
const session = attached.sessionId

await send('Page.enable', {}, session)
await mkdir(OUT, { recursive: true })

for (const target of TARGETS) {
  await send(
    'Emulation.setDeviceMetricsOverride',
    {
      width: target.width,
      height: target.height,
      deviceScaleFactor: target.dsf,
      mobile: target.width < 600,
    },
    session,
  )
  await send('Page.navigate', { url: 'about:blank' }, session)
  await sleep(250)
  await send('Page.navigate', { url: target.url }, session)
  await sleep(900)
  if (target.settings) {
    const expression = `(() => {
      const key = 'serendipia.settings.v2'
      const current = JSON.parse(localStorage.getItem(key) || '{}')
      localStorage.setItem(key, JSON.stringify({ ...current, ...${JSON.stringify(target.settings)} }))
      return 'ok'
    })()`
    await send('Runtime.evaluate', { expression }, session)
    await send('Page.reload', {}, session)
  }
  await sleep(2600)
  if (target.action) {
    const acted = await send('Runtime.evaluate', { expression: target.action, returnByValue: true }, session)
    console.log(`  action -> ${acted.result?.result?.value}`)
    await sleep(900)
  }
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, session)
  await writeFile(path.join(OUT, target.name), Buffer.from(shot.result.data, 'base64'))
  const metrics = await send(
    'Runtime.evaluate',
    {
      expression:
        'document.documentElement.scrollWidth + "/" + window.innerWidth + " view=" + (document.querySelector("nav [aria-pressed=true]")?.textContent ?? "?")',
      returnByValue: true,
    },
    session,
  )
  console.log(`${target.name}: ${target.width}x${target.height} @${target.dsf}x -> ${metrics.result?.result?.value}`)
}

socket.close()
chrome.kill()
