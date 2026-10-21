import type { Highlight, HighlightKind, ParsedEntry, ParsedItem } from './types'

const AMOUNT = String.raw`(\d{1,3}(?:[ \u00a0\u202f.,]\d{3})+|\d+(?:[.,]\d{1,2})?)`
const PAID_WORD = String.raw`payé|payee|paye|paid|versé|verse|donné|donne|réglé|regle|reglé`

const PAID_RE = new RegExp(
  String.raw`(?:^|[,\s;])(?:(?:il|elle|on|i|j'ai)\s+)?(?:(?:a|ai|avons|have|has)\s+)?(?:${PAID_WORD})\s*(?:de\s+|of\s+|:)?\s*${AMOUNT}`,
  'giu',
)

const PAID_NOUN_RE = new RegExp(
  String.raw`(?:^|[,\s;])(?:payment|versement|deposit|acompte)\s+(?:of\s+|de\s+)?${AMOUNT}`,
  'giu',
)

const TOTAL_RE = new RegExp(
  String.raw`(?:^|[,\s;])(?:total|montant|somme|amount)\s*(?:de\s+|of\s+|:?\s*)${AMOUNT}`,
  'giu',
)

type Readable = {
  customer: string
  items: ParsedItem[]
  due: number
}

export function locateSpans(text: string, parsed: Readable): Highlight[] {
  const used = Array.from({ length: text.length }, () => false)
  const spans: Highlight[] = []

  function take(start: number, end: number, kind: HighlightKind): boolean {
    if (start < 0 || end > text.length || end <= start) return false
    for (let i = start; i < end; i += 1) if (used[i]) return false
    for (let i = start; i < end; i += 1) used[i] = true
    spans.push({ kind, start, end })
    return true
  }

  function claimMatches(re: RegExp, kind: HighlightKind) {
    const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`
    const copy = new RegExp(re.source, flags)
    let match: RegExpExecArray | null
    while ((match = copy.exec(text))) {
      let start = match.index
      const lead = /^[,\s;]+/u.exec(match[0])
      if (lead) start += lead[0].length
      take(start, match.index + match[0].length, kind)
      if (match.index === copy.lastIndex) copy.lastIndex += 1
    }
  }

  function claimAmount(amount: number, kind: HighlightKind) {
    if (!amount) return
    const digits = String(Math.abs(Math.round(amount)))
    let body = digits
    if (digits.length > 3) {
      const groups: string[] = []
      let rest = digits
      while (rest.length > 3) {
        groups.unshift(rest.slice(-3))
        rest = rest.slice(0, -3)
      }
      groups.unshift(rest)
      body = `${digits}|${groups.join(String.raw`[\s\u00a0\u202f.,]`)}`
    }
    const re = new RegExp(String.raw`(?<!\d)(?:${body})(?!\d)`, 'gu')
    let match: RegExpExecArray | null
    while ((match = re.exec(text))) {
      if (take(match.index, match.index + match[0].length, kind)) return
      if (match.index === re.lastIndex) re.lastIndex += 1
    }
  }

  claimMatches(PAID_RE, 'paid')
  claimMatches(PAID_NOUN_RE, 'paid')
  claimMatches(TOTAL_RE, 'total')

  if (parsed.customer) {
    const needle = parsed.customer.toLocaleLowerCase('fr')
    const lower = text.toLocaleLowerCase('fr')
    let at = lower.indexOf(needle)
    if (at < 0) {
      const last = parsed.customer.split(/\s+/).at(-1) ?? ''
      if (last.length > 2) at = lower.indexOf(last.toLocaleLowerCase('fr'))
    }
    if (at >= 0) {
      const found = at === lower.indexOf(needle) ? parsed.customer.length : (parsed.customer.split(/\s+/).at(-1)?.length ?? 0)
      take(at, at + found, 'customer')
    }
  }

  const lower = text.toLocaleLowerCase('fr')
  for (const item of parsed.items) {
    if (!item.name) continue
    const needle = item.name.toLocaleLowerCase('fr')
    let from = 0
    let at = lower.indexOf(needle, from)
    while (at >= 0) {
      let start = at
      let end = at + needle.length
      const before = text.slice(0, start)
      const qty = /(\d+(?:[.,]\d+)?)\s*(?:x|×)?\s*$/iu.exec(before)
      if (qty && qty.index != null) {
        let blocked = false
        for (let i = qty.index; i < start; i += 1) if (used[i]) blocked = true
        if (!blocked) start = qty.index
      }
      const price = new RegExp(String.raw`^\s*${AMOUNT}`, 'iu').exec(text.slice(end))
      if (price) {
        const priceEnd = end + price[0].length
        let blocked = false
        for (let i = end; i < priceEnd; i += 1) if (used[i]) blocked = true
        if (!blocked) end = priceEnd
      }
      if (take(start, end, 'item')) break
      from = at + needle.length
      at = lower.indexOf(needle, from)
    }
    if (item.amount) claimAmount(item.amount, 'item')
  }

  if (parsed.due > 0) claimAmount(parsed.due, 'remaining')
  return spans.sort((a, b) => a.start - b.start || a.end - b.end)
}

export function highlightSegments(text: string, spans: Highlight[]): { text: string; kind?: HighlightKind }[] {
  const parts: { text: string; kind?: HighlightKind }[] = []
  let cursor = 0
  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    if (span.start < cursor || span.end > text.length) continue
    if (span.start > cursor) parts.push({ text: text.slice(cursor, span.start) })
    parts.push({ text: text.slice(span.start, span.end), kind: span.kind })
    cursor = span.end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) })
  return parts
}

export function attachSpans(text: string, parsed: Omit<ParsedEntry, 'spans'>): ParsedEntry {
  return { ...parsed, spans: locateSpans(text, parsed) }
}
