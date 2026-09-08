import { Sparkle } from "lucide-react";

const ITEMS = [
  "Independent lab comparisons",
  "Zero sponsored rankings",
  "Tested in Indian heat & humidity",
  "Updated prices, checked weekly",
  "Real pet parents, real homes",
  "Buy direct, reader first",
];

export const Marquee = () => {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div data-testid="trust-marquee" className="marquee-paused overflow-hidden border-y border-[#E7E2DA] bg-[#F4EFEA] py-3.5">
      <div className="animate-marquee flex w-max items-center gap-10">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            <span className="font-mono-accent text-xs font-bold uppercase tracking-[0.25em] text-stone-500">{item}</span>
            <Sparkle size={12} className="text-[#EA580C]" fill="currentColor" />
          </span>
        ))}
      </div>
    </div>
  );
};
