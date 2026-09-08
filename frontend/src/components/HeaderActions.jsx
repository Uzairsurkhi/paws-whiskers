import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, LogOut, Package, LayoutDashboard, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export const HeaderActions = () => {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const item = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-stone-700 transition-colors hover:bg-orange-50 hover:text-[#EA580C]";

  return (
    <>
      <Link data-testid="header-cart-button" to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white/70 text-stone-700 shadow-sm transition-colors hover:border-orange-300 hover:text-[#EA580C]">
        <ShoppingBag size={17} />
        {count > 0 && (
          <span data-testid="header-cart-count" className="font-mono-accent absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EA580C] px-1 text-[10px] font-bold text-white">{count}</span>
        )}
      </Link>
      {user ? (
        <div ref={ref} className="relative">
          <button data-testid="header-account-button" onClick={() => setOpen((o) => !o)} className="flex h-10 items-center gap-1.5 rounded-full border border-stone-200 bg-white/70 px-3 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:border-orange-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white"><User size={13} /></span>
            <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div data-testid="account-menu" className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl">
              <p className="font-mono-accent truncate px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">{user.phone || user.email}</p>
              <button data-testid="account-menu-orders" className={item} onClick={() => { setOpen(false); navigate("/orders"); }}><Package size={15} /> My orders</button>
              {isAdmin && <button data-testid="account-menu-admin" className={item} onClick={() => { setOpen(false); navigate("/admin"); }}><LayoutDashboard size={15} /> Admin dashboard</button>}
              <button data-testid="account-menu-logout" className={item} onClick={() => { setOpen(false); logout(); navigate("/"); }}><LogOut size={15} /> Log out</button>
            </div>
          )}
        </div>
      ) : (
        <Link data-testid="header-login-button" to="/login" className="flex h-10 items-center gap-1.5 rounded-full bg-stone-900 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-stone-700 active:scale-95">
          <User size={15} /> <span className="hidden sm:inline">Log in</span>
        </Link>
      )}
    </>
  );
};
