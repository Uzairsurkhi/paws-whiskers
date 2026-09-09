import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const field = "w-full rounded-2xl border border-stone-200 bg-white px-5 py-3.5 text-base text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:outline-none focus:ring-4 focus:ring-orange-100";
const primary = "flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98] disabled:opacity-60";

export default function Signup() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();
  const next = new URLSearchParams(search).get("next") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() ? phone.trim() : undefined,
      };
      const res = await api.register(payload);
      login(res);
      toast.success("Welcome to Paws & Whiskers! Your account has been created.");
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2">
      <div className="hidden lg:block">
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Join the family</p>
        <h1 className="font-display mt-4 text-4xl font-black leading-[1.05] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
          Start giving your pet the best.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600 sm:text-lg">
          Create an account to save pet profiles, track orders in real time, and enjoy effortless checkout.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-stone-600">
          {[
            "Instant order tracking & history",
            "Saved addresses for speedy checkout",
            "Exclusive subscriber discounts & pet care guides",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-teal-600" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        data-testid="register-card"
        className="rounded-[2rem] border border-[#E7E2DA] bg-white p-7 shadow-[0_30px_60px_-30px_rgba(28,25,23,0.3)] sm:p-10"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200">
            <UserPlus size={22} />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900">Create an account</h2>
            <p className="mt-1 text-sm text-stone-500">Sign up in seconds to start shopping.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-600">Full Name</label>
            <input
              data-testid="register-name-input"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Sharma"
              className={field}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-600">Email Address</label>
            <input
              data-testid="register-email-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aarav@example.com"
              className={field}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-600">
              Mobile Number <span className="text-stone-400 font-normal">(optional for delivery)</span>
            </label>
            <input
              data-testid="register-phone-input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              className={`${field} font-mono-accent`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-600">Password</label>
            <input
              data-testid="register-password-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={field}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-600">Confirm Password</label>
            <input
              data-testid="register-password-confirm-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className={field}
              required
            />
          </div>

          <button
            data-testid="register-submit-button"
            type="submit"
            disabled={busy || !name || !email || !password || !confirmPassword}
            className={`${primary} mt-2`}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link
            to={`/login?next=${encodeURIComponent(next)}`}
            data-testid="register-login-link"
            className="font-bold text-[#EA580C] hover:underline"
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
