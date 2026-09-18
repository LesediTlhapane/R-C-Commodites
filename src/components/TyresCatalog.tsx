import { Tag, ShoppingBag, ShieldCheck, Phone, Check } from "lucide-react";
import type { Range, TyreProduct } from "../types";
import { ShopButton } from "./ShopButton";

interface TyresCatalogProps {
  range: Range;
  selectedSize: string;
  selectedPosition: string;
  viewMode: "cards" | "table";
  filteredProducts: TyreProduct[];
  sizeOptions: string[];
  onSelectRange: (r: Range) => void;
  onSelectSize: (s: string) => void;
  onSelectPosition: (p: string) => void;
  onViewModeChange: (m: "cards" | "table") => void;
  onAddToCart: (p: TyreProduct) => void;
  onResetFilters: () => void;
}

export function TyresCatalog({
  range,
  selectedSize,
  selectedPosition,
  viewMode,
  filteredProducts,
  sizeOptions,
  onSelectRange,
  onSelectSize,
  onSelectPosition,
  onViewModeChange,
  onAddToCart,
  onResetFilters,
}: TyresCatalogProps) {
  return (
    <section id="tyres" className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left Sidebar Guide & Price Matrix */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Vredestein Range Breakdown
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl leading-[1.05] uppercase tracking-tight text-foreground">
                Engineered for your riding discipline.
              </h2>
            </div>

            {/* Range Toggle Cards */}
            <div className="rounded-xl border border-border bg-card p-1.5 shadow-sm space-y-1">
              <button
                onClick={() => {
                  onSelectRange("NS");
                  onSelectSize("All sizes");
                }}
                className={`flex w-full gap-3.5 rounded-lg p-3.5 text-left transition-all ${
                  range === "NS"
                    ? "bg-primary/10 border-l-4 border-primary ring-1 ring-primary/20 shadow-xs"
                    : "hover:bg-surface-soft"
                }`}
              >
                <span className="mt-1 size-3 shrink-0 rounded-full bg-primary" />
                <div>
                  <strong className="font-display text-sm sm:text-base text-foreground block">
                    Centauro NS (Super Sport)
                  </strong>
                  <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                    Track &amp; aggressive road grip, fast steering turn-in, and supreme confidence at maximum lean angle.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectRange("ST");
                  onSelectSize("All sizes");
                }}
                className={`flex w-full gap-3.5 rounded-lg p-3.5 text-left transition-all ${
                  range === "ST"
                    ? "bg-steel/10 border-l-4 border-steel ring-1 ring-steel/20 shadow-xs"
                    : "hover:bg-surface-soft"
                }`}
              >
                <span className="mt-1 size-3 shrink-0 rounded-full bg-steel" />
                <div>
                  <strong className="font-display text-sm sm:text-base text-foreground block">
                    Centauro ST (Sport Touring)
                  </strong>
                  <p className="mt-1 text-xs text-foreground-muted leading-relaxed">
                    Exceptional wet drainage siping, extended tread life, and all-weather touring comfort.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectRange("All");
                  onSelectSize("All sizes");
                  onSelectPosition("All");
                }}
                className={`flex w-full gap-3.5 rounded-lg p-2.5 text-left text-xs font-bold uppercase tracking-wider text-primary hover:underline items-center ${
                  range === "All" ? "font-black" : ""
                }`}
              >
                <span>View all fitments ({filteredProducts.length}) →</span>
              </button>
            </div>

            {/* Official Selling Price Matrix */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Tag size={15} className="text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider">Official Selling Prices</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                  In Stock (Selby)
                </span>
              </div>

              {/* Centauro ST Table */}
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px] font-black uppercase text-steel tracking-wider pb-1.5">
                  <span>Centauro ST (Sport Touring)</span>
                  <span>Price (ZAR)</span>
                </div>
                <div className="divide-y divide-border/60 text-xs">
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-foreground">120/70 ZR 17 – Front</span>
                    <strong className="font-bold text-primary">R 1,350.00</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-foreground">180/55 ZR 17 – Rear</span>
                    <strong className="font-bold text-primary">R 1,999.00</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-foreground">190/50 ZR 17 – Rear</span>
                    <strong className="font-bold text-primary">R 2,300.00</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-foreground">190/55 ZR 17 – Rear</span>
                    <strong className="font-bold text-primary">R 2,400.00</strong>
                  </div>
                </div>
              </div>

              {/* Centauro NS Table */}
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-[11px] font-black uppercase text-primary tracking-wider pb-1.5">
                  <span>Centauro NS (Super Sport)</span>
                  <span>Price (ZAR)</span>
                </div>
                <div className="divide-y divide-border/60 text-xs">
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-foreground">120/70 ZR 17 – Front</span>
                    <strong className="font-bold text-primary">R 1,900.00</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-foreground">180/55 ZR 17 – Rear</span>
                    <strong className="font-bold text-primary">R 2,000.00</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-foreground">190/55 ZR 17 – Rear</span>
                    <strong className="font-bold text-primary">R 2,450.00</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-foreground">200/55 ZR 17 – Rear</span>
                    <strong className="font-bold text-primary">R 3,100.00</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Genuine Importer Guarantee Box */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-white shadow-md">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={18} /> Official Importer Guarantee
              </div>
              <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
                Direct European performance engineering by Vredestein. Stored and fitted in Selby, Johannesburg.
              </p>
              <a
                href="tel:+27832273237"
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-white transition-colors"
              >
                <Phone size={14} /> Costa: +27 83 227 3237
              </a>
            </div>
          </div>
        </div>

        {/* Right Product Grid & Filter Toolbar */}
        <div className="lg:col-span-8">
          {/* Filter Toolbar */}
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div>
              <p className="text-sm font-bold text-foreground">
                <span className="font-display text-primary text-base">{filteredProducts.length}</span>{" "}
                Fitments Available
              </p>
              <p className="text-xs text-foreground-muted">
                Showing {range === "All" ? "all ranges" : `Centauro ${range}`}
                {selectedSize !== "All sizes" ? ` · ${selectedSize}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* View mode toggle */}
              <div className="flex items-center rounded-md border border-border bg-surface-soft p-0.5 text-xs font-bold">
                <button
                  onClick={() => onViewModeChange("cards")}
                  className={`px-3 py-1.5 rounded transition-all ${
                    viewMode === "cards"
                      ? "bg-foreground text-background shadow-xs"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => onViewModeChange("table")}
                  className={`px-3 py-1.5 rounded transition-all ${
                    viewMode === "table"
                      ? "bg-foreground text-background shadow-xs"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Price Table
                </button>
              </div>

              {/* Position filter */}
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                <span className="hidden sm:inline">Position:</span>
                <select
                  value={selectedPosition}
                  onChange={(e) => onSelectPosition(e.target.value)}
                  className="h-9 rounded-md border border-border bg-surface-soft px-2.5 text-xs text-foreground font-semibold outline-none focus:border-primary"
                >
                  <option value="All">All Positions</option>
                  <option value="Front">Front</option>
                  <option value="Rear">Rear</option>
                </select>
              </label>

              {/* Size filter */}
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                <span className="hidden sm:inline">Size:</span>
                <select
                  value={selectedSize}
                  onChange={(e) => onSelectSize(e.target.value)}
                  className="h-9 rounded-md border border-border bg-surface-soft px-2.5 text-xs text-foreground font-semibold outline-none focus:border-primary"
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
          {viewMode === "table" ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-soft text-[11px] font-black uppercase tracking-wider text-foreground-muted">
                      <th className="p-4">Tyre Model</th>
                      <th className="p-4">Size Specification</th>
                      <th className="p-4">Position</th>
                      <th className="p-4">Selling Price</th>
                      <th className="p-4 text-right">Cart Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-surface-soft/60 transition-colors">
                        <td className="p-4 font-bold text-foreground">
                          <span
                            className={`inline-block rounded-xs px-2 py-0.5 text-[10px] font-black uppercase mr-2.5 ${
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
                            onClick={() => onAddToCart(product)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow-xs active:scale-95"
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
            /* Cards Grid View */
            <div className="grid gap-5 sm:grid-cols-2">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:-translate-y-1 hover:shadow-xl hover:border-neutral-400"
                >
                  <div>
                    {/* Tyre Image Showcase */}
                    <div className="relative aspect-[5/4] bg-surface-soft overflow-hidden">
                      <img
                        src={product.image}
                        alt={`${product.name} ${product.position} tyre`}
                        className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        className={`absolute left-3.5 top-3.5 rounded-md px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-md ${
                          product.range === "NS"
                            ? "bg-primary text-white"
                            : "bg-steel text-white"
                        }`}
                      >
                        {product.range === "NS" ? "Super Sport (NS)" : "Sport Touring (ST)"}
                      </span>
                      <span className="absolute right-3.5 top-3.5 rounded-md bg-neutral-950/80 px-2.5 py-1 text-[10px] font-bold text-white uppercase backdrop-blur-xs">
                        {product.position} Tyre
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted block">
                            {product.range === "NS" ? "Centauro NS · Super Sport" : "Centauro ST · Sport Touring"} · {product.position}
                          </span>
                          <h3 className="font-display text-lg uppercase tracking-tight text-foreground mt-0.5">
                            {product.name}
                          </h3>
                          <p className="mt-1 font-display text-xl font-bold text-primary">
                            {product.size}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-medium text-foreground-muted block">Selling Price</span>
                          <strong className="font-display text-xl font-bold text-foreground block">
                            R{product.price.toLocaleString("en-ZA")}.00
                          </strong>
                        </div>
                      </div>

                      {/* Feature Chips */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {product.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-surface-soft px-2.5 py-1 text-[11px] text-foreground-muted font-normal"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <div className="p-5 pt-0">
                    <ShopButton
                      variant="dark"
                      className="w-full uppercase tracking-wider text-xs font-bold"
                      onClick={() => onAddToCart(product)}
                    >
                      Add to cart <ShoppingBag size={15} />
                    </ShopButton>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Empty Filter State */}
          {filteredProducts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-xl text-foreground">No fitments match your selected filters</p>
              <p className="mt-2 text-sm text-foreground-muted">
                Try choosing "All sizes" or clearing the position filter.
              </p>
              <button
                onClick={onResetFilters}
                className="mt-5 rounded-md bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow-md"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
