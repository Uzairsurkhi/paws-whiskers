import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Loader2, CheckCircle2, Clock } from "lucide-react";
import { api } from "../lib/api";
import { FadeIn } from "../components/Reveal";

const inr = (paise) => `₹ ${(paise / 100).toLocaleString("en-IN")}`;
const STEPS = ["new", "packed", "shipped", "delivered"];
const LABELS = { new: "Order received", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

const Progress = ({ status }) => {
  if (status === "cancelled") return <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200">Cancelled</span>;
  const idx = STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= idx ? "bg-teal-600 text-white" : "bg-stone-100 text-stone-400"}`}>{i + 1}</span>
          <span className={`hidden text-xs font-semibold sm:inline ${i <= idx ? "text-stone-800" : "text-stone-400"}`}>{LABELS[s]}</span>
          {i < STEPS.length - 1 && <span className={`h-px w-6 ${i < idx ? "bg-teal-600" : "bg-stone-200"}`} />}
        </li>
      ))}
    </ol>
  );
};

export const OrderCard = ({ order, admin = false, children }) => (
  <article data-testid={`order-card-${order.id}`} className="rounded-3xl border border-[#E7E2DA] bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-mono-accent text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Order #{order.id.slice(0, 8).toUpperCase()}</p>
        <p className="mt-1 text-sm text-stone-500">{new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
      </div>
      <div className="flex items-center gap-2">
        {order.payment_status === "paid" ? (
          <span data-testid={`order-paid-badge-${order.id}`} className="flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 ring-1 ring-teal-200"><CheckCircle2 size={13} /> Paid</span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold capitalize text-stone-600"><Clock size={13} /> {order.payment_status}</span>
        )}
        <span className="font-mono-accent text-lg font-bold text-stone-900">{inr(order.subtotal)}</span>
      </div>
    </div>
    <ul className="mt-4 divide-y divide-stone-100">
      {order.items.map((i) => (
        <li key={`${i.product_id}-${i.variant}`} className="flex items-center gap-3 py-2.5">
          <img src={i.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-stone-900">{i.name}</p>
            <p className="text-xs text-stone-500">{i.variant} × {i.quantity}</p>
          </div>
          <span className="font-mono-accent text-sm font-bold text-stone-700">{inr(i.unit_price * i.quantity)}</span>
        </li>
      ))}
    </ul>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-4">
      {order.payment_status === "paid" ? <Progress status={order.fulfillment_status} /> : <span className="text-xs text-stone-400">Awaiting payment</span>}
      <p className="text-xs text-stone-500">
        {admin ? `${order.shipping.name} · ${order.shipping.phone} · ${order.shipping.email}` : `Ships to ${order.shipping.city}, ${order.shipping.pincode}`}
      </p>
    </div>
    {admin && (
      <p className="mt-2 text-xs text-stone-500">
        {[order.shipping.line1, order.shipping.line2, order.shipping.city, order.shipping.state, order.shipping.pincode].filter(Boolean).join(", ")}
      </p>
    )}
    {children}
  </article>
);

export default function Orders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.myOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <main data-testid="orders-page" className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <FadeIn>
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Account</p>
        <h1 className="font-display mt-3 text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">My orders</h1>
      </FadeIn>
      <div className="mt-10 space-y-5">
        {orders === null && <Loader2 size={32} className="mx-auto animate-spin text-[#EA580C]" />}
        {orders?.length === 0 && (
          <div data-testid="orders-empty" className="rounded-3xl border border-dashed border-stone-300 p-12 text-center">
            <Package size={32} className="mx-auto text-stone-300" />
            <p className="mt-4 text-stone-500">No orders yet. Your pet's next favourite thing is a click away.</p>
            <Link to="/#top-picks" className="mt-6 inline-block rounded-full bg-[#EA580C] px-6 py-3 text-sm font-bold text-white">Browse picks</Link>
          </div>
        )}
        {orders?.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>
    </main>
  );
}
