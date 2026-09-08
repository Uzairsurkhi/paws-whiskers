import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ArrowUpRight, FileText, Package } from "lucide-react";
import { api } from "../lib/api";

export const SearchModal = ({ open, onClose }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ products: [], guides: [] });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ("");
      setResults({ products: [], guides: [] });
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) {
      setResults({ products: [], guides: [] });
      return;
    }
    const t = setTimeout(() => api.search(q).then(setResults).catch(() => {}), 200);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openGuide = (guide) => {
    onClose();
    if (guide.live) navigate(`/guides/${guide.slug}`);
  };

  const hasResults = results.products.length > 0 || results.guides.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="search-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-stone-900/50 px-4 pt-24 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-[#FAF7F2] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-4">
              <Search size={18} className="text-stone-400" />
              <input
                ref={inputRef}
                data-testid="site-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='What are you looking for? e.g. "best cat food for kittens"'
                className="flex-1 bg-transparent text-base text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
              <button onClick={onClose} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-3">
              {q.trim().length < 2 && (
                <div className="p-4">
                  <p className="font-mono-accent text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">Popular right now</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Royal Canin", "Farmina", "Cat litter", "Harness", "Budget dog food", "Wet food"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setQ(t)}
                        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-colors hover:border-orange-300 hover:text-[#EA580C]"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {q.trim().length >= 2 && !hasResults && (
                <p className="p-6 text-center text-sm text-stone-500">No matches for “{q}” yet — try a brand or category.</p>
              )}

              {results.products.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-1 font-mono-accent text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">Products</p>
                  {results.products.map((p) => (
                    <a
                      key={p.id}
                      data-testid={`search-result-product-${p.id}`}
                      href={p.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-orange-50"
                    >
                      <img src={p.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-stone-900">{p.name}</span>
                        <span className="block text-xs text-stone-500">{p.price_range} · ★ {p.rating.toFixed(1)}</span>
                      </span>
                      <ArrowUpRight size={16} className="text-[#EA580C]" />
                    </a>
                  ))}
                </div>
              )}

              {results.guides.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-1 font-mono-accent text-[11px] font-bold uppercase tracking-[0.25em] text-stone-400">Guides</p>
                  {results.guides.map((g) => (
                    <button
                      key={g.slug}
                      data-testid={`search-result-guide-${g.slug}`}
                      onClick={() => openGuide(g)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-teal-50"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                        <FileText size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-stone-900">{g.title}</span>
                        <span className="block text-xs text-stone-500">{g.live ? g.read_time : "Coming soon"}</span>
                      </span>
                      {g.live && <Package size={0} className="hidden" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
