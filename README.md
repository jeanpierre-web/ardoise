# Ardoise

A credit notebook for small shops. The shopkeeper types or dictates one sentence in French or English. Ardoise turns it into a customer, the items, the total, what was paid, and what is still due, in FCFA. One tap opens a polite reminder in WhatsApp. The notebook stays on the phone. There is no account.

**Live demo:** https://jeanpierre-web.github.io/ardoise/

The page is published from `main` by GitHub Actions. If that link 404s, GitHub Pages is not turned on yet. See [Publishing](#publishing).

Built for [Build With AI: Basics](https://learn-ai-basics.devpost.com/). The planning documents are [`devpost/scope.md`](devpost/scope.md), [`devpost/prd.md`](devpost/prd.md), and [`devpost/spec.md`](devpost/spec.md). The same three files are also at the repository root. The license is MIT.

The app has no users yet. The empty notebook is the real first screen.

## Screenshots

Phone width, 390 pixels.

![Empty notebook](docs/screenshots/01-empty.png)

![A sentence read before it is saved](docs/screenshots/02-reading.png)

![Kofi on the slate](docs/screenshots/03-customers.png)

![History and the WhatsApp reminder](docs/screenshots/04-customer.png)

![The same screen in English, after a payment](docs/screenshots/06-settled.png)

## Try it

The demo sentence:

```
Kofi a pris 2 sacs de riz 15000, payé 5000
```

You should see Kofi, a total of 15 000 F CFA, 5 000 paid, and 10 000 still due. Correct anything, then note it. Open Kofi and tap the WhatsApp reminder. You send the message yourself. **FR / EN** switches the labels and the reminder.

Dictation uses the browser’s speech recognition when it exists. Typing always works.

## Run it locally

Node.js 22 and npm.

```
npm install
npm test
npm run dev
```

Open the URL Vite prints. `npm run build` then `npm run preview` serves the production build.

No API key is required. To try a connected model on your own machine, copy `.env.example` to `.env.local` and set `VITE_LLM_BASE_URL`, `VITE_LLM_API_KEY`, and `VITE_LLM_MODEL`. Do not commit the key. The public site is built without those variables.

## How it was built

The repository started empty, with the MIT license. The Devpost Learn Skill Pack was installed with:

```
npx skills add challengepost/learn-ai-basics --all -y
```

The skills live in `.agents/skills`. Their templates are the shape of `devpost/scope.md`, `devpost/prd.md`, and `devpost/spec.md`, which were written from the project brief before the interface. The build checklist is `devpost/checklist.md`. A map of the code is `devpost/app-map.html`.

The app is Vite, React, and TypeScript. Tailwind supplies the reset and the font tokens. The layout is project CSS: paper, a slate band, laterite only for money still owed, Atkinson Hyperlegible for text, Fragment Mono for amounts. References used for that direction were a balance row (name on the left, amount on the right), a balance that is the screen, and a paper ledger. Mobbin’s search needed a paid plan and Refero needed a sign-in, so those libraries were not available while designing.

### The reader

The part that always runs is `parseEntry` in `src/lib/parseEntry.ts`. It is a set of rules for French and English shop sentences. It needs no key, no download, and no network. Unit tests cover the demo sentence, spaced amounts, `15,000` and `15.000`, several items, and a payment on its own.

Two optional re-readings can update the sheet if the shopkeeper has not started editing:

- The browser’s on-device `LanguageModel` API, only when the browser reports that a local model is already available.
- An OpenAI-compatible chat endpoint, only when the three environment variables above are set at build time.

If neither is there, or the call fails, the rule reading stays. The public demo does not depend on them.

Data is one JSON object in `localStorage`. A service worker caches the page so a later visit works offline. The first visit still needs a network to load the site.

## Tests

`npm test` runs Vitest. `scripts/smoke.mjs` opens the preview in Chrome at 390×844, reads the demo sentence, saves it, reloads, checks the WhatsApp link in French and English, notes a payment, and reloads while offline. It needs Playwright and a local Chrome, and it is not part of `npm test`.

## Publishing

`.github/workflows/pages.yml` builds with `GITHUB_PAGES=true` (so assets use `/ardoise/`) and deploys to GitHub Pages on every push to `main`.

If the live URL does not open, the owner needs to turn Pages on once:

1. Open the repository on GitHub.
2. **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

Then re-run the **Deploy GitHub Pages** workflow, or push an empty commit to `main`. The site should appear at https://jeanpierre-web.github.io/ardoise/.

## Hackathon notes

- Submission draft, with character counts: [`docs/devpost-submission.md`](docs/devpost-submission.md)
- Demo video script, under three minutes: [`docs/demo-script.md`](docs/demo-script.md)
- The video is not recorded yet. A live URL does not replace it.
- This repository does not submit anything to Devpost.
