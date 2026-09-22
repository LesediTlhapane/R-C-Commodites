import { useState, useEffect, useRef } from "react";
import { Phone, Search, ShoppingBag, Menu, X, ArrowRight } from "lucide-react";
import logoAsset from "../assets/rc-logo.png";
import vredesteinLogoAsset from "../assets/vredestein-logo.png";
import { tyreProducts, tyreCombos } from "../data/products";

interface HeaderProps {
  totalCartCount: number;
  onOpenCart: () => void;
  onScrollTo: (id: string) => void;
}

export function Header({
  totalCartCount,
  onOpenCart,
  onScrollTo,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNav, setActiveNav] = useState<string>("tyres");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when search popover opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [searchOpen]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["finder", "tyres", "combos", "accessories", "workshop"];
      const scrollPos = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveNav(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    onScrollTo(id);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  };

  // Quick search matching results
  const searchResults = searchQuery.trim()
    ? tyreProducts.filter((product) => {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.size.toLowerCase().includes(query) ||
          product.range.toLowerCase().includes(query) ||
          product.position.toLowerCase().includes(query) ||
          product.features.some((f) => f.toLowerCase().includes(query))
        );
      }).slice(0, 5)
    : [];

  const comboResults = searchQuery.trim()
    ? tyreCombos.filter((combo) => {
        const query = searchQuery.toLowerCase();
        return (
          combo.title.toLowerCase().includes(query) ||
          combo.frontSize.toLowerCase().includes(query) ||
          combo.rearSize.toLowerCase().includes(query) ||
          combo.popularBikes.toLowerCase().includes(query)
        );
      }).slice(0, 2)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 text-white border-b border-neutral-800/90 shadow-xl backdrop-blur-md">
      {/* LAYER 1 — UTILITY BAR */}
      <div className="border-b border-neutral-800/70 bg-neutral-900/60 py-1.5 px-4 text-xs font-normal">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between text-[11px]">
          {/* Left: Workshop & Fitment Available */}
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="font-medium text-neutral-200">Selby • Johannesburg</span>
            <span className="text-neutral-600 font-light">•</span>
            <span className="text-neutral-400">Workshop &amp; Fitment Available</span>
          </div>

          {/* Right: WhatsApp & Optional Phone */}
          <div className="flex items-center gap-4 text-neutral-300">
            <a
              href="https://wa.me/27832273237?text=Hi%20Costa,%20I%20have%20an%20enquiry%20regarding%20Vredestein%20motorcycle%20tyres"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>WhatsApp Us</span>
            </a>
            <span className="hidden sm:inline text-neutral-700">|</span>
            <a
              href="tel:+27832273237"
              className="hidden sm:inline text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              +27 83 227 3237
            </a>
          </div>
        </div>
      </div>

      {/* LAYER 2 — PRIMARY NAVIGATION */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 sm:h-22 lg:h-24 items-center justify-between gap-4">
          {/* Brand Logo on Left */}
          <div className="flex items-center gap-3 sm:gap-3.5">
            <button
              aria-label="Go to top of page"
              onClick={() => handleNavClick("top")}
              className="shrink-0 transition-all hover:opacity-95 hover:scale-[1.02] cursor-pointer"
            >
              <img
                src={logoAsset}
                alt="R&C Commodities logo"
                className="h-13 sm:h-16 lg:h-18 w-auto object-contain drop-shadow-md transition-all"
              />
            </button>
            <div className="hidden sm:flex flex-col justify-center border-l-2 border-neutral-800/90 pl-3.5 sm:pl-4 py-0.5">
              <span className="block font-display text-sm sm:text-base lg:text-lg uppercase leading-none">
                <span className="text-primary font-black tracking-wider">R&amp;C</span>{" "}
                <span className="font-extrabold tracking-[0.15em] text-white">COMMODITIES</span>
              </span>
              <span className="block text-[8.5px] sm:text-[9.5px] lg:text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold mt-1 leading-tight">
                PREMIUM MOTORCYCLE TYRES &amp; ACCESSORIES
              </span>
            </div>
            {/* Vredestein Partner Logo Badge */}
            <div className="hidden xl:flex items-center pl-3.5 border-l border-neutral-800">
              <div className="flex items-center gap-2 rounded-lg bg-neutral-900/80 border border-neutral-800 px-2.5 py-1.5">
                <span className="text-[8.5px] font-bold uppercase tracking-[0.15em] text-neutral-400 leading-tight">
                  Official<br />Partner
                </span>
                <img
                  src={vredesteinLogoAsset}
                  alt="Vredestein Tyres"
                  className="h-6 w-auto object-contain brightness-110"
                />
              </div>
            </div>
          </div>

          {/* Desktop Primary Navigation */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-8" aria-label="Primary navigation">
            {[
              { label: "Tyres", id: "tyres" },
              { label: "Combos", id: "combos" },
              { label: "Find Your Tyre", id: "finder" },
              { label: "Accessories", id: "accessories" },
              { label: "Workshop", id: "workshop" },
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative py-2.5 px-1 text-[15px] font-semibold transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-neutral-300 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Search & Cart Utility Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Search Icon Button */}
            <div className="relative">
              <button
                aria-label="Search tyre catalog"
                onClick={() => setSearchOpen(!searchOpen)}
                className={`grid size-10 sm:size-11 place-items-center rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors ${
                  searchOpen ? "bg-neutral-800 text-white" : "bg-neutral-900/80 border border-neutral-800"
                }`}
              >
                <Search size={20} />
              </button>

              {/* Quick Search Popover */}
              {searchOpen && (
                <div className="absolute right-0 top-full mt-2.5 z-50 w-80 sm:w-96 rounded-xl border border-neutral-800 bg-neutral-900 p-3 shadow-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tyre size (e.g. 190/55, 120/70, ST, NS)..."
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-primary"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Results List */}
                  {searchQuery.trim() && (
                    <div className="mt-2.5 max-h-60 overflow-y-auto divide-y divide-neutral-800/60 text-xs">
                      {searchResults.length === 0 && comboResults.length === 0 ? (
                        <p className="py-3 text-center text-neutral-400">
                          No matching tyres found.
                        </p>
                      ) : (
                        <>
                          {searchResults.map((tyre) => (
                            <button
                              key={tyre.id}
                              onClick={() => handleNavClick("tyres")}
                              className="w-full text-left py-2 px-1.5 flex items-center justify-between hover:bg-neutral-800/50 rounded transition-colors group"
                            >
                              <div>
                                <span className="font-semibold text-white group-hover:text-primary">
                                  {tyre.name} {tyre.size}
                                </span>
                                <span className="text-[10px] text-neutral-400 block">
                                  {tyre.position} · Centauro {tyre.range}
                                </span>
                              </div>
                              <span className="font-semibold text-neutral-200">
                                R{tyre.price.toLocaleString("en-ZA")}
                              </span>
                            </button>
                          ))}
                          {comboResults.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleNavClick("combos")}
                              className="w-full text-left py-2 px-1.5 flex items-center justify-between hover:bg-neutral-800/50 rounded transition-colors group"
                            >
                              <div>
                                <span className="font-semibold text-white group-hover:text-amber-300">
                                  Combo: {c.frontSize} + {c.rearSize}
                                </span>
                                <span className="text-[10px] text-amber-400/80 block">
                                  Matched Pair (Save R{c.savings})
                                </span>
                              </div>
                              <span className="font-semibold text-white">
                                R{c.price.toLocaleString("en-ZA")}
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-neutral-800 flex justify-between items-center text-[11px] text-neutral-400">
                    <span>Press Tab or click to view</span>
                    <button
                      onClick={() => handleNavClick("finder")}
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      Use Tyre Finder <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button
              aria-label={`Shopping cart with ${totalCartCount} items`}
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-200 hover:text-white hover:border-neutral-700 hover:bg-neutral-850 transition-colors"
            >
              <ShoppingBag size={19} />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Cart</span>
              {totalCartCount > 0 ? (
                <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
                  {totalCartCount}
                </span>
              ) : null}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid size-10 sm:size-11 place-items-center rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-850 lg:hidden transition-colors border border-neutral-800 bg-neutral-900"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-neutral-800 bg-neutral-950/98 px-3 py-4 lg:hidden space-y-1.5 shadow-2xl rounded-b-xl"
          >
            {[
              { label: "Tyres", id: "tyres" },
              { label: "Combos", id: "combos" },
              { label: "Find Your Tyre", id: "finder" },
              { label: "Accessories", id: "accessories" },
              { label: "Workshop", id: "workshop" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="w-full text-left rounded-lg px-4 py-3 text-[15px] font-semibold text-neutral-200 hover:bg-neutral-900 hover:text-white transition-colors flex items-center justify-between"
              >
                <span>{item.label}</span>
                <ArrowRight size={15} className="text-neutral-500" />
              </button>
            ))}

            {/* Separated Contact Area */}
            <div className="pt-3 mt-2 border-t border-neutral-800/80 flex flex-col gap-2">
              <a
                href="https://wa.me/27832273237?text=Hi%20Costa,%20I%20have%20an%20enquiry%20regarding%20Vredestein%20motorcycle%20tyres"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors"
              >
                <span>WhatsApp Costa (+27 83 227 3237)</span>
              </a>
              <a
                href="tel:+27832273237"
                className="flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 px-4 py-2.5 text-xs font-semibold text-neutral-200 transition-colors"
              >
                <Phone size={14} className="text-neutral-400" />
                <span>Call Workshop</span>
              </a>
            </div>

            {/* Mobile Official Vredestein Lockup */}
            <div className="pt-3 pb-1 border-t border-neutral-800/80 flex items-center justify-between px-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                Official Vredestein Importer
              </span>
              <img
                src={vredesteinLogoAsset}
                alt="Vredestein Tyres"
                className="h-6 w-auto object-contain brightness-110"
              />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
