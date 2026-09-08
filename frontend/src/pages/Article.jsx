import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Star, Check, X, ChevronDown, Info, Clock, User, BadgeCheck, Droplets, Scale, Wallet, Utensils } from "lucide-react";
import { api } from "../lib/api";
import { Reveal, MaskedLine, FadeIn } from "../components/Reveal";
import { Newsletter } from "../components/Newsletter";

const LABEL_STYLES = {
  "Best Overall": "bg-amber-100 text-amber-900 border-amber-300",
  "Budget Pick": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "Premium Pick": "bg-stone-900 text-amber-200 border-stone-900",
};

const Disclosure = () => (
  <div data-testid="affiliate-disclosure-banner" className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm leading-relaxed text-orange-900">
    <Info size={17} className="mt-0.5 shrink-0 text-[#EA580C]" />
    <p>
      <span className="font-bold">Affiliate disclosure:</span> We may earn a commission when you buy through our links, at no extra cost to you. Brands cannot pay for rankings — every product below was bought and tested by our team.
    </p>
  </div>
);

const QuickAnswer = ({ top }) => {
  if (!top) return null;
  return (
    <Reveal>
      <div data-testid="quick-answer-box" className="overflow-hidden rounded-[2rem] border-2 border-[#EA580C]/30 bg-white shadow-xl shadow-orange-600/10">
        <div className="flex items-center gap-2 bg-[#EA580C] px-6 py-3 text-white">
          <BadgeCheck size={18} />
          <span className="font-mono-accent text-xs font-bold uppercase tracking-[0.25em]">Quick answer — the 30-second verdict</span>
        </div>
        <div className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <img src={top.image} alt={top.name} className="h-28 w-28 shrink-0 rounded-2xl object-cover shadow-md" />
          <div className="flex-1">
            <p className="text-base leading-relaxed text-stone-700 sm:text-lg">
              Our top pick is <span className="font-display font-bold text-stone-900">{top.name}</span> for most adult cats — {top.key_benefit.toLowerCase()}, at <span className="font-mono-accent font-bold">{top.price_range}</span>.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-800 ring-1 ring-teal-200">
                <Star size={14} className="text-teal-600" fill="currentColor" /> {top.rating.toFixed(1)} / 5
              </span>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${LABEL_STYLES[top.label]}`}>{top.label}</span>
            </div>
          </div>
          <a
            data-testid="quick-answer-check-price"
            href={top.affiliate_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-3.5 font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-95"
          >
            Check latest price <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </Reveal>
  );
};

const ComparisonTable = ({ products }) => (
  <Reveal>
    <div data-testid="cat-food-comparison-table" className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-100">
            {["Product", "Best for", "Food type", "Price range", "Our rating", ""].map((h) => (
              <th key={h} className="px-5 py-4 font-mono-accent text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} data-testid={`comparison-row-${p.id}`} className="border-b border-stone-100 transition-colors last:border-0 hover:bg-amber-50/50">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <img src={p.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
                  <div>
                    <p className="font-bold text-stone-900">{p.name}</p>
                    {p.label && <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${LABEL_STYLES[p.label]}`}>{p.label}</span>}
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-stone-600">{p.best_for}</td>
              <td className="px-5 py-4 text-stone-600">{p.food_type}</td>
              <td className="px-5 py-4 font-mono-accent font-bold text-stone-900">{p.price_range}</td>
              <td className="px-5 py-4">
                <span className="flex w-max items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 font-bold text-teal-800 ring-1 ring-teal-200">
                  <Star size={13} className="text-teal-600" fill="currentColor" /> {p.rating.toFixed(1)}
                </span>
              </td>
              <td className="px-5 py-4">
                <a
                  data-testid={`table-check-price-${p.id}`}
                  href={p.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex w-max items-center gap-1.5 rounded-xl bg-[#EA580C] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#C2410C]"
                >
                  Check price <ArrowUpRight size={13} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Reveal>
);

const ReviewCard = ({ p, rank }) => (
  <Reveal>
    <article data-testid={`review-card-${p.id}`} className="overflow-hidden rounded-[2rem] border border-[#E7E2DA] bg-white shadow-sm">
      <div className="grid md:grid-cols-[300px_1fr]">
        <div className="relative min-h-[220px] overflow-hidden">
          <div className="spotlight absolute inset-0 z-10" />
          <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <span className="font-mono-accent absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-amber-200">
            {String(rank).padStart(2, "0")}
          </span>
          {p.label && <span className={`absolute bottom-4 left-4 z-20 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${LABEL_STYLES[p.label]}`}>{p.label}</span>}
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono-accent text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">{p.brand} · {p.food_type}</p>
              <h3 className="font-display mt-1 text-2xl font-bold tracking-tight text-stone-900">{p.name}</h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1.5 font-bold text-teal-800 ring-1 ring-teal-200">
              <Star size={15} className="text-teal-600" fill="currentColor" /> {p.rating.toFixed(1)}
            </span>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl bg-teal-50/60 p-4 ring-1 ring-teal-100">
              <p className="font-mono-accent text-[11px] font-bold uppercase tracking-widest text-teal-700">What we loved</p>
              <ul className="mt-2.5 space-y-2">
                {p.pros.map((pro) => (
                  <li key={pro} className="flex gap-2 text-sm text-stone-700"><Check size={15} className="mt-0.5 shrink-0 text-teal-600" />{pro}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-orange-50/60 p-4 ring-1 ring-orange-100">
              <p className="font-mono-accent text-[11px] font-bold uppercase tracking-widest text-orange-700">Worth knowing</p>
              <ul className="mt-2.5 space-y-2">
                {p.cons.map((con) => (
                  <li key={con} className="flex gap-2 text-sm text-stone-700"><X size={15} className="mt-0.5 shrink-0 text-orange-500" />{con}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm leading-relaxed text-stone-600">
            <p><span className="font-bold text-stone-800">Ideal pet:</span> {p.ideal_pet}</p>
            {p.ingredients.length > 0 && (
              <p><span className="font-bold text-stone-800">First 5 ingredients:</span> {p.ingredients.join(", ")}</p>
            )}
            <p className="rounded-xl bg-[#FAF7F2] px-4 py-3 italic text-stone-600 ring-1 ring-stone-100">
              <span className="font-bold not-italic text-stone-800">India tip:</span> {p.climate_tip}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-5">
            <div>
              <p className="font-mono-accent text-lg font-bold text-stone-900">{p.price_range}</p>
              <p className="text-xs text-stone-500">{p.pack_sizes} · checked this week</p>
            </div>
            <a
              data-testid={`review-check-price-${p.id}`}
              href={p.affiliate_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-95"
            >
              Check latest price <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </article>
  </Reveal>
);

const CHAPTERS = [
  {
    icon: Scale,
    title: "Protein vs filler: reading Indian labels",
    body: "Cats are obligate carnivores — they need animal protein to thrive, not just survive. On Indian packs, ingredients are listed by weight, so the first item matters most. Look for named meats ('chicken', 'ocean fish') over vague 'meat derivatives'. As a rule of thumb: 30%+ protein and named meat in the first two ingredients is our bar for a recommendation.",
  },
  {
    icon: Droplets,
    title: "Hydration & urinary health in hot summers",
    body: "Indian summers regularly cross 40°C, and many cats are poor drinkers. A dry-only diet concentrates urine and raises the risk of crystals and UTIs — one of the most common vet visits we see reported. Adding even one wet pouch a day, or a cat water fountain, makes a measurable difference. If your city has hard water (Delhi, Bengaluru), prefer foods with a controlled mineral profile.",
  },
  {
    icon: Wallet,
    title: "Wet vs dry: the real monthly math",
    body: "Dry food costs roughly Rs 250–900 per month for an average 4 kg cat on the brands above. A wet-only diet runs Rs 3,000–4,500. Most Indian homes land on a mixed approach — kibble as the base, wet food as a daily topper — which balances cost, convenience and hydration. Budget for airtight storage too: humidity ruins an open 3 kg sack in weeks.",
  },
  {
    icon: Utensils,
    title: "Transitioning fussy eaters without drama",
    body: "Switch foods over 7–10 days: 75% old + 25% new for three days, then 50/50, then 25/75. Warm wet food to room temperature — Indian cats often refuse fridge-cold food. If your cat skips a meal, don't panic-offer five alternatives; pickiness is often trained by us. Persistent refusal beyond 24 hours, especially in kittens, deserves a vet call.",
  },
];

const FAQS = [
  { q: "Is Whiskas good enough as a daily food?", a: "It meets basic nutritional standards and is fine for healthy adults on a budget. We'd pair it with a daily wet pouch for moisture, and upgrade when the budget allows — the jump in meat content to a Farmina or Arden Grange is significant." },
  { q: "Grain-free or regular — what should I pick?", a: "Most healthy cats digest grains fine. Grain-free matters if your cat shows itchy skin, chronic loose stools or a diagnosed sensitivity. Don't pay the premium 'just because' — spend it on higher meat content instead." },
  { q: "How much should I feed my adult cat daily?", a: "A typical 4 kg indoor cat needs about 200–250 kcal/day — roughly 45–60 g of dry food. Indian indoor cats are often overfed; measure with a katori or scale rather than free-pouring, and adjust by body condition, not the packet alone." },
  { q: "Can I feed my cat home food like rice and fish?", a: "Occasionally, yes — plain cooked fish or chicken is a great topper. But home diets alone are almost always deficient in taurine, which cats cannot synthesise. Long-term taurine deficiency causes heart and eye damage, so keep a complete commercial food as the base." },
  { q: "How do I store cat food during monsoon?", a: "Move kibble to an airtight steel or food-grade plastic dabba immediately — humidity above 70% spoils open bags fast and can grow aflatoxin mould. Keep the dabba in a cool, dark cupboard, and buy smaller pack sizes from June to September." },
];

const Accordion = ({ items, testid }) => {
  const [open, setOpen] = useState(0);
  return (
    <div data-testid={testid} className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <button
            data-testid={`${testid}-trigger-${i}`}
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          >
            <span className="font-bold text-stone-900">{item.q || item.title}</span>
            <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown size={18} className="text-stone-400" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="px-6 pb-6 text-sm leading-relaxed text-stone-600 sm:text-base">{item.a || item.body}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default function Article() {
  const [products, setProducts] = useState([]);
  const [guides, setGuides] = useState([]);

  useEffect(() => {
    api.products({ pet: "cat", category: "cat-food" }).then((r) => setProducts(r.sort((a, b) => b.rating - a.rating))).catch(() => {});
    api.guides({ pet: "cat" }).then(setGuides).catch(() => {});
  }, []);

  const top = products.find((p) => p.label === "Best Overall") || products[0];
  const related = guides.filter((g) => g.slug !== "best-cat-food-india-2026").slice(0, 2);

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="spotlight pointer-events-none absolute inset-0" />
        <div className="mx-auto max-w-4xl px-5 pb-12 pt-16 sm:px-8 sm:pt-20">
          <FadeIn>
            <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Cat nutrition guide · 2026 edition</p>
          </FadeIn>
          <h1 className="font-display mt-5 text-4xl font-black leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            <MaskedLine delay={0.1}>Best Cat Food</MaskedLine>
            <MaskedLine delay={0.25}>
              in India <span className="italic text-[#EA580C]">(2026)</span>
            </MaskedLine>
          </h1>
          <FadeIn delay={0.45}>
            <p className="mt-6 text-base leading-relaxed text-stone-600 sm:text-lg">
              We bought and compared 18 cat foods sold in India — scoring protein content, filler carbs, price per day and monsoon shelf-life. Six made the cut.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-stone-500">
              <span className="flex items-center gap-2"><User size={15} /> Team Paws &amp; Whiskers</span>
              <span className="flex items-center gap-2"><Clock size={15} /> 9 min read</span>
              <span className="font-mono-accent text-xs uppercase tracking-widest">Updated July 2026</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.6}>
            <div className="mt-8"><Disclosure /></div>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 sm:px-8">
        <QuickAnswer top={top} />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <Reveal>
          <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">01 — Side by side</p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">The full comparison</h2>
        </Reveal>
        <div className="mt-8"><ComparisonTable products={products} /></div>
      </section>

      <section className="mx-auto max-w-4xl space-y-8 px-5 pb-8 sm:px-8">
        <Reveal>
          <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">02 — Detailed reviews</p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Every pick, pros and all.</h2>
        </Reveal>
        {products.map((p, i) => (
          <ReviewCard key={p.id} p={p} rank={i + 1} />
        ))}
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
        <Reveal>
          <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">03 — Buying guide</p>
          <h2 className="font-display mt-3 max-w-xl text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Four things to know before you spend a rupee.</h2>
        </Reveal>
        <div className="mt-10 space-y-6">
          {CHAPTERS.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.05}>
              <div className="flex gap-6 rounded-3xl border border-[#E7E2DA] bg-white p-6 shadow-sm sm:p-8">
                <span className="font-display hidden shrink-0 text-5xl font-black text-orange-200 sm:block">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-200"><c.icon size={19} /></span>
                    <h3 className="text-xl font-bold tracking-tight text-stone-900">{c.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">{c.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8 sm:pb-20">
        <Reveal>
          <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">04 — FAQ</p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Questions Indian cat parents ask us.</h2>
        </Reveal>
        <div className="mt-8"><Accordion items={FAQS} testid="faq-accordion" /></div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-[#E7E2DA] bg-[#F4EFEA]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <Reveal>
              <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Keep reading</p>
            </Reveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {related.map((g, i) => (
                <Reveal key={g.slug} delay={i * 0.1}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#E7E2DA] bg-white shadow-sm transition-shadow hover:shadow-xl">
                    <div className="overflow-hidden">
                      <img src={g.image} alt={g.title} loading="lazy" className="aspect-[16/8] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-6">
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800 ring-1 ring-teal-200">{g.tag}</span>
                      <h3 className="font-display mt-3 text-xl font-bold tracking-tight text-stone-900">{g.title}</h3>
                      <p className="mt-2 text-sm text-stone-600">{g.excerpt}</p>
                      <p className="font-mono-accent mt-3 text-[11px] font-bold uppercase tracking-widest text-stone-400">{g.live ? g.read_time : "Coming soon"}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-5 pt-14 sm:px-8">
        <Disclosure />
      </section>
      <Newsletter />
    </main>
  );
}
