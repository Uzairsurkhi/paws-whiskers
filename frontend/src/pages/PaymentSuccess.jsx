import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle, Mail } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

const inr = (paise) => `₹ ${(paise / 100).toLocaleString("en-IN")}`;

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState("polling");
  const [result, setResult] = useState(null);
  const { clear } = useCart();

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      return;
    }
    let attempts = 0;
    const tick = async () => {
      try {
        const data = await api.paymentStatus(sessionId);
        if (data.payment_status === "paid") {
          setResult(data);
          setState("paid");
          if (data.kind === "order") clear();
          return;
        }
      } catch {}
      attempts += 1;
      if (attempts < 15) setTimeout(tick, 2000);
      else setState("timeout");
    };
    tick();
  }, [sessionId, clear]);

  const order = result?.order;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
      {state === "polling" && (
        <>
          <Loader2 size={48} className="animate-spin text-[#EA580C]" />
          <h1 className="font-display mt-6 text-3xl font-bold text-stone-900">Confirming your payment…</h1>
          <p className="mt-3 text-stone-500">Hold tight, we're checking with Stripe.</p>
        </>
      )}
      {state === "paid" && result.kind === "order" && (
        <div data-testid="order-success-message" className="w-full">
          <CheckCircle2 size={56} className="mx-auto text-teal-600" />
          <h1 className="font-display mt-6 text-4xl font-black tracking-tight text-stone-900">Order confirmed!</h1>
          {order && (
            <>
              <p className="mt-4 leading-relaxed text-stone-600">
                Order <span data-testid="order-success-id" className="font-mono-accent font-bold text-stone-900">#{order.id.slice(0, 8).toUpperCase()}</span> is being packed for {order.shipping.name.split(" ")[0]} and ships to {order.shipping.city} in 3–5 days.
              </p>
              <ul data-testid="order-success-items" className="mt-6 divide-y divide-stone-100 rounded-3xl border border-[#E7E2DA] bg-white text-left">
                {order.items.map((i) => (
                  <li key={`${i.product_id}-${i.variant}`} className="flex items-center gap-3 px-5 py-3">
                    <img src={i.image} alt="" className="h-10 w-10 rounded-xl object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-stone-900">{i.name}</span>
                      <span className="block text-xs text-stone-500">{i.variant} × {i.quantity}</span>
                    </span>
                    <span className="font-mono-accent text-sm font-bold">{inr(i.unit_price * i.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between px-5 py-3 font-bold text-stone-900"><span>Subtotal</span><span className="font-mono-accent">{inr(order.subtotal)}</span></li>
              </ul>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500"><Mail size={14} /> Confirmation sent to {order.shipping.email}</p>
            </>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/orders" data-testid="order-success-orders-link" className="rounded-full bg-[#EA580C] px-7 py-3.5 font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-95">Track my order</Link>
            <Link to="/" data-testid="order-success-home-link" className="rounded-full bg-stone-900 px-7 py-3.5 font-bold text-white transition-all hover:bg-stone-700 active:scale-95">Keep browsing</Link>
          </div>
        </div>
      )}
      {state === "paid" && result.kind !== "order" && (
        <div data-testid="payment-success-message">
          <CheckCircle2 size={56} className="mx-auto text-teal-600" />
          <h1 className="font-display mt-6 text-4xl font-black tracking-tight text-stone-900">You're a gem. Thank you!</h1>
          <p className="mt-4 leading-relaxed text-stone-600">
            Your support keeps Paws &amp; Whiskers India independent — every rupee goes into testing more products for Indian pets.
          </p>
          <Link to="/" data-testid="payment-success-home-link" className="mt-8 inline-block rounded-full bg-[#EA580C] px-7 py-3.5 font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-95">
            Back to the picks
          </Link>
        </div>
      )}
      {(state === "error" || state === "timeout") && (
        <div data-testid="payment-pending-message">
          <Loader2 size={48} className="mx-auto animate-spin text-stone-300" />
          <h1 className="font-display mt-6 text-3xl font-bold text-stone-900">Still confirming…</h1>
          <p className="mt-3 text-stone-500">Payment confirmations can lag a moment. If you completed checkout, you're all set — check back shortly.</p>
          <Link to="/" className="mt-8 inline-block rounded-full bg-stone-900 px-7 py-3.5 font-bold text-white">Back home</Link>
        </div>
      )}
    </main>
  );
}

export function PaymentCancel() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
      <div data-testid="payment-cancel-message">
        <XCircle size={56} className="mx-auto text-stone-300" />
        <h1 className="font-display mt-6 text-3xl font-bold tracking-tight text-stone-900">No worries — cancelled.</h1>
        <p className="mt-4 leading-relaxed text-stone-600">Nothing was charged. The picks and guides are free, always.</p>
        <Link to="/" data-testid="payment-cancel-home-link" className="mt-8 inline-block rounded-full bg-stone-900 px-7 py-3.5 font-bold text-white transition-all hover:bg-stone-800 active:scale-95">
          Back to the picks
        </Link>
      </div>
    </main>
  );
}
