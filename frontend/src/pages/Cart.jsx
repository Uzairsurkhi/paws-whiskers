import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
  ArrowRight,
  Check,
  Home as HomeIcon,
  FileText,
  CreditCard,
  Truck,
  Clock,
  Tag,
  X,
  PlusCircle,
  MapPin,
  Banknote,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api, errMsg } from "../lib/api";

const inr = (n) => `₹ ${Number(n || 0).toLocaleString("en-IN")}`;

// Pre-saved default address matching Screenshot 2 & 3
const INITIAL_ADDRESS = {
  id: "addr-1",
  name: "Uzair Surkhi",
  phone: "+91-7022889980",
  email: "uzairsurkhi@gmail.com",
  line1: "Door no 4,",
  line2: "26/1, 8th Cross Road, Vibhutipura, Ramesh Nagar, landmark: Rameshnagar",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560037",
  isDefault: true,
};

export default function Cart() {
  const { items, subtotal, count, setQty, remove, lineKey, add, clear } = useCart();
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  // Navigation Steps: 'cart' | 'address' | 'review'
  const [step, setStep] = useState("cart");
  // Payment slide-over drawer
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem("pw_saved_addresses");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [INITIAL_ADDRESS];
  });
  const [selectedAddressId, setSelectedAddressId] = useState(() => localStorage.getItem("pw_selected_address_id") || "addr-1");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Coupon state
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");

  // Loading state
  const [busy, setBusy] = useState(false);

  // Save addresses to localStorage
  useEffect(() => {
    localStorage.setItem("pw_saved_addresses", JSON.stringify(addresses));
    window.dispatchEvent(new Event("pw-addresses-updated"));
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem("pw_selected_address_id", selectedAddressId);
    window.dispatchEvent(new Event("pw-addresses-updated"));
  }, [selectedAddressId]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0] || INITIAL_ADDRESS;

  // Pricing calculations — product prices are shown as-is; no artificial MRP
  // markdown is advertised at checkout.
  const couponDiscount = couponApplied ? (subtotal > 200 ? 200 : 0) : 0;
  const platformFee = 15;
  const platformFeeOriginal = 19;
  const deliveryFee = 0; // FREE
  const finalTotal = subtotal - couponDiscount + platformFee;
  const totalSaved = couponDiscount + (platformFeeOriginal - platformFee);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (code !== "CATRINA5") {
      toast.error("That promo code is not valid.");
      return;
    }
    if (subtotal <= 200) {
      toast.error("Add more than ₹200 to use this promo code.");
      return;
    }
    setCouponCode(code);
    setCouponApplied(true);
    setCouponInput("");
    toast.success("Promo code applied: ₹200 off!");
  };

  // Quick helper to add demo item if cart is empty
  const addWhiskasDemo = () => {
    add(
      {
        id: "whiskas-ocean-fish",
        name: "Whiskas Ocean Fish Flavour Adult Cat Dry Food",
        brand: "Whiskas",
        image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80",
      },
      {
        label: "20kg",
        price: 4950,
      },
      1
    );
    toast.success("Whiskas Ocean Fish added to cart!");
  };

  // Payment Handlers
  const handleProceedFromCart = () => {
    setStep("address");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProceedFromAddress = () => {
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProceedToPayment = () => {
    setShowPaymentDrawer(true);
  };

  // Card Checkout (Stripe)
  const handleCardPayment = async () => {
    if (!user) {
      navigate("/login?next=/cart");
      return;
    }
    setBusy(true);
    try {
      const data = await api.cartCheckout({
        items: items.map(({ product_id, variant, quantity }) => ({ product_id, variant, quantity })),
        shipping: {
          name: selectedAddress.name,
          phone: selectedAddress.phone.replace(/[^0-9+]/g, ""),
          email: selectedAddress.email || user?.email || "customer@paws-whiskers.in",
          line1: selectedAddress.line1,
          line2: selectedAddress.line2 || "",
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  // UPI Checkout
  const handleUpiPayment = async () => {
    if (!user) {
      navigate("/login?next=/cart");
      return;
    }
    setBusy(true);
    try {
      const data = await api.cartCheckoutUpi({
        items: items.map(({ product_id, variant, quantity }) => ({ product_id, variant, quantity })),
        shipping: {
          name: selectedAddress.name,
          phone: selectedAddress.phone.replace(/[^0-9+]/g, ""),
          email: selectedAddress.email || user?.email || "customer@paws-whiskers.in",
          line1: selectedAddress.line1,
          line2: selectedAddress.line2 || "",
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
        origin_url: window.location.origin,
      });
      navigate(`/payment/upi/${data.order_id}`, {
        state: { upiLink: data.upi_link, amount: data.amount || finalTotal },
      });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  // Cash on Delivery Checkout
  const handleCodPayment = async () => {
    if (!user) {
      navigate("/login?next=/cart");
      return;
    }
    setBusy(true);
    try {
      const data = await api.cartCheckoutCod({
        items: items.map(({ product_id, variant, quantity }) => ({ product_id, variant, quantity })),
        shipping: {
          name: selectedAddress.name,
          phone: selectedAddress.phone.replace(/[^0-9+]/g, ""),
          email: selectedAddress.email || user?.email || "customer@paws-whiskers.in",
          line1: selectedAddress.line1,
          line2: selectedAddress.line2 || "",
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
        },
        origin_url: window.location.origin,
      });
      clear();
      toast.success("Order placed successfully with Cash on Delivery!");
      navigate(`/payment/success?order_id=${data.order_id}&method=cod`);
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  // Address Modal Save Handler
  const handleSaveAddress = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updated = {
      id: editingAddress ? editingAddress.id : `addr-${Date.now()}`,
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || "uzairsurkhi@gmail.com",
      line1: formData.get("line1"),
      line2: formData.get("line2") || "",
      city: formData.get("city"),
      state: formData.get("state"),
      pincode: formData.get("pincode"),
      isDefault: true,
    };

    if (editingAddress) {
      setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success("Address updated!");
    } else {
      setAddresses((prev) => [updated, ...prev]);
      setSelectedAddressId(updated.id);
      toast.success("New address added!");
    }
    setShowAddressModal(false);
    setEditingAddress(null);
  };

  // Empty cart fallback
  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-[#EA580C] ring-1 ring-orange-200">
          <ShoppingBag size={32} />
        </span>
        <h1 data-testid="cart-empty" className="font-display mt-6 text-3xl font-bold tracking-tight text-stone-900">
          Your cart is empty
        </h1>
        <p className="mt-3 text-stone-500">
          Add pet-nutritionist approved cat and dog food, verified treats, and essentials.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={addWhiskasDemo}
            className="flex items-center gap-2 rounded-full bg-[#EA580C] px-6 py-3.5 font-bold text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-95"
          >
            <Sparkles size={18} /> Add Whiskas 20kg (Sample Item)
          </button>
          <Link
            to="/#top-picks"
            data-testid="cart-browse-link"
            className="rounded-full border border-stone-300 bg-white px-6 py-3.5 font-bold text-stone-800 shadow-sm transition-all hover:bg-stone-50 active:scale-95"
          >
            Browse top picks
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main data-testid="cart-page" className="min-h-screen bg-[#F8F9FA] pb-24 pt-6 sm:pt-8 text-stone-900 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Stepper Bar (matching Screenshots 2, 3, 4) */}
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white px-6 py-3.5 shadow-sm max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
            {/* Step 1: Cart */}
            <button
              onClick={() => setStep("cart")}
              className={`flex items-center gap-1.5 transition-colors ${
                step === "cart"
                  ? "text-[#EA580C] font-bold"
                  : "text-[#EA580C] hover:text-[#C2410C]"
              }`}
            >
              <Check size={16} strokeWidth={2.5} className="text-[#EA580C]" />
              <span>Cart</span>
            </button>

            <div className="h-0.5 w-12 sm:w-20 bg-stone-200" />

            {/* Step 2: Address */}
            <button
              onClick={() => setStep("address")}
              className={`flex items-center gap-1.5 transition-colors ${
                step === "address"
                  ? "text-[#EA580C] font-bold"
                  : step === "review"
                  ? "text-[#EA580C]"
                  : "text-stone-400"
              }`}
            >
              {step === "review" ? (
                <Check size={16} strokeWidth={2.5} className="text-[#EA580C]" />
              ) : (
                <HomeIcon size={16} className={step === "address" ? "text-[#EA580C]" : "text-stone-400"} />
              )}
              <span>Address</span>
            </button>

            <div className="h-0.5 w-12 sm:w-20 bg-stone-200" />

            {/* Step 3: Review */}
            <button
              onClick={() => {
                if (step !== "cart") setStep("review");
              }}
              className={`flex items-center gap-1.5 transition-colors ${
                step === "review"
                  ? "text-[#EA580C] font-bold"
                  : "text-stone-400"
              }`}
            >
              <FileText size={16} className={step === "review" ? "text-[#EA580C]" : "text-stone-400"} />
              <span>Review</span>
            </button>

            <div className="h-0.5 w-12 sm:w-20 bg-stone-200" />

            {/* Step 4: Payment */}
            <div
              className={`flex items-center gap-1.5 ${
                showPaymentDrawer ? "text-[#EA580C] font-bold" : "text-stone-400"
              }`}
            >
              <CreditCard size={16} className={showPaymentDrawer ? "text-[#EA580C]" : "text-stone-400"} />
              <span>Payment</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Column + Right Summary Column */}
        <div className="grid gap-6 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_410px]">
          {/* =========================================================================
              LEFT COLUMN - STEP 1: CART (Screenshot 1)
             ========================================================================= */}
          {step === "cart" && (
            <div className="space-y-4">
              {/* Delivering to Banner (Image 1 top bar) */}
              <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-3.5 shadow-sm">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[#EA580C]">
                    <MapPin size={16} />
                  </span>
                  <p className="truncate text-xs sm:text-sm font-medium text-stone-700">
                    Delivering to <strong className="font-bold text-stone-900">{selectedAddress.line1} {selectedAddress.line2?.slice(0, 20)}...</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="ml-3 shrink-0 text-xs sm:text-sm font-bold text-[#EA580C] hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                {items.map((item) => {
                  const key = lineKey(item);

                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm"
                    >
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm sm:text-base font-bold text-stone-900 line-clamp-2 leading-snug">
                                {item.name}
                              </h3>
                              <p className="mt-1 text-xs sm:text-sm text-stone-500 font-medium">
                                Size - {item.variant}
                              </p>
                            </div>
                            <button
                              onClick={() => remove(key)}
                              className="text-stone-400 hover:text-red-500 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {/* Controls & Price */}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2">
                            {/* Quantity Selector */}
                            <div className="flex items-center rounded-lg border border-stone-200 bg-white shadow-xs">
                              <button
                                onClick={() => setQty(key, item.quantity - 1)}
                                className="px-2.5 py-1 text-stone-600 hover:text-[#EA580C] transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-xs sm:text-sm font-bold text-stone-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => setQty(key, item.quantity + 1)}
                                className="px-2.5 py-1 text-stone-600 hover:text-[#EA580C] transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Pricing Tag */}
                            <div className="flex items-baseline gap-2">
                              <span className="text-base sm:text-lg font-extrabold text-stone-900">
                                {inr(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery badge */}
                      <div className="mt-3.5 flex items-center gap-1.5 border-t border-stone-100 pt-3 text-xs font-semibold text-stone-800">
                        <span className="flex h-4 w-4 items-center justify-center text-amber-600">
                          ⚡
                        </span>
                        <span>Delivery by <strong className="text-stone-900">Today 9AM</strong></span>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          )}

          {/* =========================================================================
              LEFT COLUMN - STEP 2: ADDRESS (Screenshot 2)
             ========================================================================= */}
          {step === "address" && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                Select address
              </h2>

              {/* Saved Address Card (Orange outline, active state) */}
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`relative rounded-2xl bg-white p-5 sm:p-6 transition-all cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#EA580C] shadow-sm"
                        : "border border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base sm:text-lg font-bold text-stone-900">
                        {addr.name}
                      </span>
                      {addr.isDefault && (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-0.5 text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                      <p>{addr.line1}</p>
                      {addr.line2 && <p>{addr.line2}</p>}
                      <p>{addr.city}</p>
                      <p>{addr.state}</p>
                      <p>{addr.pincode}</p>
                      <p className="pt-2 font-medium text-stone-800">{addr.phone}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAddress(addr);
                          setShowAddressModal(true);
                        }}
                        className="rounded-lg border border-stone-300 bg-white px-4 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAddressId(addr.id);
                          handleProceedFromAddress();
                        }}
                        className="rounded-lg bg-[#EA580C] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#C2410C]"
                      >
                        Deliver here
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add a new address button (Cream / Peach styled card) */}
              <button
                type="button"
                onClick={() => {
                  setEditingAddress(null);
                  setShowAddressModal(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-[#FFF7ED] py-4 text-sm font-bold text-[#EA580C] transition-colors hover:bg-orange-100/60"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Add a new address</span>
              </button>
            </div>
          )}

          {/* =========================================================================
              LEFT COLUMN - STEP 3: REVIEW (Screenshot 3)
             ========================================================================= */}
          {step === "review" && (
            <div className="space-y-4">
              {/* Delivering to summary box */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#EA580C]">
                      <MapPin size={16} />
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-stone-900">
                      Delivering to <strong className="text-stone-900">{selectedAddress.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("address")}
                    className="text-xs sm:text-sm font-bold text-[#EA580C] hover:underline"
                  >
                    Change
                  </button>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-stone-600 pl-9 line-clamp-1">
                  {selectedAddress.line1}, {selectedAddress.line2}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                </p>
              </div>

              {/* Delivery Estimates Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Delivery estimates
                </h3>

                {/* Estimate 1: Main Items */}
                {items.map((item, idx) => (
                  <div
                    key={item.product_id}
                    className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-800">
                      <Clock size={16} className="text-amber-600" />
                      <span>Arriving by <strong className="text-stone-900">Today 9AM</strong></span>
                      <span className="text-stone-400 text-xs ml-auto">
                        Delivery {idx + 1} of {items.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 border-t border-stone-100 pt-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg border border-stone-100 object-contain p-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-stone-500 font-medium">
                          Size - {item.variant}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* =========================================================================
              RIGHT COLUMN: PRICE DETAILS (Screenshots 1, 2, 3)
             ========================================================================= */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Promo code */}
            {couponApplied ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Tag size={18} />
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-stone-900">
                        {couponCode} <span className="font-normal text-stone-500">applied</span>
                      </p>
                      <p className="text-xs font-semibold text-emerald-600">
                        ₹200 saved!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCouponApplied(false)}
                    className="text-xs font-bold text-stone-500 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 shadow-sm"
                onSubmit={(event) => {
                  event.preventDefault();
                  applyCoupon();
                }}
              >
                <label htmlFor="promo-code" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-700">
                  <Tag size={18} className="text-stone-400" /> Have a promo code?
                </label>
                <div className="mt-3 flex gap-2">
                  <input
                    id="promo-code"
                    data-testid="promo-code-input"
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold uppercase tracking-wide outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="submit"
                    disabled={!couponInput.trim()}
                    className="rounded-xl bg-stone-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </form>
            )}

            {/* Price Details Box */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm sm:text-base font-bold text-stone-900">
                Price Details ( {count} Items )
              </h3>

              <dl className="mt-4 space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-stone-900">{inr(subtotal)}</dd>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-stone-600">
                    <dt>Coupon Discount</dt>
                    <dd className="font-semibold text-emerald-600">- {inr(couponDiscount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <dt className="flex items-center gap-1">
                    Platform Fee
                    <span className="text-[10px] text-stone-400">(incl. taxes)</span>
                  </dt>
                  <dd className="space-x-1.5">
                    <span className="text-stone-400 line-through">{inr(platformFeeOriginal)}</span>
                    <span className="font-semibold text-stone-900">{inr(platformFee)}</span>
                  </dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>Delivery Fee</dt>
                  <dd className="font-bold text-emerald-600">FREE</dd>
                </div>

                <div className="border-t border-stone-200 pt-3 flex items-baseline justify-between">
                  <dt className="text-sm font-extrabold uppercase tracking-wide text-stone-900">
                    TOTAL
                  </dt>
                  <dd className="text-xl sm:text-2xl font-black text-stone-900">
                    {inr(finalTotal)}
                  </dd>
                </div>
              </dl>

              {/* Green Savings Pill */}
              <div className="mt-4 rounded-xl bg-[#E8F8F0] px-4 py-2.5 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                <span>🏷️</span> You have saved {inr(totalSaved)}
              </div>

              {/* Big Action Button */}
              {step === "cart" && (
                <button
                  type="button"
                  onClick={handleProceedFromCart}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#EA580C] py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98]"
                >
                  <span>PROCEED</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              )}

              {step === "address" && (
                <button
                  type="button"
                  onClick={handleProceedFromAddress}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#EA580C] py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98]"
                >
                  <span>PROCEED</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              )}

              {step === "review" && (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#EA580C] py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#C2410C] active:scale-[0.98]"
                >
                  <span>PROCEED TO PAYMENT</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* =========================================================================
          STEP 4: PAYMENT METHOD SLIDE-OVER DRAWER (Screenshot 4)
         ========================================================================= */}
      {showPaymentDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setShowPaymentDrawer(false)}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Header with Close ✕ */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <button
                    onClick={() => setShowPaymentDrawer(false)}
                    className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Secure Checkout
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                    Select a payment method
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-stone-500 font-medium">
                    Help us ensure a smooth delivery
                  </p>
                </div>

                {/* Payment Options List */}
                <div className="mt-6 space-y-3.5">
                  {/* Option 1: Credit / Debit card */}
                  <button
                    onClick={handleCardPayment}
                    disabled={busy}
                    className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-[#EA580C] hover:bg-orange-50/20 active:scale-[0.99] group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900 group-hover:text-[#EA580C] transition-colors">
                          Credit / Debit card
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Extra discounts available on ICICI Bank Credit Cards On Orders Above ₹2500
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-stone-400">
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">VISA</span>
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">Mastercard</span>
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600">RuPay</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-stone-400 group-hover:text-[#EA580C] shrink-0 ml-2" />
                  </button>

                  {/* Option 2: UPI */}
                  <button
                    onClick={handleUpiPayment}
                    disabled={busy}
                    className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-[#EA580C] hover:bg-orange-50/20 active:scale-[0.99] group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                        <span className="text-xs font-black">UPI</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900 group-hover:text-[#EA580C] transition-colors">
                          UPI
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Instant payment with Google Pay, PhonePe, Paytm or UPI ID
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold">
                          <span className="text-blue-600">GPay</span> •
                          <span className="text-purple-600">PhonePe</span> •
                          <span className="text-cyan-600">Paytm</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-stone-400 group-hover:text-[#EA580C] shrink-0 ml-2" />
                  </button>

                  {/* Option 3: Pay On Delivery (Cash on delivery) */}
                  <button
                    onClick={handleCodPayment}
                    disabled={busy}
                    className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-[#EA580C] hover:bg-orange-50/20 active:scale-[0.99] group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                        <Banknote size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900 group-hover:text-[#EA580C] transition-colors">
                          Pay On Delivery
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                          Pay via cash or scan UPI code at your doorstep
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-stone-400 group-hover:text-[#EA580C] shrink-0 ml-2" />
                  </button>
                </div>
              </div>

              {/* Bottom footer reassurance */}
              <div className="pt-6 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                  <span>Amount to pay:</span>
                  <span className="text-base font-extrabold text-stone-900">{inr(finalTotal)}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>100% safe &amp; secure payments with encrypted processing.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD / EDIT ADDRESS MODAL
         ========================================================================= */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-lg font-bold text-stone-900">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    name="name"
                    defaultValue={editingAddress ? editingAddress.name : user?.name || "Uzair Surkhi"}
                    required
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    name="phone"
                    defaultValue={editingAddress ? editingAddress.phone : user?.phone || "+91-7022889980"}
                    required
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Flat / House no., Building *
                </label>
                <input
                  name="line1"
                  defaultValue={editingAddress ? editingAddress.line1 : "Door no 4,"}
                  required
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Area, Street, Landmark
                </label>
                <input
                  name="line2"
                  defaultValue={editingAddress ? editingAddress.line2 : "26/1, 8th Cross Road, Vibhutipura, Ramesh Nagar, landmark: Rameshnagar"}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    City *
                  </label>
                  <input
                    name="city"
                    defaultValue={editingAddress ? editingAddress.city : "Bengaluru"}
                    required
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    State *
                  </label>
                  <input
                    name="state"
                    defaultValue={editingAddress ? editingAddress.state : "Karnataka"}
                    required
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Pincode *
                  </label>
                  <input
                    name="pincode"
                    defaultValue={editingAddress ? editingAddress.pincode : "560037"}
                    required
                    pattern="\d{6}"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="rounded-xl border border-stone-200 px-5 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#EA580C] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#C2410C]"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
