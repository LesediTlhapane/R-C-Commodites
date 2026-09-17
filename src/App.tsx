import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  Truck,
  Wrench,
  X,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Tag,
  Flame,
  Layers,
  Award,
  ChevronLeft,
  ChevronRight,
  Camera,
} from "lucide-react";
import { ShopButton } from "./components/ShopButton";
import { CartDrawer } from "./components/CartDrawer";
import { tyreProducts, tyreCombos, vredesteinHeritage, accessoryCategories } from "./data/products";
import type { CartItem, Range, TyreProduct, TyreCombo, AccessoryItem } from "./types";

import logoAsset from "./assets/rc-logo.png";
import tyre2Asset from "./assets/tyre2.jpg";
import detailAsset from "./assets/Centauro_detail.jpeg";
import backgroundAsset from "./assets/background.png";

// New high-resolution motorcycle and tyre photography
import superbikeAsset from "./assets/01ecd86a0585bbcc8e8bb93c9de047f7.jpg";
import tyreMacroAsset from "./assets/0203d32f4212b2e0b2a9df4b0f0db2f3.jpg";
import moodyBikeAsset from "./assets/4298f1d6724ee05cbb8ca427a0471e9c.jpg";
import riderTrackAsset from "./assets/a2e33fb2f4a33ac97cd10c97f2d215ed.jpg";

const sizeOptions = [
  "All sizes",
  "120/70 ZR 17",
  "180/55 ZR 17",
  "190/50 ZR 17",
  "190/55 ZR 17",
  "200/55 ZR 17",
];

const heroMediaItems = [
  {
    src: riderTrackAsset,
    alt: "Superbike knee-down track cornering on Vredestein Centauro tyres",
    label: "Cornering Grip",
    badge: "Track Attack",
    aspect: "object-cover",
    caption: "Extreme Lean Stability & Dual-Compound Shoulder Grip",
  },
  {
    src: logoAsset,
    alt: "R&C Commodities official logo - Vredestein Motorcycle Tyre Importer",
    label: "R&C Commodities",
    badge: "Official Importer",
    aspect: "object-contain p-8 sm:p-12 bg-neutral-950",
    caption: "R&C Commodities · Direct Vredestein Motorcycle Tyre Distributor (Selby, JHB)",
  },
  {
    src: tyre2Asset,
    alt: "Vredestein Centauro ST motorcycle tyre profile",
    label: "Centauro Tyre",
    badge: "Official Stock",
    aspect: "object-contain p-4 sm:p-6",
    caption: "Centauro Sport Touring & Super Sport Profile",
  },
  {
    src: tyreMacroAsset,
    alt: "Macro close-up of Vredestein Centauro tread sipes and silica compound",
    label: "Tread Siping",
    badge: "Dutch R&D",
    aspect: "object-cover",
    caption: "Full-Silica Polymer Matrix & Water Evacuation Sipes",
  },
  {
    src: superbikeAsset,
    alt: "High-performance superbike fitted with Centauro tyres ready for the road",
    label: "Superbike Stance",
    badge: "Ready to Fit",
    aspect: "object-cover",
    caption: "Zero-Degree Steel Belt Stability on Naked & Superbike Chassis",
  },
];

export default function App() {
  const [range, setRange] = useState<Range>("All");
  const [selectedSize, setSelectedSize] = useState("All sizes");
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [tyreViewMode, setTyreViewMode] = useState<"cards" | "table">("cards");
  const [heroPhotoIdx, setHeroPhotoIdx] = useState(0);

  // Finder filter state
  const [finderPosition, setFinderPosition] = useState("All");
  const [finderWidth, setFinderWidth] = useState("All");
  const [finderProfile, setFinderProfile] = useState("All");

  const totalCartCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
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
    setMenuOpen(false);
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

  return (
    <div className="relative isolate min-h-screen text-foreground selection:bg-primary selection:text-white">
      {/* Background layer */}
      <img
        src={backgroundAsset}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 h-full w-full object-cover opacity-95"
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-background/65" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl border-l-4 border-primary animate-in fade-in slide-in-from-bottom-2"
        >
          <Check size={16} className="text-emerald-400" />
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

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-700 bg-neutral-800/95 text-white shadow-xl backdrop-blur-sm">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-20 items-center justify-between gap-4 py-2">
            {/* Brand Logo & Name */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Go to top"
                onClick={() => scrollTo("top")}
                className="shrink-0 bg-transparent transition-transform hover:scale-105"
              >
                <img
                  src={logoAsset}
                  alt="R&C Commodities"
                  className="h-14 sm:h-16 w-auto object-contain"
                />
              </button>
              <div className="min-w-0 border-l-4 border-primary pl-3">
                <p className="truncate font-display text-base uppercase leading-none tracking-tight sm:text-xl">
                  <span className="text-primary">R&amp;C</span>{" "}
                  <span className="text-white">Commodities</span>
                </p>
                <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.18em] text-amber-300 sm:text-[10px]">
                  PREMIUM TYRES AND ACCESSORIES
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden items-stretch border border-neutral-600 bg-neutral-700/70 shadow-[0_0_18px_rgba(239,68,68,0.12)] lg:flex">
              <button
                onClick={() => scrollTo("tyres")}
                className="border-r border-neutral-600 px-4 py-4 text-xs font-black uppercase tracking-[0.12em] transition-colors hover:bg-primary hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.7),0_0_16px_rgba(239,68,68,0.35)]"
              >
                Tyres
              </button>
              <button
                onClick={() => scrollTo("combos")}
                className="relative border-r border-neutral-600 px-4 py-4 text-xs font-black uppercase tracking-[0.12em] text-amber-300 transition-colors hover:bg-primary hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.7),0_0_16px_rgba(239,68,68,0.35)]"
              >
                Combos
                <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-neutral-950 uppercase">
                  Save
                </span>
              </button>
              <button
                onClick={() => scrollTo("netherlands")}
                className="border-r border-neutral-600 px-4 py-4 text-xs font-black uppercase tracking-[0.12em] transition-colors hover:bg-primary hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.7),0_0_16px_rgba(239,68,68,0.35)]"
              >
                Made in Netherlands
              </button>
              <button
                onClick={() => scrollTo("accessories")}
                className="border-r border-neutral-600 px-4 py-4 text-xs font-black uppercase tracking-[0.12em] transition-colors hover:bg-primary hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.7),0_0_16px_rgba(239,68,68,0.35)]"
              >
                Accessories
              </button>
              <button
                onClick={() => scrollTo("finder")}
                className="border-r border-neutral-600 px-4 py-4 text-xs font-black uppercase tracking-[0.12em] transition-colors hover:bg-primary hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.7),0_0_16px_rgba(239,68,68,0.35)]"
              >
                Find size
              </button>
              <button
                onClick={() => scrollTo("workshop")}
                className="px-4 py-4 text-xs font-black uppercase tracking-[0.12em] transition-colors hover:bg-primary hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.7),0_0_16px_rgba(239,68,68,0.35)]"
              >
                Workshop
              </button>
            </nav>

            {/* Quick Actions (Search, Cart, Menu) */}
            <div className="flex items-center gap-2">
              <button
                aria-label="Search tyres"
                onClick={() => scrollTo("finder")}
                className="grid size-10 place-items-center border border-neutral-600 bg-neutral-700 text-white shadow-[0_0_12px_rgba(251,191,36,0.08)] hover:bg-primary transition-colors rounded-xs"
              >
                <Search size={18} />
              </button>
              <button
                aria-label={`Cart with ${totalCartCount} items`}
                onClick={() => setIsCartOpen(true)}
                className="relative grid size-10 place-items-center bg-primary text-white hover:bg-primary-hover transition-colors rounded-xs"
              >
                <ShoppingBag size={18} />
                {totalCartCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-amber-300 text-[11px] font-bold text-neutral-950 shadow">
                    {totalCartCount}
                  </span>
                )}
              </button>
              <button
                aria-label="Open menu"
                onClick={() => setMenuOpen(!menuOpen)}
                className="grid size-10 place-items-center border border-neutral-600 bg-neutral-700 text-white hover:bg-primary lg:hidden transition-colors rounded-xs"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {menuOpen && (
            <nav className="grid gap-px border-t border-neutral-600 bg-neutral-700 py-2 lg:hidden">
              {[
                ["Tyres Catalog", "tyres"],
                ["Tyre Combos (Save R650)", "combos"],
                ["Made in Netherlands (Since 1909)", "netherlands"],
                ["Accessories", "accessories"],
                ["Find my size", "finder"],
                ["Workshop & Location", "workshop"],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="px-3 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-white/85 hover:bg-primary hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.7)]"
                >
                  {label}
                </button>
              ))}
            </nav>
          )}

          {/* Quick Sub-header Range Filter Bar */}
          <div className="flex min-h-12 items-center gap-2 overflow-x-auto border-t border-neutral-600 text-sm py-1.5 scrollbar-none">
            <span className="shrink-0 font-black uppercase tracking-[0.14em] text-amber-300 text-xs">
              Quick Filter:
            </span>
            <span className="shrink-0 text-white/70 text-xs">Vredestein Range</span>
            <span className="h-4 w-px shrink-0 bg-neutral-500" />
            {(["All", "NS", "ST"] as Range[]).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setRange(item);
                  setSelectedSize("All sizes");
                  setSelectedPosition("All");
                  scrollTo("tyres");
                }}
                className={`shrink-0 border px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] transition-colors rounded-xs ${
                  range === item
                    ? "border-primary bg-primary text-white shadow-[0_0_14px_rgba(239,68,68,0.35)]"
                    : "border-neutral-600 bg-neutral-700 text-white/85 hover:border-amber-300 hover:text-white"
                }`}
              >
                {item === "All" ? "All Fitments" : `Centauro ${item}`}
              </button>
            ))}
            <button
              onClick={() => scrollTo("combos")}
              className="shrink-0 border border-amber-500/80 bg-amber-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-amber-300 hover:bg-amber-500 hover:text-neutral-950 transition-colors rounded-xs flex items-center gap-1.5"
            >
              <Flame size={12} /> Combos (From R2,940)
            </button>
            <button
              onClick={() => scrollTo("netherlands")}
              className="shrink-0 border border-neutral-600 bg-neutral-700 px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-white/85 hover:border-amber-300 hover:text-white rounded-xs"
            >
              Made in Netherlands
            </button>
            <button
              onClick={() => scrollTo("accessories")}
              className="shrink-0 border border-neutral-600 bg-neutral-700 px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-white/85 hover:border-amber-300 hover:text-white rounded-xs"
            >
              Accessories
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-background/50">
          <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-16">
            <div className="lg:col-span-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-foreground-muted">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                Made in the Netherlands · Since 1909
              </div>
              <h1 className="max-w-[14ch] text-4xl leading-[1.05] sm:text-5xl lg:text-6xl uppercase tracking-tight">
                Superbike tyres, <span className="text-primary">fitted properly.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-7 text-foreground-muted">
                Vredestein has been engineering premium tyres since 1909. Genuine Centauro NS
                (Super Sport) and Centauro ST (Sport Touring) motorcycle tyres delivering
                exceptional grip, stability, and high mileage in all conditions.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <ShopButton onClick={() => scrollTo("tyres")}>
                  Shop tyres <ArrowRight size={17} />
                </ShopButton>
                <button
                  onClick={() => scrollTo("combos")}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-neutral-950 hover:bg-amber-300 transition-colors shadow-md"
                >
                  <Flame size={16} /> Tyre Combos (From R2,940)
                </button>
                <ShopButton variant="outline" onClick={() => scrollTo("finder")}>
                  Find my size
                </ShopButton>
              </div>

              {/* Range Quick Badges */}
              <div className="mt-10 grid max-w-xl grid-cols-4 border-y border-border py-4 text-xs sm:text-sm">
                <div>
                  <strong className="block font-display text-sm sm:text-base text-steel">Centauro ST</strong>
                  <span className="text-[11px] sm:text-xs text-foreground-muted">From R1,350 (Touring)</span>
                </div>
                <div className="border-l border-border pl-3">
                  <strong className="block font-display text-sm sm:text-base text-primary">Centauro NS</strong>
                  <span className="text-[11px] sm:text-xs text-foreground-muted">From R1,900 (Sport)</span>
                </div>
                <div className="border-l border-border pl-3">
                  <strong className="block font-display text-sm sm:text-base text-amber-400">Combos</strong>
                  <span className="text-[11px] sm:text-xs text-foreground-muted">From R2,940 (Pairs)</span>
                </div>
                <div className="border-l border-border pl-3">
                  <strong className="block font-display text-sm sm:text-base text-foreground">17-inch</strong>
                  <span className="text-[11px] sm:text-xs text-foreground-muted">120 to 200 sizes</span>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase with Interactive Multi-Angle Gallery */}
            <div className="relative lg:col-span-6 flex flex-col gap-3">
              <div className="aspect-[16/11] overflow-hidden rounded-xl border border-border bg-surface-soft shadow-lg relative group">
                <img
                  key={heroPhotoIdx}
                  src={heroMediaItems[heroPhotoIdx].src}
                  alt={heroMediaItems[heroPhotoIdx].alt}
                  className={`h-full w-full ${heroMediaItems[heroPhotoIdx].aspect} transition-all duration-500 group-hover:scale-105`}
                />

                {/* Photo Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="rounded-xs bg-neutral-900/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400 border border-neutral-700 shadow-sm">
                    {heroMediaItems[heroPhotoIdx].badge}
                  </span>
                </div>

                {/* Left/Right Flip Controls */}
                <button
                  type="button"
                  aria-label="Previous view"
                  onClick={() =>
                    setHeroPhotoIdx((prev) => (prev === 0 ? heroMediaItems.length - 1 : prev - 1))
                  }
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-neutral-950/75 text-white backdrop-blur hover:bg-primary transition-colors opacity-80 group-hover:opacity-100"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next view"
                  onClick={() =>
                    setHeroPhotoIdx((prev) => (prev === heroMediaItems.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-neutral-950/75 text-white backdrop-blur hover:bg-primary transition-colors opacity-80 group-hover:opacity-100"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Caption Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/60 to-transparent p-3 pt-6 text-white text-xs flex items-center justify-between pointer-events-none">
                  <span className="font-semibold text-[11px] sm:text-xs text-white/90 truncate mr-2">
                    {heroMediaItems[heroPhotoIdx].caption}
                  </span>
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    {heroPhotoIdx + 1} / {heroMediaItems.length}
                  </span>
                </div>
              </div>

              {/* Gallery Thumbnails Strip */}
              <div className="grid grid-cols-5 gap-2">
                {heroMediaItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setHeroPhotoIdx(idx)}
                    className={`group/thumb relative aspect-video overflow-hidden rounded-md border transition-all ${
                      heroPhotoIdx === idx
                        ? "border-primary ring-2 ring-primary/40 shadow-md scale-[1.02]"
                        : "border-border/80 opacity-70 hover:opacity-100 hover:border-neutral-400"
                    } bg-neutral-950`}
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      className={`h-full w-full ${item.src === logoAsset ? "object-contain p-1.5" : "object-cover"}`}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-transparent transition-colors" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-0.5 text-[9px] font-bold text-white text-center truncate">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Price Callout Banner */}
              <div className="rounded-lg border border-border bg-surface p-3.5 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block rounded-xs bg-amber-400 px-1.5 py-0.5 text-[10px] font-black uppercase text-neutral-950">
                      Vredestein Centauro
                    </span>
                    <strong className="block font-display text-sm sm:text-base mt-1">Dutch Engineering</strong>
                  </div>
                  <div className="text-right">
                    <strong className="font-display text-base sm:text-lg text-primary block">ST from R1,350</strong>
                    <span className="text-[11px] text-amber-500 font-bold">NS from R1,900</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-foreground-muted">
                  Pairs from R2,940 · Zero-degree steel belt · High silica touring compounds
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tyre Size Finder Section */}
        <section id="finder" className="bg-foreground text-background py-8 shadow-inner">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_2.5fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                  Precision Tyre Size Finder
                </p>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl uppercase tracking-tight">
                  Find Your Perfect Fit
                </h2>
                <p className="mt-1 text-xs text-background/70">
                  Select your front or rear motorcycle wheel dimensions to instantly filter.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 items-end">
                <label className="text-xs font-semibold text-background/80">
                  Position
                  <select
                    value={finderPosition}
                    onChange={(e) => setFinderPosition(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded border border-background/25 bg-foreground-soft px-3 text-sm text-background outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="All">All Positions</option>
                    <option value="Front">Front</option>
                    <option value="Rear">Rear</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-background/80">
                  Width (mm)
                  <select
                    value={finderWidth}
                    onChange={(e) => setFinderWidth(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded border border-background/25 bg-foreground-soft px-3 text-sm text-background outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="All">All Widths</option>
                    <option value="120">120 mm (Front)</option>
                    <option value="180">180 mm (Rear)</option>
                    <option value="190">190 mm (Rear)</option>
                    <option value="200">200 mm (Rear)</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-background/80">
                  Profile (%)
                  <select
                    value={finderProfile}
                    onChange={(e) => setFinderProfile(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded border border-background/25 bg-foreground-soft px-3 text-sm text-background outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="All">All Profiles</option>
                    <option value="50">50</option>
                    <option value="55">55</option>
                    <option value="70">70</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-background/80">
                  Rim Diameter
                  <select className="mt-1.5 h-11 w-full rounded border border-background/25 bg-foreground-soft px-3 text-sm text-background outline-none focus:border-amber-400 font-medium">
                    <option>17 inch</option>
                  </select>
                </label>

                <div className="col-span-2 sm:col-span-1">
                  <button
                    onClick={handleApplyFinder}
                    className="h-11 w-full rounded bg-primary px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow flex items-center justify-center gap-1.5"
                  >
                    <Search size={14} /> Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vredestein Centauro Tyre Combos Section */}
        <section id="combos" className="border-b border-border bg-neutral-950 text-white py-14 sm:py-20 relative overflow-hidden">
          {/* Subtle racing grid graphic overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
          <img
            src={riderTrackAsset}
            alt=""
            aria-hidden="true"
            className="absolute -right-20 -top-10 h-[650px] w-auto object-cover opacity-30 pointer-events-none filter blur-[0.5px] mix-blend-screen hidden lg:block"
          />
          
          <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-10 border-b border-neutral-800">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                  <Flame size={14} className="text-amber-400" />
                  Special Combo Deals · Save up to R650
                </div>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight">
                  Vredestein Centauro <span className="text-primary">Tyre Combos</span>
                </h2>
                <p className="mt-2 text-sm sm:text-base text-neutral-400 max-w-2xl">
                  Factory-matched front and rear Sport Touring tyre pairs. Precision engineered in the Netherlands
                  to deliver balanced handling, high mileage, and supreme wet road security.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://wa.me/27832273237?text=Hi%20Costa,%20I'm%20interested%20in%20the%20Vredestein%20Centauro%20Tyre%20Combos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-700 transition-colors"
                >
                  <Phone size={14} className="text-amber-400" /> Ask Costa on WhatsApp
                </a>
              </div>
            </div>

            {/* Combos Cards Grid */}
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {tyreCombos.map((combo) => {
                const waMessage = encodeURIComponent(
                  `Hi Costa, I would like to order the Vredestein Centauro Combo: ${combo.frontSize} + ${combo.rearSize} for R${combo.price.toFixed(2)} at R&C Commodities.`
                );

                return (
                  <div
                    key={combo.id}
                    className="relative flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-7 shadow-xl transition-all duration-300 hover:border-amber-400/80 hover:-translate-y-1 group"
                  >
                    {/* Badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
                        <Tag size={12} /> {combo.tag}
                      </span>
                      <span className="rounded bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] font-bold text-primary-hover uppercase">
                        Matched Pair
                      </span>
                    </div>

                    {/* Sizes Header */}
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight text-white group-hover:text-amber-300 transition-colors">
                        {combo.frontSize} <span className="text-neutral-500 font-sans font-light">:</span> {combo.rearSize}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-400">
                        {combo.subtitle}
                      </p>

                      {/* Tyre pair breakdown boxes */}
                      <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded border border-neutral-800 bg-neutral-950 p-2.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">
                            Front Tyre
                          </span>
                          <span className="font-bold text-white text-xs sm:text-sm mt-0.5 block">
                            {combo.frontSize}
                          </span>
                          <span className="text-[10px] text-amber-400 font-medium">Centauro ST</span>
                        </div>
                        <div className="rounded border border-neutral-800 bg-neutral-950 p-2.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">
                            Rear Tyre
                          </span>
                          <span className="font-bold text-white text-xs sm:text-sm mt-0.5 block">
                            {combo.rearSize}
                          </span>
                          <span className="text-[10px] text-amber-400 font-medium">Centauro ST</span>
                        </div>
                      </div>

                      {/* Description & Fitment bikes */}
                      <p className="mt-4 text-xs text-neutral-400 leading-relaxed">
                        {combo.description}
                      </p>
                      <div className="mt-2 text-[11px] text-neutral-400">
                        <span className="text-neutral-300 font-semibold">Common fitment:</span> {combo.popularBikes}
                      </div>
                    </div>

                    {/* Pricing and CTAs */}
                    <div className="mt-6 pt-5 border-t border-neutral-800">
                      <div className="flex items-baseline justify-between gap-2 mb-4">
                        <div>
                          <span className="text-xs text-neutral-400 block">Combo Selling Price</span>
                          <span className="font-display text-2xl sm:text-3xl font-black text-white">
                            R{combo.price.toLocaleString("en-ZA")}.00
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-neutral-400 line-through block">
                            R{combo.regularPrice.toLocaleString("en-ZA")}.00
                          </span>
                          <span className="inline-block rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-black text-emerald-400 uppercase">
                            Save R{combo.savings.toLocaleString("en-ZA")}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          onClick={() => addComboToCart(combo)}
                          className="flex items-center justify-center gap-2 rounded bg-primary px-3 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow"
                        >
                          <ShoppingBag size={15} /> Add Combo
                        </button>
                        <a
                          href={`https://wa.me/27832273237?text=${waMessage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded border border-neutral-700 bg-neutral-800 px-3 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-700 transition-colors"
                        >
                          <Phone size={14} className="text-emerald-400" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom guarantee strip */}
            <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-amber-400 shrink-0" />
                <span>
                  <strong>100% Genuine European Vredestein Stock:</strong> All combo pairs include matching manufacturing date codes, stored under temperature control in Selby, Johannesburg.
                </span>
              </div>
              <a
                href="tel:+27832273237"
                className="shrink-0 text-amber-400 font-bold uppercase tracking-wider hover:underline flex items-center gap-1.5"
              >
                <Phone size={14} /> Selby Fitment: +27 83 227 3237
              </a>
            </div>
          </div>
        </section>

        {/* Real-World Action & Track Tested Visual Gallery */}
        <section className="border-b border-border bg-neutral-900 text-white py-12 sm:py-16 relative overflow-hidden">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Camera size={14} className="text-amber-400" />
                  R&amp;C Performance Gallery
                </div>
                <h3 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-white">
                  Tested On Track · Proven On Tarmac
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-xl">
                  Centauro NS &amp; ST tyres are designed to deliver progressive feedback, extreme lean angle confidence, and enduring stability on South African roads.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => scrollTo("tyres")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Explore Sizes &amp; Prices <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Photo 1: Track cornering */}
              <div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={riderTrackAsset}
                    alt="Motorcycle track cornering with knee-down lean angle"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Track-Day Grip</span>
                  <h4 className="font-display text-base font-bold text-white mt-0.5">Knee-Down Cornering</h4>
                  <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                    Dual-compound shoulder rubber maintains optimal footprint stability at extreme lean angles.
                  </p>
                </div>
              </div>

              {/* Photo 2: Tread Macro */}
              <div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={tyreMacroAsset}
                    alt="Vredestein Centauro tread sipe pattern and silica compound macro"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">Dutch Siping</span>
                  <h4 className="font-display text-base font-bold text-white mt-0.5">High-Silica Tread Matrix</h4>
                  <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                    Engineered groove angles evacuate surface water rapidly for uncompromised wet weather security.
                  </p>
                </div>
              </div>

              {/* Photo 3: Superbike Machine */}
              <div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={superbikeAsset}
                    alt="High performance superbike fitted with Centauro performance tyres"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Superbike Spec</span>
                  <h4 className="font-display text-base font-bold text-white mt-0.5">Chassis &amp; Belt Harmony</h4>
                  <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                    Zero-degree steel belt cords eliminate tyre growth at 200+ km/h for laser-true tracking.
                  </p>
                </div>
              </div>

              {/* Photo 4: High-Speed Stance */}
              <div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={moodyBikeAsset}
                    alt="Sportbike in aerodynamic focus"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">Highway Touring</span>
                  <h4 className="font-display text-base font-bold text-white mt-0.5">High Mileage Balance</h4>
                  <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                    Uniform contact pressure distribution prevents center squaring during extended highway journeys.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tyres Catalog Section */}
        <section id="tyres" className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Sidebar Guide */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Vredestein Range
                  </p>
                  <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.05] uppercase">
                    Choose the right tyre for your ride.
                  </h2>
                </div>

                <div className="rounded-lg border border-border bg-surface p-1">
                  <button
                    onClick={() => {
                      setRange("NS");
                      setSelectedSize("All sizes");
                    }}
                    className={`flex w-full gap-4 rounded-md p-4 text-left transition-colors ${
                      range === "NS" ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-surface-soft"
                    }`}
                  >
                    <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <strong className="font-display text-base text-foreground block">
                        Centauro NS (Super Sport)
                      </strong>
                      <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                        Track &amp; aggressive road grip, fast steering turn-in, and supreme confidence at maximum lean angle.
                      </p>
                    </div>
                  </button>

                  <div className="h-px bg-border my-1" />

                  <button
                    onClick={() => {
                      setRange("ST");
                      setSelectedSize("All sizes");
                    }}
                    className={`flex w-full gap-4 rounded-md p-4 text-left transition-colors ${
                      range === "ST" ? "bg-steel/10 border-l-4 border-steel" : "hover:bg-surface-soft"
                    }`}
                  >
                    <span className="mt-1 size-2.5 shrink-0 rounded-full bg-steel" />
                    <div>
                      <strong className="font-display text-base text-foreground block">
                        Centauro ST (Sport Touring)
                      </strong>
                      <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                        Exceptional wet drainage siping, extended tread life, and all-weather touring comfort.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setRange("All");
                      setSelectedSize("All sizes");
                      setSelectedPosition("All");
                    }}
                    className="text-left text-sm font-bold text-primary hover:underline flex items-center gap-1.5"
                  >
                    Reset &amp; View all fitments →
                  </button>
                  <p className="text-xs text-foreground-muted">
                    Need guidance on rim pairing? Costa at R&amp;C Commodities is available to assist with your specific motorcycle fitment.
                  </p>
                </div>

                {/* Official Selling Price Quick Matrix */}
                <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2.5 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <Tag size={14} className="text-primary" />
                      <span className="text-xs font-black uppercase tracking-wider">Official Selling Prices</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded">
                      In Stock
                    </span>
                  </div>

                  {/* ST Table */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase text-steel tracking-wider pb-1">
                      <span>Centauro ST (Touring)</span>
                      <span>Price</span>
                    </div>
                    <div className="divide-y divide-border/60 text-xs">
                      <div className="flex justify-between py-1.5">
                        <span className="font-medium text-foreground">120/70/17 - FRONT</span>
                        <strong className="font-bold text-primary">R 1,350.00</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-medium text-foreground">180/55/17</span>
                        <strong className="font-bold text-primary">R 1,999.00</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-medium text-foreground">190/50/17</span>
                        <strong className="font-bold text-primary">R 2,300.00</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-medium text-foreground">190/55/17</span>
                        <strong className="font-bold text-primary">R 2,400.00</strong>
                      </div>
                    </div>
                  </div>

                  {/* NS Table */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase text-primary tracking-wider pb-1">
                      <span>Centauro NS (Super Sport)</span>
                      <span>Price</span>
                    </div>
                    <div className="divide-y divide-border/60 text-xs">
                      <div className="flex justify-between py-1.5">
                        <span className="font-medium text-foreground">120/70/17 – FRONT</span>
                        <strong className="font-bold text-primary">R 1,900.00</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-medium text-foreground">180/55/17</span>
                        <strong className="font-bold text-primary">R 2,000.00</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-medium text-foreground">190/55/17</span>
                        <strong className="font-bold text-primary">R 2,450.00</strong>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-medium text-foreground">200/55/17</span>
                        <strong className="font-bold text-primary">R 3,100.00</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Out Box */}
                <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 text-white">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck size={16} /> 100% Genuine Tyres
                  </div>
                  <p className="mt-2 text-xs text-white/80 leading-relaxed">
                    Direct European performance engineering by Vredestein. Stored and fitted in Selby, Johannesburg.
                  </p>
                  <a
                    href="tel:+27832273237"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 hover:text-white"
                  >
                    <Phone size={14} /> +27 83 227 3237
                  </a>
                </div>
              </div>
            </div>

            {/* Products Grid / Table */}
            <div className="lg:col-span-8">
              {/* Filter controls bar */}
              <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold">
                    <span className="font-display text-primary">{filteredProducts.length}</span>{" "}
                    fitments available
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Showing {range === "All" ? "all ranges" : `Centauro ${range}`}
                    {selectedSize !== "All sizes" ? ` · ${selectedSize}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* View switcher */}
                  <div className="flex items-center rounded border border-border bg-surface-soft p-0.5 text-xs">
                    <button
                      onClick={() => setTyreViewMode("cards")}
                      className={`px-3 py-1 font-bold uppercase rounded transition-colors ${
                        tyreViewMode === "cards"
                          ? "bg-foreground text-background shadow-xs"
                          : "text-foreground-muted hover:text-foreground"
                      }`}
                    >
                      Cards
                    </button>
                    <button
                      onClick={() => setTyreViewMode("table")}
                      className={`px-3 py-1 font-bold uppercase rounded transition-colors ${
                        tyreViewMode === "table"
                          ? "bg-foreground text-background shadow-xs"
                          : "text-foreground-muted hover:text-foreground"
                      }`}
                    >
                      Price Table
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    Position:
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="h-9 rounded border border-border bg-surface-soft px-2.5 text-xs text-foreground font-semibold"
                    >
                      <option value="All">All</option>
                      <option value="Front">Front</option>
                      <option value="Rear">Rear</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    Size:
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="h-9 rounded border border-border bg-surface-soft px-2.5 text-xs text-foreground font-semibold"
                    >
                      {sizeOptions.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* Table View */}
              {tyreViewMode === "table" ? (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-surface-soft text-[11px] font-black uppercase tracking-wider text-foreground-muted">
                          <th className="p-4">Tyre Model</th>
                          <th className="p-4">Tyre Size</th>
                          <th className="p-4">Position</th>
                          <th className="p-4">Selling Price</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-surface-soft/60 transition-colors">
                            <td className="p-4 font-bold text-foreground">
                              <span
                                className={`inline-block rounded-xs px-2 py-0.5 text-[10px] font-black uppercase mr-2 ${
                                  product.range === "NS" ? "bg-primary text-white" : "bg-steel text-white"
                                }`}
                              >
                                {product.range}
                              </span>
                              {product.name}
                            </td>
                            <td className="p-4 font-display font-semibold text-foreground">
                              {product.size}
                            </td>
                            <td className="p-4 text-xs uppercase font-medium text-foreground-muted">
                              {product.position}
                            </td>
                            <td className="p-4">
                              <span className="font-display font-bold text-base text-primary">
                                R {product.price.toLocaleString("en-ZA")}.00
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => addTyreToCart(product)}
                                className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow-xs"
                              >
                                <ShoppingBag size={13} /> Add
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Grid View */
                <div className="grid gap-5 sm:grid-cols-2">
                  {filteredProducts.map((product) => (
                    <article
                      key={product.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-neutral-400"
                    >
                      <div>
                        {/* Product image with badge */}
                        <div className="relative aspect-[5/4] bg-surface-soft overflow-hidden">
                          <img
                            src={product.image}
                            alt={`${product.name} ${product.position} tyre`}
                            className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                          />
                          <span
                            className={`absolute left-3 top-3 rounded-xs px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow ${
                              product.range === "NS"
                                ? "bg-primary text-white"
                                : "bg-steel text-white"
                            }`}
                          >
                            {product.range === "NS" ? "Super Sport" : "Sport Touring"}
                          </span>
                          <span className="absolute right-3 top-3 rounded-xs bg-neutral-900/80 px-2 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-xs">
                            {product.position}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-display text-lg uppercase tracking-tight">
                                {product.name}
                              </h3>
                              <p className="mt-0.5 text-sm font-semibold text-primary">
                                {product.size}
                              </p>
                            </div>
                            <strong className="font-display text-xl text-foreground">
                              R{product.price.toLocaleString("en-ZA")}.00
                            </strong>
                          </div>

                          {/* Features chips */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {product.features.map((feat, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-surface-soft px-2 py-0.5 text-[11px] text-foreground-muted"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Add to cart action */}
                      <div className="p-5 pt-0">
                        <ShopButton
                          variant="dark"
                          className="w-full uppercase tracking-wider text-xs font-bold"
                          onClick={() => addTyreToCart(product)}
                        >
                          Add to cart <ShoppingBag size={15} />
                        </ShopButton>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {filteredProducts.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
                  <p className="font-display text-lg">No fitments match your selected filters</p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Try choosing "All sizes" or clearing the position filter.
                  </p>
                  <button
                    onClick={() => {
                      setRange("All");
                      setSelectedSize("All sizes");
                      setSelectedPosition("All");
                    }}
                    className="mt-4 rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Made in the Netherlands / Heritage Section */}
        <section id="netherlands" className="border-t border-border bg-surface py-16 sm:py-24 relative overflow-hidden">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-primary">
                  <Award size={15} />
                  MADE IN THE NETHERLANDS · FOUNDED 1909
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-foreground leading-[1.05]">
                  MADE IN THE <span className="text-primary">NETHERLANDS</span>
                </h2>

                <div className="p-6 rounded-xl border border-border bg-surface-soft shadow-sm border-l-4 border-l-primary">
                  <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                    Vredestein has been engineering premium tyres since 1909. The Centauro ST is built for modern sport touring bikes, delivering exceptional grip, stability and mileage in all conditions.
                  </p>
                </div>

                <p className="text-sm text-foreground-muted leading-relaxed">
                  Headquartered and engineered in the Netherlands, Vredestein blends over a century of European motorsport heritage with high-tech computational carcass simulation. Each Centauro compound undergoes rigorous wet track verification, high-speed autobahn endurance testing, and extreme lean-angle cornering validation before arriving at our Selby workshop.
                </p>

                {/* 3 Pillars from vredesteinHeritage */}
                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  {vredesteinHeritage.keyPillars.map((pillar, idx) => (
                    <div key={idx} className="rounded-lg border border-border bg-card p-4">
                      <div className="size-8 rounded bg-primary/10 text-primary grid place-items-center mb-2.5">
                        {idx === 0 ? <Clock3 size={16} /> : idx === 1 ? <Layers size={16} /> : <Sparkles size={16} />}
                      </div>
                      <h4 className="font-display text-sm uppercase text-foreground leading-snug">
                        {pillar.title}
                      </h4>
                      <p className="mt-1.5 text-xs text-foreground-muted leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <ShopButton onClick={() => scrollTo("combos")}>
                    View Centauro ST Combos <ArrowRight size={16} />
                  </ShopButton>
                  <ShopButton variant="outline" onClick={() => scrollTo("tyres")}>
                    Browse All Fitments
                  </ShopButton>
                </div>
              </div>

              {/* Visual Showcase Card */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl border border-border bg-neutral-950 p-8 sm:p-10 text-white shadow-2xl overflow-hidden">
                  <img
                    src={moodyBikeAsset}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover opacity-35 pointer-events-none mix-blend-luminosity filter contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/65 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 block mb-2">
                      CENTAURO SPORT TOURING &amp; SUPER SPORT
                    </span>
                    <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-white mb-4">
                      Built for Modern Superbikes &amp; Sport Tourers
                    </h3>

                    <div className="space-y-4 text-xs sm:text-sm text-neutral-300 mb-8">
                      <div className="flex items-start gap-3">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white text-xs mt-0.5">
                          ✓
                        </span>
                        <div>
                          <strong className="text-white block font-bold">Zero-Degree Steel Belt Cords</strong>
                          <span className="text-neutral-400 text-xs">Delivers laser-precise line holding and feedback during high-speed directional changes.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white text-xs mt-0.5">
                          ✓
                        </span>
                        <div>
                          <strong className="text-white block font-bold">Advanced Full-Silica Polymer Matrix</strong>
                          <span className="text-neutral-400 text-xs">Rapid cold-tire warm up and consistent chemical grip on cold, damp South African asphalt.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white text-xs mt-0.5">
                          ✓
                        </span>
                        <div>
                          <strong className="text-white block font-bold">High Mileage Center Channel</strong>
                          <span className="text-neutral-400 text-xs">Even contact pressure distribution prevents premature flat-spotting on extended highway touring.</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-neutral-800 pt-5 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">Official Stockist</span>
                        <strong className="font-display text-sm text-amber-300">R&amp;C Commodities · Selby, JHB</strong>
                      </div>
                      <a
                        href="tel:+27832273237"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-400 uppercase tracking-wider"
                      >
                        <Phone size={14} className="text-amber-400" /> Costa: +27 83 227 3237
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Motorcycle Accessories Section */}
        <section id="accessories" className="border-y border-border bg-surface-soft/80 py-16">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Essential Workshop &amp; Rider Gear
                </p>
                <h2 className="mt-1 font-display text-3xl sm:text-4xl uppercase tracking-tight">
                  Motorcycle Accessories
                </h2>
                <p className="mt-2 text-sm text-foreground-muted max-w-xl">
                  Equip your superbike with crash bobbins, paddock stands, tyre warmers, and workshop maintenance supplies.
                </p>
              </div>
              <a
                href="https://wa.me/27832273237?text=Hi%20Costa,%20I'm%20looking%20for%20specific%20motorcycle%20accessories"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors shrink-0"
              >
                Custom Part Enquiry <ExternalLink size={14} />
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {accessoryCategories.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`h-1.5 w-10 rounded-full ${item.tagColor}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="font-display text-base uppercase leading-snug">{item.title}</h3>
                    <p className="mt-2 text-xs text-foreground-muted leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <span className="font-display text-base text-primary">
                      R{item.price.toLocaleString("en-ZA")}
                    </span>
                    <button
                      onClick={() => addAccessoryToCart(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground hover:text-primary transition-colors"
                    >
                      Add +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workshop & Selby Details Section */}
        <section id="workshop" className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-12 items-stretch">
            {/* Workshop & Selby Fitment Photos */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-lg relative group">
                <img
                  src={superbikeAsset}
                  alt="High performance superbike in workshop bay ready for tyre fitment"
                  className="h-full min-h-[360px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent flex flex-col justify-end p-5 text-white">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Selby Fitment Bay</span>
                  <strong className="font-display text-base text-white">Superbike Specialist Care</strong>
                  <span className="text-xs text-neutral-300 mt-0.5">Static &amp; dynamic precision balancing</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-lg relative group">
                <img
                  src={detailAsset}
                  alt="Vredestein Centauro motorcycle tyre detail and tread pattern"
                  className="h-full min-h-[360px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent flex flex-col justify-end p-5 text-white">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Direct From Holland</span>
                  <strong className="font-display text-base text-white">Genuine Factory Stock</strong>
                  <span className="text-xs text-neutral-300 mt-0.5">Matching date codes &amp; temperature stored</span>
                </div>
              </div>
            </div>

            {/* Why R&C Commodities info */}
            <div className="lg:col-span-6 flex flex-col justify-center rounded-2xl bg-neutral-900 p-8 sm:p-12 text-white shadow-xl border border-neutral-800">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Workshop &amp; Serviceselby
              </p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl uppercase tracking-tight">
                Bought right. Fitted right.
              </h2>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                R&amp;C Commodities is your specialized superbike tyre distributor in Johannesburg.
                We provide tailored fitment advice for high-performance superbikes, adventure sport, and touring machines.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  [Wrench, "Expert size, speed index, and compound guidance for your motorcycle"],
                  [Truck, "Safe courier delivery arranged across Johannesburg & South Africa"],
                  [Check, "100% genuine factory-fresh Vredestein Centauro NS & ST tyres"],
                ].map(([Icon, text], idx) => {
                  const ItemIcon = Icon as typeof Wrench;
                  return (
                    <div key={idx} className="flex items-start gap-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-white shadow">
                        <ItemIcon size={18} />
                      </span>
                      <p className="text-sm text-white/85 pt-1">{text as string}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="tel:+27832273237"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow-lg"
                >
                  <Phone size={16} /> Call Workshop (+27 83 227 3237)
                </a>
                <a
                  href="https://wa.me/27832273237?text=Hi%20Costa,%20I%20would%20like%20to%20check%20tyre%20fitment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-700 transition-colors"
                >
                  WhatsApp Fitment Check
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-700 bg-neutral-900 text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
            <div>
              <img
                src={logoAsset}
                alt="R&C Commodities"
                className="h-16 w-auto object-contain"
              />
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
                R&amp;C Commodities — Premier distributor of Vredestein Centauro NS and ST
                superbike motorcycle tyres and accessories in Selby, Johannesburg.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-300 font-semibold uppercase tracking-wider">
                <Sparkles size={14} /> Genuine Performance Tyres
              </div>
            </div>

            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                Contact &amp; Selby Workshop
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <a
                  href="tel:+27832273237"
                  className="group flex gap-3 text-sm transition-colors hover:text-amber-300"
                >
                  <Phone size={18} className="mt-0.5 shrink-0 text-primary group-hover:scale-110 transition-transform" />
                  <span>
                    <strong className="block text-white">Phone</strong>
                    <span className="mt-1 block text-white/70">+27 83 227 3237</span>
                  </span>
                </a>

                <a
                  href="mailto:costa08@gmail.com"
                  className="group flex gap-3 text-sm transition-colors hover:text-amber-300"
                >
                  <Mail size={18} className="mt-0.5 shrink-0 text-primary group-hover:scale-110 transition-transform" />
                  <span>
                    <strong className="block text-white">Email</strong>
                    <span className="mt-1 block text-white/70">costa08@gmail.com</span>
                  </span>
                </a>

                <div className="flex gap-3 text-sm">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                  <span>
                    <strong className="block text-white">Location</strong>
                    <span className="mt-1 block leading-5 text-white/70">
                      39 Webber Street<br />
                      Selby<br />
                      Johannesburg
                    </span>
                  </span>
                </div>

                <div className="flex gap-3 text-sm">
                  <Clock3 size={18} className="mt-0.5 shrink-0 text-primary" />
                  <span>
                    <strong className="block text-white">Hours</strong>
                    <span className="mt-1 block leading-5 text-white/70">
                      Monday - Friday<br />
                      08:00 - 17:00
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 R&amp;C Commodities. All rights reserved.</span>
            <span>Genuine Vredestein Centauro Super Sport &amp; Sport Touring fitments.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
