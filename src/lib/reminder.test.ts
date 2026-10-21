import { describe, expect, it } from 'vitest'
import { reminderText, whatsappHref } from './reminder'

describe('reminder', () => {
  it('writes a polite French or English message and a wa.me link', () => {
    const fr = reminderText({ lang: 'fr', customer: 'Kofi', shopName: 'Chez Awa', amount: 10000 })
    expect(fr).toContain('Kofi')
    expect(fr).toContain('Chez Awa')
    expect(fr.toLowerCase()).toContain('ardoise')
    expect(fr).not.toMatch(/immédiat|must pay|pay now/i)

    const en = reminderText({ lang: 'en', customer: 'Kofi', shopName: '', amount: 10000 })
    expect(en.startsWith('Hello Kofi.')).toBe(true)
    expect(en).toContain('F CFA')

    const withPhone = whatsappHref('228 90 00 00 00', en)
    expect(withPhone.startsWith('https://wa.me/22890000000?text=')).toBe(true)
    expect(decodeURIComponent(withPhone)).toContain('Hello Kofi')

    const noPhone = whatsappHref('12', en)
    expect(noPhone.startsWith('https://wa.me/?text=')).toBe(true)
  })
})
