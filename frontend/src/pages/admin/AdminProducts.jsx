import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, Star } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../../lib/api";

const input = "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-orange-100";
const LABELS = ["", "Best Overall", "Budget Pick", "Premium Pick"];

const ProductEditor = ({ product, onSaved }) => {
  const [form, setForm] = useState({
    variants: product.variants,
    label: product.label || "",
    best_for: product.best_for,
    key_benefit: product.key_benefit,
    featured: product.featured,
    rating: product.rating,
  });
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify({ variants: product.variants, label: product.label || "", best_for: product.best_for, key_benefit: product.key_benefit, featured: product.featured, rating: product.rating });

  const setVariant = (i, k, v) => setForm((f) => ({ ...f, variants: f.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { label: "", price: 0, in_stock: true }] }));
  const removeVariant = (i) => setForm((f) => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }));

  const save = async () => {
    setBusy(true);
    try {
      const body = { ...form, label: form.label || null, rating: Number(form.rating), variants: form.variants.map((v) => ({ ...v, price: Number(v.price) })) };
      const updated = await api.admin.updateProduct(product.id, body);
      onSaved(updated);
      toast.success(`${product.name} saved`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const allOut = form.variants.every((v) => !v.in_stock);

  return (
    <article data-testid={`admin-product-${product.id}`} className="rounded-3xl border border-[#E7E2DA] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <img src={product.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-mono-accent text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{product.brand} · {product.pet} · {product.category}</p>
          <h3 className="font-display text-lg font-bold text-stone-900">{product.name}</h3>
          <p className="text-xs text-stone-500">Shown as <span className="font-mono-accent font-bold text-stone-700">{product.price_range}</span>{allOut && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">OUT OF STOCK</span>}</p>
        </div>
        <button data-testid={`admin-save-${product.id}`} onClick={save} disabled={busy || !dirty} className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-stone-700 active:scale-95 disabled:opacity-40">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_120px_110px]">
        <input data-testid={`admin-best-for-${product.id}`} className={input} value={form.best_for} onChange={(e) => setForm({ ...form, best_for: e.target.value })} placeholder="Best for" />
        <input className={input} value={form.key_benefit} onChange={(e) => setForm({ ...form, key_benefit: e.target.value })} placeholder="Key benefit" />
        <select data-testid={`admin-label-${product.id}`} className={input} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
          {LABELS.map((l) => <option key={l} value={l}>{l || "No label"}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <Star size={14} className="text-teal-600" />
          <input type="number" step="0.1" min="0" max="5" className={input} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-[1fr_130px_100px_36px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          <span>Pack size</span><span>Price (₹)</span><span>Stock</span><span />
        </div>
        {form.variants.map((v, i) => (
          <div key={i} className="grid grid-cols-[1fr_130px_100px_36px] items-center gap-2">
            <input data-testid={`admin-variant-label-${product.id}-${i}`} className={input} value={v.label} onChange={(e) => setVariant(i, "label", e.target.value)} placeholder="e.g. 1.5 kg" />
            <input data-testid={`admin-variant-price-${product.id}-${i}`} type="number" min="1" className={`${input} font-mono-accent`} value={v.price} onChange={(e) => setVariant(i, "price", e.target.value)} />
            <button
              type="button"
              data-testid={`admin-variant-stock-${product.id}-${i}`}
              onClick={() => setVariant(i, "in_stock", !v.in_stock)}
              className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 transition-colors ${v.in_stock ? "bg-teal-50 text-teal-800 ring-teal-200" : "bg-red-50 text-red-700 ring-red-200"}`}
            >
              {v.in_stock ? "In stock" : "Sold out"}
            </button>
            <button type="button" onClick={() => removeVariant(i)} disabled={form.variants.length === 1} className="rounded-xl p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 size={15} /></button>
          </div>
        ))}
        <button type="button" data-testid={`admin-add-variant-${product.id}`} onClick={addVariant} disabled={form.variants.length >= 8} className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#EA580C] disabled:opacity-40"><Plus size={14} /> Add pack size</button>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" data-testid={`admin-featured-${product.id}`} checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 accent-[#EA580C]" />
        Show in Top Picks on the home page
      </label>
    </article>
  );
};

export const AdminProducts = () => {
  const [products, setProducts] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.admin.products().then(setProducts).catch((e) => toast.error(errMsg(e)));
  }, []);

  const shown = products?.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div data-testid="admin-products">
      <input data-testid="admin-products-search" className={`${input} max-w-sm`} placeholder="Filter products…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-6 space-y-4">
        {products === null && <Loader2 size={28} className="mx-auto animate-spin text-[#EA580C]" />}
        {shown?.map((p) => (
          <ProductEditor key={p.id} product={p} onSaved={(u) => setProducts((ps) => ps.map((x) => (x.id === u.id ? u : x)))} />
        ))}
      </div>
    </div>
  );
};
