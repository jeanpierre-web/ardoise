import { afterEach, describe, expect, it, vi } from 'vitest'
import { exampleLedger } from './exampleShop'
import { loadLedger, saveLedger } from './storage'
import { emptyLedger } from './types'

const store = new Map<string, string>()

afterEach(() => {
  store.clear()
  vi.unstubAllGlobals()
})

describe('storage', () => {
  it('keeps the example flag across a save', () => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    })
    const book = exampleLedger(new Date('2026-10-21T12:00:00.000Z'))
    saveLedger(book)
    const loaded = loadLedger()
    expect(loaded.example).toBe(true)
    expect(loaded.customers).toHaveLength(4)
    expect(loaded.shopName).toBe('Boutique Adjo')
    saveLedger(emptyLedger())
    expect(loadLedger().example).toBe(false)
  })
})
