import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Check, X, ChevronLeft, ShoppingBag, Loader2, Truck, ShieldCheck, Minus, Plus, Dog, Cat, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { Reveal, FadeIn } from "../components/Reveal";
import { ProductCard } from "../components/ProductCard";

const LABEL_STYLES = {
  "Best Overall": "bg-amber-100 text-amber-900 border-amber-300",
  "Budget Pick": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "Premium Pick": "bg-stone-900 text-amber-200 border-stone-900",
};

const inr = (n) => `₹ ${n.toLocaleString("en-IN")}`;

const BuyBox = ({ product }) => {
  const { add } = useCart();
  const navigate = useNavigate();
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const [variant, setVariant] = useState(variants.find((v) => v.in_stock !== false) || variants[0] || null);
  const [qty, setQty] = useState(1);
  const soldOut = !variant || variant.in_stock === false;
  const allOut = variants.length === 0 || variants.every((v) => v.in_stock === false);

  const addToCart = () => {
    add(product, variant, qty);
    toast.success(`${product.name} (${variant.label}) added to cart`, {
      action: { label: "View cart", onClick: () => navigate("/cart") },
    });
  };

  const buyNow = () => {
    if (!variant) return;
    add(product, variant, qty);
    navigate("/cart");
  };

  return (
    <div data-testid="product-buy-box" className="rounded-[2rem] border border-[#E7E2DA] bg-white p-6 shadow-[0_2px_20px_-8px_rgba(28,25,23,0.12)] sm:p-7">
      <p className="font-mono-accent text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Pack size</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v.label}
            data-testid={`variant-${v.label.replace(/\s+/g, "-").toLowerCase()}`}
            onClick={() => setVariant(v)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${variant.label === v.label ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-orange-300 hover:text-[#EA580C]"} ${v.in_stock === false ? "line-through opacity-60" : ""}`}
          >
            {v.label} · {inr(v.price)}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-accent text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Total</p>
          <p data-testid="product-total-price" className="font-display mt-1 text-4xl font-black tracking-tight text-stone-900">{variant ? inr(variant.price * qty) : "Unavailable"}</p>
          <p className="mt-1 text-xs text-stone-500">{soldOut ? <span className="font-bold text-red-600">This product is currently unavailable</span> : "Incl. taxes calculated at checkout"}</p>
        </div>
        <div className="flex items-center rounded-full border border-stone-200 bg-[#FAF7F2]">
          <button data-testid="qty-decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 text-stone-600 transition-colors hover:text-[#EA580C]"><Minus size={15} /></button>
          <span data-testid="qty-value" className="font-mono-accent w-8 text-center text-sm font-bold text-stone-900">{qty}</span>
          <button data-testid="qty-increase" onClick={() => setQty((q) => Math.min(10, q + 1))} className="p-3 text-stone-600 transition-colors hover:text-[#EA580C]"><Plus size={15} /></button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          data-testid="add-to-cart-button"
          onClick={addToCart}
          disabled={soldOut}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-stone-900 bg-white px-6 py-4 text-base font-bold text-stone-900 transition-all hover:bg-stone-900 hover:text-white active:scale-[0.98] disabled:opacity-40"
        >
          <ShoppingBag size={18} /> Add to cart
        </button>
        <button
          data-testid="buy-now-button"
          onClick={buyNow}
          disabled={soldOut}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98] disabled:opacity-40"
        >
          {allOut ? "Sold out" : "Buy now"} {!allOut && <ArrowRight size={18} />}
        </button>
      </div>

      <div className="mt-5 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
        <span className="flex items-center gap-2"><Truck size={14} className="text-teal-600" /> Ships across India in 3–5 days</span>
        <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-teal-600" /> Secure checkout by Stripe</span>
      </div>
    </div>
  );
};

const ProsCons = ({ product }) => (
  <div className="grid gap-5 sm:grid-cols-2">
    <div className="rounded-3xl bg-teal-50/60 p-6 ring-1 ring-teal-100">
      <p className="font-mono-accent text-[11px] font-bold uppercase tracking-widest text-teal-700">What we loved</p>
      <ul className="mt-3 space-y-2.5">
        {(product.pros || []).map((pro) => (
          <li key={pro} className="flex gap-2 text-sm text-stone-700"><Check size={15} className="mt-0.5 shrink-0 text-teal-600" />{pro}</li>
        ))}
      </ul>
    </div>
    <div className="rounded-3xl bg-orange-50/60 p-6 ring-1 ring-orange-100">
      <p className="font-mono-accent text-[11px] font-bold uppercase tracking-widest text-orange-700">Worth knowing</p>
      <ul className="mt-3 space-y-2.5">
        {(product.cons || []).map((con) => (
          <li key={con} className="flex gap-2 text-sm text-stone-700"><X size={15} className="mt-0.5 shrink-0 text-orange-500" />{con}</li>
        ))}
      </ul>
    </div>
  </div>
);

export default function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setProduct(null);
    setMissing(false);
    api.product(id)
      .then((p) => {
        setProduct(p);
        // Recommendations are optional. A failed secondary request must not
        // prevent the product the visitor selected from being displayed.
        return api.products({ category: p.category })
          .then((list) => setRelated(list.filter((x) => x.id !== p.id).slice(0, 3)))
          .catch(() => setRelated([]));
      })
      .catch(() => setMissing(true));
  }, [id]);

  if (missing) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <h1 data-testid="product-not-found" className="font-display text-3xl font-bold text-stone-900">We couldn't find that product.</h1>
        <Link to="/#top-picks" className="mt-6 rounded-full bg-stone-900 px-7 py-3.5 font-bold text-white">Back to the picks</Link>
      </main>
    );
  }
  if (!product) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#EA580C]" />
      </main>
    );
  }

  const PetIcon = product.pet === "dog" ? Dog : Cat;

  return (
    <main data-testid="product-page">
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <FadeIn>
          <Link to="/#top-picks" data-testid="product-back-link" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors hover:text-[#EA580C]">
            <ChevronLeft size={16} /> Back to top picks
          </Link>
        </FadeIn>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-[#F4EFEA] shadow-[0_30px_60px_-30px_rgba(28,25,23,0.35)] lg:sticky lg:top-28 lg:aspect-auto lg:h-[calc(100vh-10rem)]"
          >
            <div className="spotlight absolute inset-0 z-10" />
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            {product.label && (
              <span className={`absolute left-6 top-6 z-20 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${LABEL_STYLES[product.label] || "bg-teal-100 text-teal-900 border-teal-300"}`}>
                {product.label}
              </span>
            )}
            <span className="absolute right-6 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm backdrop-blur">
              <PetIcon size={20} />
            </span>
          </motion.div>

          <div className="space-y-8">
            <FadeIn delay={0.1}>
              <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
                {product.brand}{product.food_type ? ` · ${product.food_type}` : ""}
              </p>
              <h1 data-testid="product-name" className="font-display mt-4 text-4xl font-black leading-[1.05] tracking-tight text-stone-900 sm:text-5xl">{product.name}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span data-testid="product-rating" className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1.5 text-sm font-bold text-teal-800 ring-1 ring-teal-200">
                  <Star size={14} className="text-teal-600" fill="currentColor" /> {Number(product.rating || 0).toFixed(1)} / 5
                </span>
                <span className="text-sm text-stone-600"><span className="font-semibold text-stone-800">Best for:</span> {product.best_for}</span>
              </div>
              <p className="mt-5 text-base leading-relaxed text-stone-600 sm:text-lg">{product.key_benefit}. {product.ideal_pet}</p>
            </FadeIn>

            <FadeIn delay={0.2}><BuyBox key={product.id} product={product} /></FadeIn>

            <Reveal><ProsCons product={product} /></Reveal>

            <Reveal>
              <div className="space-y-4 text-sm leading-relaxed text-stone-600">
                {(product.ingredients || []).length > 0 && (
                  <div className="rounded-3xl border border-[#E7E2DA] bg-white p-6">
                    <p className="font-mono-accent text-[11px] font-bold uppercase tracking-widest text-stone-400">First 5 ingredients</p>
                    <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                      {product.ingredients.map((ing, i) => (
                        <li key={ing} className="flex gap-2.5 text-stone-700"><span className="font-mono-accent text-xs font-bold text-orange-400">{String(i + 1).padStart(2, "0")}</span>{ing}</li>
                      ))}
                    </ol>
                  </div>
                )}
                <p className="rounded-3xl bg-[#F4EFEA] px-6 py-5 italic text-stone-600 ring-1 ring-stone-100">
                  <span className="font-bold not-italic text-stone-800">India tip:</span> {product.climate_tip}
                </p>
                <p className="text-xs text-stone-500">Available packs: {product.pack_sizes} · Price range {product.price_range}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-[#E7E2DA] bg-[#F4EFEA]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <Reveal>
              <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Compare with</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">Other picks in this category</h2>
            </Reveal>
            <div data-testid="related-products" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} compact />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
