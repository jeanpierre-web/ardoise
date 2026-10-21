import { useEffect, useRef, useState } from 'react'
import type { Copy } from '../lib/i18n'
import { formatGrouped } from '../lib/money'
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

function Amount(props: { display: number; amount: number; testId?: string }) {
  return (
    <p className="figure" data-testid={props.testId} data-amount={String(props.amount)}>
      <span className="figure-num">{formatGrouped(props.display)}</span>
      <span className="figure-unit">F CFA</span>
    </p>
  )
}

export function Header(props: {
  lang: Lang
  copy: Copy
  onLang: (lang: Lang) => void
  title: string
  value: number
  lateAmount: number
  lateCount: number
  showStats: boolean
  kicker: string
  shopLabel?: string
  onBack?: () => void
  onShop?: () => void
}) {
  const { lang, copy, onLang, title, value, lateAmount, lateCount, showStats, kicker, shopLabel, onBack, onShop } = props
  const shown = useCounted(value)
  const shownLate = useCounted(lateAmount)
  return (
    <div className="mast">
      <header className="topbar">
        <div className="brand">
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
      </header>
      {onBack ? (
        <section className="hero-card">
          <p className="eyebrow">{kicker}</p>
          <h1 className="slate-name">{title}</h1>
          <Amount display={shown} amount={value} testId="still-due" />
        </section>
      ) : showStats ? (
        <section className="aqua" data-testid="stats" aria-label={copy.totalOwed}>
          <div>
            <p className="eyebrow">{copy.totalOwed}</p>
            <Amount display={shown} amount={value} testId="still-due" />
          </div>
          <div>
            <p className="eyebrow">
              {copy.overdue}
              {lateCount ? ` · ${lateCount}` : ''}
            </p>
            <Amount display={shownLate} amount={lateAmount} testId="overdue-amount" />
          </div>
        </section>
      ) : null}
    </div>
  )
}
