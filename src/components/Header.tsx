import { useEffect, useRef, useState } from 'react'
import type { Copy } from '../lib/i18n'
import { formatFcfa } from '../lib/money'
import type { Lang } from '../lib/types'
import { BackIcon } from './Icons'

function useCounted(value: number): number {
  const [shown, setShown] = useState(value)
  const shownRef = useRef(value)
  shownRef.current = shown

  useEffect(() => {
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = shownRef.current
    if (reduce || start === value) {
      setShown(value)
      return
    }
    const t0 = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - t0) / 420)
      const eased = 1 - (1 - progress) ** 3
      setShown(Math.round(start + (value - start) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return shown
}

export function Header(props: {
  lang: Lang
  copy: Copy
  onLang: (lang: Lang) => void
  title: string
  value: number
  tone: 'due' | 'settled' | 'plain'
  kicker: string
  meta: string
  shopLabel?: string
  onBack?: () => void
  onShop?: () => void
}) {
  const { lang, copy, onLang, title, value, tone, kicker, meta, shopLabel, onBack, onShop } = props
  const shown = useCounted(value)
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
            {shopLabel || copy.shop}
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
      {onBack ? <h1 className="slate-name">{title}</h1> : <p className="kicker">{kicker}</p>}
      <p className={`figure ${tone}`} data-testid="still-due" data-amount={String(value)}>
        {formatFcfa(shown)}
      </p>
      {onBack ? <p className="slate-label">{kicker}</p> : meta ? <p className="slate-label">{meta}</p> : null}
    </header>
  )
}
