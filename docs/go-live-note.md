# Go-Live Note — Noone

**Current status:** Nora is a working demo in test mode: no live payments, real WhatsApp number, or customer data yet.

**What Nora does:** Nora is Noone's WhatsApp assistant for corporate gifting orders. She helps HR managers, office managers, and founders choose a package, collects the brief and customer email, creates an invoice, shares the Paystack payment link, confirms payment, and sends the receipt details. She applies the 50% deposit rule for orders of ₦150,000 or more and the 3pm delivery cutoff.

**What she does not do:** Nora does not take card details, process payments, issue refunds, cancel paid orders, track riders, or check live inventory. Paystack handles payment. She also does not send PDF attachments yet; invoices and receipts are sent as text.

**Before real customers:**

1. Connect Noone's live Paystack account and run one end-to-end test payment.
2. Connect Noone's business WhatsApp number and approve message templates, opt-in, and staff handoff.
3. Store orders permanently so they are not lost when the service restarts, and prevent duplicate orders or confirmations.
4. Set up automatic payment notifications and a daily check for failed, abandoned, or duplicate payments; until then, staff must confirm each payment.
5. Name the person responsible for monitoring the agent and payments, and the finance contact for reconciliation and customer complaints.
6. Agree refund, cancellation, data-retention, and customer-data policies.
7. Run a small pilot with real orders, reconcile it against finance, and fix any issues before full rollout.

**Main limitation:** Nora cannot send PDF invoices or receipts in the current WhatsApp setup, and she relies on the customer returning to chat to confirm payment. If PDFs or automatic payment follow-up are required at launch, add those first.
