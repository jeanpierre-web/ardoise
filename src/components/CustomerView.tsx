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
    <svg className="rings" viewBox="0 0 132 48" aria-hidden="true">
      <circle cx="24" cy="24" r="16" />
      <circle cx="44" cy="24" r="16" />
      <circle cx="64" cy="24" r="16" />
      <circle cx="84" cy="24" r="16" />
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
        <div className="success" data-testid="cleared">
          <div className="success-inner">
            <h2>{copy.cleared}</h2>
            <ClearedMark />
          </div>
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
