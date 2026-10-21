import { describe, expect, it } from 'vitest'
import { addEntry, balanceOf, removeEntry, stillDue } from './ledger'
import { emptyLedger } from './types'

describe('ledger', () => {
  it('keeps one balance per customer and sums what is still due', () => {
    let ledger = emptyLedger()
    ledger = addEntry(ledger, {
      customer: 'Kofi',
      phone: '',
      items: [{ qty: 2, name: 'Sacs de riz', amount: 15000 }],
      total: 15000,
      paid: 5000,
      raw: 'demo',
    })
    ledger = addEntry(ledger, {
      customer: 'kofi',
      phone: '22890000000',
      items: [],
      total: 0,
      paid: 4000,
      raw: '',
      kind: 'payment',
    })
    expect(ledger.customers).toHaveLength(1)
    expect(ledger.customers[0].phone).toBe('22890000000')
    const balance = balanceOf(ledger, ledger.customers[0].id)
    expect(balance).toBe(6000)
    expect(stillDue(ledger)).toBe(6000)
  })

  it('drops a customer when their last line is removed', () => {
    let ledger = addEntry(emptyLedger(), {
      customer: 'Ama',
      phone: '',
      items: [],
      total: 4500,
      paid: 0,
      raw: '',
    })
    const entryId = ledger.entries[0].id
    ledger = removeEntry(ledger, entryId)
    expect(ledger.customers).toHaveLength(0)
    expect(ledger.entries).toHaveLength(0)
    expect(stillDue(ledger)).toBe(0)
  })
})
