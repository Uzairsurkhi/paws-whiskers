import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-[#E7E2DA] bg-[#F4EFEA]">
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EA580C] text-white">
              <PawPrint size={17} strokeWidth={2.4} />
            </span>
            <span className="font-display text-lg font-bold text-stone-900">Paws &amp; Whiskers India</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-500">
            Honest, independent guides to food, toys, grooming and essentials for Indian dogs and cats. We buy every product we test.
          </p>
          <p className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs leading-relaxed text-orange-900">
            Every product we recommend is sold right here, at honest ₹ prices. Brands cannot pay for rankings, labels or scores.
          </p>
        </div>
        <div>
          <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.25em] text-stone-400">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold text-stone-600">
            <li><Link to="/guides/best-cat-food-india-2026" className="hover:text-[#EA580C]">Best Cat Food 2026</Link></li>
            <li><Link to="/?pet=dog#top-picks" className="hover:text-[#EA580C]">Dog Picks</Link></li>
            <li><Link to="/?pet=cat#top-picks" className="hover:text-[#EA580C]">Cat Picks</Link></li>
            <li><Link to="/#featured-guides" className="hover:text-[#EA580C]">All Guides</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.25em] text-stone-400">Popular categories</p>
          <ul className="mt-4 grid grid-cols-2 gap-2.5 text-sm font-semibold text-stone-600">
            {["Dog Food", "Cat Food", "Grooming", "Toys", "Beds", "Litter", "Harnesses", "Treats"].map((c) => (
              <li key={c}><Link to="/#categories" className="hover:text-[#EA580C]">{c}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-stone-200 pt-6 text-xs text-stone-400 sm:flex-row">
        <p>© 2026 Paws &amp; Whiskers India. Made with love for four-legged family.</p>
        <p className="font-mono-accent uppercase tracking-widest">Mumbai · Bengaluru · Delhi</p>
      </div>
    </div>
  </footer>
);
