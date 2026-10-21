import { useEffect, useRef, useState } from 'react'
import { Composer } from './components/Composer'
import { CustomerList } from './components/CustomerList'
import { CustomerView } from './components/CustomerView'
import { Header } from './components/Header'
import { PaySheet, ReadSheet, ShopSheet, type Draft } from './components/Sheets'
import { t } from './lib/i18n'
import { addEntry, balanceOf, entriesFor, removeEntry, setShopName, sortedCustomers, stillDue } from './lib/ledger'
import { formatFcfa } from './lib/money'
import { parseEntry } from './lib/parseEntry'
import { deviceModelPresent, maybeRefine, modelConfigured } from './lib/refine'
import { reminderText, whatsappHref } from './lib/reminder'
import { loadLang, loadLedger, saveLang, saveLedger } from './lib/storage'
import type { Lang, Ledger, ParsedEntry, ReaderKind } from './lib/types'

function readHash(): string | null {
  if (typeof location === 'undefined') return null
  return new URLSearchParams(location.hash.replace(/^#/, '')).get('c')
}

function draftFrom(parsed: ParsedEntry, book: Ledger, reader: ReaderKind): Draft {
  const existing = parsed.customer ? book.customers.find((customer) => customer.name.toLocaleLowerCase('fr') === parsed.customer.toLocaleLowerCase('fr')) : undefined
  return {
    customer: parsed.customer,
    phone: existing?.phone ?? '',
    items: parsed.kind === 'payment' ? [] : parsed.items.length ? parsed.items : [{ qty: null, name: '', amount: null }],
    total: parsed.total,
    paid: parsed.paid,
    raw: parsed.note,
    kind: parsed.kind,
    warnings: parsed.warnings,
    reader,
    checking: false,
    dirty: false,
    totalTouched: false,
  }
}

export function App() {
  const [ledger, setLedger] = useState<Ledger>(() => loadLedger())
  const [lang, setLang] = useState<Lang>(() => loadLang())
  const [sentence, setSentence] = useState('')
  const [openId, setOpenId] = useState<string | null>(() => readHash())
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pay, setPay] = useState<{ amount: number } | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [offline, setOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false))
  const [undo, setUndo] = useState<Ledger | null>(null)
  const undoTimer = useRef(0)
  const ledgerRef = useRef(ledger)
  const refinedRaw = useRef<string | null>(null)
  ledgerRef.current = ledger
  const copy = t(lang)

  useEffect(() => {
    saveLedger(ledger)
  }, [ledger])

  useEffect(() => {
    saveLang(lang)
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    const online = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    const onPop = () => setOpenId(readHash())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!draft) {
      refinedRaw.current = null
      return
    }
    if (draft.dirty || draft.reader !== 'rules' || refinedRaw.current === draft.raw) return
    if (!modelConfigured() && !deviceModelPresent()) return
    let cancel = false
    const raw = draft.raw
    refinedRaw.current = raw
    setDraft((current) => (current && current.raw === raw ? { ...current, checking: true } : current))
    maybeRefine(raw)
      .then((result) => {
        if (cancel || !result) return
        setDraft((current) => {
          if (!current || current.raw !== raw || current.dirty) return current
          return draftFrom(result.entry, ledgerRef.current, result.reader)
        })
      })
      .finally(() => {
        if (!cancel) {
          setDraft((current) => (current && current.raw === raw && current.reader === 'rules' ? { ...current, checking: false } : current))
        }
      })
    return () => {
      cancel = true
    }
  }, [draft])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setDraft(null)
      setPay(null)
      setShopOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const customer = ledger.customers.find((item) => item.id === openId) ?? null
  const customers = sortedCustomers(ledger)
  const balance = customer ? balanceOf(ledger, customer.id) : 0
  const slateAmount = formatFcfa(customer ? balance : stillDue(ledger))
  const slateLabel = customer
    ? balance > 0
      ? copy.dueLabel
      : balance < 0
        ? copy.aheadLabel
        : copy.settledLabel
    : copy.still

  function openCustomer(id: string) {
    const url = `${location.pathname}${location.search}#c=${encodeURIComponent(id)}`
    history.pushState({ customerId: id }, '', url)
    setOpenId(id)
  }

  function closeCustomer() {
    if (history.state && typeof history.state === 'object' && 'customerId' in history.state) history.back()
    else {
      history.replaceState(null, '', `${location.pathname}${location.search}`)
      setOpenId(null)
    }
  }

  function readSentence() {
    const parsed = parseEntry(sentence)
    if (parsed.warnings.includes('empty')) return
    setDraft(draftFrom(parsed, ledger, 'rules'))
  }

  function saveDraft() {
    if (!draft || !draft.customer.trim()) return
    const items = draft.items.map((item) => ({ ...item, name: item.name.trim() })).filter((item) => item.name)
    const kind = draft.kind === 'payment' || (draft.total === 0 && draft.paid > 0) ? 'payment' : 'credit'
    if (kind === 'payment' ? draft.paid <= 0 : draft.total <= 0) return
    setLedger(
      addEntry(ledger, {
        customer: draft.customer,
        phone: draft.phone,
        items: kind === 'payment' ? [] : items,
        total: kind === 'payment' ? 0 : draft.total,
        paid: draft.paid,
        raw: draft.raw,
        kind,
      }),
    )
    setDraft(null)
    setSentence('')
  }

  function savePayment() {
    if (!customer || !pay || pay.amount <= 0) return
    setLedger(
      addEntry(ledger, {
        customer: customer.name,
        phone: customer.phone,
        items: [],
        total: 0,
        paid: pay.amount,
        raw: '',
        kind: 'payment',
      }),
    )
    setPay(null)
  }

  function remove(entryId: string) {
    const previous = ledger
    const next = removeEntry(ledger, entryId)
    setUndo(previous)
    setLedger(next)
    if (openId && !next.customers.some((item) => item.id === openId)) closeCustomer()
    window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setUndo(null), 6000)
  }

  const reminderHref = customer
    ? whatsappHref(
        customer.phone,
        reminderText({ lang, customer: customer.name, shopName: ledger.shopName, amount: Math.max(0, balance) }),
      )
    : ''

  return (
    <div className="app">
      <Header
        lang={lang}
        copy={copy}
        onLang={setLang}
        title={customer?.name ?? 'Ardoise'}
        amount={slateAmount}
        label={slateLabel}
        onBack={customer ? closeCustomer : undefined}
        onShop={customer ? undefined : () => setShopOpen(true)}
      />
      <main className="main">
        {offline ? <p className="offline">{copy.offline}</p> : null}
        {customer ? (
          <CustomerView lang={lang} copy={copy} entries={entriesFor(ledger, customer.id)} onRemove={remove} />
        ) : (
          <CustomerList
            ledger={ledger}
            copy={copy}
            customers={customers}
            onOpen={openCustomer}
            onExample={(example) => {
              setSentence(example)
              document.querySelector<HTMLTextAreaElement>('[data-testid="composer"]')?.focus()
            }}
          />
        )}
      </main>
      {customer ? (
        <div className="dock">
          <div className="pair">
            <button type="button" className="btn line" data-testid="payment" onClick={() => setPay({ amount: balance > 0 ? balance : 0 })}>
              {copy.payment}
            </button>
            {balance > 0 ? (
              <a className="btn primary" data-testid="remind" href={reminderHref}>
                {copy.remind}
              </a>
            ) : (
              <button type="button" className="btn primary" disabled>
                {copy.remindOff}
              </button>
            )}
          </div>
          {balance > 0 ? <p className="hint">{copy.remindNote}</p> : null}
        </div>
      ) : (
        <Composer lang={lang} copy={copy} value={sentence} onChange={setSentence} onRead={readSentence} />
      )}
      {draft ? <ReadSheet copy={copy} draft={draft} onChange={setDraft} onClose={() => setDraft(null)} onSave={saveDraft} /> : null}
      {pay && customer ? (
        <PaySheet
          copy={copy}
          amount={pay.amount}
          balance={balance}
          onAmount={(amount) => setPay({ amount })}
          onClose={() => setPay(null)}
          onSave={savePayment}
        />
      ) : null}
      {shopOpen ? (
        <ShopSheet
          copy={copy}
          name={ledger.shopName}
          onName={(name) => setLedger(setShopName(ledger, name))}
          onClose={() => setShopOpen(false)}
        />
      ) : null}
      {undo ? (
        <div className="toast" role="status">
          <span>{copy.removed}</span>
          <button
            type="button"
            onClick={() => {
              setLedger(undo)
              setUndo(null)
            }}
          >
            {copy.undo}
          </button>
        </div>
      ) : null}
    </div>
  )
}
