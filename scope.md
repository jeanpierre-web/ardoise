---
doc: scope
status: approved
---

# Ardoise

A credit notebook for a small shop: one sentence in, a clear balance and a polite WhatsApp reminder out.

## The Unique Kernel
The shopkeeper speaks a sale the way they already would — "Kofi a pris 2 sacs de riz 15000, payé 5000" — and Ardoise turns that sentence into a debt line they can correct and keep. The awkward part of asking for money becomes a pre-written reminder that opens in WhatsApp, in French or English. Without that sentence and that reminder, this is just another balance list.

## Who It's For
A shopkeeper, market seller, or kiosk owner in Lomé, Togo, who sells on credit and already lives in WhatsApp. Today the debts sit in a paper notebook that gets lost, smudged, or left at home. Asking a neighbor to pay feels rude, so the number stays fuzzy.

## The Core Loop
They open Ardoise on their phone, type or dictate one sentence, check the name and the amounts, and note it. Later they open the customer, see what is still due, and tap once to open a polite reminder in WhatsApp. They come back the next time someone says "mets ça sur mon ardoise," or when they need to see who still owes.

## Inspiration & Identity
The name is the object: an ardoise, the slate and the informal tab. It should feel like a warm, well-made shop notebook used in daylight, with big type and big buttons, not like a generic finance app. French and English sit side by side. The brief asked for warm, premium, and specific. No login, no server, no invented customer base.

## Why This Matters to the Learner
The brief names a daily problem in West African shops: credit is normal, the notebook is fragile, and the reminder is socially hard. The project is a proof of concept for that moment, not a claim that shops are already using it.

## What "Working" Looks Like
On a phone-width screen, with no account and no paid API key: type "Kofi a pris 2 sacs de riz 15000, payé 5000", see Kofi, 15 000 total, 5 000 paid, 10 000 still due, save it, leave and come back, see Kofi's balance, record a payment, and open a wa.me link whose text is a polite French or English reminder with the amount. That is the demo.

## The POC Boundary
One shop, one phone, one notebook. A sentence becomes a structured entry the shopkeeper confirms. Each customer has a balance and a history. A payment lowers the balance. One tap opens WhatsApp with the reminder already written. The language of the screen and of the reminder can be French or English. Data stays in the browser. The reading of the sentence works with no key and no model download. An on-device browser model, or a connected model if a key is present at build time, may re-read the sentence. Neither is required for the demo.

## Later
A backup the shopkeeper can move to a new phone. Several shops. Printing the day's slate. Reminders that suggest a time of day. A shared notebook between two people at the counter.

## Explicitly Cut
- Accounts, passwords, and cloud sync — they add a login before the notebook works, and the proof is a single phone.
- Sending WhatsApp messages automatically — the shopkeeper must still choose to send. The app only opens the draft.
- SMS, push notifications, and scheduled chases — same social moment, much more machinery.
- Inventory, checkout, and a full point of sale — the kernel is the tab, not the shop's stock.
- A required paid or hosted AI key — the demo has to work for free, offline after the page has loaded once.
- Reusing any older shop-app code — the hackathon requires a new project.
