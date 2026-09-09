import { useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  Headphones,
  Settings,
  LogOut,
  ChevronRight,
  X,
  LayoutDashboard,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, errMsg } from "../lib/api";

export const ProfileDrawer = ({ open, onClose }) => {
  const { user, logout, isAdmin, setUser } = useAuth();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null); // 'address' | 'faq' | 'settings'
  const [saving, setSaving] = useState(false);

  // Settings form state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // Address state
  const [address, setAddress] = useState({
    line1: localStorage.getItem("pw_saved_address_line1") || "Flat 402, Sunshine Residency",
    city: localStorage.getItem("pw_saved_address_city") || "Bengaluru",
    state: localStorage.getItem("pw_saved_address_state") || "Karnataka",
    pincode: localStorage.getItem("pw_saved_address_pincode") || "560001",
  });

  if (!open || !user) return null;

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

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" data-testid="profile-drawer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="w-screen max-w-md h-screen transform bg-[#FAF7F2] p-6 shadow-2xl transition-all sm:p-8 overflow-y-auto">
          {/* Header Row with Close */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">
                Hi {displayName}
              </h2>
              <p className="mt-1 text-sm text-stone-500 font-medium">
                {loginDetail}
              </p>
            </div>
            <button
              data-testid="profile-drawer-close"
              onClick={onClose}
              className="rounded-full p-2 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition-colors"
              aria-label="Close drawer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Navigation Cards Stack matching user uploaded design */}
          <div className="mt-8 space-y-3.5">
            {/* 1. Orders (Active style with orange border and indicator bar) */}
            <button
              data-testid="profile-drawer-orders"
              onClick={() => {
                onClose();
                navigate("/orders");
              }}
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
              data-testid="profile-drawer-address"
              onClick={() => setActiveModal("address")}
              className="group flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <MapPin size={22} strokeWidth={1.8} className="text-stone-800" />
                <span className="text-base font-semibold text-stone-800">Address</span>
              </div>
              <ChevronRight size={20} strokeWidth={2} className="text-stone-400 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* 3. FAQ/ Contact Us */}
            <button
              data-testid="profile-drawer-faq"
              onClick={() => setActiveModal("faq")}
              className="group flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <Headphones size={22} strokeWidth={1.8} className="text-stone-800" />
                <span className="text-base font-semibold text-stone-800">FAQ/ Contact Us</span>
              </div>
              <ChevronRight size={20} strokeWidth={2} className="text-stone-400 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* 4. Account Settings */}
            <button
              data-testid="profile-drawer-settings"
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
                data-testid="profile-drawer-admin"
                onClick={() => {
                  onClose();
                  navigate("/admin");
                }}
                className="group flex w-full items-center justify-between rounded-2xl border border-teal-200 bg-teal-50/50 px-5 py-4 text-left shadow-sm transition-all hover:bg-teal-50 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <LayoutDashboard size={22} strokeWidth={1.8} className="text-teal-700" />
                  <span className="text-base font-semibold text-teal-900">Admin Dashboard</span>
                </div>
                <ChevronRight size={20} strokeWidth={2} className="text-teal-600 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* 5. Log Out */}
            <button
              data-testid="profile-drawer-logout"
              onClick={() => {
                onClose();
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
        </div>
      </aside>

      {/* Sub-modals for drawer items */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            {/* ADDRESS MODAL */}
            {activeModal === "address" && (
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-lg">
                    <MapPin className="text-[#EA580C]" size={20} />
                    <span>Saved Delivery Address</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Street Address
                  </label>
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-[#EA580C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                      State
                    </label>
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    PIN Code
                  </label>
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
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-full px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#EA580C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#C2410C]"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}

            {/* FAQ / CONTACT MODAL */}
            {activeModal === "faq" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-lg">
                    <Headphones className="text-[#EA580C]" size={20} />
                    <span>Help &amp; Contact</span>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-stone-400 hover:text-stone-600"
                  >
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

            {/* ACCOUNT SETTINGS MODAL */}
            {activeModal === "settings" && (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-lg">
                    <Settings className="text-[#EA580C]" size={20} />
                    <span>Account Settings</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-[#EA580C] focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium focus:border-[#EA580C] focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.phone || "Not linked"}
                    className="w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-2.5 text-sm text-stone-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">Phone number verified via SMS login.</p>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-full px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-100"
                  >
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
    </div>,
    document.body
  );
};
