import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Smartphone, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../lib/api";
import { useCart } from "../context/CartContext";

const inr = (n) => `₹ ${n.toLocaleString("en-IN")}`;

export default function UpiPayment() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { clear } = useCart();
  const [step, setStep] = useState("pay"); // pay, verify, success
  const [txnId, setTxnId] = useState("");
  const [busy, setBusy] = useState(false);

  const upiLink = location.state?.upiLink || "";
  const amount = location.state?.amount || 0;

  useEffect(() => {
    if (!upiLink) {
      navigate("/cart");
    }
  }, [upiLink, navigate]);

  const openUpiApp = () => {
    // Skip UPI app opening, just show instructions
    setStep("verify");
  };

  const verifyPayment = async (e) => {
    e.preventDefault();
    if (txnId.length < 8) {
      toast.error("Please enter a valid UPI transaction ID");
      return;
    }
    setBusy(true);
    try {
      await api.verifyUpiPayment(orderId, txnId);
      setStep("success");
      clear();
      toast.success("Payment verification submitted!");
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  if (step === "success") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 text-teal-600 ring-1 ring-teal-200">
          <CheckCircle2 size={40} />
        </span>
        <h1 className="font-display mt-6 text-3xl font-bold tracking-tight text-stone-900">
          Payment Verification Submitted
        </h1>
        <p className="mt-3 max-w-md text-stone-600">
          We've received your payment details. Your order will be confirmed once we verify the payment (usually within a few hours).
        </p>
        <button
          onClick={() => navigate("/orders")}
          className="mt-8 rounded-full bg-[#EA580C] px-7 py-3.5 font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-95"
        >
          View My Orders
        </button>
      </main>
    );
  }

  if (step === "verify") {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <div className="rounded-[2rem] border border-[#E7E2DA] bg-white p-8 shadow-lg">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200">
            <Smartphone size={24} />
          </span>
          <h1 className="font-display mt-6 text-2xl font-bold tracking-tight text-stone-900">
            Enter Transaction ID
          </h1>
          <p className="mt-2 text-stone-600">
            After completing payment in your UPI app, enter the UPI Transaction ID (UTR) below:
          </p>

          <form onSubmit={verifyPayment} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                UPI Transaction ID / UTR Number
              </label>
              <input
                type="text"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="e.g., 123456789012"
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:outline-none focus:ring-4 focus:ring-orange-100"
                required
                minLength={8}
              />
              <p className="mt-2 text-xs text-stone-500">
                You can find this in your UPI app's transaction history
              </p>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {busy ? "Verifying..." : "Submit for Verification"}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            <strong>Note:</strong> Your order will be confirmed after we verify your payment. This usually takes a few hours.
          </div>
        </div>
      </main>
    );
  }

  const openUpiWithApp = (app) => {
    const upiId = "usurkhi8@oksbi";
    const name = "Paws & Whiskers India";
    const amountStr = amount.toFixed(2);
    const note = `Order ${orderId}`;

    let deepLink = "";

    switch(app) {
      case "gpay":
        // Google Pay deep link
        deepLink = `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountStr}&tn=${encodeURIComponent(note)}&cu=INR`;
        break;
      case "phonepe":
        // PhonePe deep link
        deepLink = `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountStr}&tn=${encodeURIComponent(note)}&cu=INR`;
        break;
      case "paytm":
        // Paytm deep link
        deepLink = `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amountStr}&tn=${encodeURIComponent(note)}&cu=INR`;
        break;
      default:
        // Generic UPI intent
        deepLink = upiLink;
    }

    // Try to open the app
    window.location.href = deepLink;

    // After 3 seconds, show verify step
    setTimeout(() => {
      setStep("verify");
    }, 3000);
  };

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <div className="rounded-[2rem] border border-[#E7E2DA] bg-white p-8 shadow-lg">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200">
          <Smartphone size={24} />
        </span>
        <h1 className="font-display mt-6 text-2xl font-bold tracking-tight text-stone-900">
          Choose Payment App
        </h1>
        <p className="mt-2 text-stone-600">
          Select your preferred UPI app to complete the payment
        </p>

        <div className="mt-6 rounded-xl bg-stone-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600">Amount to pay</span>
            <span className="font-display text-2xl font-bold text-stone-900">{inr(amount)}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {/* Google Pay */}
          <button
            onClick={() => openUpiWithApp("gpay")}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-stone-200 bg-white p-5 transition-all hover:border-[#EA580C] hover:bg-orange-50 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <svg viewBox="0 0 48 48" className="h-8 w-8">
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-stone-900">Google Pay</div>
              <div className="text-xs text-stone-500">Pay using GPay</div>
            </div>
            <ArrowRight size={20} className="text-stone-400" />
          </button>

          {/* PhonePe */}
          <button
            onClick={() => openUpiWithApp("phonepe")}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-stone-200 bg-white p-5 transition-all hover:border-[#EA580C] hover:bg-orange-50 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5f259f] shadow-sm">
              <span className="text-2xl font-bold text-white">Pe</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-stone-900">PhonePe</div>
              <div className="text-xs text-stone-500">Pay using PhonePe</div>
            </div>
            <ArrowRight size={20} className="text-stone-400" />
          </button>

          {/* Paytm */}
          <button
            onClick={() => openUpiWithApp("paytm")}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-stone-200 bg-white p-5 transition-all hover:border-[#EA580C] hover:bg-orange-50 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00BAF2] shadow-sm">
              <span className="text-xl font-bold text-white">₹</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-stone-900">Paytm</div>
              <div className="text-xs text-stone-500">Pay using Paytm</div>
            </div>
            <ArrowRight size={20} className="text-stone-400" />
          </button>
        </div>

        <button
          onClick={() => setStep("verify")}
          className="mt-6 w-full text-center text-sm font-semibold text-stone-600 hover:text-[#EA580C]"
        >
          I've already paid, enter transaction ID →
        </button>

        <div className="mt-6 rounded-xl bg-blue-50 p-4 text-xs text-blue-900 ring-1 ring-blue-200">
          <strong>Note:</strong> After payment, you'll be asked to enter the transaction ID for verification.
        </div>
      </div>
    </main>
  );
}
