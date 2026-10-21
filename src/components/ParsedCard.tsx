import type { Copy } from '../lib/i18n'
import { formatGrouped, parseIntegerInput } from '../lib/money'
import type { ParsedEntry } from '../lib/types'

export type FieldFix = { customer: string; total: number; paid: number }

export function ParsedCard(props: {
  copy: Copy
  parsed: ParsedEntry
  fix: FieldFix | null
  onFix: (fix: FieldFix) => void
}) {
  const { copy, parsed, fix, onFix } = props
  const customer = fix?.customer ?? parsed.customer
  const total = fix?.total ?? parsed.total
  const paid = fix?.paid ?? parsed.paid
  const payment = parsed.kind === 'payment'
  const due = payment ? 0 : total - paid
  const itemLine = parsed.items.map((item) => item.name).filter(Boolean).join(', ')
  const base = { customer, total, paid }

  return (
    <section className="parsed" data-testid="parsed-card" aria-label={copy.parsedLead}>
      <p className={`confidence ${parsed.confidence}`} data-testid="confidence" aria-live="polite">
        {parsed.confidence === 'high' ? copy.confidenceHigh : copy.confidenceLow}
      </p>
      <div className="facts">
        <label>
          <span>{copy.customer}</span>
          <input
            value={customer}
            data-testid="live-customer"
            onChange={(event) => onFix({ ...base, customer: event.target.value })}
          />
        </label>
        <div className="fact">
          <span>{copy.items}</span>
          <p>{itemLine || '—'}</p>
        </div>
        {payment ? null : (
          <label>
            <span>{copy.total}</span>
            <input
              inputMode="numeric"
              className="num"
              value={total ? String(total) : ''}
              onChange={(event) => onFix({ ...base, total: parseIntegerInput(event.target.value) })}
            />
          </label>
        )}
        <label>
          <span>{copy.paid}</span>
          <input
            inputMode="numeric"
            className="num"
            value={paid ? String(paid) : ''}
            onChange={(event) => onFix({ ...base, paid: parseIntegerInput(event.target.value) })}
          />
        </label>
        <div className="fact">
          <span>{copy.remaining}</span>
          <p className={`fact-due figure ${due > 0 ? 'due' : 'settled'}`} data-testid="live-due" data-amount={String(due)}>
            <span className="figure-num">{formatGrouped(due)}</span>
            <span className="figure-unit">F CFA</span>
          </p>
        </div>
      </div>
      <p className="hint">{copy.correctHint}</p>
    </section>
  )
}
