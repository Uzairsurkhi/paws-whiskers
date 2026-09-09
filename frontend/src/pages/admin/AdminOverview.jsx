import { useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Truck,
  Users,
  AlertTriangle,
  Package,
  Mail,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Calendar,
  ChevronDown,
  Inbox,
} from "lucide-react";

export function AdminOverview({ stats, onNavigate }) {
  const [period, setPeriod] = useState("Last 30 days");

  const dates = ["Aug 10", "Aug 15", "Aug 20", "Aug 25", "Aug 30", "Sep 5"];

  const categories = [
    { name: "Dog Food", emoji: "🐶", orders: "0 orders", pct: 0 },
    { name: "Cat Food", emoji: "🐱", orders: "0 orders", pct: 0 },
    { name: "Treats", emoji: "🦴", orders: "0 orders", pct: 0 },
    { name: "Grooming", emoji: "🐾", orders: "0 orders", pct: 0 },
    { name: "Toys", emoji: "🎾", orders: "0 orders", pct: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-r from-[#FFFBF7] via-[#FFF6ED] to-[#FFF0E2] p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <pattern id="admin-paws" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M20 15c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5 2.5-1 2.5-2.5S21.5 15 20 15zm7 3c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5 2.5-1 2.5-2.5S28.5 18 27 18zm-14 0c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5 2.5-1 2.5-2.5S14.5 18 13 18zm7 4c-3.5 0-6 2.5-6 6 0 2.5 2.5 4.5 6 4.5s6-2 6-4.5c0-3.5-2.5-6-6-6z" fill="#EA580C" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#admin-paws)" />
          </svg>
        </div>

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-stone-900 sm:text-4xl">
              Good morning, Admin 👋
            </h1>
            <p className="mt-1.5 text-sm font-medium text-stone-600 sm:text-base">
              Here&apos;s what&apos;s happening with your store today.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex -space-x-3 overflow-hidden rounded-2xl bg-white/70 p-1.5 shadow-sm backdrop-blur-sm">
                <img
                  src="https://images.unsplash.com/photo-1783441286747-85286dd35aac?crop=entropy&cs=srgb&fm=jpg&q=85&w=200"
                  alt="Dog"
                  className="h-12 w-12 rounded-xl object-cover ring-2 ring-white"
                />
                <img
                  src="https://images.unsplash.com/photo-1592194996308-7b43878e84a6?crop=entropy&cs=srgb&fm=jpg&q=85&w=200"
                  alt="Cat"
                  className="h-12 w-12 rounded-xl object-cover ring-2 ring-white"
                />
              </div>
              <div className="text-left font-serif italic text-xs text-stone-600 leading-tight">
                For a<br />
                <span className="font-bold text-[#EA580C]">Healthier</span><br />
                Happier Tomorrow ♡
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 shadow-sm transition hover:bg-stone-50">
              <Calendar size={14} className="text-stone-500" />
              <span>{period}</span>
              <ChevronDown size={14} className="text-stone-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Revenue (Paid) */}
        <div className="group rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 font-bold text-[#EA580C] ring-1 ring-orange-200/70">
              ₹
            </div>
            <div className="w-20">
              <svg viewBox="0 0 80 32" className="h-8 w-full overflow-visible">
                <path
                  d="M0 24 L 80 24"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Revenue (Paid)</p>
            <p className="font-display mt-1 text-2xl font-black tracking-tight text-stone-900">
              ₹0
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-stone-400">
              <span>0% vs last month</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="group rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200/70">
              <ShoppingBag size={20} />
            </div>
            <div className="w-20">
              <svg viewBox="0 0 80 32" className="h-8 w-full overflow-visible">
                <path
                  d="M0 24 L 80 24"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Orders</p>
            <p className="font-display mt-1 text-2xl font-black tracking-tight text-stone-900">
              0
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-stone-400">
              <span>0% vs last month</span>
            </div>
          </div>
        </div>

        {/* To Fulfil */}
        <div className="group rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200/70">
              <Truck size={20} />
            </div>
            <div className="w-20">
              <svg viewBox="0 0 80 32" className="h-8 w-full overflow-visible">
                <path
                  d="M0 24 L 80 24"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">To Fulfil</p>
            <p className="font-display mt-1 text-2xl font-black tracking-tight text-stone-900">
              0
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-stone-400">
              <span>0% vs last month</span>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="group rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-200/70">
              <Users size={20} />
            </div>
            <div className="w-20">
              <svg viewBox="0 0 80 32" className="h-8 w-full overflow-visible">
                <path
                  d="M0 24 L 80 24"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="4 3"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Customers</p>
            <p className="font-display mt-1 text-2xl font-black tracking-tight text-stone-900">
              0
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-stone-400">
              <span>0% vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Sales Overview Chart + Needs Attention */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Overview (2 cols) */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">Sales Overview</h2>
              <p className="text-xs text-stone-500">Daily revenue trends and performance</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700">
              <span>Last 30 days</span>
              <ChevronDown size={14} className="text-stone-400" />
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {/* SVG Chart area */}
            <div className="md:col-span-3">
              <div className="relative h-56 w-full">
                {/* Horizontal guide lines */}
                <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-stone-400">
                  <div className="flex items-center border-b border-stone-100 pb-1"><span>₹100K</span></div>
                  <div className="flex items-center border-b border-stone-100 pb-1"><span>₹75K</span></div>
                  <div className="flex items-center border-b border-stone-100 pb-1"><span>₹50K</span></div>
                  <div className="flex items-center border-b border-stone-100 pb-1"><span>₹25K</span></div>
                  <div className="flex items-center border-b border-stone-100 pb-1"><span>0</span></div>
                </div>

                {/* SVG Curve at 0 baseline */}
                <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 460 200">
                  <line
                    x1="20"
                    y1="190"
                    x2="445"
                    y2="190"
                    stroke="#EA580C"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                  />
                  {dates.map((d, i) => (
                    <circle
                      key={i}
                      cx={20 + i * 85}
                      cy={190}
                      r="4"
                      fill="#FFFFFF"
                      stroke="#EA580C"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>

              {/* X Axis Dates */}
              <div className="mt-2 flex justify-between px-2 text-[11px] font-semibold text-stone-400">
                {dates.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>

            {/* Right Summary Column */}
            <div className="flex flex-col justify-center space-y-5 rounded-2xl bg-stone-50/70 p-4 border border-stone-100">
              <div>
                <p className="font-display text-2xl font-black text-stone-900">₹0</p>
                <p className="text-xs font-semibold text-stone-500">Total Revenue</p>
              </div>
              <div className="border-t border-stone-200/60 pt-3">
                <p className="font-display text-2xl font-black text-stone-900">0</p>
                <p className="text-xs font-semibold text-stone-500">Total Orders</p>
              </div>
              <div className="border-t border-stone-200/60 pt-3">
                <p className="font-display text-2xl font-black text-stone-900">₹0</p>
                <p className="text-xs font-semibold text-stone-500">Average Order Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Needs Attention Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-stone-900">Needs Attention</h2>
              <button
                onClick={() => onNavigate("orders")}
                className="text-xs font-bold text-[#EA580C] hover:underline"
              >
                View all
              </button>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">Actions required to keep orders moving</p>

            <div className="mt-5 space-y-3">
              <button
                onClick={() => onNavigate("orders")}
                className="flex w-full items-center justify-between rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5 text-left transition hover:border-amber-300 hover:bg-amber-50/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <AlertTriangle size={18} />
                  </div>
                  <span className="text-xs font-bold text-stone-800">0 orders awaiting fulfilment</span>
                </div>
                <ChevronRight size={16} className="text-stone-400" />
              </button>

              <button
                onClick={() => onNavigate("products")}
                className="flex w-full items-center justify-between rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-[#EA580C]">
                    <Package size={18} />
                  </div>
                  <span className="text-xs font-bold text-stone-800">0 products running low on stock</span>
                </div>
                <ChevronRight size={16} className="text-stone-400" />
              </button>

              <button
                onClick={() => onNavigate("emails")}
                className="flex w-full items-center justify-between rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-[#EA580C]">
                    <Mail size={18} />
                  </div>
                  <span className="text-xs font-bold text-stone-800">0 customer emails waiting</span>
                </div>
                <ChevronRight size={16} className="text-stone-400" />
              </button>

              <div className="flex w-full items-center justify-between rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-3.5 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-xs font-bold text-emerald-900">Payments working normally</span>
                </div>
                <ChevronRight size={16} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Row: Recent Orders Table + Top Selling Categories */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders (2 cols) */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">Recent Orders</h2>
              <p className="text-xs text-stone-500">Live order activity across India</p>
            </div>
            <button
              onClick={() => onNavigate("orders")}
              className="flex items-center gap-1 text-xs font-bold text-[#EA580C] hover:underline"
            >
              <span>View all orders</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#EA580C]">
              <Inbox size={24} />
            </div>
            <h3 className="font-display mt-3 text-sm font-bold text-stone-900">No orders placed yet</h3>
            <p className="mt-1 text-xs text-stone-500 max-w-sm">
              Customer orders will appear here automatically as soon as they complete checkout.
            </p>
          </div>
        </div>

        {/* Top Selling Categories */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-stone-900">Top Selling Categories</h2>
            <span className="text-xs font-bold text-[#EA580C] hover:underline cursor-pointer">View all</span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">Revenue contribution by pet segment</p>

          <div className="mt-5 space-y-4">
            {categories.map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-stone-800">
                    <span className="text-base">{c.emoji}</span>
                    <span>{c.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-500">{c.orders}</span>
                    <span className="font-bold text-stone-800">{c.pct}%</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-[#EA580C] transition-all duration-500"
                    style={{ width: "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Best Selling Products, Customer Growth, Brand Promo */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Best Selling Products */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-stone-900">Best Selling Products</h2>
            <button onClick={() => onNavigate("products")} className="text-xs font-bold text-[#EA580C] hover:underline">
              View all
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-6 text-center">
            <Package size={24} className="text-stone-400" />
            <p className="mt-2 text-xs font-bold text-stone-700">No product sales yet</p>
            <p className="mt-0.5 text-[11px] text-stone-400">Best selling items will rank here once purchases start</p>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-stone-900">Customer Growth</h2>
            <div className="flex items-center gap-1 text-xs font-semibold text-stone-500">
              <span>Last 30 days</span>
              <ChevronDown size={12} />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-black text-stone-900">0</span>
            <span className="text-xs font-medium text-stone-400">0% vs last month</span>
          </div>
          <p className="text-xs text-stone-400">New verified customer registrations</p>

          <div className="mt-5 h-16 w-full flex items-center">
            <svg viewBox="0 0 200 30" className="h-6 w-full overflow-visible">
              <line
                x1="0"
                y1="15"
                x2="200"
                y2="15"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
          </div>
        </div>

        {/* Brand Promo Banner */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/60 p-6 shadow-sm">
          <div className="relative z-10">
            <p className="font-serif text-xl italic font-bold leading-tight text-stone-800">
              Because<br />
              <span className="text-2xl font-black not-italic text-[#EA580C]">every pet</span><br />
              matters ♡
            </p>
          </div>

          <div className="mt-4 flex items-end justify-end">
            <img
              src="https://images.unsplash.com/photo-1783441286747-85286dd35aac?crop=entropy&cs=srgb&fm=jpg&q=85&w=300"
              alt="Happy pet"
              className="h-24 w-36 rounded-xl object-cover shadow-sm ring-2 ring-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
