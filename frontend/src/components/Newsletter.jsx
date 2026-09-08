import { useState } from "react";
import { toast } from "sonner";
import { MailCheck, Send } from "lucide-react";
import { api } from "../lib/api";
import { Reveal } from "./Reveal";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.newsletter(email);
      setDone(true);
      toast.success(res.message);
    } catch {
      toast.error("Please enter a valid email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section data-testid="newsletter-section" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 px-6 py-14 sm:px-14 sm:py-16">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#EA580C]/25 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-teal-500/15 blur-3xl" />
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-orange-300">The Sunday Bowl</p>
            <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Get better pet-product picks once a week.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-400">
              One short email every Sunday: price drops, new lab comparisons, and seasonal care tips for Indian pets. No spam, no brand money.
            </p>

            {done ? (
              <div data-testid="newsletter-success" className="mx-auto mt-8 flex max-w-md items-center justify-center gap-3 rounded-2xl bg-teal-500/15 px-6 py-4 text-teal-300 ring-1 ring-teal-500/30">
                <MailCheck size={20} />
                <span className="font-semibold">You're on the list. See you Sunday!</span>
              </div>
            ) : (
              <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                <input
                  data-testid="newsletter-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.in"
                  className="flex-1 rounded-2xl border border-stone-700 bg-stone-800/80 px-5 py-3.5 text-white placeholder:text-stone-500 focus:border-orange-400 focus:outline-none"
                />
                <button
                  data-testid="newsletter-submit-button"
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#EA580C] px-6 py-3.5 font-bold text-white transition-all duration-200 hover:bg-[#C2410C] active:scale-95 disabled:opacity-60"
                >
                  {loading ? "Joining..." : "Subscribe"} <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
};
