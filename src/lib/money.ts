/** West African grouping, in both languages. Amounts are integer FCFA. */
export function formatFcfa(amount: number): string {
  const abs = Math.abs(Math.round(amount))
  const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(abs)
  return `${formatted}\u00a0F CFA`
}

export function parseIntegerInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return 0
  const n = Number(digits)
  return Number.isSafeInteger(n) ? n : 0
}
