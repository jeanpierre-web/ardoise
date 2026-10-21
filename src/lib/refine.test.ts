import { describe, expect, it } from 'vitest'
import { parseEntry } from './parseEntry'
import { extractJsonObject, fromModelJson } from './refine'

describe('model JSON', () => {
  it('pulls a JSON object out of a fenced reply and keeps the rule reading as fallback', () => {
    const fallback = parseEntry('Kofi a pris 2 sacs de riz 15000, payé 5000')
    const raw = '```json\n{"customer":"Kofi","items":[{"qty":2,"name":"Sacs de riz","amount":15000}],"total":15000,"paid":5000,"kind":"credit"}\n```'
    const value = extractJsonObject(raw)
    const parsed = fromModelJson(value, fallback)
    expect(parsed?.customer).toBe('Kofi')
    expect(parsed?.due).toBe(10000)
    expect(fromModelJson('nope', fallback)).toBeNull()
    expect(fromModelJson({ customer: '', total: 0, paid: 0 }, fallback)).toBeNull()
  })
})
