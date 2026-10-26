# Deployment Field Notes

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

## 3. The first OpenAPI spec was not connector-ready

**What happened**

The initial spec was enough for Swagger locally, but it did not give the agent a reliable tool contract. It lacked an explicit server, stable `operationId`s, and useful response and required-field metadata.

**How I found the cause**

I compared `/api-json` with the operations the agent needed and imported the spec into the connector. The tool names and response shapes were ambiguous.

**Fix**

Added `operationId`s (`createOrder`, `listOrders`, `getInvoicePdf`, `getReceiptPdf`, `confirmPayment`), the production server URL, response DTO schemas, binary PDF responses, and required fields (`customerEmail`, `paymentReference`). Regenerated `noone-openapi.json` and verified the live `/api-json`.

**What I would change in Chord**

Chord docs should list the exact OpenAPI fields it consumes and provide a validation checklist before import. The connector UI should show the generated tool list and flag missing `operationId`s or response schemas.

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

Kept in-memory storage for the exercise and documented the limitation. For production, use Upstash Redis via the Vercel Marketplace (Vercel KV is sunset): `order:<id>` JSON, `email:<email>:orders` sorted set, `INCR orders:nextId`, TTLs, and idempotency keys for create and confirm.

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

## 7. Swagger UI did not render on Vercel

**What happened**

The deployed Swagger page loaded, but its UI assets were missing, so the page was blank and unusable.

**How I found the cause**

The NestJS Swagger setup relied on `swagger-ui-dist` static assets that were not available from the serverless deployment. The browser requested them and received 404s.

**Fix**

Configured Swagger to load its JavaScript and CSS from jsDelivr (`swagger-ui-dist@5.17.14`) in `src/main.ts`, which works from the serverless runtime.

**What I would change in Chord**

Chord docs should include a serverless API docs recipe, or recommend hosting Swagger as a static page. Vercel's NestJS guide should mention the static-asset caveat.
