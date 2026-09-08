import { useEffect, useState } from "react";
import axios from "axios";
import { Coffee, FlaskConical, RefreshCw, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "./Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;
const ICONS = [Coffee, FlaskConical, RefreshCw];

export const SupportSection = () => {
  const [tiers, setTiers] = useState([]);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    axios.get(`${API}/payments/tiers`).then((r) => setTiers(r.data)).catch(() => {});
  }, []);

  const pay = async (tier) => {
    setBusy(tier.lookup_key);
    try {
      const { data } = await axios.post(`${API}/payments/checkout`, {
        lookup_key: tier.lookup_key,
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch {
      toast.error("Couldn't start checkout — please try again.");
      setBusy(null);
    }
  };

  return (
    <section id="support" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Reader supported</p>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Like what we do? Chip in.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-stone-600">
          We never take money from brands. Small contributions from readers keep the lab comparisons honest and the prices fresh.
        </p>
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
        {tiers.map((t, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <Reveal key={t.lookup_key} delay={i * 0.08}>
              <div data-testid={`support-tier-${t.lookup_key}`} className={`flex h-full flex-col rounded-3xl border bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl ${i === 1 ? "border-[#EA580C]/40 ring-2 ring-orange-200" : "border-[#E7E2DA]"}`}>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200">
                  <Icon size={22} />
                </span>
                <p className="font-display mt-5 text-3xl font-black tracking-tight text-stone-900">{t.amount_label}</p>
                <h3 className="mt-1 text-base font-bold text-stone-800">{t.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">{t.blurb}</p>
                <button
                  data-testid={`support-pay-${t.lookup_key}`}
                  onClick={() => pay(t)}
                  disabled={busy !== null}
                  className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-5 py-3 font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-95 disabled:opacity-60"
                >
                  {busy === t.lookup_key ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} fill="currentColor" />}
                  {busy === t.lookup_key ? "Opening checkout…" : "Support"}
                </button>
              </div>
            </Reveal>
          );
        })}
      </div>
      <Reveal className="mt-8 text-center">
        <p className="text-xs text-stone-400">
          Secure checkout by Stripe · One-time payment · Test mode — use card 4242 4242 4242 4242
        </p>
      </Reveal>
    </section>
  );
};
