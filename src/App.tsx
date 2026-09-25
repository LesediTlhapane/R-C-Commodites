import { useMemo, useState, useEffect } from "react";
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

import { tyreProducts as fallbackProducts, tyreCombos as fallbackCombos } from "./data/products";
import type { CartItem, Range, TyreProduct, TyreCombo, AccessoryItem } from "./types";
import backgroundAsset from "./assets/background.png";
import { resolveAsset } from "./lib/assetHelper";
import { useRouter } from "./lib/router";
import { AdminRoutes } from "./components/admin/AdminRoutes";
import {
  getStorefrontProducts,
  subscribeToProductsRealtime,
  mapDbProductToTyre,
  getStorefrontCombos,
  subscribeToCombosRealtime,
  getStorefrontAccessories,
} from "./lib/productService";

export default function App() {
  const [products, setProducts] = useState<TyreProduct[]>(fallbackProducts);
  const [combos, setCombos] = useState<TyreCombo[]>(fallbackCombos);
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
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

  // 1. Fetch live products, combos, and accessories from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    // Load products
    getStorefrontProducts()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setProducts(data);
        }
      })
      .catch((err) => console.warn("[App] Error loading products:", err));

    // Load combos from Supabase
    getStorefrontCombos()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setCombos(data);
        }
      })
      .catch((err) => console.warn("[App] Error loading combos:", err));

    // Load accessories from Supabase (empty table = graceful empty state)
    getStorefrontAccessories()
      .then((data) => {
        if (isMounted) {
          setAccessories(data);
        }
      })
      .catch((err) => console.warn("[App] Error loading accessories:", err));

    // 2. Realtime listener for product stock, price, or details updates
    const unsubscribeProducts = subscribeToProductsRealtime((payload) => {
      console.log("[App] Realtime event on products:", payload.eventType);
      if (payload.eventType === "INSERT" && payload.new) {
        const mapped = mapDbProductToTyre(payload.new);
        setProducts((prev) => [...prev, mapped]);
      } else if (payload.eventType === "UPDATE" && payload.new) {
        const mapped = mapDbProductToTyre(payload.new);
        setProducts((prev) => prev.map((p) => (String(p.id) === String(mapped.id) ? mapped : p)));
      } else if (payload.eventType === "DELETE" && payload.old?.id) {
        setProducts((prev) => prev.filter((p) => String(p.id) !== String(payload.old?.id)));
      }

      // Also refresh combos when product stock changes so combo validation remains strictly up to date
      getStorefrontCombos()
        .then((data) => {
          if (isMounted && data.length > 0) {
            setCombos(data);
          }
        })
        .catch(() => {});
    });

    // 3. Realtime listener for combos updates
    const unsubscribeCombos = subscribeToCombosRealtime(() => {
      getStorefrontCombos()
        .then((data) => {
          if (isMounted && data.length > 0) {
            setCombos(data);
          }
        })
        .catch(() => {});
    });

    // 4. Fallback sync on window focus and periodic refresh (every 45s)
    const refreshData = () => {
      getStorefrontProducts()
        .then((data) => {
          if (isMounted && data.length > 0) {
            setProducts(data);
          }
        })
        .catch(() => {});

      getStorefrontCombos()
        .then((data) => {
          if (isMounted && data.length > 0) {
            setCombos(data);
          }
        })
        .catch(() => {});

      getStorefrontAccessories()
        .then((data) => {
          if (isMounted) {
            setAccessories(data);
          }
        })
        .catch(() => {});
    };

    const intervalId = window.setInterval(refreshData, 45000);
    window.addEventListener("focus", refreshData);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshData);
      unsubscribeProducts();
      unsubscribeCombos();
    };
  }, []);

  // Compute dynamic size options from available products
  const sizeOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.size) set.add(p.size);
    });
    return ["All sizes", ...Array.from(set)];
  }, [products]);

  const totalCartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const totalCartPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.active === false) return false;
      const matchRange = range === "All" || product.range === range;
      const matchSize = selectedSize === "All sizes" || product.size === selectedSize;
      const matchPosition = selectedPosition === "All" || product.position === selectedPosition;
      return matchRange && matchSize && matchPosition;
    });
  }, [products, range, selectedSize, selectedPosition]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(""), 2800);
  };

  const addTyreToCart = (product: TyreProduct) => {
    // Check authoritative stock rule: Stock must be verified and > 0
    if (!product.stockVerified) {
      showToast("Stock for this tyre is not verified. Please enquire via WhatsApp.");
      return;
    }
    const available = product.stockQuantity ?? 0;
    if (available <= 0) {
      showToast("This tyre is currently Out of Stock.");
      return;
    }

    const itemId = `tyre-${product.id}`;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        if (existing.quantity >= available) {
          showToast(`Only ${available} unit(s) available in stock.`);
          return prev;
        }
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
          productId: String(product.id),
          maxStock: available,
          stockVerified: product.stockVerified,
        },
      ];
    });
    showToast(`${product.name} ${product.size} added to cart.`);
  };

  const addComboToCart = (combo: TyreCombo) => {
    // Dual product stock validation
    if (!combo.purchasable) {
      showToast(combo.unpurchasableReason || "Combo is not available for direct purchase.");
      return;
    }

    const available = combo.availableStock ?? 1;
    const itemId = `combo-${combo.id}`;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === itemId);
      if (existing) {
        if (existing.quantity >= available) {
          showToast(`Only ${available} combo set(s) available based on component tyre inventory.`);
          return prev;
        }
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
          comboId: combo.id,
          frontProductId: combo.frontProductId,
          rearProductId: combo.rearProductId,
          maxStock: available,
          stockVerified: combo.stockVerified,
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
        products={products}
        combos={combos}
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
          combos={combos}
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
          accessories={accessories}
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
