import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState("polling");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      return;
    }
    let attempts = 0;
    const tick = async () => {
      try {
        const { data } = await axios.get(`${API}/payments/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setOrder(data);
          setState("paid");
          return;
        }
      } catch {}
      attempts += 1;
      if (attempts < 15) setTimeout(tick, 2000);
      else setState("timeout");
    };
    tick();
  }, [sessionId]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
      {state === "polling" && (
        <>
          <Loader2 size={48} className="animate-spin text-[#EA580C]" />
          <h1 className="font-display mt-6 text-3xl font-bold text-stone-900">Confirming your payment…</h1>
          <p className="mt-3 text-stone-500">Hold tight, we're checking with Stripe.</p>
        </>
      )}
      {state === "paid" && order?.kind === "order" && (
        <div data-testid="order-success-message">
          <CheckCircle2 size={56} className="mx-auto text-teal-600" />
          <h1 className="font-display mt-6 text-4xl font-black tracking-tight text-stone-900">Order confirmed!</h1>
          <p className="mt-4 leading-relaxed text-stone-600">
            <span className="font-bold text-stone-900">{order.product_name}</span> · {order.variant} × {order.quantity} is on its way to your pet. We'll email you tracking details shortly.
          </p>
          <Link to="/" data-testid="order-success-home-link" className="mt-8 inline-block rounded-full bg-[#EA580C] px-7 py-3.5 font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-95">
            Keep browsing
          </Link>
        </div>
      )}
      {state === "paid" && order?.kind !== "order" && (
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
