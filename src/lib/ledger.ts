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

export function sortedCustomers(ledger: Ledger): Customer[] {
  return [...ledger.customers].sort((a, b) => {
    const byBalance = balanceOf(ledger, b.id) - balanceOf(ledger, a.id)
    if (byBalance !== 0) return byBalance
    return a.name.localeCompare(b.name, 'fr')
  })
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
