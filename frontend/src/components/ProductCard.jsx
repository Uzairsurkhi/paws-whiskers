import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, ArrowRight, Dog, Cat } from "lucide-react";

const LABEL_STYLES = {
  "Best Overall": "bg-amber-100 text-amber-900 border-amber-300",
  "Budget Pick": "bg-emerald-100 text-emerald-900 border-emerald-300",
  "Premium Pick": "bg-stone-900 text-amber-200 border-stone-900",
};

export const ProductCard = ({ product, index = 0, compact = false }) => (
  <motion.article
    data-testid={`product-card-${product.id}`}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -6 }}
    className="group flex flex-col overflow-hidden rounded-3xl border border-[#E7E2DA] bg-white shadow-[0_2px_20px_-8px_rgba(28,25,23,0.12)] transition-shadow duration-300 hover:shadow-[0_24px_50px_-20px_rgba(234,88,12,0.28)]"
  >
    <Link to={`/products/${product.id}`} data-testid={`product-image-link-${product.id}`} className="relative block h-52 overflow-hidden bg-[#F4EFEA]">
      <div className="spotlight absolute inset-0 z-10" />
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      {product.label && (
        <span className={`absolute left-4 top-4 z-20 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${LABEL_STYLES[product.label] || "bg-teal-100 text-teal-900 border-teal-300"}`}>
          {product.label}
        </span>
      )}
      <span className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm backdrop-blur">
        {product.pet === "dog" ? <Dog size={17} /> : <Cat size={17} />}
      </span>
    </Link>

    <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
      <div>
        <p className="font-mono-accent text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">{product.brand}</p>
        <h3 className="font-display mt-1 text-lg font-bold leading-snug tracking-tight text-stone-900">
          <Link to={`/products/${product.id}`} className="transition-colors hover:text-[#EA580C]">{product.name}</Link>
        </h3>
      </div>

      <div className="space-y-1.5 text-sm text-stone-600">
        <p><span className="font-semibold text-stone-800">Best for:</span> {product.best_for}</p>
        <p>
          <span className="font-semibold text-stone-800">Price range:</span>{" "}
          <span className="font-mono-accent font-bold text-stone-900">{product.price_range}</span>
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span data-testid={`product-rating-${product.id}`} className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-800 ring-1 ring-teal-200">
          <Star size={14} className="text-teal-600" fill="currentColor" />
          {product.rating.toFixed(1)}
        </span>
        <Link
          data-testid={`view-product-button-${product.id}`}
          to={`/products/${product.id}`}
          className="flex items-center gap-1.5 rounded-xl bg-[#EA580C] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#C2410C] hover:shadow-md active:scale-95"
        >
          View & Buy <ArrowRight size={15} />
        </Link>
      </div>
      {!compact && (
        <p className="text-xs leading-relaxed text-stone-500">{product.key_benefit}</p>
      )}
    </div>
  </motion.article>
);
