import { describe, expect, it } from 'vitest'
import { exampleLedger } from './exampleShop'
import { balanceOf, isOverdue, sortedCustomers, stillDue } from './ledger'

describe('example shop', () => {
  const now = new Date('2026-10-21T12:00:00.000Z')

  it('loads four labelled customers, with overdue names first', () => {
    const book = exampleLedger(now)
    expect(book.example).toBe(true)
    expect(book.shopName).toBe('Boutique Adjo')
    expect(book.customers).toHaveLength(4)
    expect(book.customers.every((customer) => customer.example)).toBe(true)
    expect(sortedCustomers(book, now).map((customer) => customer.name)).toEqual(['Kofi', 'Ama', 'Yao', 'Afi'])
    const id = (name: string) => book.customers.find((customer) => customer.name === name)?.id ?? ''
    expect(isOverdue(book, id('Kofi'), now)).toBe(true)
    expect(isOverdue(book, id('Ama'), now)).toBe(true)
    expect(isOverdue(book, id('Yao'), now)).toBe(false)
    expect(isOverdue(book, id('Afi'), now)).toBe(false)
    expect(balanceOf(book, id('Kofi'))).toBe(10000)
    expect(balanceOf(book, id('Afi'))).toBe(0)
    expect(stillDue(book)).toBe(18500)
  })
})
