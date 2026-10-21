---
doc: spec
status: approved
---

# Ardoise — Technical Spec

## How This Works, In Plain Language
Ardoise is one website that runs on the shopkeeper's phone. There is no account and no server we operate.

The page has four pieces:

- The **screen**, written in React, shows the slate, the customer list, the sentence box, and the customer page.
- The **reader** takes one sentence and returns a customer, items, a total, what was paid, and what is left. The reader that always runs is a set of rules in the project (`parseEntry`). It does not call anyone and does not download a model. If the browser itself offers a local language model, or if someone built the site with an optional key, a second reading can update the sheet.
- The **notebook** is `localStorage`: a sticky note the browser keeps for this site. Reload tomorrow and the same phone still has the lines.
- The **reminder** is a link. `https://wa.me/?text=` opens WhatsApp with the message filled in. Ardoise does not talk to WhatsApp's servers and does not send the message.

This shape is enough because the proof is one person, one phone, one loop. A database, a login, and a required model would add accounts and failure modes without making the sentence any clearer.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. The shopkeeper opens the page. React starts, reads `localStorage`, and draws the slate and the list. The first time, the note is empty, so the list is empty.
2. They type a sentence and tap read. `parseEntry` runs in the browser and returns the structured line. The sheet shows it. Nothing is stored yet.
3. If a local browser model or an optional key exists, the page asks it for JSON and, if the shopkeeper has not started editing, replaces the fields. If that call fails, the rule reading stays.
4. They tap note. The app adds or reuses a customer and appends an entry, then writes the whole notebook back to `localStorage`. The list redraws, highest balance first.
5. They reload. The page reads the same note and shows Kofi again.
6. They open Kofi. The screen filters entries for that customer and sums total minus paid.
7. They note a payment. A new entry with a paid amount and no sale is appended. The sum drops.
8. They tap the reminder. The app builds the French or English text and opens a `wa.me` link. WhatsApp, if it is installed, shows the draft.

## Stack
- TypeScript and React 19 — the screen. https://react.dev/
- Vite  — dev server and the static build. https://vite.dev/
- Tailwind CSS 4 — layout reset and tokens, with the visual design in project CSS. https://tailwindcss.com/
- Vitest — tests for the reader, the notebook math, and the reminder link. https://vitest.dev/
- vite-plugin-pwa — caches the page so a later visit works offline. https://vite-pwa-org.netlify.app/
- Atkinson Hyperlegible and Fragment Mono, via Fontsource, bundled with the page so the fonts are not a second service. https://fontsource.org/

The brief named Vite, React, TypeScript, and Tailwind. Those were kept. The tradeoff is a front-end-only app: easy to put on GitHub Pages, no private data on a server, and the notebook dies if the browser storage is cleared.

## Where It Runs and How Someone Tries It
It runs in a mobile browser. Node.js is only needed to build it. No API key is required.

Local demo:

```
npm install
npm test
npm run dev
```

Open the URL Vite prints. For a phone-width pass, use a 390px-wide viewport.

Production build:

```
npm run build
npm run preview
```

GitHub Pages build sets `GITHUB_PAGES=true` so asset paths use `/ardoise/`. The workflow is `.github/workflows/pages.yml`. The public site is meant to be `https://jeanpierre-web.github.io/ardoise/`.

Submission still requires a short demo video and the public GitHub repository. The live URL does not replace the video.

Optional connected model, local builds only: copy `.env.example` to `.env.local` and set `VITE_LLM_BASE_URL`, `VITE_LLM_API_KEY`, and `VITE_LLM_MODEL`. The Pages build does not set them.

## Look and Feel
Carried from `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`.

- Page `#EFEDE6`, cards `#FFFCF8`, plum text `#45132F`, muted plum `#6A3A52`, hairline `#EADFEA`.
- Pink `#FBB2F0` for the primary pill and the empty-state block. Soft pink `#FBDDF6` for chips and avatars. Aqua `#C9F1F6` for the total-owed / overdue tile. A settled account uses a plum block with a white inner card and pink line-art circles.
- Type: Manrope only. Amounts are large, tight, and split from the small “F CFA” label. No italic word treatment.
- Density: 16px page padding, 44px minimum targets, 48px primary pills, balance figures from 34px in the stats tile to 56px on a customer. Motion stays under half a second and is disabled for `prefers-reduced-motion`.
- Copy tone: short, polite, concrete. French uses apostrophes and shop language ("sur l'ardoise", "Noter").
- Tailwind can express these tokens. It cannot replace them with its default indigo, dark surfaces, or large rounded cards.

## Components

### Sentence reader
`parseEntry` in `src/lib/parseEntry.ts`. Pure function. Finds a paid amount after payé / paid / versé and similar words, a customer name before a verb or a colon, item chunks with a quantity and a price, and an FCFA integer total. Returns a warning list when the name or the amount is missing, and character spans (`src/lib/highlights.ts`) for the customer, the items, the paid amount, and a remaining amount when that number is in the sentence.
PRD ref: `prd.md > Reading a sentence`.

### Optional re-reading
`src/lib/refine.ts`. After the rule reading, `maybeRefine` looks for the browser `LanguageModel` API (a local model, no key) and, only if the env vars are present, for an OpenAI-style chat completions endpoint. It expects JSON. Failure leaves the rule reading in place. The demo never waits on it.
PRD ref: `prd.md > Reading a sentence`.

### Notebook store
`src/lib/storage.ts` reads and writes one JSON object, including the example-shop flag. `src/lib/ledger.ts` adds a credit, adds a payment, removes a line, sums a customer, and sums what is still due. It sorts overdue customers first: a positive balance whose oldest credit is at least 7 days old. `src/lib/exampleShop.ts` builds the labelled sample. `clearExample` removes those sample customers and keeps anyone added by hand.
PRD ref: `prd.md > The notebook`, `prd.md > History and payments`.

### Screen
`src/App.tsx` and the components under `src/components/`. Header slate, customer rows, composer, reading sheet, customer history, shop name sheet. Language strings live in `src/lib/i18n.ts`.
PRD ref: `prd.md > Screens and Layout`, `prd.md > Language`.

### Reminder link
`src/lib/reminder.ts` builds the French or English text and the `wa.me` URL. A phone number is included only when it has at least 8 digits.
PRD ref: `prd.md > WhatsApp reminder`.

### Offline shell
The PWA plugin emits a service worker that caches the built files. The notebook data is not in that cache. It is in `localStorage`.
PRD ref: `prd.md > States and Boundaries`.

## Data Model
One object under the key `ardoise.ledger.v1`:

```
{
  version: 1,
  shopName: string,
  customers: [{ id, name, phone, createdAt }],
  entries: [{
    id, customerId, createdAt, raw, kind: "credit" | "payment",
    items: [{ qty, name, amount }],
    total, paid
  }]
}
```

Amounts are integer FCFA. A customer's balance is the sum of `total - paid` on their entries. A payment is an entry with `kind: "payment"`, `total: 0`, and `paid` set to the money received. Language is a separate key, `ardoise.lang`. Leaving and coming back reads these keys. Clearing site data removes them. There is no other copy.

## File Structure

```
ardoise/
├── index.html
├── package.json
├── vite.config.ts
├── .env.example
├── .github/workflows/pages.yml
├── public/
│   ├── favicon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/        # slate, list, composer, sheet, customer, shop
│   └── lib/
│       ├── parseEntry.ts  # the on-phone reader
│       ├── refine.ts      # optional local or connected re-reading
│       ├── ledger.ts      # balances and edits
│       ├── storage.ts     # localStorage
│       ├── reminder.ts    # wa.me text
│       └── i18n.ts
├── devpost/               # scope, prd, spec, checklist, app map
├── docs/                  # submission draft, demo script, screenshots
└── LICENSE
```

## External Services and Dependencies
- **WhatsApp, via a link only.** The page sets `window.location` or an anchor to `https://wa.me/<digits>?text=<encoded>` or `https://wa.me/?text=<encoded>` when there is no number. No token. Documentation: https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat
- **Browser speech recognition,** when present (`SpeechRecognition` / `webkitSpeechRecognition`). No key. Unavailable browsers keep typing.
- **Browser LanguageModel,** when present. No key. This is Chrome's on-device prompt API where the browser has enabled it. If `availability()` is not `"available"`, Ardoise skips it.
- **Optional chat completions.** Only if `VITE_LLM_BASE_URL`, `VITE_LLM_API_KEY`, and optionally `VITE_LLM_MODEL` are set. `POST {base}/chat/completions` with `Authorization: Bearer` and a JSON body `{ model, messages, temperature: 0 }`. Cost and rate limits are whatever that provider charges the key owner. The public demo is built with the variables empty, so this call is absent.
- **GitHub Pages.** Static hosting for the built `dist/` folder. Free for a public repository. No runtime secrets.
- **Fontsource packages.** Fonts are files in the build, not a font CDN at runtime.

## Important Failure Modes
- **The sentence is ambiguous** → the sheet shows the best reading and a warning. Save is refused without a customer and an amount. The shopkeeper edits the fields.
- **No on-device model and no key** → the rule reader still fills the sheet. The demo sentence does not depend on a model.
- **The connected model is slow or returns junk** → an eight-second timeout, then the rule reading remains.
- **WhatsApp is not installed** → the link still opens. On desktop it opens WhatsApp Web if they use it. The message is visible in the link either way.
- **Storage is unavailable or corrupt** → the page starts from an empty notebook instead of crashing.
- **Offline on the very first visit** → the page cannot load. After one successful load, the service worker serves it.

## What Was Simplified and Why
- **A rule reader on the phone** instead of a required downloaded language model — a model large enough to read French and English reliably is a heavy download on mobile data, and the demo must work with no key. The fuller version would ship a small offline model once its size and accuracy are known. The optional browser model and the optional key are the door for that, not the path the demo stands on.
- **localStorage** instead of an account and a database — the proof is one phone. A sync service would need a login, which scope cut.
- **A wa.me link** instead of the WhatsApp Business API — no application, no template approval, no sending on the shopkeeper's behalf.
- **No backup file** — deferred in the PRD. The risk is a cleared browser. It is named, not hidden.
- **No sample shop** — sample people would look like users. The app has none.

## Decisions and Open Issues
- Stack: Vite, React, TypeScript, Tailwind, as the brief asked. Tradeoff accepted: a static site, logic in the browser.
- Where it runs: a phone browser, deployed on GitHub Pages so a judge can open it without cloning. The video is still required.
- Reader: rules first. The brief's open choice was "free in-browser model, otherwise a robust parser, optional key." The uncertainty was whether a free in-browser model would be reliable on a low-end phone. What clarified it: the public demo cannot download a large model or require a key, so `parseEntry` is tested against the demo sentence and is the reading that must succeed. `LanguageModel` is used when the browser already has a local model. A connected model runs only when the three env vars are set. Evidence is `src/lib/parseEntry.test.ts` and the absence of those vars in the Pages workflow.
- No live planning interview took place. The written brief and the build request are the source of the product decisions above. Implementation details (file names, the exact palette, the rule reader) were derived from those decisions, not attributed to a conversation that did not happen.
- Carried from `prd.md > Open Questions`: the owner still records the video, confirms GitHub Pages is enabled, and submits on Devpost. Nothing here is blocked on those.
