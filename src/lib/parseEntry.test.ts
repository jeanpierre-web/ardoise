import { describe, expect, it } from 'vitest'
import { parseAmountToken, parseEntry } from './parseEntry'

describe('parseAmountToken', () => {
  it('reads plain and grouped FCFA amounts', () => {
    expect(parseAmountToken('15000')).toBe(15000)
    expect(parseAmountToken('15 000')).toBe(15000)
    expect(parseAmountToken('15.000')).toBe(15000)
    expect(parseAmountToken('5,000')).toBe(5000)
    expect(parseAmountToken('15 000 F')).toBe(15000)
  })
})

describe('parseEntry', () => {
  it('reads the demo sentence', () => {
    const parsed = parseEntry('Kofi a pris 2 sacs de riz 15000, payé 5000')
    expect(parsed.customer).toBe('Kofi')
    expect(parsed.items).toEqual([{ qty: 2, name: 'Sacs de riz', amount: 15000 }])
    expect(parsed.total).toBe(15000)
    expect(parsed.paid).toBe(5000)
    expect(parsed.due).toBe(10000)
    expect(parsed.kind).toBe('credit')
    expect(parsed.confidence).toBe('high')
  })

  it('reads an English sale', () => {
    const parsed = parseEntry('Ama took 3 bottles of oil 4500')
    expect(parsed.customer).toBe('Ama')
    expect(parsed.items[0]).toMatchObject({ qty: 3, amount: 4500 })
    expect(parsed.items[0].name.toLowerCase()).toContain('oil')
    expect(parsed.total).toBe(4500)
    expect(parsed.paid).toBe(0)
    expect(parsed.due).toBe(4500)
  })

  it('reads several items and a payment', () => {
    const parsed = parseEntry('Pour Yao: savon 2000, riz 5000, a payé 3000')
    expect(parsed.customer).toBe('Yao')
    expect(parsed.items).toHaveLength(2)
    expect(parsed.total).toBe(7000)
    expect(parsed.paid).toBe(3000)
    expect(parsed.due).toBe(4000)
  })

  it('reads a payment on its own', () => {
    const parsed = parseEntry('Kofi paid 10000')
    expect(parsed.customer).toBe('Kofi')
    expect(parsed.kind).toBe('payment')
    expect(parsed.paid).toBe(10000)
    expect(parsed.total).toBe(0)
  })

  it('keeps a title with the customer and a spaced price', () => {
    const titled = parseEntry('M. Agbeko 2 baguettes 500')
    expect(titled.customer).toContain('Agbeko')
    expect(titled.total).toBe(500)
    expect(titled.paid).toBe(0)

    const spaced = parseEntry('Kofi a pris du riz, 15 000 F, il a versé 5 000')
    expect(spaced.customer).toBe('Kofi')
    expect(spaced.total).toBe(15000)
    expect(spaced.paid).toBe(5000)
    expect(spaced.due).toBe(10000)
  })

  it('reads grouped English amounts and a two-item French sale', () => {
    const english = parseEntry('Kofi took 2 bags of rice 15,000, paid 5,000')
    expect(english.customer).toBe('Kofi')
    expect(english.total).toBe(15000)
    expect(english.paid).toBe(5000)

    const french = parseEntry("Afi a acheté 1 sac de maïs 8000 et 2 bidons d'huile 6000, payé 4000")
    expect(french.customer).toBe('Afi')
    expect(french.total).toBe(14000)
    expect(french.paid).toBe(4000)
    expect(french.due).toBe(10000)
  })

  it('warns when the name is missing and reads a debt with doit', () => {
    const nameless = parseEntry('2 sacs de riz 15000')
    expect(nameless.customer).toBe('')
    expect(nameless.total).toBe(15000)
    expect(nameless.warnings).toContain('no-customer')

    const owes = parseEntry('Kofi doit 12000')
    expect(owes.customer).toBe('Kofi')
    expect(owes.total).toBe(12000)
    expect(owes.paid).toBe(0)
    expect(owes.due).toBe(12000)
  })

  it('returns a low-confidence empty reading for a blank sentence', () => {
    const parsed = parseEntry('   ')
    expect(parsed.confidence).toBe('low')
    expect(parsed.total).toBe(0)
    expect(parsed.warnings).toContain('empty')
  })
})
