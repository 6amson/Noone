# Go-Live Note — Noone

**What Nora does**

Nora is the WhatsApp assistant for Noone's corporate gifting orders. She helps HR managers, office managers, and founders choose packages, collects the brief and customer email, creates the invoice, sends the Paystack payment link, confirms payment, and returns the receipt details. She applies the 50% deposit rule for orders of ₦150,000 or more and the 3pm delivery cutoff.

**What she does not do**

Nora does not take card details, process payments, issue refunds, cancel paid orders, track riders, or check live inventory. Paystack owns payment collection. She does not send PDF attachments in the current Chord channel; invoices and receipts are delivered as text, although the API can generate PDFs for an attachment-capable integration.

**Before real customers**

1. Put live Paystack keys in the agent platform, not the repo, and run a live test transaction.
2. Connect the business WhatsApp number and confirm message templates, opt-in, and human handoff.
3. Replace the in-memory order store with durable storage (Upstash Redis) and add idempotency for create and confirm.
4. Add Paystack webhook verification and a daily reconciliation process for failed, abandoned, or duplicate payments.
5. Assign the operations lead for API and payment alerts, and finance for reconciliation exceptions. Define who handles complaints and custom quotes.
6. Agree refund, cancellation, data-retention, and customer-data policies before launch.
7. Pilot with a small set of real orders and reconcile the results against finance before full rollout.

**Known limitation**

PDF delivery is not available through the current Chord agent. Customers receive invoice and receipt text; PDFs are available from the API for email or WhatsApp integrations that support attachments. If PDF delivery is a launch requirement, add that integration first.
