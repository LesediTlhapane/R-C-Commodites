import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { TyreFinder } from "./components/TyreFinder";
import { FeaturedRanges } from "./components/FeaturedRanges";
import { CombosSection } from "./components/CombosSection";
import { TyresCatalog } from "./components/TyresCatalog";
import { PerformanceGallery } from "./components/PerformanceGallery";
import { AccessoriesSection } from "./components/AccessoriesSection";
import { WorkshopSection } from "./components/WorkshopSection";
import { VredesteinHeritage } from "./components/VredesteinHeritage";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { MobileQuickBar } from "./components/MobileQuickBar";

import { tyreProducts, tyreCombos, accessoryCategories } from "./data/products";
import type { CartItem, Range, TyreProduct, TyreCombo, AccessoryItem } from "./types";
import backgroundAsset from "./assets/background.png";
import { resolveAsset } from "./lib/assetHelper";
import { useRouter } from "./lib/router";
import { AdminRoutes } from "./components/admin/AdminRoutes";

const sizeOptions = [
  "All sizes",
  "120/70 ZR 17",
  "180/55 ZR 17",
  "190/50 ZR 17",
  "190/55 ZR 17",
  "200/55 ZR 17",
];

export default function App() {
  const [range, setRange] = useState<Range>("All");
  const [selectedSize, setSelectedSize] = useState("All sizes");
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [tyreViewMode, setTyreViewMode] = useState<"cards" | "table">("cards");

  // Tyre finder state
  const [finderPosition, setFinderPosition] = useState("All");
  const [finderWidth, setFinderWidth] = useState("All");
  const [finderProfile, setFinderProfile] = useState("All");

  const totalCartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const totalCartPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const filteredProducts = useMemo(() => {
    return tyreProducts.filter((product) => {
      const matchRange = range === "All" || product.range === range;
      const matchSize = selectedSize === "All sizes" || product.size === selectedSize;
      const matchPosition = selectedPosition === "All" || product.position === selectedPosition;
      return matchRange && matchSize && matchPosition;
    });
  }, [range, selectedSize, selectedPosition]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(""), 2800);
  };

  const addTyreToCart = (product: TyreProduct) => {
    const itemId = `tyre-${product.id}`;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          title: product.name,
          subtitle: `${product.size} (${product.position})`,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ];
    });
    showToast(`${product.name} ${product.size} added to cart.`);
  };

  const addComboToCart = (combo: TyreCombo) => {
    const itemId = `combo-${combo.id}`;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          title: combo.title,
          subtitle: `${combo.frontSize} + ${combo.rearSize}`,
          price: combo.price,
          quantity: 1,
        },
      ];
    });
    showToast(`${combo.title} added to cart.`);
  };

  const addAccessoryToCart = (item: AccessoryItem) => {
    const itemId = `acc-${item.id}`;
    setCartItems((prev) => {
      const existing = prev.find((it) => it.id === itemId);
      if (existing) {
        return prev.map((it) =>
          it.id === itemId ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          title: item.title,
          subtitle: item.category,
          price: item.price,
          quantity: 1,
        },
      ];
    });
    showToast(`${item.title} added to cart.`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handleApplyFinder = () => {
    if (finderWidth !== "All" && finderProfile !== "All") {
      const targetSize = `${finderWidth}/${finderProfile} ZR 17`;
      const match = sizeOptions.includes(targetSize);
      if (match) {
        setSelectedSize(targetSize);
      }
    }
    if (finderPosition !== "All") {
      setSelectedPosition(finderPosition);
    } else {
      setSelectedPosition("All");
    }
    scrollTo("tyres");
  };

  const handleResetFinder = () => {
    setFinderPosition("All");
    setFinderWidth("All");
    setFinderProfile("All");
    setSelectedSize("All sizes");
    setSelectedPosition("All");
  };

  const { pathname } = useRouter();

  // If path is within the admin space (/admin, /admin/login, /admin/*), render dedicated Admin application
  if (pathname.startsWith("/admin")) {
    return <AdminRoutes />;
  }

  const pageBgAsset = resolveAsset(["background", "bg"], backgroundAsset);

  return (
    <div className="relative isolate min-h-screen text-foreground selection:bg-primary selection:text-white pb-16 md:pb-0">
      {/* Background layer with controlled opacity */}
      <img
        src={pageBgAsset}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 h-full w-full object-cover opacity-85 filter contrast-110"
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-background/75" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-3.5 text-sm font-semibold text-white shadow-2xl border-l-4 border-primary animate-in fade-in slide-in-from-bottom-2"
        >
          <Check size={17} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
      />

      {/* Header Navigation */}
      <Header
        totalCartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onScrollTo={scrollTo}
      />

      {/* Main Body */}
      <main id="top">
        {/* 1. Hero Section */}
        <Hero onScrollTo={scrollTo} />

        {/* 2. Tyre Finder Section */}
        <TyreFinder
          finderPosition={finderPosition}
          finderWidth={finderWidth}
          finderProfile={finderProfile}
          onPositionChange={setFinderPosition}
          onWidthChange={setFinderWidth}
          onProfileChange={setFinderProfile}
          onApply={handleApplyFinder}
          onReset={handleResetFinder}
        />

        {/* 3. Featured Tyres / Ranges Section */}
        <FeaturedRanges
          onSelectRange={(r) => {
            setRange(r);
            setSelectedSize("All sizes");
            setSelectedPosition("All");
          }}
          onScrollToTyres={() => scrollTo("tyres")}
        />

        {/* 4. Combos Deals Section */}
        <CombosSection
          combos={tyreCombos}
          onAddCombo={addComboToCart}
        />

        {/* 5. Tyres Catalog Section */}
        <TyresCatalog
          range={range}
          selectedSize={selectedSize}
          selectedPosition={selectedPosition}
          viewMode={tyreViewMode}
          filteredProducts={filteredProducts}
          sizeOptions={sizeOptions}
          onSelectRange={setRange}
          onSelectSize={setSelectedSize}
          onSelectPosition={setSelectedPosition}
          onViewModeChange={setTyreViewMode}
          onAddToCart={addTyreToCart}
          onResetFilters={() => {
            setRange("All");
            setSelectedSize("All sizes");
            setSelectedPosition("All");
          }}
        />

        {/* 6. Performance & Brand Credibility Gallery */}
        <PerformanceGallery onScrollToTyres={() => scrollTo("tyres")} />

        {/* 7. Accessories Section */}
        <AccessoriesSection
          accessories={accessoryCategories}
          onAddAccessory={addAccessoryToCart}
        />

        {/* 8. Workshop & Selby Details Section */}
        <WorkshopSection />

        {/* 9. Made in the Netherlands / Heritage Section */}
        <VredesteinHeritage
          onScrollToCombos={() => scrollTo("combos")}
          onScrollToTyres={() => scrollTo("tyres")}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Sticky Quick Action Bar */}
      <MobileQuickBar
        totalCartCount={totalCartCount}
        totalCartPrice={totalCartPrice}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}
