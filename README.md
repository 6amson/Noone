# Noone — Corporate Gifting Agent API

## Role preference and problem statement

**Role preference:** AI Solutions Engineer / Forward-Deployed Engineer.

Noone is a Lagos-based corporate gifting company that sells curated, multi-recipient gift packages to HR managers, office managers, and founders. The WhatsApp agent turns a messy gifting brief into a validated order, an invoice, a Paystack payment, and a receipt, while grounding package choices in the internal catalogue and enforcing deposit and delivery-cutoff rules. It is worth paying for because it removes the manual quote and order admin behind every corporate gifting order and gives the customer's finance team a clean record. I deliberately left out real-time inventory, rider tracking, refunds or cancellations after payment, and card handling; payment collection is owned by the agent platform via Paystack.

## What this is

A NestJS API that backs a WhatsApp gifting agent. The customer-facing agent, Nora, is built and runs on Chord; this repo is the API/tool layer. The agent owns the conversation, catalogue lookup, Paystack payment, and customer messaging. This service owns the order record, invoice calculations, payment confirmation, and PDF documents.

It is deployed at [https://noone-seven.vercel.app](https://noone-seven.vercel.app).

### Flow

1. The agent collects the brief and customer email.
2. The agent calls `POST /orders` with the selected catalogue items.
3. The API returns invoice data: line items, subtotal, delivery fee, deposit, total due now, balance, delivery date, and notes.
4. The agent initializes a Paystack transaction for `totalDueNow * 100` kobo and sends the authorization URL.
5. After payment, the agent verifies the transaction and calls `POST /orders/{id}/confirm` with the Paystack reference.
6. The API returns receipt data. Invoice and receipt PDFs are available at the PDF endpoints, but the current Chord agent cannot stream or attach files, so Nora sends the details as text.

The API never creates or returns payment links and never handles card details. The Paystack secret key lives in the agent platform, not here.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/orders` | Create a pending order and return invoice data |
| `GET` | `/orders?email=...` | List a customer's orders, newest first |
| `GET` | `/orders/{id}/invoice.pdf` | Download the invoice PDF |
| `POST` | `/orders/{id}/confirm` | Confirm a Paystack payment; returns receipt data |
| `GET` | `/orders/{id}/receipt.pdf` | Download the receipt PDF (paid orders only) |

`POST /orders` requires `customerEmail` and at least one item. `confirm` requires `paymentReference`. An unpaid receipt request returns `400`.

### OpenAPI and docs

- Spec: [`noone-openapi.json`](./noone-openapi.json)
- Live spec: [https://noone-seven.vercel.app/api-json](https://noone-seven.vercel.app/api-json)
- Swagger UI: [https://noone-seven.vercel.app/api](https://noone-seven.vercel.app/api)

## Agent skills

The agent instructions that define tone, business rules, catalogue usage, and the end-to-end workflow are in [`business_skills/`](./business_skills/):

- `business_context.md` — who Noone is and what success looks like
- `business_constraints.md` — non-negotiable business rules
- `business_packages.md` — catalogue source and reference
- `business_workflow.md` — the step-by-step conversation flow

These skills are already uploaded to the Chord agent **Nora**. The API is the tool layer; this repo copy is the source of truth if the skills need updating or re-uploading.

## Submission constraints

This submission uses Paystack test keys and made-up customer data only. No live payment keys, real customer data, or personal phone numbers are connected.

## AI tools used

I used OpenCode with DeepSeek V4.1 Flash Free as an AI coding assistant for implementation support: scaffolding and refactoring the NestJS endpoints, tracing the Vercel/pdfkit PDF failure, drafting the OpenAPI spec and documentation, and reviewing the business workflow. I ran the tests, local compiled checks, and live deployment checks myself. AI was not used to fabricate test results or customer data.

## Assessment notes

- [Deployment field notes](./docs/deployment-field-notes.md)
- [Go-live note](./docs/go-live-note.md)

## Run locally

```bash
npm install
npm run start:dev
```

The API runs on `http://localhost:3000`; Swagger is at `http://localhost:3000/api`.

Useful commands:

```bash
npm run build          # compile to dist/
npm run start:prod     # run the compiled app
npm test               # run the Jest suite
npx tsc --noEmit       # type-check
```

No environment variables are required for the API. Paystack keys belong to the agent/connector.

## Deployment

The repo is configured for Vercel with the NestJS preset (`vercel.json`). Push to `main` and Vercel builds and deploys the app. Swagger UI assets are loaded from jsDelivr so they work in the serverless environment.

## Current limitations

- Orders live in an in-memory `Map`. A Vercel cold start or a different instance loses them. For production, move the store to a durable Redis-backed store such as Upstash Redis.
- The API can generate invoice and receipt PDFs, but the current Chord agent cannot stream or attach file responses. Nora delivers the invoice and receipt as text; the PDF endpoints are ready for a channel or integration that supports attachments.
- The service does not send emails or WhatsApp messages; the agent platform does.
- The service does not verify Paystack transactions itself; the agent verifies before calling `confirm`.
- Refunds, cancellations after payment, rider tracking, and live inventory are out of scope.
