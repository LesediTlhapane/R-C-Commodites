import { useState } from "react";
import { Phone, Search, ShoppingBag, Menu, X, Flame } from "lucide-react";
import type { Range } from "../types";
import logoAsset from "../assets/rc-logo.png";

interface HeaderProps {
  totalCartCount: number;
  onOpenCart: () => void;
  onScrollTo: (id: string) => void;
  currentRange: Range;
  onSelectRange: (range: Range) => void;
}

export function Header({
  totalCartCount,
  onOpenCart,
  onScrollTo,
  currentRange,
  onSelectRange,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onScrollTo(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 text-white shadow-2xl backdrop-blur-md">
      {/* Top micro announcement bar */}
      <div className="border-b border-neutral-800/80 bg-neutral-900/90 py-1.5 px-4 text-xs font-semibold">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider">Selby Workshop Open:</span>
            <span className="hidden sm:inline text-neutral-400">Direct Vredestein Motorcycle Tyre Importer &amp; Fitment</span>
            <span className="sm:hidden text-neutral-400">Direct Vredestein Importer</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/27832273237?text=Hi%20Costa,%20I%20have%20an%20enquiry%20regarding%20Vredestein%20motorcycle%20tyres"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <span>WhatsApp Costa:</span>
              <span className="text-white">+27 83 227 3237</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-20 items-center justify-between gap-4 py-2">
          {/* Brand Logo & Identification */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Go to top"
              onClick={() => handleNavClick("top")}
              className="shrink-0 bg-transparent transition-transform hover:scale-105"
            >
              <img
                src={logoAsset}
                alt="R&C Commodities logo"
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </button>
            <div className="min-w-0 border-l-2 border-primary/80 pl-3">
              <span className="block truncate font-display text-base uppercase leading-none tracking-tight sm:text-xl text-white">
                <span className="text-primary font-black">R&amp;C</span> Commodities
              </span>
              <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 sm:text-[10px]">
                PREMIUM MOTORCYCLE TYRES &amp; ACCESSORIES
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900/80 p-1 lg:flex shadow-inner">
            <button
              onClick={() => handleNavClick("tyres")}
              className="rounded px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              Tyres
            </button>
            <button
              onClick={() => handleNavClick("combos")}
              className="relative flex items-center gap-1.5 rounded px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-amber-300 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <Flame size={13} className="text-amber-400" />
              <span>Combos</span>
              <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-black text-neutral-950 uppercase">
                Save R650
              </span>
            </button>
            <button
              onClick={() => handleNavClick("finder")}
              className="rounded px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              Tyre Finder
            </button>
            <button
              onClick={() => handleNavClick("netherlands")}
              className="rounded px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              Dutch Heritage
            </button>
            <button
              onClick={() => handleNavClick("accessories")}
              className="rounded px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              Accessories
            </button>
            <button
              onClick={() => handleNavClick("workshop")}
              className="rounded px-3.5 py-2 text-xs font-black uppercase tracking-[0.1em] text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              Workshop
            </button>
          </nav>

          {/* Right Action Icons & Direct Fitment Call */}
          <div className="flex items-center gap-2.5">
            <a
              href="tel:+27832273237"
              className="hidden xl:inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:border-amber-400 hover:text-white transition-colors"
            >
              <Phone size={14} className="text-primary" />
              <span>Call Costa</span>
            </a>

            <button
              aria-label="Search tyre sizes"
              onClick={() => handleNavClick("finder")}
              className="grid size-10 place-items-center rounded-md border border-neutral-800 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Search size={18} />
            </button>

            <button
              aria-label={`Cart with ${totalCartCount} items`}
              onClick={onOpenCart}
              className="relative flex items-center gap-2 h-10 px-3.5 rounded-md bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors shadow-lg"
            >
              <ShoppingBag size={17} />
              <span className="hidden sm:inline">Cart</span>
              {totalCartCount > 0 ? (
                <span className="grid size-5 place-items-center rounded-full bg-amber-400 text-[11px] font-black text-neutral-950">
                  {totalCartCount}
                </span>
              ) : null}
            </button>

            <button
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid size-10 place-items-center rounded-md border border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 lg:hidden transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-neutral-800 bg-neutral-900/98 p-3 lg:hidden space-y-1 rounded-b-xl shadow-2xl">
            {[
              ["All Tyres Catalog", "tyres"],
              ["Vredestein Combos (Save R650)", "combos"],
              ["Precision Tyre Finder", "finder"],
              ["Made in the Netherlands (Since 1909)", "netherlands"],
              ["Motorcycle Accessories", "accessories"],
              ["Workshop & Selby Fitment", "workshop"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className="w-full text-left rounded-md px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-neutral-200 hover:bg-neutral-800 hover:text-amber-400 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2">
              <a
                href="https://wa.me/27832273237?text=Hi%20Costa,%20I%20have%20an%20enquiry%20regarding%20Vredestein%20tyres"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
              >
                WhatsApp Costa (+27 83 227 3237)
              </a>
              <a
                href="tel:+27832273237"
                className="flex items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
              >
                <Phone size={14} className="text-primary" /> Call Workshop Directly
              </a>
            </div>
          </nav>
        )}

        {/* Quick Range Filter Ribbon */}
        <div className="flex min-h-12 items-center gap-2 overflow-x-auto border-t border-neutral-800/80 py-1.5 text-xs scrollbar-none">
          <span className="shrink-0 font-black uppercase tracking-[0.14em] text-amber-400 text-[11px]">
            Quick Range Filter:
          </span>
          <span className="h-3.5 w-px shrink-0 bg-neutral-700" />
          
          {(["All", "NS", "ST"] as Range[]).map((item) => (
            <button
              key={item}
              onClick={() => {
                onSelectRange(item);
                onScrollTo("tyres");
              }}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                currentRange === item
                  ? "bg-primary text-white shadow-md ring-1 ring-primary/50"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white"
              }`}
            >
              {item === "All" ? "All Fitments" : `Centauro ${item}`}
            </button>
          ))}

          <button
            onClick={() => onScrollTo("combos")}
            className="shrink-0 flex items-center gap-1 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-amber-300 hover:bg-amber-500 hover:text-neutral-950 transition-colors"
          >
            <Flame size={12} /> Combos (Pairs from R2,940)
          </button>

          <button
            onClick={() => onScrollTo("finder")}
            className="shrink-0 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
          >
            Find My Tyre Size
          </button>

          <button
            onClick={() => onScrollTo("workshop")}
            className="shrink-0 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors"
          >
            Selby Workshop
          </button>
        </div>
      </div>
    </header>
  );
}
