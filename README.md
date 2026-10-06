# sprayfoam-bid-mvp

Spray-foam bid calculator MVP: messy measurements to branded PDF bid, plus homeowner instant-quote widget (working name; branding TBD).

**Spray Foam Bid Builder (working name)** is a phone-first web app (installable PWA) that turns a cut-up jobsite measurement into a branded spray-foam proposal. It also includes a homeowner instant-quote widget that prices from the same price book.

> **Demo build.** No login, no billing, no server. All data stays in the browser's localStorage. Prices, yields, and the $49/mo price are **sample / working numbers**, not final. The name is a working name.

- **Live demo:** https://joshuaread.github.io/sprayfoam-bid-mvp/
- **Widget demo site:** https://joshuaread.github.io/sprayfoam-bid-mvp/demo-site/
- **Plan / scope source of truth:** [`docs/PLAN.md`](docs/PLAN.md) (sections 2 and 4)

## What's in the demo

| Area | What works |
|---|---|
| Price book | Open cell / closed cell / coating / primer products: set price, set size, rated yield (bf/set), field-yield factor, waste %. Labor as crew x hourly rate x bf/hr production, or a flat $/bf. Trip charge, mileage, minimum job. Pricing mode: cost-plus margin (price = cost / (1 - margin)) or a per-inch price ladder ($/sq ft by foam type and thickness). Seeded with labeled sample numbers. |
| Estimate builder | Area builders: walls minus openings (segments with mixed heights; doors, windows, garage doors as count x W x H), gable ends, roof deck by pitch (3/12 to 12/12 + custom), attic floor / list of rectangles, Quonset / arch (+ end walls minus openings), metal building preset (walls + gables + roof by pitch), rim joist, freeform sq ft. Each area takes multiple layers (product + inches; coatings by coats). Sticky live totals bar with sq ft, board feet, sets (decimal and rounded up per product), material, labor, trip, min job, coatings, total cost, price, margin $ and %, and $/sq ft. Min-job floor applied automatically with a visible note. |
| Calc engine | Pure TypeScript in `src/lib/engine/` (no React). Vitest tests for every shape, the sets formula, margin mode, ladder mode, min job, coatings, labor, and the widget range. `engine_version` is stored on every estimate's totals. |
| PDFs (client-side, jsPDF) | Branded customer proposal (logo, brand color, contractor info incl. license #, customer/job, scope by area with foam type/thickness/sq ft/optional R-value text, price, terms, validity date, acceptance/signature lines, disclaimer). Internal cost sheet (every input, each area's formula and parts, board feet, sets formula, costs, margin). |
| Records | Customers, estimate history (search, duplicate, save as new version, status). The price book is **snapshotted** onto each estimate, so later price-book edits don't change old estimates ("refresh from price book" is an explicit action). |
| Widget | `public/widget.js` (one `<script>` tag) renders an iframe inside shadow DOM, so host CSS can't break it. Flow: project type, approx sq ft (with "help me estimate"), foam preference (OC / CC / not sure), price **range** from the price book +/- a configurable band, min job applied. Gated/ungated toggle. Lead form with name, phone, email, ZIP, consent checkbox, and a honeypot. Leads land in the in-app Leads inbox with "convert to estimate". Contractor email is **stubbed** ("would email contractor at ..."). |
| Widget setup | Project types + assumed thickness, band %, gated/ungated, colors, consent text, copy-snippet button (absolute Pages URL), live preview. |
| PWA | Web manifest + service worker that work under the `/sprayfoam-bid-mvp` basePath. PNG icons (192/512) are generated at build time by `scripts/gen-icons.mjs` (no binary files committed). |
| Stubs | Demo-mode banner, pricing page ($49/mo, "working price - not final"), disabled checkout and email buttons. |

## Run locally

Requires Node 20+.

```bash
npm ci
npm test          # Vitest unit tests for the calc engine
npm run dev       # http://localhost:3000 (no basePath in dev)
npm run build     # static export to out/ (basePath /sprayfoam-bid-mvp)
```

To preview the production build exactly as GitHub Pages serves it:

```bash
npm run build
rm -rf /tmp/site && mkdir -p /tmp/site && cp -r out /tmp/site/sprayfoam-bid-mvp
cd /tmp/site && python3 -m http.server 8080
# open http://localhost:8080/sprayfoam-bid-mvp/
```

In dev, the widget demo page is at http://localhost:3000/demo-site/index.html.

## Deploy

`.github/workflows/deploy.yml` runs on push to `main` (and manual `workflow_dispatch`): `npm ci`, `npm test`, `npm run build`, then `actions/configure-pages`, `actions/upload-pages-artifact` (path `out`), and `actions/deploy-pages`. Pages source must be set to **GitHub Actions** (it is). `next.config.mjs` sets `output: 'export'`, `trailingSlash: true`, `images.unoptimized`, and basePath/assetPrefix `/sprayfoam-bid-mvp` in production (override with `PAGES_BASE_PATH`).

## 60-second demo walkthrough (for Josh)

1. **(0:00) Home.** Open the live URL on a phone. Point out the yellow DEMO banner, then tap **Price book**: sample OC/CC/coating products with yield, field-yield factor, and waste; labor; trip; $1,500 min job; margin vs per-inch ladder. "Every contractor puts in their own numbers once."
2. **(0:10) New estimate.** Type a customer name. Tap **Walls minus openings**: two segments at different heights; tap **+ Segment** for a 12 ft wall, **+ Garage door**. Show the formula line updating.
3. **(0:20) Two layers.** On the wall, tap **+ Add layer**: set layer 1 to closed cell 1" (flash coat), layer 2 to open cell 3.5". Board feet and sets update per layer.
4. **(0:30) More areas.** Add **Roof deck by pitch** and change the pitch to 8/12. Add **Rim joist** (closed cell 2"). Tap the dark totals bar to expand: sq ft, board feet, sets (decimal + sets to order), material, labor, trip, min job, cost, price, margin, $/sq ft.
5. **(0:40) Proposal.** Tap **Customer proposal PDF** (branded, scope by area, signature line, disclaimer), then **Internal cost sheet PDF** (every formula and input). Logo, color, license #, and terms come from **Settings**.
6. **(0:50) Widget.** Open **Widget**, show the snippet and live preview, then open the **demo site**: pick Attic, 1,200 sq ft, Open cell, and get an instant range. Submit the lead form.
7. **(0:58) Leads.** Open **Leads**: the lead is there with "would email contractor" status. Tap **Convert to estimate**.

## What's stubbed (not real in this demo)

- **Auth:** no login, magic links, users, or roles. Single local "company".
- **Billing:** no Stripe Checkout, trial, coupons, or customer portal. The pricing page is a placeholder ($49/mo, working price - not final).
- **Email:** `src/lib/email/` has an `EmailAdapter` interface with a `StubEmailAdapter` that writes "would email" entries to a local outbox. No email is ever sent. Resend (server-side) goes behind the same interface later.
- **Database:** `src/lib/storage/` has a `StorageAdapter` interface with a `LocalStorageAdapter`. Data lives only in this browser. Supabase (Postgres + RLS per org) goes behind the same interface later.
- **Server-side quote API:** the widget computes the range in the browser from the price book saved in the same origin's localStorage. On a real third-party contractor site this needs a `/api/widget/quote` endpoint with a public widget key (browsers partition third-party iframe storage, so the iframe would not see the contractor's price book or share leads with the app).
- **Spam controls:** honeypot is real; per-IP / per-key rate limiting and the allowed-domains list are not implemented (need the server).
- **Proposal sending:** no email-to-customer or share links; status (draft/sent/accepted/lost) is set manually.
- **Onboarding wizard, Crew users, good/better/best, offline drafts (IndexedDB), e-sign/deposits, SMS:** not built.
- **Sample data:** all seeded prices, yields, ladder rows, and the demo company/contact info are placeholders.

## Code map

```
src/lib/engine/      pure TS calc engine (types, geometry, calc, quote range, sample price book) + tests
src/lib/storage/     StorageAdapter interface + LocalStorageAdapter (swap: Supabase)
src/lib/email/       EmailAdapter interface + StubEmailAdapter (swap: Resend)
src/lib/pdf/         jsPDF customer proposal + internal cost sheet (loaded on demand)
src/app/             pages: dashboard, estimate builder, estimates, customers, leads, price book, widget setup, settings, pricing, embed
src/components/      AppShell, AreaEditor, TotalsBar, WidgetFlow, UI helpers
public/widget.js     embeddable loader (shadow DOM + iframe)
public/demo-site/    DEMO host page with the widget embedded
public/sw.js, public/manifest.webmanifest, scripts/gen-icons.mjs   PWA
```

## Disclaimer

Planning aid only. Contractor verifies measurements, product data sheets, code requirements, and final price.
