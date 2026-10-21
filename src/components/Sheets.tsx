import { useEffect, useRef } from 'react'
import type { Copy } from '../lib/i18n'
import { formatFcfa, parseIntegerInput } from '../lib/money'
import type { ParsedItem, ReaderKind } from '../lib/types'

export type Draft = {
  customer: string
  phone: string
  items: ParsedItem[]
  total: number
  paid: number
  raw: string
  kind: 'credit' | 'payment'
  warnings: string[]
  reader: ReaderKind
  checking: boolean
  dirty: boolean
  totalTouched: boolean
}

export function ReadSheet(props: {
  copy: Copy
  draft: Draft
  onChange: (draft: Draft) => void
  onClose: () => void
  onSave: () => void
}) {
  const { copy, draft, onChange, onClose, onSave } = props
  const first = useRef<HTMLInputElement>(null)
  const payment = draft.kind === 'payment'
  const due = draft.total - draft.paid
  const canSave = Boolean(draft.customer.trim()) && (payment ? draft.paid > 0 : draft.total > 0)

  useEffect(() => {
    first.current?.focus()
  }, [])

  function patch(partial: Partial<Draft>) {
    onChange({ ...draft, ...partial, dirty: true })
  }

  function updateItem(index: number, partial: Partial<ParsedItem>) {
    const items = draft.items.map((item, i) => (i === index ? { ...item, ...partial } : item))
    const priced = items.filter((item) => item.name.trim() && item.amount != null)
    const total = draft.totalTouched || !priced.length ? draft.total : priced.reduce((sum, item) => sum + (item.amount ?? 0), 0)
    onChange({ ...draft, items, total, dirty: true })
  }

  const reader =
    draft.checking ? copy.readerChecking : draft.reader === 'device' ? copy.readerDevice : draft.reader === 'remote' ? copy.readerRemote : copy.readerRules

  return (
    <div className="backdrop" role="presentation">
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="read-title"
        data-testid="sheet"
        onSubmit={(event) => {
          event.preventDefault()
          if (canSave) onSave()
        }}
      >
        <h2 id="read-title">{payment ? copy.payment : draft.customer || copy.customer}</h2>
        <p className={`sheet-due ${due <= 0 ? 'settled' : ''}`} data-testid="due-amount" data-amount={String(payment ? draft.paid : due)}>
          {formatFcfa(payment ? draft.paid : due)}
        </p>
        <p className="reader">{reader}</p>
        {draft.warnings.includes('no-customer') || draft.warnings.includes('no-amount') ? <p className="check">{copy.check}</p> : null}
        <label className="field">
          <span>{copy.customer}</span>
          <input ref={first} value={draft.customer} onChange={(event) => patch({ customer: event.target.value })} data-testid="field-customer" />
        </label>
        <label className="field">
          <span>{copy.phone}</span>
          <input inputMode="tel" value={draft.phone} onChange={(event) => patch({ phone: event.target.value })} />
          <span className="hint">{copy.phoneHint}</span>
        </label>
        {payment ? (
          <label className="field">
            <span>{copy.paymentAmount}</span>
            <input inputMode="numeric" value={draft.paid ? String(draft.paid) : ''} onChange={(event) => patch({ paid: parseIntegerInput(event.target.value) })} />
          </label>
        ) : (
          <>
            <div className="item-labels" aria-hidden="true">
              <span>{copy.qty}</span>
              <span>{copy.item}</span>
              <span>{copy.amount}</span>
              <span />
            </div>
            {draft.items.map((item, index) => (
              <div className="item-row" key={index}>
                <input
                  aria-label={copy.qty}
                  inputMode="numeric"
                  value={item.qty ?? ''}
                  onChange={(event) => updateItem(index, { qty: event.target.value ? parseIntegerInput(event.target.value) : null })}
                />
                <input aria-label={copy.item} value={item.name} onChange={(event) => updateItem(index, { name: event.target.value })} />
                <input
                  aria-label={copy.amount}
                  inputMode="numeric"
                  value={item.amount ?? ''}
                  onChange={(event) => updateItem(index, { amount: event.target.value ? parseIntegerInput(event.target.value) : null })}
                />
                <button
                  type="button"
                  className="x"
                  aria-label={copy.removeItem}
                  onClick={() => {
                    const items = draft.items.filter((_, i) => i !== index)
                    const priced = items.filter((item) => item.name.trim() && item.amount != null)
                    const total = draft.totalTouched || !priced.length ? draft.total : priced.reduce((sum, item) => sum + (item.amount ?? 0), 0)
                    onChange({ ...draft, items, total, dirty: true })
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-btn"
              onClick={() => patch({ items: [...draft.items, { qty: null, name: '', amount: null }] })}
            >
              {copy.addItem}
            </button>
            <label className="field">
              <span>{copy.total}</span>
              <input
                inputMode="numeric"
                data-testid="field-total"
                value={draft.total ? String(draft.total) : ''}
                onChange={(event) => patch({ total: parseIntegerInput(event.target.value), totalTouched: true })}
              />
            </label>
            <label className="field">
              <span>{copy.paid}</span>
              <input
                inputMode="numeric"
                data-testid="field-paid"
                value={draft.paid ? String(draft.paid) : ''}
                onChange={(event) => patch({ paid: parseIntegerInput(event.target.value) })}
              />
            </label>
          </>
        )}
        <div className="sheet-actions">
          <button type="button" className="btn line" onClick={onClose}>
            {copy.cancel}
          </button>
          <button type="submit" className="btn primary" data-testid="save" disabled={!canSave}>
            {copy.save}
          </button>
        </div>
      </form>
    </div>
  )
}

export function PaySheet(props: {
  copy: Copy
  amount: number
  balance: number
  onAmount: (amount: number) => void
  onClose: () => void
  onSave: () => void
}) {
  const { copy, amount, balance, onAmount, onClose, onSave } = props
  return (
    <div className="backdrop" onClick={onClose} role="presentation">
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (amount > 0) onSave()
        }}
      >
        <h2>{copy.payment}</h2>
        <label className="field">
          <span>{copy.paymentAmount}</span>
          <input
            autoFocus
            inputMode="numeric"
            data-testid="pay-amount"
            value={amount ? String(amount) : ''}
            onChange={(event) => onAmount(parseIntegerInput(event.target.value))}
          />
        </label>
        {balance > 0 ? (
          <button type="button" className="text-btn" onClick={() => onAmount(balance)}>
            {copy.full} · {formatFcfa(balance)}
          </button>
        ) : null}
        <div className="sheet-actions">
          <button type="button" className="btn line" onClick={onClose}>
            {copy.cancel}
          </button>
          <button type="submit" className="btn primary" data-testid="save-payment" disabled={amount <= 0}>
            {copy.notePayment}
          </button>
        </div>
      </form>
    </div>
  )
}

export function ShopSheet(props: { copy: Copy; name: string; onName: (name: string) => void; onClose: () => void }) {
  const { copy, name, onName, onClose } = props
  return (
    <div className="backdrop" onClick={onClose} role="presentation">
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          onClose()
        }}
      >
        <h2>{copy.shop}</h2>
        <label className="field">
          <span>{copy.shopName}</span>
          <input value={name} onChange={(event) => onName(event.target.value)} />
          <span className="hint">{copy.shopHint}</span>
        </label>
        <button type="submit" className="btn primary">
          {copy.close}
        </button>
      </form>
    </div>
  )
}
