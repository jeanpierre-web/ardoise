import { useRef, useState } from 'react'
import type { Copy } from '../lib/i18n'
import type { Lang } from '../lib/types'
import { MicIcon } from './Icons'

export function Composer(props: {
  lang: Lang
  copy: Copy
  value: string
  onChange: (value: string) => void
  onRead: () => void
}) {
  const { lang, copy, value, onChange, onRead } = props
  const [listening, setListening] = useState(false)
  const [noSpeech, setNoSpeech] = useState(false)
  const recRef = useRef<SpeechRecognitionLike | null>(null)

  function stop() {
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
  }

  function dictate() {
    if (listening) {
      stop()
      return
    }
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      setNoSpeech(true)
      return
    }
    try {
      const rec = new Ctor()
      rec.lang = lang === 'fr' ? 'fr-FR' : 'en-US'
      rec.interimResults = true
      rec.continuous = false
      rec.onresult = (event) => {
        let text = ''
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          text += event.results[i][0].transcript
        }
        if (text.trim()) onChange(text.trim())
      }
      rec.onerror = () => stop()
      rec.onend = () => {
        recRef.current = null
        setListening(false)
      }
      recRef.current = rec
      rec.start()
      setListening(true)
      setNoSpeech(false)
    } catch {
      setNoSpeech(true)
      setListening(false)
    }
  }

  return (
    <form
      className="dock"
      onSubmit={(event) => {
        event.preventDefault()
        onRead()
      }}
    >
      <label>
        <span className="composer-label">{copy.sentence}</span>
        <textarea
          data-testid="composer"
          value={value}
          placeholder={copy.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {listening ? <p className="hint">{copy.listening}</p> : null}
      {noSpeech ? <p className="hint">{copy.noSpeech}</p> : null}
      <div className="actions">
        <button type="button" className="btn line" onClick={dictate} aria-pressed={listening}>
          <MicIcon />
          {listening ? copy.stop : copy.dictate}
        </button>
        <button type="submit" className="btn primary" data-testid="read" disabled={!value.trim()}>
          {copy.read}
        </button>
      </div>
    </form>
  )
}
