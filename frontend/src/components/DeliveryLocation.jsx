import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, MapPin } from "lucide-react";

const ADDRESSES_KEY = "pw_saved_addresses";
const SELECTED_ADDRESS_KEY = "pw_selected_address_id";

const readAddresses = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(ADDRESSES_KEY) || "[]");
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {}

  const line1 = localStorage.getItem("pw_saved_address_line1");
  const city = localStorage.getItem("pw_saved_address_city");
  const state = localStorage.getItem("pw_saved_address_state");
  const pincode = localStorage.getItem("pw_saved_address_pincode");
  return line1 ? [{ id: "profile-address", line1, city, state, pincode }] : [];
};

export const DeliveryLocation = () => {
  const [addresses, setAddresses] = useState(readAddresses);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(SELECTED_ADDRESS_KEY) || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setAddresses(readAddresses());
    window.addEventListener("storage", refresh);
    window.addEventListener("pw-addresses-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("pw-addresses-updated", refresh);
    };
  }, []);

  const selected = addresses.find((address) => address.id === selectedId) || addresses[0];
  const selectAddress = (id) => {
    localStorage.setItem(SELECTED_ADDRESS_KEY, id);
    setSelectedId(id);
    setOpen(false);
    window.dispatchEvent(new Event("pw-addresses-updated"));
  };

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        data-testid="header-delivery-location"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 max-w-[190px] items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-3 text-left shadow-sm transition-colors hover:border-orange-300"
        aria-expanded={open}
      >
        <MapPin size={16} className="shrink-0 text-[#EA580C]" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-stone-400">Deliver to</span>
          <span className="block truncate text-xs font-bold text-stone-700">
            {selected ? `${selected.city || selected.line1}${selected.pincode ? ` · ${selected.pincode}` : ""}` : "Add address"}
          </span>
        </span>
        <ChevronDown size={14} className="shrink-0 text-stone-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">Saved delivery addresses</p>
          {addresses.length ? addresses.map((address) => (
            <button
              key={address.id}
              type="button"
              onClick={() => selectAddress(address.id)}
              className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-orange-50"
            >
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#EA580C]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-stone-800">{address.name || "Delivery address"}</span>
                <span className="block truncate text-xs text-stone-500">{[address.line1, address.city, address.pincode].filter(Boolean).join(", ")}</span>
              </span>
              {selected?.id === address.id && <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />}
            </button>
          )) : <p className="px-3 py-3 text-sm text-stone-500">No saved address yet.</p>}
          <Link to="/cart" onClick={() => setOpen(false)} className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-bold text-[#EA580C] hover:bg-orange-50">
            {addresses.length ? "Manage addresses" : "Add delivery address"}
          </Link>
        </div>
      )}
    </div>
  );
};
