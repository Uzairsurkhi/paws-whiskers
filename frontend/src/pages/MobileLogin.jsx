import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Smartphone, Loader2, ArrowRight, ShieldCheck, ChevronLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const field = "w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-base text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:outline-none focus:ring-4 focus:ring-orange-100";
const primary = "flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98] disabled:opacity-60";

const digitsOnly = (value) => value.replace(/\D/g, "");

const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(digitsOnly(value));

export default function MobileLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const next = new URLSearchParams(search).get("next") || "/";

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendOtp = async (event) => {
    event?.preventDefault();
    if (!isValidIndianMobile(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setBusy(true);
    try {
      const response = await api.requestMobileOtp(digitsOnly(phone));
      setNormalizedPhone(response.phone || response.identifier);
      setChallenge(response.challenge || "");
      setDevOtp(response.dev_mode ? response.dev_otp || "" : "");
      setStep("otp");
      setCode("");
      setCooldown(30);
      toast.success(`OTP sent to ${response.phone || response.identifier}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    try {
      const response = await api.verifyMobileOtp(normalizedPhone, code, challenge);
      login(response);
      toast.success("You're in!");
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  const resetFlow = () => {
    setStep("phone");
    setCode("");
    setChallenge("");
    setDevOtp("");
    setNormalizedPhone("");
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2">
      <div className="hidden lg:block">
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Mobile login</p>
        <h1 className="font-display mt-4 text-4xl font-black leading-[1.05] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
          Sign in with your mobile number.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600 sm:text-lg">
          Enter your Indian mobile number and we&apos;ll send a one-time password by SMS. No password required.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-stone-600">
          {[
            "6-digit OTP valid for 5 minutes",
            "Works for new and returning customers",
            "Secure SMS delivery in production",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-teal-600" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        data-testid="mobile-login-card"
        className="rounded-[2rem] border border-[#E7E2DA] bg-white p-7 shadow-[0_30px_60px_-30px_rgba(28,25,23,0.3)] sm:p-10"
      >
        {step === "phone" ? (
          <form onSubmit={sendOtp} className="space-y-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200">
              <Smartphone size={22} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900">Mobile OTP login</h2>
              <p className="mt-1.5 text-sm text-stone-500">We&apos;ll text a 6-digit code to your phone.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-600">Mobile number</label>
              <div className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white focus-within:border-[#EA580C] focus-within:ring-4 focus-within:ring-orange-100">
                <span className="flex items-center border-r border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-600">+91</span>
                <input
                  data-testid="mobile-login-phone-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={phone}
                  onChange={(event) => setPhone(digitsOnly(event.target.value).slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full bg-transparent px-4 py-4 font-mono-accent text-base tracking-wider text-stone-900 placeholder:text-stone-400 focus:outline-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              data-testid="mobile-login-send-otp-button"
              type="submit"
              disabled={busy || !isValidIndianMobile(phone)}
              className={primary}
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {busy ? "Sending OTP…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-5">
            <button
              type="button"
              data-testid="mobile-login-back-button"
              onClick={resetFlow}
              className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-[#EA580C]"
            >
              <ChevronLeft size={16} /> Change number
            </button>

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-200">
              <KeyRound size={22} />
            </span>

            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900">Enter OTP</h2>
              <p className="mt-1.5 text-sm text-stone-500">
                Code sent to <span className="font-mono-accent font-bold text-stone-800">{normalizedPhone}</span>
              </p>
            </div>

            {devOtp ? (
              <div
                data-testid="mobile-login-dev-otp-banner"
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                Dev mode: your OTP is <span className="font-mono-accent font-bold">{devOtp}</span>
              </div>
            ) : null}

            <div className="flex justify-center">
              <InputOTP
                data-testid="mobile-login-otp-input"
                maxLength={6}
                value={code}
                onChange={setCode}
                autoFocus
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-12 w-11 rounded-xl border-stone-200 text-lg font-semibold first:rounded-xl last:rounded-xl"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <button
              data-testid="mobile-login-verify-button"
              type="submit"
              disabled={busy || code.length !== 6}
              className={primary}
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {busy ? "Verifying…" : "Verify & continue"}
            </button>

            <button
              type="button"
              data-testid="mobile-login-resend-button"
              onClick={sendOtp}
              disabled={cooldown > 0 || busy}
              className="w-full text-center text-sm font-semibold text-stone-500 hover:text-[#EA580C] disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>

            <p className="text-center text-xs leading-relaxed text-stone-400">
              SMS can take up to a minute. Check blocked messages if the code doesn&apos;t arrive.
            </p>
          </form>
        )}

        <div className="mt-8 space-y-2 text-center text-sm text-stone-500">
          <p>
            Prefer email or password?{" "}
            <Link
              to={`/login?next=${encodeURIComponent(next)}`}
              data-testid="mobile-login-email-link"
              className="font-bold text-[#EA580C] hover:underline"
            >
              Other login options
            </Link>
          </p>
          <p className="text-xs text-stone-400">
            Don&apos;t have an account?{" "}
            <Link
              to={`/signup?next=${encodeURIComponent(next)}`}
              data-testid="mobile-login-register-link"
              className="font-semibold text-stone-600 underline-offset-2 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
