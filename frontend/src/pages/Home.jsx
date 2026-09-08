import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Search, ShieldCheck, FlaskConical, Thermometer, HandCoins, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Reveal, MaskedLine, FadeIn } from "../components/Reveal";
import { Marquee } from "../components/Marquee";
import { ProductCard } from "../components/ProductCard";
import { Newsletter } from "../components/Newsletter";

const IMGS = {
  golden: "https://images.unsplash.com/photo-1783441286747-85286dd35aac?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  kitten: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  spaniel: "https://images.unsplash.com/photo-1590527844234-563331a1d02c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  tabby: "https://images.unsplash.com/photo-1599572739984-8ae9388f23b5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
};

const Hero = ({ onSearch }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yDog = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const yCat = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const rotDog = useTransform(scrollYProgress, [0, 1], [-4, 3]);
  const rotCat = useTransform(scrollYProgress, [0, 1], [5, -3]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="spotlight pointer-events-none absolute inset-0" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pb-28 lg:pt-24">
        <div>
          <FadeIn>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-teal-800">
              <ShieldCheck size={14} /> Independent · India-first
            </p>
          </FadeIn>
          <h1 className="font-display mt-6 text-4xl font-black leading-[1.06] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            <MaskedLine delay={0.1}>Better picks for</MaskedLine>
            <MaskedLine delay={0.25}>
              <span className="italic text-[#EA580C]">happier pets.</span>
            </MaskedLine>
          </h1>
          <FadeIn delay={0.45}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
              Honest guides to food, toys, grooming and essentials for dogs and cats — lab-compared, priced in rupees, and tested in real Indian homes.
            </p>
          </FadeIn>
          <FadeIn delay={0.6}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                data-testid="hero-cta-dog-picks"
                href="#top-picks"
                onClick={(e) => { e.preventDefault(); window.__lenis?.scrollTo("#top-picks", { offset: -90 }); }}
                className="rounded-full bg-[#EA580C] px-7 py-3.5 font-bold text-white shadow-md shadow-orange-600/25 transition-all duration-200 hover:bg-[#C2410C] hover:shadow-lg active:scale-95"
              >
                Explore Dog Picks
              </a>
              <Link
                data-testid="hero-cta-cat-picks"
                to="/guides/best-cat-food-india-2026"
                className="rounded-full bg-stone-900 px-7 py-3.5 font-bold text-white shadow-md transition-all duration-200 hover:bg-stone-800 active:scale-95"
              >
                Explore Cat Picks
              </Link>
            </div>
          </FadeIn>
          <FadeIn delay={0.75}>
            <button
              data-testid="hero-search-bar"
              onClick={onSearch}
              className="mt-10 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
            >
              <Search size={18} className="shrink-0 text-stone-400" />
              <span className="truncate text-sm text-stone-400 sm:text-base">
                What are you looking for? e.g. “best cat food for kittens”
              </span>
              <kbd className="font-mono-accent ml-auto hidden rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] font-bold text-stone-500 sm:inline">⌘K</kbd>
            </button>
          </FadeIn>
        </div>

        <div className="relative hidden h-[480px] lg:block">
          <motion.div style={{ y: yDog, rotate: rotDog }} className="absolute left-0 top-4 w-64">
            <div className="animate-float-slow overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl shadow-stone-900/20">
              <img src={IMGS.golden} alt="Joyful golden retriever" className="aspect-[4/5] w-full object-cover" />
            </div>
            <span className="font-mono-accent absolute -bottom-4 left-4 rounded-full bg-stone-900 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-200 shadow-lg">Dog-tested</span>
          </motion.div>
          <motion.div style={{ y: yCat, rotate: rotCat }} className="absolute right-0 top-28 w-72">
            <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl shadow-stone-900/20" style={{ animation: "float-slow 7s ease-in-out infinite reverse" }}>
              <img src={IMGS.kitten} alt="Playful kitten reaching up" className="aspect-[4/5] w-full object-cover" />
            </div>
            <span className="font-mono-accent absolute -bottom-4 right-4 rounded-full bg-teal-700 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-teal-50 shadow-lg">Cat-approved</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ShopByPet = () => {
  const cards = [
    { pet: "dog", title: "Dog Essentials", desc: "Food, harnesses, beds & toys for every breed from Indies to Goldens.", img: IMGS.spaniel, testid: "shop-by-pet-dog" },
    { pet: "cat", title: "Cat Essentials", desc: "Nutrition, litter, scratchers & grooming for kittens to seniors.", img: IMGS.tabby, testid: "shop-by-pet-cat" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal>
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">01 — Shop by pet</p>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Who runs your house?</h2>
      </Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {cards.map((c, i) => (
          <Reveal key={c.pet} delay={i * 0.12}>
            <motion.button
              data-testid={c.testid}
              onClick={() => {
                const url = new URL(window.location);
                url.searchParams.set("pet", c.pet);
                window.history.pushState({}, "", url);
                window.dispatchEvent(new Event("petchange"));
                window.__lenis?.scrollTo("#top-picks", { offset: -90 });
              }}
              whileHover="hover"
              className="group relative block w-full overflow-hidden rounded-[2rem] text-left shadow-lg shadow-stone-900/10"
            >
              <motion.img
                src={c.img}
                alt={c.title}
                loading="lazy"
                variants={{ hover: { scale: 1.06 } }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/85 via-stone-900/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-7">
                <div>
                  <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">{c.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-300">{c.desc}</p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EA580C] text-white shadow-lg transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight size={20} />
                </span>
              </div>
            </motion.button>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

const Categories = ({ categories, active, onSelect }) => (
  <section id="categories" className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <Reveal>
      <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">02 — Popular categories</p>
      <div data-testid="category-pills" className="mt-6 flex flex-wrap gap-3">
        {categories.map((c) => (
          <button
            key={c.slug}
            data-testid={`category-pill-${c.slug}`}
            onClick={() => onSelect(active === c.slug ? null : c.slug)}
            className={`rounded-full border px-5 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
              active === c.slug
                ? "border-[#EA580C] bg-[#EA580C] text-white shadow-md shadow-orange-600/25"
                : "border-stone-200 bg-white text-stone-700 hover:border-orange-300 hover:text-[#EA580C]"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </Reveal>
  </section>
);

const TopPicks = ({ products, pet, setPet, category }) => (
  <section id="top-picks" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
    <Reveal className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">03 — Top picks &amp; deals</p>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">The shortlist, updated weekly.</h2>
      </div>
      <div className="flex rounded-full border border-stone-200 bg-white p-1 shadow-sm">
        {[
          { id: null, label: "All", testid: "pet-filter-all" },
          { id: "dog", label: "Dogs", testid: "pet-filter-dog" },
          { id: "cat", label: "Cats", testid: "pet-filter-cat" },
        ].map((t) => (
          <button
            key={t.label}
            data-testid={t.testid}
            onClick={() => setPet(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${pet === t.id ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </Reveal>
    {products.length === 0 ? (
      <p className="mt-12 text-center text-stone-500">No picks in this combination yet — try another category.</p>
    ) : (
      <div data-testid="top-picks-grid" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, 6).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    )}
  </section>
);

const FeaturedGuides = ({ guides }) => {
  const featured = guides.filter((g) => g.featured);
  if (featured.length === 0) return null;
  const [first, ...rest] = featured;
  const card = (g, big) => {
    const inner = (
      <>
        <img src={g.image} alt={g.title} loading="lazy" className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${big ? "aspect-[16/9]" : "aspect-[16/9]"}`} />
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800 ring-1 ring-teal-200">{g.tag}</span>
            <span className="font-mono-accent text-[11px] font-bold uppercase tracking-widest text-stone-400">{g.live ? g.read_time : "Coming soon"}</span>
          </div>
          <h3 className={`font-display mt-3 font-bold tracking-tight text-stone-900 ${big ? "text-2xl sm:text-3xl" : "text-xl"}`}>{g.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{g.excerpt}</p>
          <span className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${g.live ? "text-[#EA580C]" : "text-stone-400"}`}>
            {g.live ? "Read the guide" : "In the works"} <ArrowRight size={15} />
          </span>
        </div>
      </>
    );
    const cls = "group flex h-full flex-col overflow-hidden rounded-3xl border border-[#E7E2DA] bg-white shadow-sm transition-shadow hover:shadow-xl";
    return g.live ? (
      <Link key={g.slug} data-testid={`guide-card-${g.slug}`} to={`/guides/${g.slug}`} className={cls}>{inner}</Link>
    ) : (
      <button key={g.slug} data-testid={`guide-card-${g.slug}`} onClick={() => toast("This guide is being lab-tested right now.", { description: "Subscribe below and we'll email you when it drops." })} className={`${cls} text-left`}>{inner}</button>
    );
  };
  return (
    <section id="featured-guides" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal>
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">04 — Featured guides</p>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Deep dives worth your Sunday chai.</h2>
      </Reveal>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">{card(first, true)}</Reveal>
        <div className="grid gap-6">
          {rest.slice(0, 3).map((g, i) => (
            <Reveal key={g.slug} delay={0.1 * (i + 1)}>{card(g, false)}</Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const TRUST = [
  { icon: FlaskConical, title: "Clear comparisons", desc: "Every pick is compared on protein, materials, price per day and real-world durability — side by side." },
  { icon: ShieldCheck, title: "Independent recommendations", desc: "We buy what we test. Brands cannot pay for rankings, labels or review scores." },
  { icon: Thermometer, title: "Tested for Indian conditions", desc: "Humidity, heat, hard water and small flats — our checks match how Indian pets actually live." },
  { icon: HandCoins, title: "Updated prices", desc: "Prices are re-checked weekly across Amazon.in, Flipkart and specialty pet stores." },
];

const WhyTrust = () => (
  <section className="border-y border-[#E7E2DA] bg-[#F0FDF9]/60">
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal>
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-teal-700">05 — Why trust us</p>
        <h2 className="font-display mt-3 max-w-2xl text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Trust is the whole product. So we protect it fiercely.
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t, i) => (
          <Reveal key={t.title} delay={i * 0.08}>
            <div className="h-full rounded-3xl border border-teal-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-200">
                <t.icon size={22} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-stone-900">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{t.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const LatestGuides = ({ guides }) => {
  const latest = guides.filter((g) => !g.featured);
  if (latest.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">06 — Latest guides</p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Fresh from the test bench.</h2>
        </div>
      </Reveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {latest.map((g, i) => (
          <Reveal key={g.slug} delay={i * 0.08}>
            <article data-testid={`latest-guide-${g.slug}`} className="group overflow-hidden rounded-3xl border border-[#E7E2DA] bg-white shadow-sm transition-shadow hover:shadow-xl">
              <div className="relative overflow-hidden">
                <img src={g.image} alt={g.title} loading="lazy" className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-700 backdrop-blur">{g.tag}</span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold tracking-tight text-stone-900">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{g.excerpt}</p>
                <p className="font-mono-accent mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-stone-400">
                  <Star size={12} className="text-amber-500" fill="currentColor" /> {g.read_time}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default function Home({ onSearch }) {
  const [products, setProducts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const pet = searchParams.get("pet");
  const category = searchParams.get("category");

  useEffect(() => {
    api.products().then(setProducts).catch(() => {});
    api.guides().then(setGuides).catch(() => {});
    api.categories().then(setCategories).catch(() => {});
    const onPetChange = () => {
      const p = new URL(window.location).searchParams.get("pet");
      setSearchParams(p ? { pet: p } : {});
    };
    window.addEventListener("petchange", onPetChange);
    return () => window.removeEventListener("petchange", onPetChange);
  }, [setSearchParams]);

  const setPet = (p) => {
    const next = {};
    if (p) next.pet = p;
    if (category) next.category = category;
    setSearchParams(next);
  };
  const setCategory = (c) => {
    const next = {};
    if (pet) next.pet = pet;
    if (c) next.category = c;
    setSearchParams(next);
    window.__lenis?.scrollTo("#top-picks", { offset: -90 });
  };

  const filtered = products.filter((p) => (!pet || p.pet === pet) && (!category || p.category === category));

  return (
    <main>
      <Hero onSearch={onSearch} />
      <Marquee />
      <ShopByPet />
      <Categories categories={categories} active={category} onSelect={setCategory} />
      <TopPicks products={filtered} pet={pet} setPet={setPet} category={category} />
      <FeaturedGuides guides={guides} />
      <WhyTrust />
      <LatestGuides guides={guides} />
      <Newsletter />
    </main>
  );
}
