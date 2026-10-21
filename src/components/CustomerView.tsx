import type { Copy } from '../lib/i18n'
import { formatFcfa } from '../lib/money'
import type { Entry, Lang } from '../lib/types'

function when(iso: string, lang: Lang): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' }).format(date)
}

export function CustomerView(props: {
  lang: Lang
  copy: Copy
  entries: Entry[]
  onRemove: (id: string) => void
}) {
  const { lang, copy, entries, onRemove } = props
  return (
    <section>
      <ul className="history">
        <li>
          <h2>{copy.history}</h2>
        </li>
        {entries.map((entry) => {
          const effect = entry.total - entry.paid
          const payment = entry.kind === 'payment'
          return (
            <li key={entry.id} className="line">
              <span className="when">{when(entry.createdAt, lang)}</span>
              <span className="what">{payment ? copy.payment : entry.items.map((item) => item.name).filter(Boolean).join(', ') || entry.raw}</span>
              <span className={`bal ${payment || effect <= 0 ? 'settled' : 'due'}`}>
                {formatFcfa(payment ? entry.paid : effect)}
              </span>
              {payment ? <span className="sub">{copy.paymentAmount}</span> : entry.paid > 0 ? (
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
