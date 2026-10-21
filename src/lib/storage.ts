import { emptyLedger, type Lang, type Ledger } from './types'

const LEDGER_KEY = 'ardoise.ledger.v1'
const LANG_KEY = 'ardoise.lang'

function canStore(): boolean {
  return typeof localStorage !== 'undefined'
}

export function loadLedger(): Ledger {
  if (!canStore()) return emptyLedger()
  try {
    const raw = localStorage.getItem(LEDGER_KEY)
    if (!raw) return emptyLedger()
    const data = JSON.parse(raw) as Partial<Ledger>
    if (data.version !== 1 || !Array.isArray(data.customers) || !Array.isArray(data.entries)) return emptyLedger()
    return {
      version: 1,
      shopName: typeof data.shopName === 'string' ? data.shopName : '',
      customers: data.customers,
      entries: data.entries,
    }
  } catch {
    return emptyLedger()
  }
}

export function saveLedger(ledger: Ledger): void {
  if (!canStore()) return
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger))
}

export function loadLang(): Lang {
  if (!canStore()) return defaultLang()
  const saved = localStorage.getItem(LANG_KEY)
  if (saved === 'fr' || saved === 'en') return saved
  return defaultLang()
}

export function saveLang(lang: Lang): void {
  if (!canStore()) return
  localStorage.setItem(LANG_KEY, lang)
}

function defaultLang(): Lang {
  if (typeof navigator === 'undefined') return 'fr'
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'fr'
}
