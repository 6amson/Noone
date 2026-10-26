# Go-Live Note — Noone

**Current submission:** This demo uses Paystack test keys and made-up customer data only. No live keys, real customer data, or personal phone numbers are connected.

**What Nora does:** Nora is Noone's WhatsApp gifting assistant. She helps HR managers, office managers, and founders choose packages, collects the brief and customer email, creates the invoice, sends the Paystack payment link, confirms payment, and returns the receipt details. She applies the 50% deposit rule for orders of ₦150,000 or more and the 3pm delivery cutoff.

**What she does not do:** Nora does not take card details, process payments, issue refunds, cancel paid orders, track riders, or check live inventory. Paystack owns payment collection. She does not send PDF attachments in the current Chord channel; invoices and receipts are text, though the API can generate PDFs for an attachment-capable integration.

**Before real customers:**

1. Replace the Paystack test keys with live keys only at launch and run a live test transaction.
2. Connect the business WhatsApp number and confirm templates, opt-in, and human handoff.
3. Move orders from the in-memory store to Upstash Redis and add idempotency for create and confirm.
4. Add Paystack webhook verification and daily reconciliation for failed, abandoned, or duplicate payments. Until webhooks exist in the connector, keep inline verify-before-confirm and handle customers who never return.
5. Assign operations for API/payment alerts and finance for reconciliation. Define who handles complaints and custom quotes.
6. Agree refund, cancellation, data-retention, and customer-data policies.
7. Pilot with a small set of real orders and reconcile against finance before rollout.

**Known limitation:** PDF delivery is unavailable through the current Chord agent. Payment confirmation also depends on the customer returning to chat. If PDFs or proactive receipts are launch requirements, add an attachment-capable channel and a webhook/payment-event trigger first.
