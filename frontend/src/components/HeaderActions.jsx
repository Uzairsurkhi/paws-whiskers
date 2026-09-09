import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, User, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ProfileDrawer } from "./ProfileDrawer";

export const HeaderActions = () => {
  const { user } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Link data-testid="header-cart-button" to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white/70 text-stone-700 shadow-sm transition-colors hover:border-orange-300 hover:text-[#EA580C]">
        <ShoppingBag size={17} />
        {count > 0 && (
          <span data-testid="header-cart-count" className="font-mono-accent absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EA580C] px-1 text-[10px] font-bold text-white">{count}</span>
        )}
      </Link>
      {user ? (
        <div>
          <button
            data-testid="header-account-button"
            onClick={() => setOpen(true)}
            className="flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-[#EA580C]/40 hover:bg-white active:scale-95"
            aria-label="Open profile menu"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EA580C] text-white">
              <User size={13} />
            </span>
            <span className="hidden sm:inline text-xs font-bold text-stone-800 max-w-[110px] truncate">
              {user.name ? user.name.split(" ")[0] : "Account"}
            </span>
            <ChevronDown size={14} className="text-stone-400" />
          </button>
          <ProfileDrawer open={open} onClose={() => setOpen(false)} />
        </div>
      ) : (
        <Link data-testid="header-login-button" to="/login" className="flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-stone-900 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-stone-700 active:scale-95">
          <User size={15} className="shrink-0" /> <span className="hidden sm:inline">Log in</span>
        </Link>
      )}
    </>
  );
};
