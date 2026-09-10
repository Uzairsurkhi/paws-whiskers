import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  BarChart3,
  Megaphone,
  Mail,
  Star,
  Settings,
  ExternalLink,
  LogOut,
  Search,
  MapPin,
  Bell,
  ChevronDown,
  ChevronRight,
  Loader2,
  PawPrint,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { AdminOverview } from "./AdminOverview";
import { AdminOrders } from "./AdminOrders";
import { AdminProducts } from "./AdminProducts";
import { AdminEmails } from "./AdminEmails";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "products", label: "Products", icon: Package },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "customers", label: "Customers", icon: Users },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "emails", label: "Emails", icon: Mail },
  { key: "reviews", label: "Reviews", icon: Star },
];

export default function Admin() {
  const { user, ready, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDashboard = () => {
    if (isAdmin) {
      api.admin.stats().then(setStats).catch(() => {});
      api.admin.orders().then(setRecentOrders).catch(() => setRecentOrders([]));
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [isAdmin, tab]);

  if (!ready) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#EA580C]" />
      </main>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleNavigate = (newTab) => {
    setParams({ tab: newTab });
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div data-testid="admin-page" className="flex min-h-screen bg-[#FAF8F5] text-stone-900">
      {/* Left Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-stone-200/90 bg-white px-4 py-5 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-3 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EA580C] text-white shadow-sm shadow-orange-500/30">
              <PawPrint size={22} fill="currentColor" />
            </div>
            <div>
              <div className="font-display text-base font-black tracking-tight text-stone-900 leading-tight">
                Paws &amp; Whiskers
              </div>
              <div className="font-mono-accent text-[9px] font-bold uppercase tracking-[0.25em] text-[#EA580C]">
                I N D I A
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = tab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  data-testid={`admin-nav-${item.key}`}
                  onClick={() => handleNavigate(item.key)}
                  className={`group flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-orange-50 text-[#EA580C] shadow-sm ring-1 ring-orange-200/70"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={active ? "text-[#EA580C]" : "text-stone-400 group-hover:text-stone-600"}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge != null && (
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${
                        active
                          ? "bg-[#EA580C] text-white"
                          : "bg-orange-100 text-[#EA580C]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Divider */}
            <div className="my-3 border-t border-stone-100" />

            {/* Settings */}
            <button
              onClick={() => handleNavigate("settings")}
              className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                tab === "settings"
                  ? "bg-orange-50 text-[#EA580C] shadow-sm ring-1 ring-orange-200/70"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <Settings size={18} className="text-stone-400" />
              <span>Settings</span>
            </button>

            {/* Store Front Link */}
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold text-stone-600 transition-all hover:bg-stone-50 hover:text-stone-900"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-stone-400" />
                <span>Store Front</span>
              </div>
              <ExternalLink size={14} className="text-stone-400" />
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4">
          {/* User badge */}
          <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/70 p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EA580C] text-sm font-bold text-white shadow-sm">
                A
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-stone-900 leading-tight">Admin</p>
                <p className="text-[10px] font-medium text-stone-500">Store Admin</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-stone-400" />
          </div>

          {/* Log out */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs font-bold text-stone-500 transition hover:text-rose-600"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>

          {/* Brand Watermark */}
          <div className="flex items-center gap-2 px-3 pt-2 text-stone-300">
            <PawPrint size={28} className="opacity-40" />
            <span className="font-serif text-xs italic text-stone-400">
              Happy Pets<br />Happier People ♡
            </span>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200/80 bg-white/95 px-6 backdrop-blur-md">
          {/* Search Box */}
          <div className="relative w-full max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, products, customers..."
              className="w-full rounded-2xl border border-stone-200/90 bg-stone-50/60 py-2 pl-9 pr-14 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-stone-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-stone-400">
              ⌘ K
            </span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Delivery Location pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-stone-200/90 bg-stone-50 px-3.5 py-1.5 text-xs font-bold text-stone-700">
              <MapPin size={13} className="text-[#EA580C]" />
              <span>Deliver to</span>
              <span className="font-semibold text-stone-900">Bengaluru · 560037</span>
              <ChevronDown size={12} className="text-stone-400" />
            </div>

            {/* Notification Bell */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-600 transition hover:bg-stone-100">
              <Bell size={16} />
            </button>

            {/* Admin Avatar Header Pill */}
            <div className="flex items-center gap-2.5 rounded-full border border-stone-200/80 bg-white p-1 pr-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EA580C] font-bold text-white text-xs">
                A
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-bold text-stone-900 leading-tight">Admin</p>
                <p className="text-[10px] text-stone-500">Store Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="flex-1 p-6 sm:p-8">
          {tab === "overview" && (
            <AdminOverview stats={stats} orders={recentOrders} onNavigate={handleNavigate} onRefresh={loadDashboard} />
          )}
          {tab === "orders" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-black text-stone-900 sm:text-3xl">Orders Management</h1>
                  <p className="text-xs text-stone-500">Track and fulfill pet customer orders</p>
                </div>
                <button
                  onClick={() => handleNavigate("overview")}
                  className="rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50"
                >
                  ← Back to Overview
                </button>
              </div>
              <AdminOrders />
            </div>
          )}
          {tab === "products" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-black text-stone-900 sm:text-3xl">Products &amp; Pricing</h1>
                  <p className="text-xs text-stone-500">Manage catalog, variants, and stock availability</p>
                </div>
                <button
                  onClick={() => handleNavigate("overview")}
                  className="rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50"
                >
                  ← Back to Overview
                </button>
              </div>
              <AdminProducts />
            </div>
          )}
          {tab === "emails" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl font-black text-stone-900 sm:text-3xl">Email Broadcasts</h1>
                  <p className="text-xs text-stone-500">Review automated order &amp; notification logs</p>
                </div>
                <button
                  onClick={() => handleNavigate("overview")}
                  className="rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50"
                >
                  ← Back to Overview
                </button>
              </div>
              <AdminEmails />
            </div>
          )}
          {!["overview", "orders", "products", "emails"].includes(tab) && (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C]">
                <Package size={28} />
              </div>
              <h2 className="font-display mt-4 text-xl font-bold capitalize text-stone-900">{tab} Hub</h2>
              <p className="mt-2 text-sm text-stone-500">
                Detailed configuration and reports for {tab} are being synchronized.
              </p>
              <button
                onClick={() => handleNavigate("overview")}
                className="mt-6 rounded-2xl bg-[#EA580C] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#C2410C]"
              >
                Return to Overview
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
