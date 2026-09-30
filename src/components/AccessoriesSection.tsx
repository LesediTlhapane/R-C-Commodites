import React, { useState, useMemo, useEffect } from "react";
import {
  ExternalLink,
  ShoppingBag,
  Wrench,
  Search,
  X,
  ZoomIn,
  Eye,
  CheckCircle2,
  Sparkles,
  Tag,
  ShieldCheck,
} from "lucide-react";
import type { AccessoryItem } from "../types";
import moodyBikeAsset from "../assets/4298f1d6724ee05cbb8ca427a0471e9c.jpg";
import { resolveAsset } from "../lib/assetHelper";

interface AccessoriesSectionProps {
  accessories: AccessoryItem[];
  onAddAccessory: (item: AccessoryItem) => void;
}

export function AccessoriesSection({ accessories, onAddAccessory }: AccessoriesSectionProps) {
  const accessoriesBg = resolveAsset(
    ["4298f1d6", "e086514c", "accessories", "paddock"],
    moodyBikeAsset
  );

  // Search & Filter state to comfortably support as many accessories as needed
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Image Lightbox Modal state
  const [activeModalItem, setActiveModalItem] = useState<AccessoryItem | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    if (!activeModalItem) {
      setIsZoomed(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModalItem(null);
        setIsZoomed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalItem]);

  // Dynamically extract all available categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    accessories.forEach((a) => {
      if (a.category && a.category.trim()) {
        cats.add(a.category.trim());
      }
    });
    return ["All", ...Array.from(cats)];
  }, [accessories]);

  // Filter accessories based on search and category
  const filteredAccessories = useMemo(() => {
    return accessories.filter((item) => {
      if (item.active === false) return false;

      const matchesCat =
        selectedCategory === "All" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCat) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = (item.subtitle || "").toLowerCase().includes(q);
      const matchCat = (item.category || "").toLowerCase().includes(q);

      return matchTitle || matchSubtitle || matchCat;
    });
  }, [accessories, selectedCategory, searchQuery]);

  return (
    <section
      id="accessories"
      className="relative overflow-hidden border-y border-neutral-800 bg-neutral-950 py-16 sm:py-24 text-white"
    >
      {/* Background picture with tuned opacity */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={accessoriesBg}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-40 filter contrast-110"
        />
        <div className="absolute inset-0 bg-neutral-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/98 via-neutral-950/60 to-neutral-950/85" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-2">
              <Sparkles size={13} />
              <span>Essential Rider &amp; Workshop Gear</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-white">
              Motorcycle Accessories
            </h2>
            <p className="mt-2 text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Equip your superbike with crash bobbins, paddock stands, digital tyre warmers, and
              workshop maintenance supplies from our Selby depot. Click any image to inspect in full
              detail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <span className="text-xs text-neutral-400 bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 rounded-lg font-mono">
              {accessories.length} {accessories.length === 1 ? "Product" : "Products"} Available
            </span>
            <a
              href="https://wa.me/27832273237?text=Hi%20Costa,%20I'm%20looking%20for%20specific%20motorcycle%20accessories"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 hover:border-neutral-700 transition-colors shadow-sm cursor-pointer"
            >
              <span>Custom Part Enquiry</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Search & Category Filter Controls (Accommodates any number of accessories) */}
        {accessories.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
              {/* Live Search Input */}
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search accessories by name, category, or fitment..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:border-primary focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Pills Slider */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 px-1 scrollbar-none">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  const count =
                    cat === "All"
                      ? accessories.length
                      : accessories.filter(
                          (a) => a.category?.toLowerCase() === cat.toLowerCase()
                        ).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800"
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-neutral-900 text-neutral-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Accessories Product Grid */}
        {accessories.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 sm:p-12 text-center backdrop-blur-xs max-w-2xl mx-auto shadow-2xl">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-neutral-950 border border-neutral-800 text-primary shadow-lg mb-4">
              <ShoppingBag size={28} />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-300 mb-3">
              Accessories Catalogue
            </div>
            <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight text-white">
              Confirmed Accessory Inventory Arriving Soon
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-lg mx-auto">
              Our official motorcycle accessories catalogue is being updated with paddock stands,
              crash bobbins, tyre warmers and maintenance kits. Add custom items via the admin
              portal or enquire directly.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="https://wa.me/27832273237?text=Hi%20Costa,%20I'm%20looking%20for%20specific%20motorcycle%20accessories%20from%20R&C%20Commodities"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors shadow-md cursor-pointer"
              >
                <ExternalLink size={14} /> Custom Accessory Enquiry (WhatsApp)
              </a>
              <a
                href="tel:+27832273237"
                className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Call Costa (+27 83 227 3237)
              </a>
            </div>
          </div>
        ) : filteredAccessories.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-10 text-center max-w-xl mx-auto">
            <Search size={32} className="mx-auto text-neutral-600 mb-3" />
            <h3 className="font-display text-lg uppercase text-white">No accessories matched</h3>
            <p className="mt-1 text-xs text-neutral-400">
              No products found matching &ldquo;{searchQuery}&rdquo; in category &ldquo;
              {selectedCategory}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 rounded-lg bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-700 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredAccessories.map((item) => {
              const accImg = item.image || item.imageUrl;

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-800/90 bg-neutral-900/85 backdrop-blur-xs shadow-lg transition-all hover:border-primary/80 hover:shadow-2xl hover:-translate-y-1 group"
                >
                  {/* Accessory Image with Click-to-View Feature */}
                  {accImg ? (
                    <div
                      onClick={() => {
                        setActiveModalItem(item);
                        setIsZoomed(false);
                      }}
                      className="relative h-48 w-full overflow-hidden bg-neutral-950 border-b border-neutral-800/80 cursor-zoom-in group/img"
                      title="Click to view full image"
                    >
                      <img
                        src={accImg}
                        alt={item.title}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/img:scale-108"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />

                      {/* Category Pill Tag */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-neutral-950/85 backdrop-blur-xs border border-neutral-700/80 text-neutral-200 shadow-xs">
                          {item.category}
                        </span>
                      </div>

                      {/* Always Visible View Badge */}
                      <div className="absolute bottom-2.5 right-2.5 z-10">
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-950/90 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-xs group-hover/img:bg-primary transition-colors">
                          <Eye size={12} className="text-amber-400 group-hover/img:text-white" />
                          <span>View Image</span>
                        </span>
                      </div>

                      {/* Hover Click-to-View Badge Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950/90 border border-white/20 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-xs">
                          <ZoomIn size={14} className="text-primary" />
                          <span>Click to View Image</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setActiveModalItem(item);
                        setIsZoomed(false);
                      }}
                      className="relative h-36 w-full flex flex-col items-center justify-center bg-neutral-950/80 border-b border-neutral-800/80 cursor-pointer group/placeholder"
                      title="Click to view details"
                    >
                      <div className="grid size-12 place-items-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover/placeholder:border-primary group-hover/placeholder:text-primary transition-colors">
                        <Wrench size={22} />
                      </div>
                      <span className="mt-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  )}

                  {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-base uppercase leading-snug text-white group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="mt-2 text-xs text-neutral-300 leading-relaxed line-clamp-3">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="font-display text-base text-primary font-bold block">
                        R{item.price.toLocaleString("en-ZA")}.00
                      </span>
                      {item.stockQuantity === null || item.stockQuantity === undefined ? (
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          Stock Not Verified
                        </span>
                      ) : item.stockQuantity === 0 ? (
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          In Stock ({item.stockQuantity})
                        </span>
                      )}
                    </div>

                    {item.stockQuantity !== null &&
                    item.stockQuantity !== undefined &&
                    item.stockQuantity > 0 ? (
                      <button
                        onClick={() => onAddAccessory(item)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors active:scale-95 cursor-pointer shadow-xs"
                      >
                        <ShoppingBag size={13} /> Add
                      </button>
                    ) : (
                      <a
                        href={`https://wa.me/27832273237?text=${encodeURIComponent(
                          `Hi Costa, please verify stock for accessory: ${item.title}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/80 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:border-neutral-600 transition"
                      >
                        Enquire
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* LIGHTBOX / IMAGE MODAL */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="accessory-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 text-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 sm:px-6 bg-neutral-950">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                  {activeModalItem.category}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  R{activeModalItem.price.toLocaleString("en-ZA")}.00
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(activeModalItem.image || activeModalItem.imageUrl) && (
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="grid size-9 place-items-center rounded-xl border border-neutral-800 bg-neutral-850 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                    title={isZoomed ? "Reset zoom" : "Zoom in"}
                    aria-label={isZoomed ? "Reset zoom" : "Zoom in"}
                  >
                    <ZoomIn size={16} className={isZoomed ? "text-primary" : ""} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalItem(null);
                    setIsZoomed(false);
                  }}
                  className="grid size-9 place-items-center rounded-xl border border-neutral-800 bg-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Close image viewer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Image View Area */}
            <div className="relative max-h-[64vh] w-full overflow-hidden bg-neutral-950 flex items-center justify-center p-3">
              {activeModalItem.image || activeModalItem.imageUrl ? (
                <div
                  className={`overflow-auto max-h-[58vh] w-full flex items-center justify-center cursor-pointer transition-transform duration-200 ${
                    isZoomed ? "scale-125" : ""
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                  title={isZoomed ? "Click to reset zoom" : "Click image to zoom in"}
                >
                  <img
                    src={activeModalItem.image || activeModalItem.imageUrl || ""}
                    alt={activeModalItem.title}
                    className="max-h-[56vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              ) : (
                <div className="py-20 text-center text-neutral-500">
                  <Wrench size={48} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs uppercase font-bold">No photo uploaded</p>
                </div>
              )}
            </div>

            {/* Modal Footer & Actions */}
            <div className="border-t border-neutral-800 bg-neutral-950/90 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3
                    id="accessory-modal-title"
                    className="font-display text-xl uppercase tracking-tight text-white"
                  >
                    {activeModalItem.title}
                  </h3>
                  {activeModalItem.subtitle && (
                    <p className="mt-1 text-xs text-neutral-400 leading-relaxed max-w-md">
                      {activeModalItem.subtitle}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-display text-xl text-primary font-black">
                      R{activeModalItem.price.toLocaleString("en-ZA")}.00
                    </span>
                    {activeModalItem.stockQuantity !== null &&
                    activeModalItem.stockQuantity !== undefined &&
                    activeModalItem.stockQuantity > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-emerald-400">
                        <CheckCircle2 size={13} /> In Stock ({activeModalItem.stockQuantity} units)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase text-amber-400">
                        Out of Stock / Custom Order
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activeModalItem.stockQuantity !== null &&
                  activeModalItem.stockQuantity !== undefined &&
                  activeModalItem.stockQuantity > 0 ? (
                    <button
                      onClick={() => {
                        onAddAccessory(activeModalItem);
                        setActiveModalItem(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow-lg active:scale-95 cursor-pointer"
                    >
                      <ShoppingBag size={16} />
                      <span>Add to Cart</span>
                    </button>
                  ) : (
                    <a
                      href={`https://wa.me/27832273237?text=${encodeURIComponent(
                        `Hi Costa, I would like to enquire about ordering: ${activeModalItem.title}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-500 transition-colors shadow-lg"
                    >
                      <span>Enquire on WhatsApp</span>
                    </a>
                  )}

                  <button
                    onClick={() => setActiveModalItem(null)}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
