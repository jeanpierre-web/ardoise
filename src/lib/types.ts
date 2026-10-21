export type Lang = 'fr' | 'en'

export type ParsedItem = {
  qty: number | null
  name: string
  amount: number | null
}

export type EntryKind = 'credit' | 'payment'

export type HighlightKind = 'customer' | 'item' | 'total' | 'paid' | 'remaining'

export type Highlight = {
  kind: HighlightKind
  start: number
  end: number
}

export type ParsedEntry = {
  customer: string
  items: ParsedItem[]
  total: number
  paid: number
  due: number
  note: string
  kind: EntryKind
  confidence: 'high' | 'low'
  warnings: string[]
  /** Indexes into the original sentence, not the normalized note. */
  spans: Highlight[]
}

export type Customer = {
  id: string
  name: string
  phone: string
  createdAt: string
  example?: boolean
}

export type Entry = {
  id: string
  customerId: string
  createdAt: string
  raw: string
  kind: EntryKind
  items: ParsedItem[]
  total: number
  paid: number
}

export type Ledger = {
  version: 1
  shopName: string
  customers: Customer[]
  entries: Entry[]
  /** True when the book still holds the labelled sample shop. */
  example?: boolean
}

export type ReaderKind = 'rules' | 'device' | 'remote'

export function emptyLedger(): Ledger {
  return { version: 1, shopName: '', customers: [], entries: [], example: false }
}
