import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchModal } from "@/components/SearchModal";
import Home from "@/pages/Home";
import Article from "@/pages/Article";

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
      <div className="min-h-screen bg-[#FAF7F2]">
        <div className="grain-overlay" />
        <ScrollManager />
        <Header onSearch={() => setSearchOpen(true)} />
        <Routes>
          <Route path="/" element={<Home onSearch={() => setSearchOpen(true)} />} />
          <Route path="/guides/best-cat-food-india-2026" element={<Article />} />
        </Routes>
        <Footer />
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        <Toaster position="bottom-center" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;
