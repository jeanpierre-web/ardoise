import type { Copy } from '../lib/i18n'
import type { Lang } from '../lib/types'
import { BackIcon } from './Icons'

export function Header(props: {
  lang: Lang
  copy: Copy
  onLang: (lang: Lang) => void
  title: string
  amount: string
  label: string
  onBack?: () => void
  onShop?: () => void
}) {
  const { lang, copy, onLang, title, amount, label, onBack, onShop } = props
  return (
    <header className="slate">
      <div className="slate-top">
        {onBack ? (
          <button type="button" className="back" onClick={onBack}>
            <BackIcon />
            {copy.back}
          </button>
        ) : (
          <p className="wordmark">Ardoise</p>
        )}
        {onShop ? (
          <button type="button" className="shop-btn" onClick={onShop}>
            {copy.shop}
          </button>
        ) : null}
      </div>
      <div className="langs" role="group" aria-label="Language">
        <button type="button" data-testid="lang-fr" aria-pressed={lang === 'fr'} onClick={() => onLang('fr')}>
          FR
        </button>
        <button type="button" data-testid="lang-en" aria-pressed={lang === 'en'} onClick={() => onLang('en')}>
          EN
        </button>
      </div>
      {onBack ? <h1 className="slate-name">{title}</h1> : null}
      <p className="figure" data-testid="still-due" data-amount={amount}>
        {amount}
      </p>
      <p className="slate-label">{label}</p>
    </header>
  )
}
