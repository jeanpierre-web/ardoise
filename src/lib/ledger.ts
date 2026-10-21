import type { Customer, Entry, EntryKind, Ledger, ParsedItem } from './types'

export function balanceOf(ledger: Ledger, customerId: string): number {
  return ledger.entries
    .filter((entry) => entry.customerId === customerId)
    .reduce((sum, entry) => sum + entry.total - entry.paid, 0)
}

export function stillDue(ledger: Ledger): number {
  return ledger.customers.reduce((sum, customer) => {
    const balance = balanceOf(ledger, customer.id)
    return sum + (balance > 0 ? balance : 0)
  }, 0)
}

export function findCustomerByName(ledger: Ledger, name: string): Customer | undefined {
  const key = name.trim().toLocaleLowerCase('fr')
  return ledger.customers.find((customer) => customer.name.toLocaleLowerCase('fr') === key)
}

function id(): string {
  return crypto.randomUUID()
}

export const OVERDUE_DAYS = 7

export function initials(name: string): string {
  const skip = /^(m|mme|mr|mrs|ms|monsieur|madame)$/i
  const parts = name
    .split(/\s+/)
    .map((part) => part.replace(/\./g, ''))
    .filter((part) => part && !skip.test(part))
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('fr') || '?'
  return parts
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toLocaleUpperCase('fr') || '?'
}

export function oldestCreditAt(ledger: Ledger, customerId: string): string | null {
  let oldest: string | null = null
  for (const entry of ledger.entries) {
    if (entry.customerId !== customerId || entry.kind !== 'credit') continue
    if (!oldest || entry.createdAt < oldest) oldest = entry.createdAt
  }
  return oldest
}

export function isOverdue(ledger: Ledger, customerId: string, now = new Date(), days = OVERDUE_DAYS): boolean {
  if (balanceOf(ledger, customerId) <= 0) return false
  const oldest = oldestCreditAt(ledger, customerId)
  if (!oldest) return false
  const age = now.getTime() - new Date(oldest).getTime()
  return age >= days * 24 * 60 * 60 * 1000
}

export function overdueCount(ledger: Ledger, now = new Date()): number {
  return ledger.customers.filter((customer) => isOverdue(ledger, customer.id, now)).length
}

export function overdueAmount(ledger: Ledger, now = new Date()): number {
  return ledger.customers.reduce((sum, customer) => {
    if (!isOverdue(ledger, customer.id, now)) return sum
    return sum + Math.max(0, balanceOf(ledger, customer.id))
  }, 0)
}

export function sortedCustomers(ledger: Ledger, now = new Date()): Customer[] {
  return [...ledger.customers].sort((a, b) => {
    const aLate = isOverdue(ledger, a.id, now) ? 0 : 1
    const bLate = isOverdue(ledger, b.id, now) ? 0 : 1
    if (aLate !== bLate) return aLate - bLate
    if (aLate === 0) {
      const at = oldestCreditAt(ledger, a.id) ?? ''
      const bt = oldestCreditAt(ledger, b.id) ?? ''
      if (at !== bt) return at.localeCompare(bt)
    }
    const byBalance = balanceOf(ledger, b.id) - balanceOf(ledger, a.id)
    if (byBalance !== 0) return byBalance
    return a.name.localeCompare(b.name, 'fr')
  })
}

export function clearExample(ledger: Ledger): Ledger {
  const sampleIds = new Set(ledger.customers.filter((customer) => customer.example).map((customer) => customer.id))
  if (!ledger.example && sampleIds.size === 0) return ledger
  const customers = ledger.customers.filter((customer) => !customer.example)
  return {
    version: 1,
    shopName: ledger.shopName === 'Boutique Adjo' ? '' : ledger.shopName,
    customers,
    entries: ledger.entries.filter((entry) => !sampleIds.has(entry.customerId)),
    example: false,
  }
}

export function entriesFor(ledger: Ledger, customerId: string): Entry[] {
  return ledger.entries
    .filter((entry) => entry.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

type CreditInput = {
  customer: string
  phone: string
  items: ParsedItem[]
  total: number
  paid: number
  raw: string
  kind?: EntryKind
}

export function addEntry(ledger: Ledger, input: CreditInput, now = new Date().toISOString()): Ledger {
  const name = input.customer.trim()
  if (!name) return ledger
  const existing = findCustomerByName(ledger, name)
  const phone = input.phone.trim()
  let customers = ledger.customers
  let customerId: string
  if (existing) {
    customerId = existing.id
    customers = customers.map((customer) =>
      customer.id === existing.id
        ? {
            ...customer,
            name,
            phone: phone || customer.phone,
          }
        : customer,
    )
  } else {
    customerId = id()
    customers = [...customers, { id: customerId, name, phone, createdAt: now }]
  }
  const kind = input.kind ?? (input.total === 0 && input.paid > 0 ? 'payment' : 'credit')
  const entry: Entry = {
    id: id(),
    customerId,
    createdAt: now,
    raw: input.raw,
    kind,
    items: input.items,
    total: kind === 'payment' ? 0 : Math.max(0, Math.round(input.total)),
    paid: Math.max(0, Math.round(input.paid)),
  }
  return { ...ledger, customers, entries: [...ledger.entries, entry] }
}

export function removeEntry(ledger: Ledger, entryId: string): Ledger {
  const entry = ledger.entries.find((item) => item.id === entryId)
  if (!entry) return ledger
  const entries = ledger.entries.filter((item) => item.id !== entryId)
  const stillThere = entries.some((item) => item.customerId === entry.customerId)
  const customers = stillThere
    ? ledger.customers
    : ledger.customers.filter((customer) => customer.id !== entry.customerId)
  return { ...ledger, customers, entries }
}

export function setShopName(ledger: Ledger, shopName: string): Ledger {
  return { ...ledger, shopName: shopName.trim() }
}
