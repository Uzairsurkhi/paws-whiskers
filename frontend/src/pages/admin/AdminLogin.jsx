import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const field = "w-full rounded-2xl border border-stone-200 bg-white px-5 py-3.5 text-base text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:outline-none focus:ring-4 focus:ring-orange-100";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") navigate("/admin", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      login(await api.adminLogin(email, password));
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-16">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        data-testid="admin-login-card"
        className="w-full space-y-5 rounded-[2rem] border border-stone-800 bg-stone-900 p-8 text-white shadow-2xl"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200 text-stone-900"><Lock size={22} /></span>
        <div>
          <p className="font-mono-accent text-[11px] font-bold uppercase tracking-[0.3em] text-amber-300">Store admin</p>
          <h1 className="font-display mt-2 text-2xl font-bold tracking-tight">Sign in</h1>
        </div>
        <input data-testid="admin-email-input" type="email" autoComplete="username" className={`${field} text-stone-900`} placeholder="admin@…" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input data-testid="admin-password-input" type="password" autoComplete="current-password" className={`${field} text-stone-900`} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button data-testid="admin-login-button" type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-200 px-6 py-3.5 font-bold text-stone-900 transition-all hover:bg-amber-100 active:scale-[0.98] disabled:opacity-60">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />} Enter dashboard
        </button>
        <p className="text-center text-xs text-stone-400">Admins with a registered phone can also use <Link to="/login/mobile" className="font-semibold text-stone-600 underline-offset-2 hover:underline">mobile OTP login</Link>.</p>
      </motion.form>
    </main>
  );
}
