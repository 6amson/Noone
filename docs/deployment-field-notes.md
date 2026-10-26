# Deployment Field Notes

All testing used Paystack test keys and made-up order data. No live payment keys, real customer data, or personal phone numbers were connected.

## 1. Chord could not stream or attach the generated PDFs

**What happened**

The API could generate invoice and receipt PDFs, but in the Chord simulator Nora could not stream or attach them to the conversation. The customer received text only.

**How I found the cause**

I tested the tool responses in the simulator and compared the API response (`application/pdf`) with what the agent could deliver. The current Chord agent runtime does not expose file or binary tool responses as attachments; it can call the endpoint but cannot pass the bytes through to WhatsApp.

**Workaround**

Nora sends the invoice and receipt fields as text. The workflow and README state this explicitly, and the PDF endpoints remain in the OpenAPI spec for channels or integrations that can fetch attachments. The demo does not claim that Nora attaches a PDF.

**What I would change in Chord**

Add first-class file/attachment support to Chord tool responses, with documented size/type limits and a way to attach a PDF to a WhatsApp reply. Until then, Chord docs should clearly state that binary tool responses are not deliverable and show the recommended text fallback.

## 2. Invoice and receipt PDFs returned 500 on Vercel

**What happened**

Both PDF endpoints worked locally and returned `%PDF`, but on Vercel they returned HTTP 500 with a generic JSON error.

**How I found the cause**

I traced the deployed entrypoint with `@vercel/nft`:

```bash
npx @vercel/nft print dist/main.js
```

The trace included `node_modules/pdfkit/js/pdfkit.js` but not `node_modules/pdfkit/js/standard-fonts/Helvetica.cjs` or its chunk. pdfkit 0.20 loads standard fonts through a dynamic `createRequire` call (`require$1('#standard-fonts/Helvetica')`), which the tracer did not follow. I reproduced the failure locally by renaming `node_modules/pdfkit/js/standard-fonts`; the exact error was:

```text
Error: Cannot find module '.../node_modules/pdfkit/js/standard-fonts/Helvetica.cjs'
code: 'MODULE_NOT_FOUND'
```

**Fix**

Added a static require in `src/utils/pdf.service.ts`:

```ts
require('pdfkit/standard-fonts/Helvetica');
```

This forces the tracer to include the font module and its chunk. I re-ran the trace, confirmed both files were present, redeployed, and verified live invoice and receipt responses: `200 application/pdf`, body starting with `%PDF`.

**What I would change**

Vercel/nft should follow package `imports` and dynamic `createRequire` calls inside dependencies. pdfkit should document serverless bundling. In Chord docs, add a note that PDF/binary tools need their runtime assets explicitly traced, with a working serverless PDF example.

## 3. OpenAPI import is file-based and lacks sync/type visibility

**What happened**

The initial spec was enough for Swagger locally, but it was not a stable connector contract: it had no `operationId`s, so generated tool names were ambiguous. Chord also imports a JSON file rather than a live URL; a live deployment did not refresh the connector, and the imported API's generated types were not visible enough to verify the tool contract.

**How I found the cause**

I compared `/api-json` with the tool list in Chord and re-imported the spec after changes. `operationId` is a standard OpenAPI 3.x property, not a Chord-specific field; it is the stable operation name a connector maps to a tool. The missing operationIds were our gap. The file-only import and lack of auto-sync/type visibility were Chord's side of the problem.

**Fix**

Added standard `operationId`s (`createOrder`, `listOrders`, `getInvoicePdf`, `getReceiptPdf`, `confirmPayment`), the production server URL, response DTO schemas, binary PDF responses, and required fields (`customerEmail`, `paymentReference`). Regenerated `noone-openapi.json` and re-imported it manually after changes.

**What I would change in Chord**

- Support importing from the live OpenAPI URL, with a manual refresh or a deploy-triggered refresh.
- Show the generated tool schemas, required fields, and response types after import so builders can verify what the agent will call.
- Validate and warn on missing or duplicate `operationId`s.
- Document that `operationId` is the standard OpenAPI field used for stable tool names.

## 4. `confirmPayment` returned 201 while the spec promised 200

**What happened**

A test expected `200` from `POST /orders/{id}/confirm`, but Nest returned `201 Created` because POST defaults to 201. The OpenAPI response said `200`.

**How I found the cause**

The failing Jest assertion showed:

```text
expected 200 "OK", got 201 "Created"
```

The controller had no `@HttpCode(200)`.

**Fix**

Added `@HttpCode(200)` and kept the test and spec aligned. The suite now passes with 6 tests.

**What I would change in Chord**

Chord should validate success codes against the OpenAPI response and warn when the runtime returns a different 2xx. Docs should call out that 2xx variants are not interchangeable for tool contracts.

## 5. In-memory orders are not safe across Vercel instances

**What happened**

Orders are stored in a process-local `Map`. Vercel can cold-start a function or route consecutive requests to different instances, so a create/confirm/list sequence can lose state or return `404 Order not found`.

**How I found the cause**

The implementation used an in-memory `Map`; Vercel's serverless model does not guarantee instance affinity. I confirmed the risk while testing the create/confirm/PDF flow and kept the demo on a warm instance.

**Workaround**

Kept in-memory storage for the exercise and documented the limitation. For production, use a durable Redis-backed store such as Upstash Redis: `order:<id>` JSON, `email:<email>:orders` sorted set, `INCR orders:nextId`, TTLs, and idempotency keys for create and confirm.

**What I would change in Chord**

Chord docs should flag multi-step stateful tools on serverless and recommend external state plus idempotency. A sample Redis-backed connector would make this much faster to get right.

## 6. The API initially returned a mock payment link, blurring ownership

**What happened**

The invoice included a fake `paymentLink`, which implied the API owned payment collection. The intended architecture is that the Chord agent owns Paystack and the API only records orders and confirmation.

**How I found the cause**

I traced the agent flow end to end: the agent initializes Paystack, sends the authorization URL, verifies the transaction, then confirms. A tool-owned link duplicated that responsibility and would have hidden the real integration.

**Fix**

Removed `paymentLink` from invoice data and docs. Added `confirmPayment` with a required Paystack `paymentReference`. Documented that the API never creates or returns payment links and never handles card details.

**What I would change in Chord**

Chord docs should include a reference pattern for "agent owns payment provider, tool owns order record," and warn against mock payment links in connector specs.

## 7. The Paystack connector has no webhook or payment-event trigger

**What happened**

The Paystack connector can initialize and verify transactions, but it does not expose a webhook or event subscription that Chord can consume. When a customer pays, the agent is not notified. The working path is for the customer to return to WhatsApp and say they paid; the agent then verifies the transaction and calls our `confirmPayment` tool before sending the receipt.

**How I found the cause**

I mapped the payment flow against the connector's available tools. There is no event registration or webhook trigger in the connector, and Chord has no generic payment-event trigger in this setup. Confirmation is therefore request/response, initiated by the customer's message.

**Workaround**

Use inline confirmation:

1. The customer says they have paid.
2. The agent calls Paystack verify with the reference.
3. The agent checks that the status is successful, the amount and currency match the invoice, and the reference belongs to the order.
4. The agent calls `POST /orders/{id}/confirm` with the reference.
5. The agent sends the receipt fields.

This is the demo flow. It works, but it depends on the customer returning to chat and is not proactive.

**What I would change in Chord**

Add webhook/event subscriptions to the Paystack connector, or a generic webhook trigger the agent can subscribe to. Include the order reference, amount, currency, status, and signature; verify signatures, retry failed deliveries, and make handlers idempotent. Document failed and abandoned payment events. If webhooks are not possible, expose a status/polling tool so the agent can check pending payments without waiting for the customer.

## 8. Swagger UI did not render on Vercel

**What happened**

The deployed Swagger page loaded, but its UI assets were missing, so the page was blank and unusable.

**How I found the cause**

The NestJS Swagger setup relied on `swagger-ui-dist` static assets that were not available from the serverless deployment. The browser requested them and received 404s.

**Fix**

Configured Swagger to load its JavaScript and CSS from jsDelivr (`swagger-ui-dist@5.17.14`) in `src/main.ts`, which works from the serverless runtime.

**What I would change in Chord**

Chord docs should include a serverless API docs recipe, or recommend hosting Swagger as a static page. Vercel's NestJS guide should mention the static-asset caveat.

## What I would build with more time

- Move the order store to Upstash Redis and make create and confirm idempotent.
- Add a Paystack webhook receiver with signature verification and failed/abandoned payment handling.
- Deliver PDFs through email or an attachment-capable WhatsApp integration.
- Add auth, rate limiting, structured logs, and alerts for 5xx errors and payment failures.
- Expand tests around delivery cutoff, deposit boundaries, duplicate payments, and invalid dates.
