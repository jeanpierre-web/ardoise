import { EXAMPLES, type Copy } from '../lib/i18n'
import { balanceOf, initials, isOverdue } from '../lib/ledger'
import { formatFcfa } from '../lib/money'
import type { Entry, Ledger } from '../lib/types'

function lastLine(entries: Entry[], customerId: string, paymentLabel: string): string {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index]
    if (entry.customerId !== customerId) continue
    if (entry.kind === 'payment') return paymentLabel
    const names = entry.items.map((item) => item.name).filter(Boolean)
    if (names.length) return names.join(', ')
    return entry.raw
  }
  return ''
}

export function CustomerList(props: {
  ledger: Ledger
  copy: Copy
  customers: Ledger['customers']
  freshId: string | null
  now: Date
  onOpen: (id: string) => void
  onExample: (sentence: string) => void
  onTryShop: () => void
  onReset: () => void
}) {
  const { ledger, copy, customers, freshId, now, onOpen, onExample, onTryShop, onReset } = props
  const example = Boolean(ledger.example)

  if (!customers.length) {
    return (
      <div className="empty">
        <h2>{copy.emptyTitle}</h2>
        <p>{copy.emptyBody}</p>
        <button type="button" className="btn primary try" data-testid="try-example" onClick={onTryShop}>
          {copy.tryExample}
        </button>
        <p className="note">{copy.tryHint}</p>
        <p className="note">{copy.onPhone}</p>
        <p className="or">{copy.orSentence}</p>
        <div className="examples">
          {EXAMPLES.map((sentence) => (
            <button key={sentence} type="button" onClick={() => onExample(sentence)}>
              <span className="example-kicker">{copy.example}</span>
              {sentence}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {example ? (
        <div className="banner" role="status" data-testid="example-banner">
          <p>{copy.exampleBanner}</p>
          <button type="button" className="btn line" data-testid="reset-example" onClick={onReset}>
            {copy.resetExample}
          </button>
        </div>
      ) : null}
      <ul className="rows" data-testid="customer-list">
        {customers.map((customer) => {
          const balance = balanceOf(ledger, customer.id)
          const late = isOverdue(ledger, customer.id, now)
          const tone = balance > 0 ? 'due' : 'settled'
          const word = balance > 0 ? copy.dueLabel : balance < 0 ? copy.aheadLabel : copy.settledLabel
          const fresh = ledger.entries.some((entry) => entry.id === freshId && entry.customerId === customer.id)
          return (
            <li key={customer.id}>
              <button
                type="button"
                className={`row${fresh ? ' chalk-in' : ''}`}
                data-testid={`customer-${customer.name}`}
                onClick={() => onOpen(customer.id)}
              >
                <span className={`avatar ${late ? 'late' : tone}`} aria-hidden="true">
                  {initials(customer.name)}
                </span>
                <span className="name chalk-write">
                  {customer.example ? <span className="example-kicker">{copy.exampleMark}</span> : null}
                  {customer.name}
                </span>
                <span className={`bal ${tone}`}>{formatFcfa(balance)}</span>
                <span className="meta">{late ? copy.overdue : lastLine(ledger.entries, customer.id, copy.payment)}</span>
                <span className="bal-word">{word}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="note foot-note">{copy.onPhone}</p>
    </>
  )
}
