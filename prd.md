---
doc: prd
status: approved
---

# Ardoise — Product Requirements

A mobile web credit notebook for a small shopkeeper in Togo. One sentence becomes a confirmed debt line, a balance per customer, and a polite WhatsApp reminder.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > The POC Boundary`.

## The Core Journey
1. The shopkeeper opens Ardoise. The notebook is empty the first time. A short line says everything stays on this phone. The slate at the top shows how much is still owed, which is zero.
2. They type or dictate a sentence in French or English, for example "Kofi a pris 2 sacs de riz 15000, payé 5000".
3. They tap to read the sentence. A sheet shows the customer, the items, the total, what was paid, and what is still due. They can fix any field before it is saved.
4. They note it. Kofi appears in the list with 10 000 F CFA still due.
5. They leave the site and come back. Kofi is still there.
6. They open Kofi and see the history. They can note a payment received, which lowers the balance.
7. They tap the WhatsApp reminder. WhatsApp opens with a polite message, in the language currently selected, naming Kofi and the amount still due. Nothing is sent until they send it.
8. They can switch the whole screen between French and English. The reminder follows that choice.

## Screens and Layout
Two surfaces, plus two sheets. No extra screens.

- **Notebook.** The whole screen is the slate: the name Ardoise, the French/English switch, the shop name, and the total still owed in large figures, with a count of customers and how many are overdue. Customers are rows with initials. Overdue names come first. An empty notebook offers one tap that loads a labelled example shop, and a reset that removes that sample. Three example sentences only fill the box. They do not save themselves. At the bottom, a sentence box that marks the parts it has read, a dictate button, and "Read the sentence". A card of the reading appears while typing. The fields can be corrected before saving.
- **Customer.** The same slate, now with a way back, the customer's name, and the balance in large figures. A settled account shows a cleared state. Under it, the history. At the thumb: "Payment received" and "WhatsApp reminder", which opens a preview of the message before WhatsApp.
- **Reading sheet.** Slides up over the notebook after a sentence is read. Editable customer, optional WhatsApp number, item lines, paid, and the remaining amount. "Note" saves. "Cancel" drops it.
- **Shop sheet.** From the slate, a place to set the shop name used in the reminder. Nothing else.

Movement: the notebook is home. A row opens the customer. Back returns. The reading sheet and the shop sheet close without leaving the notebook.

## Look and Feel
From the brief: warm, premium, not generic, big touch targets, readable in a shop, French and English labels.

Direction used for the build, because no separate visual study was available (Mobbin needed a paid plan; Refero needed a sign-in):

- A warm cream page. Content sits in large rounded cards. Pink is the accent and the empty-state block. Plum is the text and the settled block. An aqua tile shows total owed and overdue.
- Manrope for everything. Amounts are the largest type, with “F CFA” as a small label. Primary actions are pink pills. French and English sit in a dark segmented toggle.
- Touch targets at least 44px, primary controls 48px. Motion is short, and it turns off when the device asks for reduced motion. Amounts are the loudest text on the customer screen.
- Tone of the copy: plain and polite. No startup slogans. The French should sound like a person at the counter, not a translation of a dashboard.

## Features and Behavior

### Reading a sentence
What the shopkeeper can do: type or dictate one sentence, then see a structured reading before anything is saved.
Source: `scope.md > The Unique Kernel`.

- As a shopkeeper, I want one sentence to become a customer, items, a total, an amount paid, and a balance, so that I do not fill a form at the counter.
  - [ ] "Kofi a pris 2 sacs de riz 15000, payé 5000" shows customer Kofi, total 15 000, paid 5 000, due 10 000, before save.
  - [ ] An English sentence of the same shape is read the same way.
  - [ ] Amounts with spaces or thousand separators (15 000, 15.000, 5,000) are read as FCFA integers.
  - [ ] The shopkeeper can change the name, the items, the total, and the paid amount before saving.
  - [ ] If the name or the amount is missing, the sheet says to check, and save stays off until a name and an amount exist.
  - [ ] Dictate uses the phone's speech recognition when the browser has it, in the selected language. If it does not, the screen says so and typing still works.
  - [ ] The reading works with no API key. If the browser offers a local model, or a key was set at build time, the sheet may update from that re-reading until the shopkeeper edits a field.

### The notebook
Source: `scope.md > The Core Loop`.

- As a shopkeeper, I want each customer to carry one balance, so that I can see who to talk to.
  - [ ] Saving a line creates the customer or adds to the same name, ignoring capitals.
  - [ ] The list is sorted with the highest amount still due first.
  - [ ] The slate total is the sum of what customers still owe, not a negative mixed with people who paid ahead.
  - [ ] A payment entry lowers that customer's balance.
  - [ ] The first visit has no sample customers.

### History and payments
- As a shopkeeper, I want the lines that made the balance, and a way to note money that came in.
  - [ ] Opening a customer shows each saved line, newest first, with its date.
  - [ ] "Payment received" asks for an amount, offers the full remaining balance, and notes that payment.
  - [ ] A line can be removed, with a short undo.
  - [ ] An optional WhatsApp number can be saved on the customer for the next reminder.

### WhatsApp reminder
Source: `scope.md > The Unique Kernel`.

- As a shopkeeper, I want one tap to open a polite reminder I can still choose to send.
  - [ ] The button opens `https://wa.me/` with the message in the query string.
  - [ ] If a usable number is saved, the link includes it. If not, the message still opens for the shopkeeper to pick the chat.
  - [ ] French and English messages name the customer and the amount still due. The shop name is included only when one was set.
  - [ ] The message is not a demand. The shopkeeper sends it themselves.
  - [ ] The button does not offer a reminder when nothing is due.

### Language
- [ ] FR and EN switch every label on the screen.
- [ ] The reminder uses the language that is selected at the moment of the tap.
- [ ] The choice is remembered on this phone.

## States and Boundaries

- **First use** — empty list, examples that only fill the sentence box, slate at zero, a line that the notebook stays on this phone.
- **Normal use** — customers, balances, history.
- **Empty reading** — an empty sentence does not open the sheet.
- **Unclear sentence** — the sheet still opens if anything was found, with a check warning. If nothing useful was found, save stays off.
- **Paid more than the total** — the entry can show an advance. The customer balance can go below zero and is labeled as an advance, not as debt.
- **Nothing due** — the reminder button explains there is nothing to remind.
- **Offline** — after the page has loaded once, the notebook still opens and still saves. A line says the phone is offline. The first visit needs a network to load the page.
- **Persistence** — customers, lines, shop name, phone numbers, and language survive a reload. There is no account. Clearing the site data clears the notebook.
- **Who can see it** — whoever holds the phone. There is no sharing and no login.
- **Assumption** — amounts are FCFA integers. Centimes are rounded.

## Product Decisions

- One sentence, then a confirmation sheet — the reading will sometimes be wrong, and the shopkeeper must fix it before it hits the notebook. From the brief.
- WhatsApp through a link, not an automatic send — asking for money should stay a human tap. From the brief.
- No login and no server — the proof is one phone, and a lost password would be worse than a notebook. From the brief.
- French and English both in the product — the counter uses both, and the hackathon materials are in English. From the brief.
- No seeded fake customers — the app has no users, and the empty state should not pretend otherwise. From the build request.
- Shop name is optional and local — it makes the reminder sound like the shop, and it is not an account.

## What We're Building
The journey above: read a sentence, confirm, save on the phone, list balances, open a customer, note a payment, open a polite FR/EN WhatsApp reminder, switch language, and keep working after a reload and after the page is cached.

## Deferred From the POC
- Moving the notebook to a new phone — the data is local, and an export would be the next safety net. Out for now so the demo stays the sentence and the reminder.
- More than one shop or one seller — there is no account to hang that on.
- Automatic sending, SMS, or reminders on a schedule — cut in scope, still cut.

## Possible Later Enhancements
A file the shopkeeper can keep as a backup. A second person at the same counter. A end-of-day total that is only today's lines.

## Non-Goals
- A point of sale, inventory, or tax tool — the kernel is the tab.
- Hosted accounts or a database — they do not prove the sentence.
- A paid AI subscription as the price of the demo — forbidden by the build request.
- Pretend usage numbers, testimonials, or a populated sample shop.

## Open Questions
None that block the build. The video, the public Pages setting, and the Devpost form are for the owner after the app runs. They do not change the product.
