import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  RefreshCw,
  UserPlus,
  Headphones,
  Settings,
  LogOut,
  ChevronRight,
  X,
  Copy,
  LayoutDashboard,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, errMsg } from "../lib/api";
import { FadeIn } from "../components/Reveal";

export default function Profile() {
  const { user, logout, isAdmin, setUser } = useAuth();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [address, setAddress] = useState({
    line1: localStorage.getItem("pw_saved_address_line1") || "Flat 402, Sunshine Residency",
    city: localStorage.getItem("pw_saved_address_city") || "Bengaluru",
    state: localStorage.getItem("pw_saved_address_state") || "Karnataka",
    pincode: localStorage.getItem("pw_saved_address_pincode") || "560001",
  });

  if (!user) return null;

  const displayName = user.name?.trim() || "Uzair Surkhi";
  const loginDetail = user.phone ? `Logged in via ${user.phone}` : (user.email ? `Logged in via ${user.email}` : "Logged in");

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateMe({ name, email });
      setUser(updated);
      toast.success("Account settings updated!");
      setActiveModal(null);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    localStorage.setItem("pw_saved_address_line1", address.line1);
    localStorage.setItem("pw_saved_address_city", address.city);
    localStorage.setItem("pw_saved_address_state", address.state);
    localStorage.setItem("pw_saved_address_pincode", address.pincode);
    toast.success("Delivery address saved!");
    setActiveModal(null);
  };

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/?ref=${user.id?.slice(0, 8) || "paws"}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard!");
  };

  return (
    <main data-testid="profile-page" className="mx-auto max-w-xl px-5 py-12 sm:px-8 sm:py-16">
      <FadeIn>
        {/* Header matching screenshot */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900">
            Hi {displayName}
          </h1>
          <p className="mt-1.5 text-sm text-stone-500 font-medium">
            {loginDetail}
          </p>
        </div>

        {/* Card Navigation Stack */}
        <div className="mt-8 space-y-3.5">
          {/* 1. Orders (Active style with orange border and indicator bar) */}
          <button
            data-testid="profile-page-orders"
            onClick={() => navigate("/orders")}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border-2 border-[#EA580C] bg-white px-5 py-4 text-left shadow-sm transition-all hover:bg-orange-50/40 active:scale-[0.99]"
          >
            <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-[#EA580C]" />
            <div className="flex items-center gap-3.5 pl-1">
              <Package size={22} strokeWidth={2} className="text-[#EA580C]" />
              <span className="text-base font-bold text-[#EA580C]">Orders</span>
            </div>
            <ChevronRight size={20} strokeWidth={2.4} className="text-[#EA580C] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* 2. Address */}
          <button
            data-testid="profile-page-address"
            onClick={() => setActiveModal("address")}
            className="group flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <MapPin size={22} strokeWidth={1.8} className="text-stone-800" />
              <span className="text-base font-semibold text-stone-800">Address</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* 3. Subscription */}
          <button
            data-testid="profile-page-subscription"
            onClick={() => setActiveModal("subscription")}
            className="group flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <RefreshCw size={22} strokeWidth={1.8} className="text-stone-800" />
              <span className="text-base font-semibold text-stone-800">Subscription</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* 4. Invite friends */}
          <button
            data-testid="profile-page-invite"
            onClick={() => setActiveModal("invite")}
            className="group flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <UserPlus size={22} strokeWidth={1.8} className="text-stone-800" />
              <span className="text-base font-semibold text-stone-800">Invite friends</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* 5. FAQ/ Contact Us */}
          <button
            data-testid="profile-page-faq"
            onClick={() => setActiveModal("faq")}
            className="group flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <Headphones size={22} strokeWidth={1.8} className="text-stone-800" />
              <span className="text-base font-semibold text-stone-800">FAQ/ Contact Us</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* 6. Account Settings */}
          <button
            data-testid="profile-page-settings"
            onClick={() => {
              setName(user?.name || "");
              setEmail(user?.email || "");
              setActiveModal("settings");
            }}
            className="group flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <Settings size={22} strokeWidth={1.8} className="text-stone-800" />
              <span className="text-base font-semibold text-stone-800">Account Settings</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-stone-400 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Admin Dashboard (if admin) */}
          {isAdmin && (
            <button
              data-testid="profile-page-admin"
              onClick={() => navigate("/admin")}
              className="group flex w-full items-center justify-between rounded-2xl border border-teal-200 bg-teal-50/50 px-5 py-4 text-left shadow-sm transition-all hover:bg-teal-50 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <LayoutDashboard size={22} strokeWidth={1.8} className="text-teal-700" />
                <span className="text-base font-semibold text-teal-900">Admin Dashboard</span>
              </div>
              <ChevronRight size={20} strokeWidth={2} className="text-teal-600 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {/* 7. Log Out */}
          <button
            data-testid="profile-page-logout"
            onClick={() => {
              logout();
              toast.success("You've been logged out.");
              navigate("/");
            }}
            className="group flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-red-200 hover:bg-red-50/40 active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <LogOut size={22} strokeWidth={1.8} className="text-stone-800 group-hover:text-red-600" />
              <span className="text-base font-semibold text-stone-800 group-hover:text-red-600">Log Out</span>
            </div>
            <ChevronRight size={20} strokeWidth={2} className="text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-red-500" />
          </button>
        </div>
      </FadeIn>

      {/* Sub-modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            {activeModal === "address" && (
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-lg">
                    <MapPin className="text-[#EA580C]" size={20} />
                    <span>Saved Delivery Address</span>
                  </div>
                  <button type="button" onClick={() => setActiveModal(null)} className="text-stone-400 hover:text-stone-600">
                    <X size={20} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-[#EA580C] focus:outline-none"
                    placeholder="House/Flat number, Street name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-[#EA580C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-[#EA580C] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setActiveModal(null)} className="rounded-full px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-full bg-[#EA580C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#C2410C]">
                    Save Address
                  </button>
                </div>
              </form>
            )}

            {activeModal === "subscription" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-lg">
                    <RefreshCw className="text-[#EA580C]" size={20} />
                    <span>Pet Subscriptions</span>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="text-stone-400 hover:text-stone-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                  <p className="font-bold text-stone-900">Never run out of kibble or treats</p>
                  <p className="mt-1 text-xs text-stone-600">
                    Set up auto-delivery on any food or litter product with 10% recurring discount.
                  </p>
                </div>
                <p className="text-sm text-stone-500">
                  You currently have no active recurring subscriptions. You can enable auto-delivery right from any product pack size.
                </p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    navigate("/#top-picks");
                  }}
                  className="w-full rounded-full bg-[#EA580C] py-3 text-sm font-bold text-white hover:bg-[#C2410C]"
                >
                  Browse Repeat Favorites
                </button>
              </div>
            )}

            {activeModal === "invite" && (
              <div className="space-y-4 text-center">
                <div className="flex justify-end">
                  <button onClick={() => setActiveModal(null)} className="text-stone-400 hover:text-stone-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-[#EA580C]">
                  <UserPlus size={26} />
                </div>
                <h3 className="text-xl font-bold text-stone-900">Give ₹200, Get ₹200</h3>
                <p className="text-sm text-stone-600">
                  Share your referral link with fellow dog and cat parents. When they place their first order, both of you get ₹200 off!
                </p>
                <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-2 text-left">
                  <span className="truncate font-mono text-xs text-stone-600 flex-1 pl-2">
                    {`${window.location.origin}/?ref=${user.id?.slice(0, 8) || "paws"}`}
                  </span>
                  <button
                    onClick={handleCopyInvite}
                    className="flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>
              </div>
            )}

            {activeModal === "faq" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-lg">
                    <Headphones className="text-[#EA580C]" size={20} />
                    <span>Help &amp; Contact</span>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="text-stone-400 hover:text-stone-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-2 text-sm text-stone-700">
                  <div className="rounded-xl border border-stone-200 p-3">
                    <p className="font-bold text-stone-900">How long does delivery take?</p>
                    <p className="mt-1 text-xs text-stone-600">
                      Standard shipping across India takes 3 to 5 business days with live email tracking.
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-200 p-3">
                    <p className="font-bold text-stone-900">What is the return policy?</p>
                    <p className="mt-1 text-xs text-stone-600">
                      Unopened bags and defect-free toys can be returned or exchanged within 7 days of delivery.
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-200 p-3">
                    <p className="font-bold text-stone-900">Need immediate assistance?</p>
                    <p className="mt-1 text-xs text-stone-600">
                      Email us anytime at <a href="mailto:support@pawsandwhiskers.in" className="text-[#EA580C] underline font-bold">support@pawsandwhiskers.in</a>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "settings" && (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-lg">
                    <Settings className="text-[#EA580C]" size={20} />
                    <span>Account Settings</span>
                  </div>
                  <button type="button" onClick={() => setActiveModal(null)} className="text-stone-400 hover:text-stone-600">
                    <X size={20} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-[#EA580C] focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-[#EA580C] focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    disabled
                    value={user.phone || "Not linked"}
                    className="w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-2.5 text-sm text-stone-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">Phone number verified via SMS login.</p>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setActiveModal(null)} className="rounded-full px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-full bg-[#EA580C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#C2410C] disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
