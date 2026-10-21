---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

The session could not pause for a live learner. Mechanical checks and a browser pass stand in for the hands-on checkpoints. The owner still needs to try the phone build before submitting.

## Slices

- [x] **1. A sentence becomes a debt line you can check**
  Becomes usable: Type the demo sentence, see Kofi, the total, what was paid, and what is left, and note it into a list.
  Why now: This is the kernel. Scaffolding lives inside this slice so the first running screen already reads a sentence.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Reading a sentence`
  Spec ref: `spec.md > Sentence reader`, `spec.md > Screen`
  Build: Scaffold Vite, React, TypeScript, and Tailwind. Implement `parseEntry`, the composer, the reading sheet, and an in-memory customer list.
  Verify (mechanical): `npm test` covers the demo sentence and the amount formats. The dev server starts.
  Learner check: Open the app, read "Kofi a pris 2 sacs de riz 15000, payé 5000", and confirm the sheet shows 10 000 F CFA still due before save.
  Commit: `Read a sentence into a debt line`

- [x] **2. The notebook, the history, and the reminder**
  Becomes usable: Lines survive a reload. A customer has a history and a payment. One tap opens a polite WhatsApp draft in French or English.
  Why now: The kernel is visible. Persistence and the reminder are the rest of the loop a judge can follow.
  PRD ref: `prd.md > The notebook`, `prd.md > History and payments`, `prd.md > WhatsApp reminder`, `prd.md > Language`
  Spec ref: `spec.md > Notebook store`, `spec.md > Reminder link`, `spec.md > Data Model`
  Build: localStorage, customer detail, payment, wa.me link, FR/EN copy, shop name.
  Verify (mechanical): Ledger and reminder tests pass. A browser script reloads and checks the balance and the link.
  Learner check: Save Kofi, reload, open him, note a payment, switch to English, and open the reminder link without sending it.
  Commit: `Keep the notebook and open a WhatsApp reminder`

- [x] **3. Offline shell, optional re-reading, and the public build**
  Becomes usable: After one load, the page can open offline. A browser model or a build-time key can re-read a sentence. The site can be published from GitHub Actions.
  Why now: The loop already works. These keep the demo free and openable without cloning.
  PRD ref: `prd.md > States and Boundaries`, `prd.md > Reading a sentence`
  Spec ref: `spec.md > Optional re-reading`, `spec.md > Offline shell`, `spec.md > Where It Runs and How Someone Tries It`
  Build: PWA, `maybeRefine`, Pages workflow, icons, README and docs.
  Verify (mechanical): `npm test` and `npm run build` succeed. The built page is exercised at 390px.
  Learner check: On a phone-width screen, run the core journey against the preview build.
  Commit: `Ship the offline page and the Pages workflow`

## Hands-on Checkpoints

- [x] Early usable behavior explored — slice 1, agent browser pass (no live learner in this session)
- [x] Final kick-the-tires exploration and feedback completed — agent browser pass of the core journey at 390px, including reload, both languages, payment, and offline reload. The owner has not done this pass yet.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

Agent result, not a learner sign-off: `npm test` passed (13 tests). `scripts/smoke.mjs` against `vite preview` at 390×844 passed, including the demo sentence (due 10000), reload, the French and English `wa.me` text, a full payment, and an offline reload. Screenshots are in `docs/screenshots/`. No product change came out of that pass beyond the column labels on the item row and a darker brass for the small “Example” label, so the contrast clears 4.5:1.

## Code Tour and App Map

- [x] Learning activity complete — reference recap, not a live tour. No learner was in the session.
- [x] Optional edit and transfer reflection addressed — not applicable. There was no learner to offer the edit or the reflection to. Personal answers were not invented.
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: reference recap tied to `prd.md > Reading a sentence` and `src/lib/parseEntry.test.ts`. The grouped-amount failure (15 instead of 15000) is the evidence. The fix is the thousands-separator protection in `parseEntry`.
Route and stops: reference only — `src/App.tsx` `readSentence` / `saveDraft`, `src/lib/parseEntry.ts` `parseEntry`, `src/lib/storage.ts` `saveLedger`. Not walked live.
Edit outcome: not applicable
Reflection: not offered — no learner in the session. Nothing personal was written into this public file.
Activity mode: reference recap

## Revisions

- Thousand separators are protected before the sentence is split on commas — `15,000` was read as 15 because the comma was treated as a gap between items. The demo sentence’s acceptance test is what showed it.
- Item amount columns got visible labels (qty, item, amount) after the 390px pass, and the small “Example” label moved from brass `#8C6A2F` (contrast 4.35 on paper) to `#6A4E16`.
- The owner asked for a less generic screen. The surface is now the slate (charcoal, chalk wordmark, terracotta only for what is still owed). A labelled example shop loads in one tap. The sentence is marked as it is typed. Overdue customers sort first. The WhatsApp reminder opens a preview. Motion respects `prefers-reduced-motion`.
