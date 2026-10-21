import type { Copy } from '../lib/i18n'
import { formatFcfa } from '../lib/money'
import type { Entry, Lang } from '../lib/types'

function when(iso: string, lang: Lang): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' }).format(date)
}

function ClearedMark() {
  return (
    <svg className="cleared-mark" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path className="cleared-check" d="M16 24.5 21.5 30 33 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CustomerView(props: {
  lang: Lang
  copy: Copy
  entries: Entry[]
  freshId: string | null
  settled: boolean
  onRemove: (id: string) => void
}) {
  const { lang, copy, entries, freshId, settled, onRemove } = props
  return (
    <section>
      {settled && entries.length ? (
        <div className="cleared" data-testid="cleared">
          <ClearedMark />
          <p>{copy.cleared}</p>
        </div>
      ) : null}
      <ul className="history">
        <li>
          <h2>{copy.history}</h2>
        </li>
        {entries.map((entry) => {
          const effect = entry.total - entry.paid
          const payment = entry.kind === 'payment'
          const fresh = entry.id === freshId
          return (
            <li key={entry.id} className={`line${fresh ? ' chalk-in' : ''}`}>
              <span className="when">{when(entry.createdAt, lang)}</span>
              <span className="what chalk-write">{payment ? copy.payment : entry.items.map((item) => item.name).filter(Boolean).join(', ') || entry.raw}</span>
              <span className={`bal ${payment || effect <= 0 ? 'settled' : 'due'}`}>
                {formatFcfa(payment ? entry.paid : effect)}
              </span>
              {payment ? (
                <span className="sub">{copy.paymentAmount}</span>
              ) : entry.paid > 0 ? (
                <span className="sub">
                  {formatFcfa(entry.total)} − {formatFcfa(entry.paid)}
                </span>
              ) : (
                <span className="sub" />
              )}
              <button type="button" className="text-btn" onClick={() => onRemove(entry.id)}>
                {copy.remove}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
