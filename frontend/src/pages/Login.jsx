import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Smartphone, Mail, Lock, KeyRound, Loader2, ArrowRight, ShieldCheck, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const field = "w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:outline-none focus:ring-4 focus:ring-orange-100";
const primary = "flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98] disabled:opacity-60";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const next = new URLSearchParams(search).get("next") || "/";
  const [tab, setTab] = useState("password"); // "password" | "email" | "phone"
  const [step, setStep] = useState("input"); // "input" | "code"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState("");
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

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isValidPhone = (val) => val.replace(/\D/g, "").length >= 10;
  const isValidLoginIdentifier = (val) => isValidEmail(val) || isValidPhone(val);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      const identifier = email.trim();
      const res = await api.login({
        ...(isValidEmail(identifier) ? { email: identifier.toLowerCase() } : { username: identifier }),
        password,
      });
      login(res);
      toast.success("Welcome back!");
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  const requestOtp = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const payload = tab === "email" ? { email: email.trim().toLowerCase() } : { phone: phone.trim() };
      const r = await api.requestOtp(payload);
      const activeId = r.email || r.phone || (tab === "email" ? email : phone);
      setIdentifier(activeId);
      setChallenge(r.challenge || "");
      setStep("code");
      setCooldown(30);
      toast.success(`Code requested for ${activeId}`);
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
      const target = tab === "email" ? { email: identifier } : { phone: identifier };
      const r = await api.verifyOtp(target, code, challenge);
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
          Welcome back to Paws &amp; Whiskers.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600 sm:text-lg">
          Log in with your password or one-time code to track orders, manage pet details, and enjoy fast checkout.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-stone-600">
          {["Instant order tracking & history", "Fast checkout with saved details", "Password or passwordless login"].map((t) => (
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
        {step === "input" ? (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex rounded-2xl bg-stone-100 p-1.5 text-xs sm:text-sm font-semibold">
              <button
                type="button"
                onClick={() => setTab("password")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all ${
                  tab === "password"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <Lock size={15} /> Password
              </button>
              <button
                type="button"
                onClick={() => setTab("email")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all ${
                  tab === "email"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <Mail size={15} /> Email OTP
              </button>
              <button
                type="button"
                onClick={() => setTab("phone")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all ${
                  tab === "phone"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <Smartphone size={15} /> Mobile SMS
              </button>
            </div>

            {tab === "password" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200">
                  <Lock size={22} />
                </span>
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900">Log in with password</h2>
                  <p className="mt-1 text-sm text-stone-500">Enter your registered email or mobile number and password.</p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-600">Email or Mobile Number</label>
                  <input
                    data-testid="login-email-input"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com or 98765 43210"
                    className={field}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-600">Password</label>
                  <input
                    data-testid="login-password-input"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={field}
                    required
                  />
                </div>

                <button
                  data-testid="login-submit-button"
                  type="submit"
                  disabled={busy || !isValidLoginIdentifier(email) || !password}
                  className={primary}
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
            ) : (
              <form onSubmit={requestOtp} className="space-y-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200">
                  {tab === "email" ? <Mail size={22} /> : <Smartphone size={22} />}
                </span>
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900">
                    {tab === "email" ? "Log in with email code" : "Log in with mobile code"}
                  </h2>
                  <p className="mt-1.5 text-sm text-stone-500">
                    {tab === "email"
                      ? "We'll send a 6-digit verification code to your inbox."
                      : "We'll text you a 6-digit verification code."}
                  </p>
                </div>

                {tab === "email" ? (
                  <input
                    data-testid="login-email-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={field}
                    required
                    autoFocus
                  />
                ) : (
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
                    autoFocus
                  />
                )}

                <button
                  data-testid="login-send-otp-button"
                  type="submit"
                  disabled={busy || (tab === "email" ? !isValidEmail(email) : !isValidPhone(phone))}
                  className={primary}
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {busy ? "Sending…" : "Send code"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={verify} className="space-y-5">
            <button
              type="button"
              data-testid="login-back-button"
              onClick={() => {
                setStep("input");
                setCode("");
              }}
              className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-[#EA580C]"
            >
              <ChevronLeft size={16} /> Change {tab === "email" ? "email" : "number"}
            </button>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-200">
              <KeyRound size={22} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900">Enter your code</h2>
              <p className="mt-1.5 text-sm text-stone-500">
                Code requested for <span className="font-mono-accent font-bold text-stone-800">{identifier}</span>
              </p>
            </div>
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
            <button
              data-testid="login-verify-button"
              type="submit"
              disabled={busy || code.length !== 6}
              className={primary}
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {busy ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              data-testid="login-resend-button"
              onClick={requestOtp}
              disabled={cooldown > 0 || busy}
              className="w-full text-center text-sm font-semibold text-stone-500 hover:text-[#EA580C] disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
            {tab === "phone" && (
              <p className="text-center text-xs leading-relaxed text-stone-400">
                SMS can take up to a minute. If it does not arrive, check blocked messages or use Email OTP from the previous screen.
              </p>
            )}
          </form>
        )}
        <div className="mt-8 space-y-2 text-center text-sm text-stone-500">
          <p>
            Don't have an account?{" "}
            <Link
              to={`/signup?next=${encodeURIComponent(next)}`}
              data-testid="login-register-link"
              className="font-bold text-[#EA580C] hover:underline"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-stone-400">
            Store admin? <Link to="/admin/login" data-testid="login-admin-link" className="font-semibold text-stone-600 underline-offset-2 hover:underline">Sign in with email</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
