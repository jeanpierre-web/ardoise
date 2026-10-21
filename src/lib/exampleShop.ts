import type { Entry, Ledger } from './types'

const DAY = 24 * 60 * 60 * 1000

function at(now: Date, daysAgo: number): string {
  return new Date(now.getTime() - daysAgo * DAY).toISOString()
}

/**
 * A labelled sample book so a first visit shows balances, an overdue name,
 * and a cleared account. Dates are relative to `now`, not a fixed calendar.
 */
export function exampleLedger(now = new Date()): Ledger {
  const customers = [
    { id: 'ex-kofi', name: 'Kofi', phone: '', createdAt: at(now, 12), example: true },
    { id: 'ex-ama', name: 'Ama', phone: '', createdAt: at(now, 9), example: true },
    { id: 'ex-yao', name: 'Yao', phone: '', createdAt: at(now, 2), example: true },
    { id: 'ex-afi', name: 'Afi', phone: '', createdAt: at(now, 4), example: true },
  ]
  const entries: Entry[] = [
    {
      id: 'ex-kofi-sale',
      customerId: 'ex-kofi',
      createdAt: at(now, 12),
      raw: 'Kofi a pris 2 sacs de riz 15000, payé 5000',
      kind: 'credit',
      items: [{ qty: 2, name: 'Sacs de riz', amount: 15000 }],
      total: 15000,
      paid: 5000,
    },
    {
      id: 'ex-ama-sale',
      customerId: 'ex-ama',
      createdAt: at(now, 9),
      raw: 'Ama took 3 bottles of oil 4500',
      kind: 'credit',
      items: [{ qty: 3, name: 'Bottles of oil', amount: 4500 }],
      total: 4500,
      paid: 0,
    },
    {
      id: 'ex-yao-sale',
      customerId: 'ex-yao',
      createdAt: at(now, 2),
      raw: 'Pour Yao: savon 2000, riz 5000, a payé 3000',
      kind: 'credit',
      items: [
        { qty: null, name: 'Savon', amount: 2000 },
        { qty: null, name: 'Riz', amount: 5000 },
      ],
      total: 7000,
      paid: 3000,
    },
    {
      id: 'ex-afi-sale',
      customerId: 'ex-afi',
      createdAt: at(now, 4),
      raw: 'Afi a pris du savon 2500',
      kind: 'credit',
      items: [{ qty: null, name: 'Savon', amount: 2500 }],
      total: 2500,
      paid: 0,
    },
    {
      id: 'ex-afi-pay',
      customerId: 'ex-afi',
      createdAt: at(now, 3),
      raw: '',
      kind: 'payment',
      items: [],
      total: 0,
      paid: 2500,
    },
  ]
  return {
    version: 1,
    shopName: 'Boutique Adjo',
    customers,
    entries,
    example: true,
  }
}
