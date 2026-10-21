import { locateSpans } from './highlights'
import { parseEntry } from './parseEntry'
import type { EntryKind, ParsedEntry, ParsedItem, ReaderKind } from './types'

const SYSTEM = `You turn one shopkeeper sentence about a credit sale into JSON only.
Schema: {"customer":string,"items":[{"qty":number|null,"name":string,"amount":number|null}],"total":number,"paid":number,"kind":"credit"|"payment"}
Amounts are integers in FCFA. Words like payé, versé, and paid are the amount already paid, not the price.
A sentence that is only a payment has kind "payment", total 0, and paid set.
No markdown.`

export function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown
  } catch {
    return null
  }
}

function asAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(n)) return Math.max(0, Math.round(n))
  }
  return null
}

export function fromModelJson(value: unknown, fallback: ParsedEntry): ParsedEntry | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const customer = typeof record.customer === 'string' ? record.customer.trim() : ''
  const items: ParsedItem[] = Array.isArray(record.items)
    ? record.items.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const row = item as Record<string, unknown>
        const name = typeof row.name === 'string' ? row.name.trim() : ''
        if (!name) return []
        const qty = asAmount(row.qty)
        return [{ qty: qty && qty > 0 ? qty : null, name, amount: asAmount(row.amount) }]
      })
    : fallback.items
  const paid = asAmount(record.paid) ?? fallback.paid
  const kind: EntryKind = record.kind === 'payment' ? 'payment' : 'credit'
  const lineSum = items.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const total = kind === 'payment' ? 0 : asAmount(record.total) ?? (lineSum || fallback.total)
  if (!customer && total === 0 && paid === 0) return null
  const due = total - paid
  const confidence: ParsedEntry['confidence'] = customer && (total > 0 || kind === 'payment') ? 'high' : 'low'
  const reading: Omit<ParsedEntry, 'spans'> = {
    customer: customer || fallback.customer,
    items: kind === 'payment' ? [] : items,
    total,
    paid,
    due,
    note: fallback.note,
    kind,
    confidence,
    warnings: customer ? [] : ['no-customer'],
  }
  return { ...reading, spans: locateSpans(fallback.note, reading) }
}

async function promptDevice(sentence: string): Promise<string | null> {
  const Model = window.LanguageModel
  if (!Model) return null
  try {
    const availability = await Model.availability()
    if (availability !== 'available') return null
    const session = await Model.create({
      initialPrompts: [{ role: 'system', content: SYSTEM }],
    })
    try {
      return await session.prompt(sentence)
    } finally {
      session.destroy?.()
    }
  } catch {
    return null
  }
}

async function promptRemote(sentence: string): Promise<string | null> {
  const base = import.meta.env.VITE_LLM_BASE_URL?.replace(/\/$/, '')
  const key = import.meta.env.VITE_LLM_API_KEY
  const model = import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini'
  if (!base || !key) return null
  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: sentence },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    return data.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
}

export async function maybeRefine(sentence: string): Promise<{ entry: ParsedEntry; reader: ReaderKind } | null> {
  const fallback = parseEntry(sentence)
  const remote = await promptRemote(sentence)
  const device = remote ? null : await promptDevice(sentence)
  const raw = remote ?? device
  if (!raw) return null
  const parsed = fromModelJson(extractJsonObject(raw), fallback)
  if (!parsed) return null
  return { entry: parsed, reader: remote ? 'remote' : 'device' }
}

export function modelConfigured(): boolean {
  return Boolean(import.meta.env.VITE_LLM_API_KEY && import.meta.env.VITE_LLM_BASE_URL)
}

export function deviceModelPresent(): boolean {
  return typeof window !== 'undefined' && typeof window.LanguageModel !== 'undefined'
}
