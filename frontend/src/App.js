import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchModal } from "@/components/SearchModal";
import Home from "@/pages/Home";
import Article from "@/pages/Article";
import Product from "@/pages/Product";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Cart from "@/pages/Cart";
import Orders from "@/pages/Orders";
import Admin from "@/pages/admin/Admin";
import AdminLogin from "@/pages/admin/AdminLogin";
import PaymentSuccess, { PaymentCancel } from "@/pages/PaymentSuccess";
import UpiPayment from "@/pages/UpiPayment";
import Profile from "@/pages/Profile";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

const RequireAuth = ({ children }) => {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();
  if (!ready) return null;
  return user ? children : <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
};

const ScrollManager = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) {
      window.__lenis?.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
};

const StoreHeader = ({ onSearch }) => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <Header onSearch={onSearch} />;
};

const StoreFooter = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <Footer />;
};

function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.0 });
    window.__lenis = lenis;
    lenisRef.current = lenis;
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
      <div className="min-h-screen bg-[#FAF7F2]">
        <div className="grain-overlay" />
        <ScrollManager />
        <StoreHeader onSearch={() => setSearchOpen(true)} />
        <Routes>
          <Route path="/" element={<Home onSearch={() => setSearchOpen(true)} />} />
          <Route path="/guides/best-cat-food-india-2026" element={<Article />} />
          <Route path="/products/:id" element={<Product />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/payment/upi/:orderId" element={<RequireAuth><UpiPayment /></RequireAuth>} />
        </Routes>
        <StoreFooter />
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        <Toaster position="bottom-center" richColors />
      </div>
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
