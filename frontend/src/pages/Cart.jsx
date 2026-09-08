import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, Lock, ArrowRight, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api, errMsg } from "../lib/api";
import { FadeIn } from "../components/Reveal";

const inr = (n) => `₹ ${n.toLocaleString("en-IN")}`;
const input = "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:outline-none focus:ring-4 focus:ring-orange-100";

const EMPTY = { name: "", phone: "", email: "", line1: "", line2: "", city: "", state: "", pincode: "" };

const CartLine = ({ item, lineKey, setQty, remove }) => {
  const key = lineKey(item);
  const slug = key.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return (
    <div data-testid={`cart-line-${slug}`} className="flex gap-4 rounded-3xl border border-[#E7E2DA] bg-white p-4 sm:p-5">
      <Link to={`/products/${item.product_id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#F4EFEA]">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-mono-accent text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">{item.brand}</p>
        <Link to={`/products/${item.product_id}`} className="font-display truncate text-base font-bold text-stone-900 hover:text-[#EA580C]">{item.name}</Link>
        <p className="text-sm text-stone-500">{item.variant} · {inr(item.price)} each</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center rounded-full border border-stone-200 bg-[#FAF7F2]">
            <button data-testid={`cart-qty-decrease-${slug}`} onClick={() => setQty(key, item.quantity - 1)} className="p-2 text-stone-600 hover:text-[#EA580C]"><Minus size={14} /></button>
            <span data-testid={`cart-qty-${slug}`} className="font-mono-accent w-7 text-center text-sm font-bold">{item.quantity}</span>
            <button data-testid={`cart-qty-increase-${slug}`} onClick={() => setQty(key, item.quantity + 1)} className="p-2 text-stone-600 hover:text-[#EA580C]"><Plus size={14} /></button>
          </div>
          <p className="font-mono-accent font-bold text-stone-900">{inr(item.price * item.quantity)}</p>
          <button data-testid={`cart-remove-${slug}`} onClick={() => remove(key)} className="rounded-full p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600" aria-label="Remove">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Cart() {
  const { items, subtotal, count, setQty, remove, lineKey } = useCart();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [ship, setShip] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setShip((s) => ({ ...s, name: s.name || user.name || "", phone: s.phone || user.phone || "", email: s.email || user.email || "" }));
  }, [user]);

  const set = (k) => (e) => setShip((s) => ({ ...s, [k]: e.target.value }));

  const pay = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login?next=/cart");
      return;
    }
    setBusy(true);
    try {
      const data = await api.cartCheckout({
        items: items.map(({ product_id, variant, quantity }) => ({ product_id, variant, quantity })),
        shipping: ship,
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  const payUpi = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login?next=/cart");
      return;
    }
    setBusy(true);
    try {
      const data = await api.cartCheckoutUpi({
        items: items.map(({ product_id, variant, quantity }) => ({ product_id, variant, quantity })),
        shipping: ship,
        origin_url: window.location.origin,
      });
      // Navigate to UPI payment page instead of direct link
      navigate(`/payment/upi/${data.order_id}`, { state: { upiLink: data.upi_link, amount: data.amount } });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200"><ShoppingBag size={28} /></span>
        <h1 data-testid="cart-empty" className="font-display mt-6 text-3xl font-bold tracking-tight text-stone-900">Your cart is empty.</h1>
        <p className="mt-3 text-stone-500">Every pick we recommend is ready to ship across India.</p>
        <Link to="/#top-picks" data-testid="cart-browse-link" className="mt-8 rounded-full bg-[#EA580C] px-7 py-3.5 font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-95">Browse top picks</Link>
      </main>
    );
  }

  return (
    <main data-testid="cart-page" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <FadeIn>
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Checkout</p>
        <h1 className="font-display mt-3 text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">Your cart <span className="text-stone-400">({count})</span></h1>
      </FadeIn>

      <form onSubmit={pay} className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {items.map((item) => <CartLine key={lineKey(item)} item={item} lineKey={lineKey} setQty={setQty} remove={remove} />)}

          <div className="mt-8 rounded-[2rem] border border-[#E7E2DA] bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-200"><Truck size={18} /></span>
              <h2 className="font-display text-xl font-bold text-stone-900">Delivery details</h2>
            </div>
            {!user && ready && (
              <p data-testid="cart-login-notice" className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
                You'll need to <Link to="/login?next=/cart" className="font-bold underline underline-offset-2">log in with your mobile</Link> before paying — it takes 10 seconds.
              </p>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input data-testid="ship-name" className={input} placeholder="Full name" value={ship.name} onChange={set("name")} required minLength={2} />
              <input data-testid="ship-phone" className={input} placeholder="Mobile number" value={ship.phone} onChange={set("phone")} required minLength={10} />
              <input data-testid="ship-email" className={`${input} sm:col-span-2`} type="email" placeholder="Email for order confirmation" value={ship.email} onChange={set("email")} required />
              <input data-testid="ship-line1" className={`${input} sm:col-span-2`} placeholder="Flat / house no., street" value={ship.line1} onChange={set("line1")} required minLength={3} />
              <input data-testid="ship-line2" className={`${input} sm:col-span-2`} placeholder="Area, landmark (optional)" value={ship.line2} onChange={set("line2")} />
              <input data-testid="ship-city" className={input} placeholder="City" value={ship.city} onChange={set("city")} required />
              <input data-testid="ship-state" className={input} placeholder="State" value={ship.state} onChange={set("state")} required />
              <input data-testid="ship-pincode" className={input} placeholder="PIN code" inputMode="numeric" pattern="\d{6}" value={ship.pincode} onChange={set("pincode")} required />
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] border border-[#E7E2DA] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(28,25,23,0.3)] sm:p-7">
            <h2 className="font-display text-xl font-bold text-stone-900">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm text-stone-600">
              {items.map((i) => (
                <div key={lineKey(i)} className="flex justify-between gap-4">
                  <dt className="truncate">{i.name} <span className="text-stone-400">× {i.quantity}</span></dt>
                  <dd className="font-mono-accent shrink-0 font-bold text-stone-900">{inr(i.price * i.quantity)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-stone-100 pt-3">
                <dt>Shipping</dt><dd className="font-bold text-teal-700">Free</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-end justify-between border-t border-stone-200 pt-5">
              <span className="font-mono-accent text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Total</span>
              <span data-testid="cart-subtotal" className="font-display text-4xl font-black tracking-tight text-stone-900">{inr(subtotal)}</span>
            </div>
            <p className="mt-1 text-right text-xs text-stone-400">Taxes calculated at checkout</p>
            <button data-testid="cart-pay-upi-button" type="button" onClick={payUpi} disabled={busy || !ready} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98] disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : user ? <Lock size={18} /> : <ArrowRight size={18} />}
              {busy ? "Opening UPI app…" : user ? `Pay ${inr(subtotal)} via UPI` : "Log in to pay"}
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-stone-400 uppercase tracking-wider">or</span>
              </div>
            </div>
            <button data-testid="cart-pay-button" type="submit" disabled={busy || !ready} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-6 py-4 text-base font-bold text-stone-900 shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.98] disabled:opacity-60">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {busy ? "Opening checkout…" : user ? `Pay with Card` : "Log in to pay"}
            </button>
            <p className="mt-4 text-center text-xs text-stone-400">UPI: PhonePe, GPay, Paytm • Card: Secure by Stripe</p>
          </div>
        </aside>
      </form>
    </main>
  );
}
