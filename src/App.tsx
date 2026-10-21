import { useEffect, useRef, useState } from 'react'
import { Composer } from './components/Composer'
import { CustomerList } from './components/CustomerList'
import { CustomerView } from './components/CustomerView'
import { Header } from './components/Header'
import { ParsedCard, type FieldFix } from './components/ParsedCard'
import { PaySheet, ReadSheet, RemindSheet, ShopSheet, type Draft } from './components/Sheets'
import { exampleLedger } from './lib/exampleShop'
import { t } from './lib/i18n'
import { addEntry, balanceOf, clearExample, entriesFor, overdueCount, removeEntry, setShopName, sortedCustomers, stillDue } from './lib/ledger'
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
  const existing = parsed.customer
    ? book.customers.find((customer) => customer.name.toLocaleLowerCase('fr') === parsed.customer.toLocaleLowerCase('fr'))
    : undefined
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
    confidence: parsed.confidence,
  }
}

function addedId(previous: Ledger, next: Ledger): string | null {
  const before = new Set(previous.entries.map((entry) => entry.id))
  return next.entries.find((entry) => !before.has(entry.id))?.id ?? null
}

export function App() {
  const [ledger, setLedger] = useState<Ledger>(() => loadLedger())
  const [lang, setLang] = useState<Lang>(() => loadLang())
  const [sentence, setSentence] = useState('')
  const [fix, setFix] = useState<FieldFix | null>(null)
  const [openId, setOpenId] = useState<string | null>(() => readHash())
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pay, setPay] = useState<{ amount: number } | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [remindOpen, setRemindOpen] = useState(false)
  const [offline, setOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false))
  const [undo, setUndo] = useState<Ledger | null>(null)
  const [freshId, setFreshId] = useState<string | null>(null)
  const undoTimer = useRef(0)
  const ledgerRef = useRef(ledger)
  const refinedRaw = useRef<string | null>(null)
  const nowRef = useRef(new Date())
  ledgerRef.current = ledger
  const copy = t(lang)
  const parsed = parseEntry(sentence)

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
      setRemindOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const customer = ledger.customers.find((item) => item.id === openId) ?? null
  const customers = sortedCustomers(ledger, nowRef.current)
  const balance = customer ? balanceOf(ledger, customer.id) : 0
  const homeDue = stillDue(ledger)
  const late = overdueCount(ledger, nowRef.current)
  const headerValue = customer ? balance : homeDue
  const tone = customer ? (balance > 0 ? 'due' : 'settled') : homeDue > 0 ? 'due' : 'plain'
  const kicker = customer
    ? balance > 0
      ? copy.dueLabel
      : balance < 0
        ? copy.aheadLabel
        : copy.settledLabel
    : copy.still
  const meta = customer
    ? ''
    : customers.length
      ? `${customers.length} ${copy.customers}${late ? ` · ${late} ${copy.overdueInline}` : ''}`
      : ''

  function openCustomer(id: string) {
    setRemindOpen(false)
    const url = `${location.pathname}${location.search}#c=${encodeURIComponent(id)}`
    history.pushState({ customerId: id }, '', url)
    setOpenId(id)
  }

  function closeCustomer() {
    setRemindOpen(false)
    if (history.state && typeof history.state === 'object' && 'customerId' in history.state) history.back()
    else {
      history.replaceState(null, '', `${location.pathname}${location.search}`)
      setOpenId(null)
    }
  }

  function readSentence() {
    const reading = parseEntry(sentence)
    if (reading.warnings.includes('empty')) return
    const next = draftFrom(reading, ledger, 'rules')
    if (fix) {
      const changed = fix.customer !== reading.customer || fix.total !== reading.total || fix.paid !== reading.paid
      next.customer = fix.customer
      next.total = fix.total
      next.paid = fix.paid
      if (fix.total !== reading.total) next.totalTouched = true
      if (changed) next.dirty = true
    }
    setDraft(next)
  }

  function commit(next: Ledger) {
    setFreshId(addedId(ledger, next))
    setLedger(next)
  }

  function saveDraft() {
    if (!draft || !draft.customer.trim()) return
    const items = draft.items.map((item) => ({ ...item, name: item.name.trim() })).filter((item) => item.name)
    const kind = draft.kind === 'payment' || (draft.total === 0 && draft.paid > 0) ? 'payment' : 'credit'
    if (kind === 'payment' ? draft.paid <= 0 : draft.total <= 0) return
    commit(
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
    setFix(null)
  }

  function savePayment() {
    if (!customer || !pay || pay.amount <= 0) return
    commit(
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

  const reminder = customer
    ? reminderText({ lang, customer: customer.name, shopName: ledger.shopName, amount: Math.max(0, balance) })
    : ''
  const reminderHref = customer ? whatsappHref(customer.phone, reminder) : ''
  const showCard = !customer && !parsed.warnings.includes('empty')

  return (
    <div className="app">
      <Header
        lang={lang}
        copy={copy}
        onLang={setLang}
        title={customer?.name ?? 'Ardoise'}
        value={headerValue}
        tone={tone}
        kicker={kicker}
        meta={meta}
        shopLabel={ledger.shopName}
        onBack={customer ? closeCustomer : undefined}
        onShop={customer ? undefined : () => setShopOpen(true)}
      />
      <main className="main">
        {offline ? <p className="offline">{copy.offline}</p> : null}
        {customer ? (
          <CustomerView
            lang={lang}
            copy={copy}
            entries={entriesFor(ledger, customer.id)}
            freshId={freshId}
            settled={balance === 0}
            onRemove={remove}
          />
        ) : (
          <>
            {showCard ? (
              <ParsedCard copy={copy} parsed={parsed} fix={fix} onFix={setFix} />
            ) : (
              <CustomerList
                ledger={ledger}
                copy={copy}
                customers={customers}
                freshId={freshId}
                now={nowRef.current}
                onOpen={openCustomer}
                onExample={(example) => {
                  setFix(null)
                  setSentence(example)
                  document.querySelector<HTMLTextAreaElement>('[data-testid="composer"]')?.focus()
                }}
                onTryShop={() => {
                  setSentence('')
                  setFix(null)
                  setFreshId(null)
                  setLedger(exampleLedger())
                }}
                onReset={() => {
                  setFreshId(null)
                  setLedger(clearExample(ledger))
                }}
              />
            )}
          </>
        )}
      </main>
      {customer ? (
        <div className="dock">
          <div className="pair">
            <button type="button" className="btn line" data-testid="payment" onClick={() => setPay({ amount: balance > 0 ? balance : 0 })}>
              {copy.payment}
            </button>
            {balance > 0 ? (
              <button type="button" className="btn primary" data-testid="remind" onClick={() => setRemindOpen(true)}>
                {copy.remind}
              </button>
            ) : (
              <button type="button" className="btn primary" disabled>
                {copy.remindOff}
              </button>
            )}
          </div>
        </div>
      ) : (
        <Composer lang={lang} copy={copy} value={sentence} spans={parsed.spans} onChange={(value) => { setFix(null); setSentence(value) }} onRead={readSentence} />
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
      {remindOpen && customer ? (
        <RemindSheet
          copy={copy}
          customer={customer.name}
          amountLabel={formatFcfa(Math.max(0, balance))}
          text={reminder}
          href={reminderHref}
          onClose={() => setRemindOpen(false)}
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
