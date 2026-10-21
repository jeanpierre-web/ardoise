# Devpost submission draft — Ardoise

Draft for the project owner to review. Do not submit this file as-is if a sentence is not how you want to say it. Nothing here has been sent to Devpost.

The rules page does not publish the form’s character limits. Counts below are of the answer text only, in characters, including spaces. Trim a field if the form rejects it.

Suggested links, not part of the counts:

- GitHub: https://github.com/jeanpierre-web/ardoise
- Live demo: https://jeanpierre-web.github.io/ardoise/
- Demo video: record from `docs/demo-script.md`, publish on YouTube or Vimeo, public, under 3 minutes. Paste that URL on the form. There is no video yet.

## Project name

7 characters.

```
Ardoise
```

## Tagline

105 characters.

```
The credit notebook for small shops: one sentence in, a clear balance and a polite WhatsApp reminder out.
```

## Inspiration

282 characters.

```
In Lomé and across West Africa, small shopkeepers sell on credit. A customer says to put it on the slate, and the debt goes into a paper notebook. The notebook gets lost, and asking a neighbor to pay feels awkward. Ardoise is a proof of concept for that moment. It has no users yet.
```

## What it does

753 characters.

```
Ardoise is a mobile web notebook for one shop. The first screen can load a labelled example shop in one tap, and that sample can be cleared. The shopkeeper types or dictates one sentence in French or English, such as "Kofi a pris 2 sacs de riz 15000, payé 5000". As they type, the customer, the items, the total, and what was paid are marked, and a card shows what is still due. They can correct the fields, then save. Each customer has a running balance and a history. Overdue names sit first. Noting a payment lowers the balance until the account is settled. One tap opens a preview of a polite French or English reminder, then WhatsApp, and the shopkeeper sends it. There is no login. After the page has loaded once, the notebook still opens offline.
```

## How we built it

517 characters.

```
The repository started empty, apart from an MIT license. The Devpost Learn Skill Pack was installed with npx skills add challengepost/learn-ai-basics --all -y, and scope.md, prd.md, and spec.md were written from the brief before the interface. The app is Vite, React, and TypeScript. Tests cover the sentence reader, the live highlights, the example shop, the overdue sort, the balances, and the WhatsApp link. A browser check at 390 pixels walks the loop, including the example shop, a reload, and an offline reload.
```

## Challenges we ran into

552 characters.

```
The demo had to read French and English money with no paid API key and no large model download. A model big enough to trust would be a heavy file on a phone in Lomé, so the reader that always runs is a tested set of rules. A browser on-device model is used only when that browser already has one. A connected model runs only if three environment variables are set at build time, and the public site is built without them. A comma is both a thousands mark and a gap between items, so amounts like 15,000 had to be protected before the sentence is split.
```

## Accomplishments that we're proud of

378 characters.

```
The loop works on a phone-width screen: an example shop you can clear, a sentence that lights up as it is read, a correction sheet, a saved balance, a history, a payment that settles the account, and a WhatsApp preview in French or English. The notebook survives a reload. After one visit it still opens offline. No account, no server, and no paid key are required for the demo.
```

## What we learned

293 characters.

```
Writing the one sentence we cared about as a check, before polishing the screen, made the reader easy to fix. A grouped amount first came back as 15 instead of 15000, and the test showed it. Cutting accounts, automatic sending, and a required AI key kept the proof of concept to a single loop.
```

## What's next

200 characters.

```
A backup file, so a new phone does not mean a lost notebook. The project owner still records the public demo video and submits the project. Ardoise has no users yet, and this text does not invent any.
```

## Built with

283 characters.

```
React, TypeScript, Vite, Tailwind CSS, Vitest, Cursor, Devpost Learn Skill Pack, GitHub Pages, browser localStorage, WhatsApp click-to-chat links. Optional, not used by the public demo: the browser LanguageModel API, and an OpenAI-compatible chat API when a key is set at build time.
```

Try these as separate Devpost tags if the form wants a list: React, TypeScript, Vite, Tailwind CSS, Cursor, GitHub Pages.
