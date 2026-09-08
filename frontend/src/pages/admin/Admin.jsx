import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Package, ShoppingBag, Mail, IndianRupee, Users, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { AdminOrders } from "./AdminOrders";
import { AdminProducts } from "./AdminProducts";
import { AdminEmails } from "./AdminEmails";

const TABS = [
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "products", label: "Stock & pricing", icon: Package },
  { key: "emails", label: "Emails", icon: Mail },
];

const Stat = ({ label, value, testid }) => (
  <div className="rounded-3xl border border-stone-800 bg-stone-900 p-5 text-white">
    <p className="font-mono-accent text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">{label}</p>
    <p data-testid={testid} className="font-display mt-2 text-3xl font-black tracking-tight">{value}</p>
  </div>
);

export default function Admin() {
  const { user, ready, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "orders";
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isAdmin) api.admin.stats().then(setStats).catch(() => {});
  }, [isAdmin, tab]);

  if (!ready) return <main className="flex min-h-[60vh] items-center justify-center"><Loader2 size={32} className="animate-spin text-[#EA580C]" /></main>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <main data-testid="admin-page" className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <p className="font-mono-accent text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Store admin</p>
      <h1 className="font-display mt-3 text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">Dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (paid)" value={stats ? `₹ ${(stats.revenue_paise / 100).toLocaleString("en-IN")}` : "—"} testid="stat-revenue" />
        <Stat label="Paid orders" value={stats ? stats.orders_paid : "—"} testid="stat-paid-orders" />
        <Stat label="To fulfil" value={stats ? stats.pending_fulfillment : "—"} testid="stat-pending" />
        <Stat label="Customers" value={stats ? stats.customers : "—"} testid="stat-customers" />
      </div>

      <div className="mt-10 flex gap-2 overflow-x-auto border-b border-[#E7E2DA]">
        {TABS.map((t) => (
          <button
            key={t.key}
            data-testid={`admin-tab-${t.key}`}
            onClick={() => setParams({ tab: t.key })}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${tab === t.key ? "border-[#EA580C] text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "orders" && <AdminOrders />}
        {tab === "products" && <AdminProducts />}
        {tab === "emails" && <AdminEmails />}
      </div>
    </main>
  );
}
