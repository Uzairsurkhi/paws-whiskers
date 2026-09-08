import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Smartphone, KeyRound, Loader2, ArrowRight, ShieldCheck, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const field = "w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-lg text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:outline-none focus:ring-4 focus:ring-orange-100";
const primary = "flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98] disabled:opacity-60";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const next = new URLSearchParams(search).get("next") || "/";
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef(null);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const requestOtp = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const r = await api.requestOtp(phone);
      setPhone(r.phone);
      setDevOtp(r.dev_mode ? r.dev_otp : null);
      setStep("code");
      setCooldown(30);
      toast.success(r.dev_mode ? "Dev mode — your code is shown below." : `Code sent to ${r.phone}`);
      setTimeout(() => codeRef.current?.focus(), 80);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.verifyOtp(phone, code);
      login(r);
      toast.success("You're in!");
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2">
      <div className="hidden lg:block">
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Members</p>
        <h1 className="font-display mt-4 text-4xl font-black leading-[1.05] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
          One number.<br />Zero passwords.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600 sm:text-lg">
          Log in with your mobile number to check out faster, track orders and save your pet's favourites.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-stone-600">
          {["No password to remember", "Order history & tracking", "Faster checkout with saved details"].map((t) => (
            <li key={t} className="flex items-center gap-2.5"><ShieldCheck size={16} className="text-teal-600" />{t}</li>
          ))}
        </ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        data-testid="login-card"
        className="rounded-[2rem] border border-[#E7E2DA] bg-white p-7 shadow-[0_30px_60px_-30px_rgba(28,25,23,0.3)] sm:p-10"
      >
        {step === "phone" ? (
          <form onSubmit={requestOtp} className="space-y-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200"><Smartphone size={22} /></span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900">Log in with your mobile</h2>
              <p className="mt-1.5 text-sm text-stone-500">We'll text you a 6-digit code.</p>
            </div>
            <input
              data-testid="login-phone-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              className={`${field} font-mono-accent tracking-wider`}
              required
            />
            <button data-testid="login-send-otp-button" type="submit" disabled={busy || phone.replace(/\D/g, "").length < 10} className={primary}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {busy ? "Sending…" : "Send code"}
            </button>
            <p className="text-center text-xs text-stone-400">Indian numbers can skip the +91. By continuing you agree to our terms.</p>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-5">
            <button type="button" data-testid="login-back-button" onClick={() => { setStep("phone"); setCode(""); }} className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-[#EA580C]">
              <ChevronLeft size={16} /> Change number
            </button>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-200"><KeyRound size={22} /></span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900">Enter your code</h2>
              <p className="mt-1.5 text-sm text-stone-500">Sent to <span className="font-mono-accent font-bold text-stone-800">{phone}</span></p>
            </div>
            {devOtp && (
              <button
                type="button"
                data-testid="login-dev-otp-banner"
                onClick={() => setCode(devOtp)}
                className="w-full rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 transition-colors hover:bg-amber-100"
              >
                <span className="font-mono-accent text-[10px] font-bold uppercase tracking-[0.25em] text-amber-700">Dev mode · SMS not configured</span>
                <span className="mt-1 block">Your code is <span data-testid="login-dev-otp-value" className="font-mono-accent text-lg font-black tracking-[0.3em]">{devOtp}</span> — tap to fill.</span>
              </button>
            )}
            <input
              ref={codeRef}
              data-testid="login-otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className={`${field} font-mono-accent text-center text-2xl tracking-[0.5em]`}
              required
            />
            <button data-testid="login-verify-button" type="submit" disabled={busy || code.length !== 6} className={primary}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {busy ? "Verifying…" : "Verify & continue"}
            </button>
            <button type="button" data-testid="login-resend-button" onClick={requestOtp} disabled={cooldown > 0 || busy} className="w-full text-center text-sm font-semibold text-stone-500 hover:text-[#EA580C] disabled:opacity-50">
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </form>
        )}
        <p className="mt-8 text-center text-xs text-stone-400">
          Store admin? <Link to="/admin/login" data-testid="login-admin-link" className="font-semibold text-stone-600 underline-offset-2 hover:underline">Sign in with email</Link>
        </p>
      </motion.div>
    </main>
  );
}
