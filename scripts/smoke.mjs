import { cp, mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.SMOKE_URL ?? 'http://127.0.0.1:4173/'
const out = process.env.SMOKE_OUT ?? 'docs/screenshots'
await mkdir(out, { recursive: true })
await mkdir('/opt/cursor/artifacts/screenshots', { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'fr-FR',
})
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))

await page.goto(base, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })

await page.screenshot({ path: `${out}/01-empty.png` })
if (!(await page.getByTestId('try-example').count())) throw new Error('example shop button missing')

await page.getByTestId('try-example').click()
await page.getByTestId('example-banner').waitFor()
await page.getByTestId('customer-Kofi').waitFor()
const owed = await page.getByTestId('still-due').getAttribute('data-amount')
if (owed !== '18500') throw new Error(`expected example total 18500, got ${owed}`)
await page.waitForTimeout(600)
await page.screenshot({ path: `${out}/08-example.png` })
await page.getByTestId('reset-example').click()
await page.getByTestId('try-example').waitFor()

await page.getByTestId('composer').fill('Kofi a pris 2 sacs de riz 15000, payé 5000')
await page.getByTestId('parsed-card').waitFor()
const live = await page.getByTestId('live-due').getAttribute('data-amount')
if (live !== '10000') throw new Error(`expected live due 10000, got ${live}`)
if (!(await page.locator('.mark.customer').count())) throw new Error('customer highlight missing')
if (!(await page.locator('.mark.paid').count())) throw new Error('paid highlight missing')
await page.waitForTimeout(400)
await page.screenshot({ path: `${out}/02-reading.png` })
await page.getByTestId('read').click()
await page.getByTestId('sheet').waitFor()
const due = await page.getByTestId('due-amount').getAttribute('data-amount')
if (due !== '10000') throw new Error(`expected due 10000, got ${due}`)
const customer = await page.getByTestId('field-customer').inputValue()
if (customer !== 'Kofi') throw new Error(`expected Kofi, got ${customer}`)
await page.getByTestId('save').click()
await page.getByTestId('customer-Kofi').waitFor()

await page.waitForTimeout(600)
await page.screenshot({ path: `${out}/03-customers.png` })
await page.reload({ waitUntil: 'networkidle' })
await page.getByTestId('customer-Kofi').waitFor()

await page.getByTestId('customer-Kofi').click()
await page.getByTestId('remind').click()
await page.getByTestId('remind-open').waitFor()
const frenchHref = await page.getByTestId('remind-open').getAttribute('href')
if (!frenchHref?.startsWith('https://wa.me/?text=')) throw new Error(`bad wa link ${frenchHref}`)
const frenchText = decodeURIComponent(frenchHref.split('?text=')[1] ?? '')
if (!frenchText.includes('Kofi') || !frenchText.toLowerCase().includes('ardoise')) {
  throw new Error(`reminder missing details: ${frenchText}`)
}
await page.screenshot({ path: `${out}/04-customer.png` })
await page.getByTestId('remind-close').click()

await page.getByTestId('lang-en').click()
await page.getByTestId('remind').click()
await page.getByTestId('remind-open').waitFor()
const englishHref = await page.getByTestId('remind-open').getAttribute('href')
const englishText = decodeURIComponent((englishHref ?? '').split('?text=')[1] ?? '')
if (!englishText.startsWith('Hello Kofi')) throw new Error(`english reminder: ${englishText}`)
await page.screenshot({ path: `${out}/05-english.png` })
await page.getByTestId('remind-close').click()

await page.getByTestId('payment').click()
await page.getByTestId('save-payment').click()
await page.getByRole('button', { name: 'Nothing to remind' }).waitFor()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/06-settled.png` })

await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Nothing to remind' }).waitFor()

await page.evaluate(() => navigator.serviceWorker.ready)
await page.context().setOffline(true)
await page.reload({ waitUntil: 'domcontentloaded' })
await page.getByRole('button', { name: 'Nothing to remind' }).waitFor()
await page.screenshot({ path: `${out}/07-offline.png` })

const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
if (overflow) throw new Error('horizontal overflow')
if (errors.length) throw new Error(errors.join('\n'))
await cp(out, '/opt/cursor/artifacts/screenshots', { recursive: true })
await browser.close()
console.log('smoke ok')
console.log(frenchText)
console.log(englishText)
