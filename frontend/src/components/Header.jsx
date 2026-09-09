import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PawPrint, Search, Menu, X } from "lucide-react";
import { HeaderActions } from "./HeaderActions";
import { DeliveryLocation } from "./DeliveryLocation";

export const Header = ({ onSearch }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const goPet = (pet) => {
    setOpen(false);
    navigate(`/?pet=${pet}#top-picks`);
    setTimeout(() => window.__lenis?.scrollTo("#top-picks", { offset: -90 }), 60);
  };

  const goAnchor = (hash) => {
    setOpen(false);
    navigate(`/${hash}`);
    setTimeout(() => window.__lenis?.scrollTo(hash, { offset: -90 }), 60);
  };

  const navLink =
    "text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer";

  return (
    <header data-testid="main-navbar" className="sticky top-0 z-50 border-b border-[#E7E2DA]/80 bg-[#FAF7F2]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link to="/" data-testid="nav-home-link" className="group flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EA580C] text-white shadow-md shadow-orange-600/20 transition-transform duration-300 group-hover:-rotate-12">
            <PawPrint size={20} strokeWidth={2.4} />
          </span>
          <span className="leading-none">
            <span className="font-display block text-lg font-bold tracking-tight text-stone-900">
              Paws <span className="text-[#EA580C]">&amp;</span> Whiskers
            </span>
            <span className="font-mono-accent text-[10px] font-bold uppercase tracking-[0.35em] text-teal-700">India</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <button data-testid="nav-dogs-link" onClick={() => goPet("dog")} className={navLink}>Dogs</button>
          <button data-testid="nav-cats-link" onClick={() => goPet("cat")} className={navLink}>Cats</button>
          <button data-testid="nav-reviews-link" onClick={() => goAnchor("#top-picks")} className={navLink}>Reviews</button>
          <Link data-testid="nav-cat-food-article-link" to="/guides/best-cat-food-india-2026" className={navLink}>Guides</Link>
          <button data-testid="nav-deals-link" onClick={() => goAnchor("#top-picks")} className={navLink}>Deals</button>
          <button data-testid="nav-support-link" onClick={() => goAnchor("#support")} className="rounded-full bg-[#EA580C] px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#C2410C] active:scale-95">Support us</button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            data-testid="header-search-trigger"
            onClick={onSearch}
            className="flex items-center gap-2.5 rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-sm text-stone-400 shadow-sm transition-colors hover:border-orange-300 hover:text-stone-600"
          >
            <Search size={15} />
            <span className="hidden xl:inline">Search picks &amp; guides</span>
            <kbd className="font-mono-accent hidden rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-bold text-stone-500 xl:inline">/</kbd>
          </button>
          <DeliveryLocation />
          <HeaderActions />
          <button data-testid="mobile-menu-button" onClick={() => setOpen(!open)} className="rounded-full p-2 text-stone-700 lg:hidden">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-stone-200/70 bg-[#FAF7F2] px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3 text-base font-semibold text-stone-700">
            <button onClick={() => goPet("dog")} className="text-left">Dogs</button>
            <button onClick={() => goPet("cat")} className="text-left">Cats</button>
            <button onClick={() => goAnchor("#top-picks")} className="text-left">Reviews</button>
            <Link to="/guides/best-cat-food-india-2026" onClick={() => setOpen(false)}>Guides</Link>
            <button onClick={() => goAnchor("#top-picks")} className="text-left">Deals</button>
          </div>
        </div>
      )}
    </header>
  );
};
