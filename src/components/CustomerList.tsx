import { EXAMPLES, type Copy } from '../lib/i18n'
import { balanceOf } from '../lib/ledger'
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
  onOpen: (id: string) => void
  onExample: (sentence: string) => void
  customers: Ledger['customers']
}) {
  const { ledger, copy, onOpen, onExample, customers } = props
  if (!customers.length) {
    return (
      <>
        <div className="empty">
          <h2>{copy.emptyTitle}</h2>
          <p>{copy.emptyBody}</p>
          <div className="rules" aria-hidden="true" />
          <p className="note">{copy.onPhone}</p>
        </div>
        <div className="examples">
          {EXAMPLES.map((sentence) => (
            <button key={sentence} type="button" onClick={() => onExample(sentence)}>
              <span className="example-kicker">{copy.example}</span>
              {sentence}
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <ul className="rows" data-testid="customer-list">
        {customers.map((customer) => {
          const balance = balanceOf(ledger, customer.id)
          const tone = balance > 0 ? 'due' : 'settled'
          const word = balance > 0 ? copy.dueLabel : balance < 0 ? copy.aheadLabel : copy.settledLabel
          return (
            <li key={customer.id}>
              <button type="button" className="row" data-testid={`customer-${customer.name}`} onClick={() => onOpen(customer.id)}>
                <span className="name">{customer.name}</span>
                <span className={`bal ${tone}`}>{formatFcfa(balance)}</span>
                <span className="meta">{lastLine(ledger.entries, customer.id, copy.payment)}</span>
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
