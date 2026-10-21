import { locateSpans } from './highlights'
import type { ParsedEntry, ParsedItem } from './types'

const AMOUNT = String.raw`(\d{1,3}(?:[ \u00a0\u202f.,]\d{3})+|\d+(?:[.,]\d{1,2})?)`

const PAID_WORD = String.raw`payé|payee|paye|paid|versé|verse|donné|donne|réglé|regle|reglé`

const PAID_RE = new RegExp(
  String.raw`(?:^|[,\s;])(?:(?:il|elle|on|i|j'ai)\s+)?(?:(?:a|ai|avons|have|has)\s+)?(?:${PAID_WORD})\s*(?:de\s+|of\s+|:)?\s*${AMOUNT}`,
  'giu',
)

const PAID_NOUN_RE = new RegExp(
  String.raw`(?:^|[,\s;])(?:payment|versement|deposit|acompte)\s+(?:of\s+|de\s+)?${AMOUNT}`,
  'giu',
)

const TOTAL_RE = new RegExp(
  String.raw`(?:^|[,\s;])(?:total|montant|somme|amount)\s*(?:de\s+|of\s+|:?\s*)${AMOUNT}`,
  'giu',
)

const VERB = String.raw`a\s+pris|a\s+achet[eé]e?s?|took|bought|got|prend|doit|owes(?:\s+me)?`

const NAME = String.raw`((?:(?:monsieur|madame|mme|mr|mrs|ms|m)\.?\s+)?[\p{L}][\p{L}'’.-]*(?:\s+[\p{L}][\p{L}'’.-]*){0,2})`

const QTY_WORDS: Record<string, number> = {
  un: 1,
  une: 1,
  one: 1,
  deux: 2,
  two: 2,
  trois: 3,
  three: 3,
  quatre: 4,
  four: 4,
  cinq: 5,
  five: 5,
  six: 6,
  sept: 7,
  seven: 7,
  huit: 8,
  eight: 8,
  neuf: 9,
  nine: 9,
  dix: 10,
  ten: 10,
}

const NOT_A_NAME = new Set([
  'il', 'elle', 'je', 'on', 'j', 'i', 'we', 'they', 'the', 'le', 'la', 'les',
  'un', 'une', 'des', 'du', 'de', 'a', 'an', 'me', 'mon', 'ma', 'pour', 'for',
  'client', 'chez', 'paid', 'paye', 'payé',
])

const PRODUCT_WORDS = new Set([
  'riz', 'rice', 'savon', 'soap', 'huile', 'oil', 'sucre', 'sugar', 'lait', 'milk',
  'pain', 'bread', 'baguette', 'baguettes', 'eau', 'water', 'sac', 'sacs', 'bag', 'bags',
  'bouteille', 'bouteilles', 'bottle', 'bottles', 'mais', 'farine', 'flour', 'tomate',
  'tomates', 'oignon', 'oignons', 'sel', 'salt', 'bidon', 'bidons', 'carton', 'cartons',
  'boite', 'paquet', 'paquets', 'sachet', 'sachets', 'litre', 'litres', 'kg', 'kilo',
  'kilos', 'piece', 'pieces',
])

function normalize(input: string): string {
  return input
    .replace(/[’‘]/g, "'")
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/(\d)[.,](?=\d{3}\b)/g, '$1\u202f')
    .replace(/[ ]+/g, ' ')
    .trim()
}

export function parseAmountToken(raw: string): number | null {
  let s = raw.trim().replace(/[\s\u00a0\u202f]/g, '')
  s = s.replace(/(?:fcfa|cfa|francs?)$/i, '')
  s = s.replace(/f$/i, '')
  if (!s) return null
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '')
  else if (/^\d+[.,]\d{1,2}$/.test(s)) return Math.round(Number(s.replace(',', '.')))
  if (!/^\d+$/.test(s)) return null
  const n = Number(s)
  if (!Number.isSafeInteger(n)) return null
  return n
}

function empty(note: string): ParsedEntry {
  return {
    customer: '',
    items: [],
    total: 0,
    paid: 0,
    due: 0,
    note,
    kind: 'credit',
    confidence: 'low',
    warnings: ['empty'],
    spans: [],
  }
}

function cleanCustomer(raw: string): string {
  const s = raw.replace(/[:.,]+$/g, '').replace(/\s+/g, ' ').trim()
  if (!s) return ''
  const words = s.split(' ')
  const firstCore = words[0].replace(/\./g, '').toLowerCase()
  if (NOT_A_NAME.has(firstCore) || PRODUCT_WORDS.has(firstCore)) return ''
  return words
    .map((word, index) => {
      const bare = word.replace(/\./g, '')
      const lower = bare.toLowerCase()
      if (/^(m|mme|mr|mrs|ms|monsieur|madame)$/i.test(lower)) {
        if (lower === 'm' || lower === 'monsieur') return 'M.'
        if (lower === 'mme' || lower === 'madame') return 'Mme'
        if (lower === 'mr') return 'Mr'
        if (lower === 'mrs') return 'Mrs'
        return 'Ms'
      }
      if (index > 0 && /^(de|di|van|da)$/i.test(word)) return word.toLowerCase()
      if (!word) return word
      return word[0].toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function isProductish(name: string): boolean {
  const words = name
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[.'’]/g, ''))
    .filter(Boolean)
  return words.length > 0 && words.every((word) => PRODUCT_WORDS.has(word) || NOT_A_NAME.has(word))
}

function pullAmounts(working: string, re: RegExp, into: number[]): string {
  re.lastIndex = 0
  return working.replace(re, (full, amountRaw: string) => {
    const n = parseAmountToken(amountRaw)
    if (n == null) return full
    into.push(n)
    return ' '
  })
}

type FoundName = { name: string; start: number; end: number }

function findCustomer(working: string): FoundName | null {
  const patterns = [
    new RegExp(String.raw`^\s*(?:pour|for|client|chez)?\s*:?\s*${NAME}\s*(?::|,)?\s*(?:${VERB})(?![\p{L}])`, 'iu'),
    new RegExp(String.raw`^\s*(?:pour|for|client|chez)?\s*:?\s*${NAME}\s*:`, 'iu'),
    new RegExp(String.raw`^\s*(?:pour|for)?\s*${NAME}\s+(?=\d)`, 'iu'),
  ]
  for (const re of patterns) {
    const match = working.match(re)
    if (!match || match.index == null) continue
    const name = cleanCustomer(match[1] ?? '')
    if (!name || isProductish(name)) continue
    return { name, start: match.index, end: match.index + match[0].length }
  }
  const only = working.match(new RegExp(String.raw`^\s*(?:pour|for)?\s*${NAME}\s*$`, 'iu'))
  if (only && only.index != null) {
    const name = cleanCustomer(only[1] ?? '')
    if (name && !isProductish(name)) return { name, start: only.index, end: only.index + only[0].length }
  }
  return null
}

function cleanName(raw: string): string {
  let s = raw.replace(/\s+/g, ' ').trim()
  s = s.replace(/^(?:du|de la|des|de|of|some|the|d')\s+/i, '')
  s = s.replace(/^(?:x|×)\s+/i, '')
  s = s.replace(/[.,;:]+$/g, '').trim()
  if (!s || /^\d+$/.test(s)) return ''
  return s[0].toUpperCase() + s.slice(1)
}

function bareAmount(chunk: string): number | null {
  const match = chunk.trim().match(new RegExp(String.raw`^${AMOUNT}$`, 'iu'))
  if (!match) return null
  return parseAmountToken(match[1] ?? '')
}

function chunkHasAmount(chunk: string): boolean {
  return new RegExp(String.raw`${AMOUNT}\s*$`, 'iu').test(chunk.trim())
}

function splitChunks(working: string): string[] {
  const parts = working
    .split(/\s*(?:,|;|\bet\b|\band\b|\+)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
  const merged: string[] = []
  for (const part of parts) {
    const previous = merged[merged.length - 1]
    if (previous && bareAmount(part) != null && bareAmount(previous) == null && !chunkHasAmount(previous)) {
      merged[merged.length - 1] = `${previous} ${part}`
    } else {
      merged.push(part)
    }
  }
  return merged
}

function parseChunk(chunk: string): ParsedItem | null {
  let s = chunk.trim()
  if (!s || bareAmount(s) != null) return null
  let qty: number | null = null
  const wordQty = s.match(/^([\p{L}]+)\s+(.*)$/u)
  if (wordQty) {
    const mapped = QTY_WORDS[wordQty[1].toLowerCase()]
    if (mapped != null && wordQty[2]) {
      qty = mapped
      s = wordQty[2]
    }
  }

  const withQty = s.match(new RegExp(String.raw`^(\d+(?:[.,]\d+)?)\s*(?:x|×)?\s+(.+?)\s+${AMOUNT}$`, 'iu'))
  if (withQty) {
    const name = cleanName(withQty[2] ?? '')
    const amount = parseAmountToken(withQty[3] ?? '')
    const q = Number((withQty[1] ?? '').replace(',', '.'))
    if (name && amount != null) return { qty: qty ?? (Number.isFinite(q) ? q : null), name, amount }
  }

  const namePrice = s.match(new RegExp(String.raw`^(.+?)\s+${AMOUNT}$`, 'iu'))
  if (namePrice) {
    const name = cleanName(namePrice[1] ?? '')
    const amount = parseAmountToken(namePrice[2] ?? '')
    if (name && amount != null) return { qty, name, amount }
  }

  const qtyOnly = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:x|×)?\s+(.+)$/iu)
  if (qtyOnly) {
    const name = cleanName(qtyOnly[2] ?? '')
    const q = Number((qtyOnly[1] ?? '').replace(',', '.'))
    if (name) return { qty: qty ?? (Number.isFinite(q) ? q : null), name, amount: null }
  }

  const name = cleanName(s)
  if (!name) return null
  return { qty, name, amount: null }
}

function stripCurrency(working: string): string {
  return working
    .replace(/\b(fcfa|cfa|francs?)\b/gi, ' ')
    .replace(/(\d)\s*f\b/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseEntry(text: string): ParsedEntry {
  const note = normalize(text)
  if (!note) return empty(note)

  const paidAmounts: number[] = []
  let working = ` ${note} `
  working = pullAmounts(working, PAID_RE, paidAmounts)
  working = pullAmounts(working, PAID_NOUN_RE, paidAmounts)
  const paid = paidAmounts.reduce((sum, n) => sum + n, 0)

  let explicitTotal: number | null = null
  const totals: number[] = []
  working = pullAmounts(working, TOTAL_RE, totals)
  if (totals.length) explicitTotal = totals[totals.length - 1] ?? null

  working = stripCurrency(working.replace(/\s+/g, ' ').trim())
  working = working.replace(/^(?:a pris|a achet[eé]e?s?|took|bought|got|prend|doit|owes(?:\s+me)?)(?![\p{L}])\s*/iu, '')

  const found = findCustomer(working)
  let customer = ''
  if (found) {
    customer = found.name
    working = `${working.slice(0, found.start)} ${working.slice(found.end)}`.replace(/\s+/g, ' ').trim()
  }

  working = working
    .replace(/^(?:a pris|a achet[eé]e?s?|took|bought|got|prend|doit|owes(?:\s+me)?)(?![\p{L}])\s*/iu, '')
    .replace(/^(?:du|de la|des|de|of|some)\s+/i, '')
    .trim()

  const bare = bareAmount(working)
  if (bare != null && explicitTotal == null) {
    explicitTotal = bare
    working = ''
  }

  const items = splitChunks(working)
    .map(parseChunk)
    .filter((item): item is ParsedItem => item != null)

  const lineSum = items.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const hasLineAmounts = items.some((item) => item.amount != null)
  const total = explicitTotal != null ? explicitTotal : hasLineAmounts ? lineSum : 0

  const purchaseHint = /\b(pris|achet|took|bought|got|doit|owes|sac|riz|rice|savon|huile|oil)\b/i.test(note)
  const kind = paid > 0 && total === 0 && items.length === 0 && !purchaseHint ? 'payment' : 'credit'
  const due = total - paid
  const warnings: string[] = []
  if (!customer) warnings.push('no-customer')
  if (total === 0 && kind !== 'payment') warnings.push('no-amount')
  if (kind === 'credit' && total > 0 && paid > total) warnings.push('paid-exceeds-total')
  const confidence: ParsedEntry['confidence'] = customer && (total > 0 || kind === 'payment') ? 'high' : 'low'
  const reading: Omit<ParsedEntry, 'spans'> = { customer, items, total, paid, due, note, kind, confidence, warnings }
  return { ...reading, spans: locateSpans(text, reading) }
}
