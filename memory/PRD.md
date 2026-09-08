# Paws & Whiskers India — PRD

## Original problem statement
Build "Paws & Whiskers India" — an Indian pet-product review & affiliate editorial site for dogs and cats.
Visual style: clean cream/light beige background, dark charcoal text, warm orange/coral buttons and highlights, teal/soft green trust badges and ratings, real cheerful dog/cat photos, rounded cards, soft shadows, generous whitespace, friendly headings with clear factual info.
Homepage: header (Dogs, Cats, Reviews, Guides, Deals, search), hero "Better picks for happier pets." with dog/cat CTAs, search bar, shop-by-pet, popular categories (Dog Food, Cat Food, Grooming, Toys, Beds, Litter, Harnesses, Treats), featured guides, top-picks comparison cards (Best Overall label, best for, ₹ price range, rating, Check Price), why-trust-us, latest guides, newsletter.
Article page "Best Cat Food in India (2026)": quick answer, comparison table near top, detailed review cards (pros/cons, ideal pet, ingredients, price button), buying guide, FAQ. Rules: comparison table near top of every Best-of article; Best Overall / Budget Pick / Premium Pick labels; "Check latest price" affiliate buttons; filters for pet/budget/food type; visible affiliate disclosure; vet badge only if a real vet reviewed (skipped — no real vet yet); avoid heavy ads/pop-ups.

## Architecture
- Frontend: React 19 + Tailwind + framer-motion + lenis (smooth scroll). Pages: Home (/), Article (/guides/best-cat-food-india-2026). Components: Header, Footer, Marquee, ProductCard, Newsletter, SearchModal, Reveal (motion helpers). Fraunces (display) + Plus Jakarta Sans (body) + JetBrains Mono (labels/prices).
- Backend: FastAPI + MongoDB (motor). Seeded collections: products (10), guides (6), categories (8). Endpoints: /api/health, /api/products (filters: pet, category, featured), /api/products/{id}, /api/guides, /api/categories, /api/search?q=, /api/newsletter (POST email).
- On-site product pages: /products/{id} with variants (pack sizes + ₹ prices), Buy now → Stripe Checkout (POST /api/products/checkout, ad-hoc INR price_data, tax_code txcd_99999999, shipping address IN/US). No external affiliate links anywhere.
- Design system lives in /app/design_guidelines.json. Palette: #FAF7F2 cream, #1C1917 charcoal, #EA580C coral, #0D9488 teal.

## User personas
- Indian pet parent (dog/cat) researching what to buy, budget-conscious, wants trustworthy ₹ pricing.
- First-time kitten/puppy owner looking for feeding guidance.
- Affiliate content editor (future) who will manage products/guides.

## Implemented (2026-07-08, update: Stripe payments)
- Award-style homepage: masked line-by-line hero reveal, parallax floating pet photo cards, editorial marquee, shop-by-pet split cards, category pills, filterable top-picks grid (All/Dogs/Cats + category), featured guides bento, why-trust-us strip, "Support us" reader-contribution section (Stripe), latest guides, newsletter (saves emails to MongoDB), footer with disclosure.
- Article page "Best Cat Food in India (2026)": quick answer box (Farmina N&D top pick), affiliate disclosure ribbon, full comparison table (6 cat foods), detailed review cards with pros/cons/ingredients/India tips, numbered buying-guide chapters, FAQ accordion, related guides.
- Live search modal (⌘K or /) across products and guides.
- Real Amazon.in search links on every Check Price button. Vet-review badge deliberately omitted (no real vet yet).
- Stripe payments (Emergent-managed claimable sandbox, TEST mode, US account — IN unsupported by Stripe): one-time reader-support tiers ₹99/₹299/₹499 in INR via hosted Checkout; backend routes /api/payments/tiers, /api/payments/checkout, /api/payments/status/{session_id} (with Stripe-poll fallback), /api/stripe/webhook (idempotent); payment_transactions collection in MongoDB; success/cancel pages with status polling. Tax mode: full (Stripe managed payments). Verified e2e with test card 4242 4242 4242 4242 → ₹322.55 paid (₹299 + 7.875% tax).
- setup_stripe.py: idempotent catalog sync (product + prices by lookup_key, tax settings).

## Implemented (2026-06, de-affiliation + on-site shop)
- Removed all Amazon.in/Flipkart links, affiliate disclosure banners (Article + Footer) and "affiliate" wording (Marquee, trust strip).
- Products now carry `variants: [{label, price}]` (affiliate_url dropped; startup upserts seed so schema changes propagate).
- New Product page (/products/:id): sticky hero image, label/rating/best-for, BuyBox (pack-size pills, qty 1–10, live ₹ total), Buy now → Stripe hosted Checkout; pros/cons, ingredients, India tip, related products.
- POST /api/products/checkout (404 unknown product, 400 unknown variant, 422 qty bounds); payment_transactions now store kind=order|support + product_name/variant/quantity; /api/payments/status returns them; success page shows "Order confirmed" for orders.
- ProductCard "View & Buy", Article buttons "Buy from ₹…", search results → internal product pages.
- Tested by testing_agent (iteration_1.json): all backend + frontend flows pass incl. full Stripe test purchase.

## Backlog (prioritized)
- P0: Admin CMS to edit products/guides/prices/stock (user asked for DB content + simple admin later).
- P0: Individual article pages for the other 5 guides (currently "Coming soon" toasts).
- P1: Orders dashboard + order confirmation email (Resend) now that products are sold on-site.
- P1: User to claim the Stripe sandbox (onboarding_url) + complete KYC before deploy; platform auto-switches to live keys on approval.
- P1: Advanced filters (kitten/puppy/adult, budget slider, food type, breed size).
- P1: Monthly pet-food budget calculator in ₹.
- P2: Vet-review badge system once a real veterinarian reviews content.
- P2: Deals page with price-drop tracking; email sending via Resend for the newsletter; paid premium guides on top of the Stripe rails.

## Next tasks
1. Build admin CMS (auth + product/guide CRUD).
2. Publish remaining guide articles.
3. Claim Stripe sandbox + KYC, then deploy.
4. Add budget/life-stage filters.
