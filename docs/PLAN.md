> **Repo copy note (2026-10-05):** This is a copy of the planning doc used as the source of truth for this demo (sections 2 and 4 define scope and screens). Per the naming rule for this repo, one competitor's product name is replaced with **"Competitor F"** throughout. Nothing else was changed.

# Spray-foam bid calculator: MVP development plan

**Date:** 2026-10-05 (written ~9:00–10:00 PM CT)
**Lane:** Unicorn Hunter side lane. This is the follow-on to `2026-10-05-contractor-microsaas-screen.md` (pick #1, with pick #2 bundled in per the round-2 verdict).
**Status:** Plan only. Unicorn Hunter scouts and plans; it does not build. Nothing here was signed up for, bought, posted, or sent.
**Labels:** **[fact]** = from the screen file or a public page checked today. **[estimate]** = my estimate. **[assumption]** = something Josh needs to confirm. **[proposed target]** = a gate threshold I made up as a starting point, not market data.

---

## 0. One-screen summary

- **Product:** a web app (works as an installable phone PWA) that turns a messy jobsite measurement into a branded spray-foam proposal in about 10 minutes. It includes a homeowner instant-quote widget that prices from the same price book.
- **Price:** Solo at **$49/mo [assumption, Josh's working number]** or $490/yr, with the widget included. Crew tier at $99/mo. Founding partners get **$29/mo**. A free board-foot calculator works as the SEO and lead funnel.
- **Timeline [estimate], assuming a start on Mon Oct 12, 2026:**
  - Week 0 validation: Oct 12–18.
  - Build Weeks 1–5 plus a buffer week: Oct 19 – Nov 29.
  - Design-partner beta: Nov 30 – Jan 8.
  - Public launch: **Mon Jan 11, 2027**. That's about 8 weeks before SprayFoam 2027 in Fort Worth (Mar 6–10, 2027).
- **Cash budget [estimate], excluding builder labor:**
  - About **$0.5K–2.2K** through beta.
  - About **$1.7K–4.6K** through launch + 90 days.
  - Add about **$4K–7K** if Josh takes a 10×10 booth at SprayFoam 2027, or about **$1.3K–2.7K** to attend without a booth.
- **First 3 actions:**
  1. Josh picks the builder (Firstmate's crew or himself) and approves Week 0.
  2. Josh confirms how SPFA list access actually works and books 10 contractor conversations.
  3. Stand up a one-page landing site with a waitlist and run a **$300–500 Meta ad test** aimed at spray-foam contractors.

---

## 1. Product thesis and positioning

**Thesis.** Spray-foam contractors already pay for estimating help. JobPro charged $150/mo in 2012, IDI BIDIT and Competitor F charge $39.99/mo, and Spray Foam Advisor's SPF Profit Engine is $597/mo for SPFA members **[fact]**. But the board-foot math itself is free everywhere: Enverge, Graco, Profoam, the $1.99 Spray Foam Pro app, and many web calculators **[fact]**. The time sink contractors describe is different: turning a cut-up house ("8' 9' 10' 12' 14' and higher walls mixed throughout") into sprayable area, then "compile the bid," usually in Excel **[fact, forum quotes]**. They also want a customer-ready proposal, not just internal numbers **[fact]**.

**Wedge:** *messy measurement → branded proposal, fast, on any phone.* The widget is included, so the same price book also brings in homeowner leads.

| Alternative | What it does well | Where we win | Where we lose |
|---|---|---|---|
| **Excel** (the default) | Free, fully customizable, the contractor trusts their own formulas | Area builders for real shapes (walls minus openings, gables, pitch, Quonset), a branded PDF in one tap, saved history, a widget | It's free and already built. We must import their numbers (price book wizard) and match their totals within about ±2% |
| **Competitor F** ($39.99/mo; iOS, plus Android since Jul 28 2026; web app "in development") **[fact]** | Structure geometry, multi-layer, PDF, Meta ads running | Web-first today (desktop + any phone, no app store), widget included, customer list and history, per-inch price ladder presets from Josh's playbook | They're ahead and already advertising. If their web app ships, "web-first" stops being a difference. Speed matters. |
| **IDI BIDIT** ($39.99/mo billed annually, IDI customers only, "nearly break-even") **[fact]** | Supplier-subsidized, comes with a rep | Works with **any** supplier, monthly option, widget included, measurement speed | Price. A supplier can always undercut. Don't race them to the bottom. |
| **Free calculators** (Enverge, Graco Reactor Connect, web calcs) **[fact]** | Free, good enough for set counts | Proposal output, saved jobs, margin and labor, widget | Contractors who only need set counts will never pay. Fine: they're the SEO funnel, not the target. |
| **Estimate Rocket / SFS ProAPP** (from $139/mo) **[fact]** | Full CRM | About a third of the price, spray-foam-first, faster setup | Bigger feature set |

**Positioning line (draft):** "Measure the messy house, send a branded bid before you leave the driveway, and let your website quote homeowners while you spray."

**Price tension, flagged:** $49/mo sits **above** the $39.99 anchor that two competitors share, and a contractor called $40 "steep" **[fact]**. The case for $49 is the bundled widget: I didn't see a homeowner widget on Competitor F's or BIDIT's public pages in round 2, though I didn't audit their feature sets exhaustively. The annual plan ($490/yr ≈ $40.83/mo) and founding price ($29/mo) give price-sensitive contractors a way in under the anchor. **Decision for Josh** (see §12).

---

## 2. MVP scope

### Must-have (ships in the 5 build weeks)

**Price book (per company, saved)**
- Products: open cell, closed cell, coating, primer, or other. Each product stores set price, set size, theoretical yield (board feet per set), **field-yield factor** (e.g. 0.85 = getting 85% of rated yield), default waste %, and an active flag.
- Labor: crew size, hourly rate, production rate (board feet per hour) or a flat labor rate per board foot.
- Job charges: trip charge, mileage rate (optional), **minimum job**.
- Pricing mode, chosen per company and overridable per estimate:
  - **Cost-plus margin:** target margin %, with price = cost ÷ (1 − margin).
  - **Per-inch price ladder:** price per sq ft by foam type and thickness (e.g. OC 3.5", 5.5"; CC 1", 2", 3"). The ladder is pre-filled from Josh's playbook presets **[assumption: the playbook has ladders]**.
- Coatings: price per sq ft or per gallon, with coverage rate.

**Area builders** (each produces sprayable sq ft; any area can carry several foam layers)
- **Walls minus openings:** perimeter segments × height, with mixed heights allowed, minus doors, windows, and garage doors (count × W × H).
- **Gable ends:** ½ × span × rise, counted × qty.
- **Roof deck by pitch:** footprint × pitch factor √(1 + (rise/12)²). Pick pitch from a list (3/12 … 12/12) or enter custom.
- **Attic floor / flat:** L × W, or a list of rectangles.
- **Quonset / arch building:** arch surface π × r × L (half-cylinder) + end walls (π r² ÷ 2 each, minus openings). Also a **"metal building" preset** (walls + roof by pitch).
- **Rim joist:** linear feet × joist height.
- **Freeform:** enter sq ft directly (escape hatch).
- Every area shows its formula and inputs on the internal cost sheet so a contractor can audit it.

**Calculation outputs (live while editing)**
- Board feet per area and in total (sq ft × inches).
- **Sets** = board feet ÷ (theoretical yield × field-yield factor) × (1 + waste). Shown as a decimal and rounded up.
- Material cost, labor hours and cost, trip and minimums, coatings, **total cost, price, gross margin $ and %**, and price per sq ft.
- Minimum-job floor applied automatically, with a visible note.

**Documents**
- **Branded customer PDF:** logo, colors, contact info and license #, customer and job address, scope by area (foam type, thickness, sq ft, optional R-value text the contractor enters themselves), price (total or by area), optional good/better/best, terms, validity date, signature/acceptance line, and **disclaimer**.
- **Internal cost sheet PDF:** every input, formula, set count, cost, and margin. Never sent to customers.
- Send by email through Resend (with a copy to the contractor) or by share link. Status: draft / sent / accepted / lost (set manually at MVP).

**Records**
- Customer list (manual entries plus widget leads).
- Estimate history: search, duplicate an estimate, revise as v2.
- The price book is **snapshotted** onto each estimate, so later price changes don't rewrite old bids.

**Widget (bundled)**
- One `<script>` snippet the contractor pastes into their site (WordPress, Wix, Squarespace, Shopify custom HTML). It renders in an iframe or shadow DOM so it can't break their CSS.
- Homeowner flow: project type (attic, walls/new build, crawlspace, pole barn/metal building, rim joist, other) → approximate sq ft (with a "help me estimate" helper) → foam preference (OC / CC / not sure) → **price range** (from the contractor's price book ± a configurable band, min job applied).
- **Gated or ungated mode:** show the range before or after asking for contact details. Insulation4You deliberately shows "a number in ten seconds, no form first" **[fact]**.
- Lead capture: name, phone, email, zip, and a consent checkbox → **email to the contractor** + in-app leads inbox + one-click "convert to estimate."
- Spam control: honeypot field, rate limit per IP and widget key, and an allowed-domains list.

**Account and billing**
- Magic-link login. One company per account. Solo = 1 user, Crew = up to 5 users.
- Stripe Checkout + Customer Portal. 14-day trial without a card. Founding coupon. Annual plan.
- First-run onboarding wizard: logo → products → labor → pricing mode → a sample estimate. Goal: under 10 minutes **[proposed target]**.
- Terms, privacy, and the estimate disclaimer shown at signup and printed on the PDF.

### Nice-to-have (only after the beta proves the core)
- **Offline draft capture** (IndexedDB) for no-signal jobsites. *Week 0 interviews decide whether this moves up to must-have.*
- Sketch-on-photo measurement, or tracing a satellite or plan image.
- E-signature and deposit collection on the proposal (Stripe payment link).
- Post-job **actual sets used** logging, so the field-yield factor auto-tunes per product.
- SMS lead alerts (see A2P 10DLC note in §3).
- Good/better/best builder with an R-value/code table.
- QuickBooks export, a Zapier webhook for leads, and multi-location.
- Spanish UI and PDF.
- Calendar/scheduling, and job costing against actuals.

### Explicitly out of scope for MVP
- Native iOS/Android apps and app-store in-app purchases (the PWA covers phones).
- Full CRM, scheduling, dispatch, payroll, and inventory.
- Fire-protection/thermal-barrier code compliance checks, and any claim that a bid meets code.
- **Local competitor price benchmarking** (contractors asked for "what others are charging," **[fact]**). Pooling competitors' prices raises privacy and antitrust concerns. Skip it.
- Supplier ordering, integrations with rig data (Graco Reactor), and AI takeoff from plans.
- A standalone widget-only plan (round 2 found no evidence contractors pay for that alone).

---

## 3. Recommended tech stack (one builder)

| Layer | Choice | Why |
|---|---|---|
| App framework | **Next.js (App Router) + TypeScript**, on **Vercel** | One codebase for the app, landing page, SEO calculator pages, and the public quote API. Vercel Pro is **$20/mo** (1 deploy seat, $20 usage credit) **[fact, Vercel docs, Oct 2026]**. The Hobby tier is meant for non-commercial use, so plan on Pro by beta. |
| Database / auth / files | **Supabase** (Postgres + Auth + Storage) | Postgres row-level security keeps each contractor's data separate without custom code. Magic-link auth. Storage for logos and PDFs. Free tier while building; **Pro $25/mo** **[fact, Supabase pricing]**. |
| Calc engine | Pure TypeScript package with unit tests (Vitest) | The same code runs in the browser (live totals), on the server (PDF), and in the widget API, so the numbers can never disagree. Test fixtures come from 5 real partner jobs. |
| UI | Tailwind + shadcn/ui; phone-first layouts | Fast to build; big tap targets for gloved hands. |
| PWA | Web app manifest + service worker (e.g. Serwist) | Installs to the home screen on Android and iPhone. No app-store review and no IAP setup. Offline drafts can come later. |
| PDF | **@react-pdf/renderer**, generated on the server | Pure JavaScript, no headless browser, so it runs fine in serverless functions. Fixed layout gives consistent printing. |
| Email | **Resend** + React Email | Proposal emails and lead alerts. Free tier during beta; ~**$20/mo** paid tier after **[estimate, check Resend's current pricing]**. Needs SPF/DKIM on a sending domain. |
| Billing | **Stripe** Checkout + Billing + Customer Portal | Trials, coupons, annual plans, and dunning without building any of it. Cards are **2.9% + 30¢** **[fact, Stripe pricing]**, plus a pay-as-you-go Billing fee on subscription volume (≈0.7% **[estimate, check Stripe Billing page]**). That's about **$2.06 per $49 charge** **[estimate]**. |
| Widget | Small vanilla TS bundle (Preact if needed), served from the same domain. Calls `/api/widget/quote` with a public widget key | One script tag. An iframe or shadow DOM isolates styles. The server computes the range from the price book, so contractor rates are never exposed in client code beyond the range shown. |
| Ops | Sentry (errors) and PostHog (product analytics + funnels), free tiers **[assumption: free tiers suffice at beta scale]** | Needed to measure the beta metrics in §6. |

**SMS: skip at MVP.** US business texting from 10-digit numbers requires A2P 10DLC registration. Twilio lists a $4.50 brand registration + $15 campaign vetting one-time fee, then $1.50–$10/mo per campaign, plus carrier fees of roughly $0.0035–$0.005 per segment and Twilio's own per-message price. Campaign review currently takes **10–15 days** **[fact, Twilio pages, Oct 2026]**. Sending texts on behalf of many contractors also raises the question of registering each contractor's brand, plus TCPA consent handling for homeowner numbers. Email + in-app lead alerts are enough for beta. If partners insist, add Twilio after Gate 2 and budget roughly $20 one-time + $2–10/mo + per-message fees **[estimate]**.

---

## 4. Data model sketch and key screens

### Tables (Postgres; every table has `org_id` + RLS)
```
organizations  id, name, logo_path, brand_color, phone, email, address, license_no,
               proposal_terms, disclaimer_text, default_pricing_mode, timezone,
               stripe_customer_id, plan (trial|solo|crew|founding), trial_ends_at
memberships    org_id, user_id, role (owner|estimator)
products       id, org_id, name, kind (open_cell|closed_cell|coating|primer|other),
               set_price, set_size_gal, rated_yield_bf_per_set, field_yield_factor,
               default_waste_pct, coverage_sqft_per_gal (coatings), active
labor_settings org_id, crew_size, hourly_rate, prod_rate_bf_per_hr, labor_per_bf (alt),
               trip_charge, mileage_rate, min_job
price_ladder   id, org_id, product_kind, thickness_in, price_per_sqft
customers      id, org_id, name, phone, email, address, source (manual|widget), notes
estimates      id, org_id, customer_id, number, version, status (draft|sent|accepted|lost),
               job_address, pricing_mode, margin_pct, valid_until,
               price_book_snapshot jsonb, totals jsonb, created_by, sent_at
estimate_areas id, estimate_id, label, shape (wall|gable|roof_pitch|attic_floor|quonset|
               metal_building|rim_joist|freeform), dims jsonb, openings jsonb,
               computed_sqft, sort
area_layers    id, area_id, product_id, thickness_in        -- BF computed, not stored as truth
line_items     id, estimate_id, kind (labor|trip|coating|misc|discount), qty, unit,
               unit_cost, unit_price
documents      id, estimate_id, kind (customer_pdf|cost_sheet), storage_path, version
widgets        id, org_id, public_key, allowed_domains[], project_types jsonb,
               range_band_pct, gated bool, min_job_override, theme jsonb, active
leads          id, org_id, widget_id, customer_id, project_type, sqft, foam_pref,
               inputs jsonb, quoted_low, quoted_high, consent_text, consent_at,
               status (new|contacted|estimated|won|lost), created_at
events         id, org_id, user_id, name, props jsonb, created_at   -- or PostHog only
```
Calc-engine version is stored in `totals.engine_version`, so old bids stay reproducible.

### Key screens
1. **Onboarding wizard:** branding → products → labor/min job → pricing mode (margin or ladder, with playbook presets) → sample estimate.
2. **Dashboard:** "New estimate" button, recent estimates, new leads, and the month's sent/accepted totals.
3. **Estimate builder** (the core screen, phone-first): customer/job header, area list, sticky **live totals bar** (board feet · sets · price · margin).
4. **Add/edit area sheet:** shape picker with icons → shape-specific inputs (mixed wall heights, openings, pitch) → layers (product + inches) → computed sq ft and board feet.
5. **Review & price:** cost vs price breakdown, margin slider or ladder view, line items, min-job note.
6. **Proposal preview & send:** PDF preview, then email, share link, or download. Cost sheet download.
7. **Customers** and **Estimate history** (search, duplicate, new version).
8. **Leads inbox:** widget leads with the range shown and a "convert to estimate" button.
9. **Widget setup:** project types, band %, gated/ungated, min job, colors, allowed domains, **copy snippet**, live preview.
10. **Settings:** branding, terms/disclaimer, users (Crew), billing portal.
11. **Public pages:** landing, free calculators (board feet, sets, roof pitch area, Quonset area), the widget, and the proposal share-link view.

---

## 5. Week-by-week build plan (one builder) **[estimate]**

| Week (2026–27) | Focus | Deliverables | Milestone |
|---|---|---|---|
| **W0** Oct 12–18 | **Validation before code** | 10 contractor conversations (script below). One-page landing site + waitlist (the only code this week). $300–500 Meta ad test to that page. Collect 5 real past jobs (measurements + their Excel totals) from willing contractors. | **Gate 0** (see §10) |
| **W1** Oct 19–25 | Foundation | Repo, Next.js + Supabase + RLS, magic-link auth, org/membership, price book CRUD (products, labor, ladder), Stripe test mode, Sentry/PostHog | A price book can be saved |
| **W2** Oct 26–Nov 1 | Calc engine + area builders | TS engine with all shapes, layers, sets with field-yield factor, waste, labor, trip/min job, coatings, margin and ladder modes. Unit tests against the 5 real jobs | Engine matches partner Excel within ±2% on 5 jobs **[proposed target]** |
| **W3** Nov 2–8 | Estimate flow on phone | Estimate builder, area sheet, live totals, customers, history, duplicate/version, PWA install | **Gate 1:** internal alpha. A full real estimate on a phone in ≤10 min |
| **W4** Nov 9–15 | Documents | Branded customer PDF, internal cost sheet, Resend email + share link, branding settings, disclaimer | First design partner sends a real PDF to a real customer |
| **W5** Nov 16–22 | Widget + billing | Embed script, widget config, quote API with rate limit and allowed domains, lead email + inbox + convert, Stripe Checkout/Portal/trial/founding coupon, onboarding wizard, playbook ladder presets | **Beta-ready build** |
| **W6** Nov 23–29 (Thanksgiving week) | Buffer / hardening | Bug fixes from the first partners, mobile polish, legal pages, help docs, 4 job templates (attic, metal building/Quonset, crawlspace, rim joist) | Beta invite goes out |
| **Beta** Nov 30–Jan 8 | 5–10 design partners | Weekly calls, fixes, measure (see §6). Second Meta test only if Gate 0 passed | **Gate 2** (~Jan 8) |
| **Launch** Mon Jan 11, 2027 | Public | Pricing live, free calculator pages indexed, launch ad flight, playbook funnel | Gate 3 at launch + 90 days (~Apr 11, 2027) |

**Week 0 interview script (15–20 min core + ~5 min supplier add-on, done by Josh) [draft]:**
1. Walk me through your last bid, from the site visit to sending the price. Where did the time go?
2. How do you measure today (tape, laser, plans, satellite)? What's the hardest kind of building to measure?
3. What do you price in: Excel, a supplier tool, Competitor F/BIDIT, paper, or your head? What do you like and hate about it?
4. What does the customer receive? A text, an email, a PDF?
5. Do you have signal on most jobsites? (This decides offline mode.)
6. Does your website show prices? Would you show a range to homeowners?
7. What do you pay for software today? If this saved you X hours a week and sent a branded PDF, what would it be worth monthly?
8. Would you send me one past job (measurements + your final numbers) so I can test the math? Would you try a beta?

**Supplier-deal add-on (added Oct 5, 2026; about 5 extra minutes; see `2026-10-06-supplier-partnership-fsi.md`):**
9. Who do you buy foam from today: a manufacturer direct, a distributor (which one), or both? Which brands do you spray for open cell and closed cell?
10. How many sets did you go through last year, roughly? (A range is fine. It tells us how much a $/set discount is worth to you.)
11. How loyal are you to your current foam brand and supplier? What would make you switch: price, yield, rep support, delivery, credit terms, warranty, or rig compatibility?
12. What would a discount need to be, in dollars per set, before you'd try a different brand on a real job? And before you'd switch for good?
13. Are you in any supplier rebate, loyalty, or contractor program today (e.g. training, certified-applicator status, rebates, trips)? What do you actually get from it?
14. If this app showed a sponsored supplier deal (clearly labelled), would you use it, ignore it, or trust the app less? Would it matter if the sponsor wasn't your current brand?
15. Would you let the app send a quote request or order for sets to a supplier for you? Would you share your set usage with a supplier in exchange for a better price?
16. Has a supplier ever given you software or tools for free or at a discount (e.g. BIDIT, Enverge, JobPro)? Did you keep using it, and did it change who you buy from?

---

## 6. Beta plan (design partners)

- **Size:** 5–10 spray-foam contractors, ideally a mix of residential retrofit, new construction, and ag/metal building, plus at least 2 Android users and at least 2 with a website that can take the widget **[proposed]**.
- **Recruiting channels.** Every outreach step is a Josh action; agents won't post or contact anyone.
  - **Josh's playbook as the hook:** "Get the playbook + early access to the bid tool." The waitlist form asks about trade mix, phone OS, current tool, and whether they have a website.
  - **r/sprayfoam:** a transparent founder post asking for 5 beta testers, following subreddit self-promo rules. The Competitor F launch thread shows the sub does engage with tool posts **[fact]**.
  - **SprayFoam.com forum:** the same kind of post, in the business/estimating area.
  - **SPFA:** through Josh's own SPFA relationship or list access **once confirmed**. Ask SPFA about the member-discount program (terms unknown **[fact]**).
  - **Meta test** waitlist signups from Week 0.
  - Josh's own contractor network **[assumption]**.
- **The deal:** free during beta. In return, partners enter at least 3 real jobs, join a 15-minute weekly call, and allow their (anonymized) job as a test case. After beta, **founding price $29/mo, locked for as long as they stay subscribed** (first 25 accounts) **[proposed; Josh decides]**.
- **What to measure** (PostHog funnels + calls):
  - Activation: signup → price book done → first estimate → first PDF sent. Target ≤ 1 day from signup to first PDF.
  - **Time per estimate**: median, from create to PDF.
  - Estimates sent per partner per week, and repeat use in week 2 and week 4.
  - **Accuracy:** our totals vs their Excel, and (where available) estimated vs actual sets used.
  - Widget installs, widget views → range shown → leads, and leads → estimates.
  - Support load: tickets/messages per partner per week.
  - Sean Ellis question ("how would you feel if you could no longer use this?") and stated willingness to pay at $29 / $49.
  - Feature requests ranked by how many partners ask.

---

## 7. Launch and go-to-market

1. **Playbook as the hook.** Gated playbook download → email sequence → 14-day trial. The in-app price ladders ship **pre-filled from the playbook**, so the tool feels like the playbook made executable. *Confirm the playbook's format, price, and whether it's free or paid* **[assumption]**.
2. **SPFA route (list access to be confirmed by Josh).**
   - **Member-discount program:** this is the cleanest sanctioned route. Hearth, Spray Foam Advisor, and WebLead Systems are already listed **[fact]**. Ask SPFA about terms (unknown). A member offer could be, e.g., first 2 months free or 20% off annual **[proposed]**.
   - **SprayFoam 2027, Fort Worth, Mar 6–10, 2027 (exhibit hall Mar 9–10)** **[fact]**. The sponsor page claims 2,200+ attendees **[fact, self-reported]**. 2025 booth prices: 10×10 **$2,864 member / $3,972 non-member** **[fact, 2025 brochure; 2027 price not checked]**. Decide **booth vs attend-only vs skip** at Gate 2 (~Jan 8). Check the exhibitor deadline before then; I don't know it. Attend-only full pass: $545 member / $745 non-member **[fact]**.
   - Other sanctioned options: the directory/Buyers' Guide, *Sprayfoam Professional* magazine, and the newswire. Prices weren't checked.
   - **Don't build the forecast on "the SPFA list"** until Josh confirms what access really means (owned list, partnership, or none). I found no public list-rental option **[fact]**.
3. **Meta ads (the channel is nearly empty).** The Oct 5 Ad Library check found Competitor F is the only spray-foam software advertiser. The "spray foam estimating software" search returned 1 unclear ad **[fact]**.
   - Week 0: $300–500 test to the waitlist.
   - Launch: $1,000–1,500 over 4–6 weeks to the free trial **[proposed]**.
   - Creative angles: "Cut-up house → branded bid before you leave the driveway," a 30-second phone screen recording, "Your website quotes homeowners while you spray," and "Works on Android, iPhone, and desktop."
   - Targeting: contractor/business-owner interests around spray foam and insulation. Which interests exist in Ads Manager is unverified.
   - Track cost per waitlist signup, trial, and paid account.
4. **SEO with free calculators as the funnel.** Free pages: board-foot calculator, sets calculator (with field-yield factor), roof-pitch area, Quonset/arch area, gable area, and "spray foam price per sq ft" for homeowners. Each contractor page offers "Save as a branded proposal → free trial." Free web calculators already exist **[fact]**, so the difference is the PDF/save step, plus a quality bar of correct formulas and shown work.
5. **Ainsworth Studio upsell [assumption: Josh's studio offers websites and marketing].** A done-for-you package: widget install + contractor website refresh + Meta lead ads setup + proposal template design. Price is Josh's call. The reference point is spray-foam marketing agencies with retainers of $2K–10K+/mo **[fact, Spray Foam Genius]**, so a fixed-fee setup could sit well under that.
6. **Community/content:** short YouTube or Reels demos measuring real buildings, plus forum participation (Josh posting as himself).

---

## 8. Pricing and billing

| Plan | Price | Includes |
|---|---|---|
| **Free calculator** | $0, no account | Board feet / sets / area calculators. No save, no PDF. |
| **Solo** | **$49/mo** or **$490/yr** (2 months free ≈ $40.83/mo) **[assumption: Josh's working price]** | 1 user, unlimited estimates, branded PDF + cost sheet, price book, customers/history, **widget included** (1 site) |
| **Crew** | **$99/mo** or **$990/yr** **[proposed]** | Up to 5 users, shared price book, estimator role, widget on up to 3 sites, priority support |
| **Founding** | **$29/mo** (or $290/yr) locked while subscribed, first 25 accounts **[proposed]** | Solo features, plus a direct line to the builder |

- **Trial:** 14 days, full features, no card required. Card is requested on day 10 via email and in-app prompts **[proposed]**.
- **Annual:** pushed at checkout. It lands under the $39.99/mo anchor, which answers the "$40 is steep" objection.
- **Billing:** Stripe Checkout + Customer Portal, card only at MVP, with Smart Retries for failed payments. US sales tax on SaaS varies by state; check whether Stripe Tax is needed **[assumption]**.
- **Unit economics [estimate]:** Stripe takes ~$2.06 of each $49 charge. Hosting is roughly $45–85/mo flat at beta scale. So **25 paying Solo accounts ≈ $1,225 MRR gross**, and fixed infrastructure stays small.

---

## 9. Budget (cash). All figures are estimates or assumptions unless marked [fact]. Builder labor is excluded.

| Item | When | Amount | Basis |
|---|---|---|---|
| Domain | W0 | ~$15/yr | estimate |
| Vercel Pro | from beta | $20/mo (+ usage beyond the $20 credit) | **fact**, Vercel docs |
| Supabase Pro | from beta | $25/mo (Free while building) | **fact**, Supabase pricing |
| Resend | from launch | $0 beta → ~$20/mo | estimate, check current pricing |
| Sentry / PostHog | all | $0 (free tiers) | assumption |
| Stripe | per charge | 2.9% + 30¢ **[fact]** + ~0.7% Billing → ~$2.06 per $49 charge | estimate |
| AI coding tools / dev subscriptions | W1–beta | $20–200/mo | assumption, depends on builder |
| Terms/privacy/disclaimer | W5–W6 | $0–500 (template) / optional attorney review $500–1,500 | assumption |
| Interview thank-yous | W0 | $0–500 (10 × $0–50 gift cards, optional) | assumption |
| Meta ad test #1 | W0 | $300–500 | proposed |
| Meta launch flight | Jan–Feb 2027 | $1,000–1,500 | proposed |
| SMS (not recommended at MVP) | post-Gate 2 | ~$20 one-time + $1.50–10/mo + per-message fees | **fact** (Twilio fee schedule), total is an estimate |
| SprayFoam 2027 booth 10×10 | Mar 2027 | $2,864 member / $3,972 non-member (**2025** prices) | **fact** (2025), 2027 unknown |
| Booth travel/lodging (Fort Worth) | Mar 2027 | $800–2,000 | assumption |
| Booth graphics/handouts | Mar 2027 | $300–1,000 | assumption |
| Attend-only alternative (full pass) | Mar 2027 | $545 member / $745 non-member + travel | **fact** (pass), travel assumed |
| SPFA vendor/supplier membership | optional | unknown (contractor tiers $750/$1,800/$5,000 don't apply to a software vendor) | not checked |

**Totals [estimate]:**
- **Through beta (W0–Jan 8):** ~$500–2,200. That covers hosting ~2 months, tools, optional legal/interview costs, and the $300–500 ad test.
- **Launch + 90 days:** another ~$1,200–2,400. That covers hosting ~3 months, the $1,000–1,500 ad flight, and tools.
- **Total without the show: ~$1.7K–4.6K.**
- **Add a booth:** ~$4.0K–7.0K (booth + travel + materials). **Attend only:** ~$1.3K–2.7K.
- **All-in with a booth: ~$5.7K–11.6K.**

---

## 10. Go/no-go gates (all thresholds are **proposed targets**, not benchmarks)

| Gate | When | GO if | Kill / pivot if |
|---|---|---|---|
| **Gate 0: Validation** | End of W0 (~Oct 18) | ≥10 conversations held; ≥6 name measuring/compiling the bid as a top time sink; ≥5 agree to be design partners and ≥3 send a real past job; ≥3 say they'd pay ≥$39/mo; waitlist ≥40 signups; Meta cost per contractor waitlist signup ≤$15 | <3 design partners **or** most say free calcs/Excel are "good enough" **or** cost per signup >$40 with no organic signups → stop, or pivot to widget-only/agency offer |
| **Gate 1: Alpha** | End of W3 (~Nov 8) | Engine within ±2% of partner Excel on 5 real jobs; a full estimate on a phone in ≤10 min | Can't hit accuracy (yield/product data is too contractor-specific) → add an "override everything" mode before continuing |
| **Gate 2: Beta** | ~Jan 8, 2027 | ≥5 active partners each sent ≥3 real bids; median time to proposal ≤10 min; week-4 retention ≥60% of partners; ≥1 widget live with ≥1 real lead; ≥3 partners commit to the founding paid plan; support ≤1 hr per partner per week | <3 partners still using it at week 4 **or** 0 willing to pay → stop before launch spend and the booth |
| **Booth decision** | at Gate 2 | Gate 2 passed **and** ≥5 paying/committed accounts → book a 10×10 (or attend only if budget is tight) | Gate 2 missed → skip the show or attend as a visitor only |
| **Gate 3: Traction** | Launch + 90 days (~Apr 11, 2027) | ≥25 paying accounts (≈$1.2K MRR at $49); trial → paid ≥15%; monthly logo churn ≤5%; blended paid CAC ≤$150 | <10 paying accounts → stop paid acquisition; keep it as a playbook companion or shut down |
| **Gate 4: Scale** | ~6 months after launch | ≥75 paying (~$3.7K MRR) → invest in offline mode, e-sign/deposits, SMS, and a support person | Flat for 2 months → maintenance mode |

---

## 11. Risks and mitigations

| Risk | Likelihood / impact [my judgment] | Mitigation |
|---|---|---|
| **IDI BIDIT price war** ($39.99, "nearly break-even," supplier-subsidized) | Medium / High | Don't match the supplier on price. Sell the wedge it doesn't lead with: any supplier, measurement speed, widget. Annual at ~$40.83/mo and founding at $29 handle price-sensitive buyers. |
| **Free supplier tools** (Enverge, Graco, Huntsman Daily Work Record) | High / Medium | Treat them as the free math layer. Offer our own free calculator pages. Charge for proposal output + widget + history. Consider supplier product presets in the price book. |
| **Competitor F ships its web app and/or a widget** | Medium / High | Speed (launch Jan 11), the SPFA route, the playbook bundle, and the widget built in. Watch Competitor F's App Store notes and site monthly. |
| **SPFA list access isn't what we think** | Unknown / High | Nothing in the plan depends on it. Gates use Meta, forums, and the playbook. SPFA is an upside lane once Josh confirms. |
| **Liability for a wrong estimate** (under-bid sets, wrong area) | Medium / Medium | A disclaimer on signup and every PDF ("planning aid; contractor verifies measurements, product data sheets, code requirements, and final price"). Limitation-of-liability clause in the ToS. No code-compliance claims. Formulas shown on the cost sheet. Unit-tested engine with versioning. Price-book snapshot per estimate. Attorney review of ToS is optional but recommended before paid launch. |
| **Support load** from non-technical users | Medium / Medium | Onboarding wizard + job templates, short help videos, weekly office hours during beta, email support only for Solo, priority for Crew. Track hours per partner (Gate 2 limit). |
| **Low willingness to pay / churn** ("$40 is steep," "3 file cabinets... nope") | High / High | Founding and annual pricing. Prove time saved in onboarding (show their first estimate time). The widget's lead value is a second reason to stay. |
| **Accuracy disputes:** yields vary by rig, temperature, and applicator | High / Medium | A per-product field-yield factor that contractors control. Later, "actual sets used" logging to tune it. |
| **Homeowner lead data / texting compliance** | Low / Medium | Consent text stored with every lead. No SMS at MVP (avoids A2P/TCPA work). Minimal data collected. |
| **Widget spam / abuse** | Medium / Low | Honeypot, rate limits, allowed domains, and lead email throttling. |
| **Builder bandwidth / scope creep** | Medium / High | The out-of-scope list above is binding until Gate 2. A buffer week is built in. |
| **Seasonality** of contractor attention (unknown) | Unknown / Medium | Ask in Week 0 interviews. Launch timing may need to shift. |

---

## 12. Who builds it (DECISION FOR JOSH)

Unicorn Hunter only scouts and plans. It does not build. Options:
- **A. Firstmate's crew**, the same hand-off pattern as the Framing Nailer project (`briefs/framing-nailer-compatibility.md` was written as the source of truth for briefing Firstmate). This plan would become the build brief. Gate 0 should pass first.
- **B. Josh builds it himself** with the stack above (a 5–6 week estimate for one focused builder).
- Either way, **Week 0 conversations should be done by Josh personally**, since he has the contractor relationships and the playbook.

### Decisions Josh needs to make
1. **Builder:** Firstmate's crew or Josh?
2. **Go on Week 0** (Oct 12–18), including the $300–500 Meta test budget and a Meta ad account to run it from.
3. **Price point:** keep $49 Solo (above the $39.99 anchor, justified by the widget) or launch at ≤$39? Approve the founding terms ($29/mo locked while subscribed, first 25).
4. **SPFA:** confirm what "list access" really is; whether to apply to the member-discount program; and booth vs attend-only vs skip for SprayFoam 2027 (decide at Gate 2, ~Jan 8).
5. **Playbook:** format, free or paid, and whether its price ladders become in-app presets.
6. **Ainsworth Studio upsell:** offer scope and price.
7. **SMS at MVP:** recommend **no**. Confirm.
8. **Name, domain, and the legal entity/EIN** that will own Stripe (and any future A2P registration).
9. **Outreach approvals:** each forum or Reddit post and each SPFA inquiry goes out under Josh's name. Agents won't post or contact anyone.

---

## Sources used
- `side-lanes/2026-10-05-contractor-microsaas-screen.md`: all market facts. This includes Competitor F/BIDIT/free tools, forum quotes, widget examples, the SPFA channel, and the Oct 5 Meta Ad Library check.
- Twilio A2P 10DLC fees and review time: https://www.twilio.com/en-us/phone-numbers/a2p-10dlc · https://www.twilio.com/docs/messaging/compliance/a2p-10dlc · https://www.twilio.com/docs/trust-hub/registrations/a2p-10dlc-brand
- Vercel Pro: https://vercel.com/docs/plans/pro-plan
- Supabase Pro: https://supabase.com/pricing
- Stripe: https://stripe.com/pricing · https://stripe.com/billing/pricing (the Billing pay-as-you-go % wasn't shown in the fetched summary; ≈0.7% is my estimate)
- SPFA / SprayFoam 2027: https://sprayfoamshow.org/ · https://sprayfoamshow.org/sprayfoam-pricing/ · https://sprayfoamshow.org/exhibitor/ · https://www.sprayfoam.org/member-discounts/

## Caveats
- Every timeline, budget, and gate figure is an estimate or proposed target. None is market data. Revenue for every competitor is still **unknown**.
- Vendor prices (Vercel, Supabase, Stripe, Twilio) were checked via search on Oct 5, 2026 and can change. Resend and Stripe Billing % are from memory, so check them before committing.
- SprayFoam 2027 booth prices and the exhibitor deadline weren't checked. The 2025 prices are a reference only.
- The playbook and Ainsworth Studio details are assumptions about Josh's assets; I found nothing about them in the research files.
