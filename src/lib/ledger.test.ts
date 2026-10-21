import { describe, expect, it } from 'vitest'
import { addEntry, balanceOf, clearExample, initials, isOverdue, overdueAmount, removeEntry, sortedCustomers, stillDue } from './ledger'
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

  it('sorts overdue balances first and builds initials', () => {
    const now = new Date('2026-10-21T12:00:00.000Z')
    const week = 7 * 24 * 60 * 60 * 1000
    let ledger = emptyLedger()
    ledger = addEntry(
      ledger,
      { customer: 'Yao', phone: '', items: [], total: 4000, paid: 0, raw: '' },
      new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    )
    ledger = addEntry(
      ledger,
      { customer: 'Ama', phone: '', items: [], total: 4500, paid: 0, raw: '' },
      new Date(now.getTime() - week - 1000).toISOString(),
    )
    ledger = addEntry(
      ledger,
      { customer: 'Kofi', phone: '', items: [], total: 1000, paid: 0, raw: '' },
      new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    )
    expect(sortedCustomers(ledger, now).map((customer) => customer.name)).toEqual(['Kofi', 'Ama', 'Yao'])
    expect(overdueAmount(ledger, now)).toBe(5500)
    const yao = ledger.customers.find((customer) => customer.name === 'Yao')
    expect(yao && isOverdue(ledger, yao.id, now)).toBe(false)
    expect(initials('Kofi')).toBe('KO')
    expect(initials('Ama Mensah')).toBe('AM')
    expect(initials('M. Agbeko')).toBe('AG')
  })

  it('clears labelled example customers and keeps a real one', () => {
    let ledger = addEntry(emptyLedger(), {
      customer: 'Kofi',
      phone: '',
      items: [],
      total: 1000,
      paid: 0,
      raw: '',
    })
    ledger = {
      ...ledger,
      example: true,
      shopName: 'Boutique Adjo',
      customers: ledger.customers.map((customer) => ({ ...customer, example: true })),
    }
    ledger = addEntry(ledger, { customer: 'Esi', phone: '', items: [], total: 2000, paid: 0, raw: '' })
    const cleared = clearExample(ledger)
    expect(cleared.example).toBe(false)
    expect(cleared.shopName).toBe('')
    expect(cleared.customers.map((customer) => customer.name)).toEqual(['Esi'])
    expect(stillDue(cleared)).toBe(2000)
  })
})
