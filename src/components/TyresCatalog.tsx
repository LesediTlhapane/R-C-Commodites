import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Filter,
  HelpCircle,
  ImageOff,
  RotateCcw,
  ShoppingBag,
  X,
} from "lucide-react";
import type { Range, TyreProduct } from "../types";
import { TYRE_BRANDS } from "../data/tyreCatalogueTaxonomy";
import { ShopButton } from "./ShopButton";

type SortOption = "relevance" | "name-asc" | "name-desc" | "price-asc" | "price-desc" | "newest";
type Facet = "brand" | "model" | "width" | "profile" | "rim" | "position" | "category";

interface TyresCatalogProps {
  range: Range;
  selectedSize: string;
  selectedPosition: string;
  viewMode: "cards" | "table";
  products: TyreProduct[];
  sizeOptions: string[];
  onSelectRange: (range: Range) => void;
  onSelectSize: (size: string) => void;
  onSelectPosition: (position: string) => void;
  onViewModeChange: (mode: "cards" | "table") => void;
  onAddToCart: (product: TyreProduct) => void;
  onResetFilters: () => void;
}

const EMPTY_FILTERS: Record<Facet, string> = {
  brand: "",
  model: "",
  width: "",
  profile: "",
  rim: "",
  position: "",
  category: "",
};

const FACET_LABELS: Record<Facet, string> = {
  brand: "Brand",
  model: "Model",
  width: "Width",
  profile: "Profile",
  rim: "Rim size",
  position: "Position",
  category: "Category",
};

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function matchesFacet(product: TyreProduct, facet: Facet, value: string): boolean {
  if (!value) return true;
  switch (facet) {
    case "brand":
      return (product.brand || "Vredestein").toLowerCase() === value.toLowerCase();
    case "model":
      return product.name.toLowerCase() === value.toLowerCase();
    case "width":
      return product.width === value;
    case "profile":
      return product.profile === value;
    case "rim":
      return product.rim.replace(/\D/g, "") === value;
    case "position":
      return product.position === value || product.position === "Both";
    case "category":
      return (product.category || "Other").toLowerCase() === value.toLowerCase();
  }
}

export function TyresCatalog({
  range,
  selectedSize,
  selectedPosition,
  viewMode,
  products,
  sizeOptions,
  onSelectRange,
  onSelectSize,
  onSelectPosition,
  onViewModeChange,
  onAddToCart,
  onResetFilters,
}: TyresCatalogProps) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedFacets, setExpandedFacets] = useState<Record<Facet, boolean>>({
    brand: true,
    model: true,
    width: true,
    profile: false,
    rim: false,
    position: true,
    category: true,
  });

  const availableProducts = useMemo(
    () => products.filter((product) => product.active !== false),
    [products]
  );

  const matches = (product: TyreProduct, exceptFacet?: Facet) => {
    if (range !== "All" && product.range !== range) return false;
    if (selectedSize !== "All sizes" && product.size !== selectedSize) return false;
    if (
      exceptFacet !== "position" &&
      selectedPosition !== "All" &&
      product.position !== selectedPosition &&
      product.position !== "Both"
    ) return false;

    return (Object.keys(filters) as Facet[]).every(
      (facet) => facet === exceptFacet || matchesFacet(product, facet, filters[facet])
    );
  };

  const matchingProducts = useMemo(
    () => availableProducts.filter((product) => matches(product)),
    [availableProducts, range, selectedSize, selectedPosition, filters]
  );

  const sortedProducts = useMemo(() => {
    const sorted = [...matchingProducts];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`));
        break;
      case "name-desc":
        sorted.sort((a, b) => `${b.brand} ${b.name}`.localeCompare(`${a.brand} ${a.name}`));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        sorted.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        break;
    }
    return sorted;
  }, [matchingProducts, sort]);

  const brandOptions = useMemo(
    () => unique([...TYRE_BRANDS, ...availableProducts.map((product) => product.brand || "Vredestein")]),
    [availableProducts]
  );
  const categoryOptions = useMemo(
    () => unique(availableProducts.map((product) => product.category || "Other")).sort(),
    [availableProducts]
  );
  const optionsFor = (facet: Facet): string[] => {
    const facetProducts = availableProducts.filter((product) => matches(product, facet));
    switch (facet) {
      case "brand":
        return brandOptions;
      case "model":
        return unique(facetProducts.map((product) => product.name)).sort();
      case "width":
        return unique(facetProducts.map((product) => product.width)).sort((a, b) => Number(a) - Number(b));
      case "profile":
        return unique(facetProducts.map((product) => product.profile)).sort((a, b) => Number(a) - Number(b));
      case "rim":
        return unique(facetProducts.map((product) => product.rim.replace(/\D/g, ""))).sort(
          (a, b) => Number(a) - Number(b)
        );
      case "position":
        return unique(facetProducts.flatMap((product) => (product.position === "Both" ? ["Front", "Rear", "Both"] : [product.position])));
      case "category":
        return unique(facetProducts.map((product) => product.category || "Other")).sort();
    }
  };

  const countFor = (facet: Facet, value: string) =>
    availableProducts.filter((product) => matches(product, facet) && matchesFacet(product, facet, value)).length;

  const categories = optionsFor("category");
  const activeFilters = [
    ...(range !== "All" ? [{ label: `Range: ${range}`, clear: () => onSelectRange("All") }] : []),
    ...(selectedSize !== "All sizes" ? [{ label: `Size: ${selectedSize}`, clear: () => onSelectSize("All sizes") }] : []),
    ...(selectedPosition !== "All" ? [{ label: `Position: ${selectedPosition}`, clear: () => onSelectPosition("All") }] : []),
    ...(Object.keys(filters) as Facet[])
      .filter((facet) => filters[facet])
      .map((facet) => ({
        label: `${FACET_LABELS[facet]}: ${filters[facet]}`,
        clear: () => setFilters((current) => ({ ...current, [facet]: "" })),
      })),
  ];

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    onResetFilters();
    setMobileFiltersOpen(false);
  };

  const selectFacet = (facet: Facet, value: string) => {
    if (facet === "position") {
      onSelectPosition(selectedPosition === value ? "All" : value);
      return;
    }
    setFilters((current) => ({
      ...current,
      [facet]: current[facet] === value ? "" : value,
      ...(facet === "brand" ? { model: "" } : {}),
    }));
  };

  const toggleFacet = (facet: Facet) =>
    setExpandedFacets((current) => ({ ...current, [facet]: !current[facet] }));

  const filterContent = (
    <div className="space-y-2">
      {(["brand", "model", "width", "profile", "rim", "position", "category"] as Facet[]).map((facet) => {
        const options = optionsFor(facet);
        return (
          <section key={facet} className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => toggleFacet(facet)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-foreground hover:bg-surface-soft"
              aria-expanded={expandedFacets[facet]}
            >
              <span>{FACET_LABELS[facet]}</span>
              <ChevronDown size={15} className={`transition-transform ${expandedFacets[facet] ? "rotate-180" : ""}`} />
            </button>
            {expandedFacets[facet] && (
              <div className="max-h-56 space-y-1 overflow-y-auto border-t border-border px-3 py-2">
                {options.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-foreground-muted">No matching options.</p>
                ) : options.map((option) => {
                  const count = countFor(facet, option);
                  const unavailableBrand = facet === "brand" && count === 0;
                  return (
                    <label
                      key={option}
                      className={`flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-xs ${
                        unavailableBrand ? "cursor-not-allowed text-foreground-muted/60" : "cursor-pointer text-foreground hover:bg-surface-soft"
                      }`}
                      title={unavailableBrand ? "No products from this brand are currently listed." : undefined}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={facet === "position" ? selectedPosition === option : filters[facet] === option}
                          disabled={unavailableBrand}
                          onChange={() => selectFacet(facet, option)}
                          className="size-3.5 accent-primary"
                        />
                        <span className="truncate">{option}</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-foreground-muted">{count}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <label className="block rounded-xl border border-border bg-card p-3">
        <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-foreground-muted">
          Tyre size
        </span>
        <select
          value={selectedSize}
          onChange={(event) => onSelectSize(event.target.value)}
          className="h-10 w-full rounded-md border border-border bg-surface-soft px-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
        >
          {sizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>

      <button
        type="button"
        onClick={clearAll}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-soft px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary hover:text-primary"
      >
        <RotateCcw size={13} /> Clear all filters
      </button>
    </div>
  );

  return (
    <section id="tyres" className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Find your next tyre</p>
        <h2 className="mt-2 font-display text-3xl uppercase tracking-tight text-foreground sm:text-4xl">Tyres</h2>
        <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
          Browse available motorcycle tyres by brand, model, fitment and riding category.
        </p>
      </div>

      {categories.length > 0 && (
        <nav aria-label="Tyre categories" className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setFilters((current) => ({ ...current, category: "" }))}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide ${
              filters.category ? "border-border bg-card text-foreground-muted" : "border-primary bg-primary text-white"
            }`}
          >
            All categories ({availableProducts.filter((product) => matches(product, "category")).length})
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              onClick={() => selectFacet("category", category)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                filters.category === category ? "border-primary bg-primary text-white" : "border-border bg-card text-foreground hover:border-primary"
              }`}
            >
              {category} ({countFor("category", category)})
            </button>
          ))}
        </nav>
      )}

      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm uppercase tracking-wide text-foreground">Filter tyres</h3>
              <span className="text-[10px] font-bold text-foreground-muted">{activeFilters.length} active</span>
            </div>
            {filterContent}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <div>
              <p className="text-sm font-bold text-foreground">
                Showing <span className="font-display text-primary">{sortedProducts.length}</span>{" "}
                {sortedProducts.length === 1 ? "product" : "products"}
              </p>
              <p className="text-xs text-foreground-muted">
                {availableProducts.length} listed product{availableProducts.length === 1 ? "" : "s"} in the catalogue
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface-soft px-3 text-xs font-bold text-foreground lg:hidden"
              >
                <Filter size={14} /> Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
              </button>
              <label className="flex items-center gap-2 text-xs font-bold text-foreground-muted">
                <span className="hidden sm:inline">Sort by</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  className="h-10 rounded-md border border-border bg-surface-soft px-3 text-xs font-semibold text-foreground outline-none focus:border-primary"
                >
                  <option value="relevance">Relevance</option>
                  <option value="name-asc">Name: A–Z</option>
                  <option value="name-desc">Name: Z–A</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
              <div className="flex items-center rounded-md border border-border bg-surface-soft p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onViewModeChange("cards")}
                  className={`rounded px-3 py-2 ${viewMode === "cards" ? "bg-foreground text-background" : "text-foreground-muted"}`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange("table")}
                  className={`rounded px-3 py-2 ${viewMode === "table" ? "bg-foreground text-background" : "text-foreground-muted"}`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <button
                  type="button"
                  key={filter.label}
                  onClick={filter.clear}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-foreground"
                >
                  {filter.label} <X size={12} />
                </button>
              ))}
              <button type="button" onClick={clearAll} className="text-[11px] font-bold text-primary hover:underline">
                Clear all
              </button>
            </div>
          )}

          {sortedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center sm:p-14">
              <p className="font-display text-xl uppercase text-foreground">No tyres match these filters</p>
              <p className="mt-2 text-sm text-foreground-muted">Clear one or more filters to see available products.</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-5 rounded-md bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover"
              >
                Clear filters
              </button>
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-surface-soft text-[10px] font-black uppercase tracking-wider text-foreground-muted">
                  <tr>
                    <th className="p-4">Brand / Model</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Position</th>
                    <th className="p-4">Availability</th>
                    <th className="p-4">Price</th>
                    <th className="p-4 text-right">Cart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-surface-soft/50">
                      <td className="p-4">
                        <span className="block text-[10px] font-bold uppercase text-foreground-muted">{product.brand}</span>
                        <span className="font-semibold text-foreground">{product.name}</span>
                      </td>
                      <td className="p-4 font-display font-semibold text-foreground">{product.size}</td>
                      <td className="p-4 text-xs text-foreground-muted">{product.position}</td>
                      <td className="p-4"><StockLabel product={product} /></td>
                      <td className="p-4 font-display font-bold text-primary">R {product.price.toLocaleString("en-ZA")}.00</td>
                      <td className="p-4 text-right">
                        <AddToCart product={product} onAddToCart={onAddToCart} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {sortedProducts.map((product) => (
                <article key={product.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative grid aspect-[5/4] place-items-center overflow-hidden bg-surface-soft">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={`${product.brand} ${product.name} tyre`}
                        className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-foreground-muted">
                        <ImageOff size={34} strokeWidth={1.4} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Image coming soon</span>
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-md bg-neutral-950/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                      {product.brand || "Tyre"}
                    </span>
                    <span className="absolute right-3 top-3 rounded-md bg-neutral-950/80 px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                      {product.position}
                    </span>
                    <div className="absolute bottom-3 left-3"><StockLabel product={product} /></div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                      {product.category || "Motorcycle tyre"}
                    </p>
                    <h3 className="mt-1 font-display text-base uppercase leading-snug text-foreground">{product.name}</h3>
                    <p className="mt-2 font-display text-lg font-bold text-primary">{product.size}</p>
                    {product.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground-muted">{product.description}</p>
                    )}
                    {product.features.length > 0 && (
                      <ul className="mt-3 space-y-1 text-[11px] text-foreground-muted">
                        {product.features.slice(0, 2).map((feature) => <li key={feature}>• {feature}</li>)}
                      </ul>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <span className="font-display text-lg font-bold text-foreground">R{product.price.toLocaleString("en-ZA")}.00</span>
                      <AddToCart product={product} onAddToCart={onAddToCart} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-neutral-950/70"
          />
          <div role="dialog" aria-modal="true" aria-label="Tyre filters" className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col bg-background p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg uppercase text-foreground">Filters</h3>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="grid size-9 place-items-center rounded-md border border-border text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{filterContent}</div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-black uppercase tracking-wider text-white"
            >
              Show {sortedProducts.length} products
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function StockLabel({ product }: { product: TyreProduct }) {
  const verified = Boolean(product.stockVerified);
  const quantity = product.stockQuantity;
  if (verified && quantity !== null && quantity !== undefined && quantity > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 size={11} /> In stock ({quantity})
      </span>
    );
  }
  if (verified && quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[9px] font-bold uppercase text-red-700 dark:text-red-400">
        <AlertCircle size={11} /> Out of stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-neutral-950/85 px-2 py-1 text-[9px] font-bold uppercase text-amber-300">
      <HelpCircle size={11} /> Stock unverified
    </span>
  );
}

function AddToCart({
  product,
  onAddToCart,
}: {
  product: TyreProduct;
  onAddToCart: (product: TyreProduct) => void;
}) {
  const inStock = Boolean(
    product.stockVerified && product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity > 0
  );
  return inStock ? (
    <ShopButton variant="dark" className="shrink-0 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider" onClick={() => onAddToCart(product)}>
      Add <ShoppingBag size={13} />
    </ShopButton>
  ) : (
    <button
      type="button"
      disabled
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface-soft px-3 py-2 text-[10px] font-bold uppercase text-foreground-muted"
    >
      <AlertCircle size={12} /> Unavailable
    </button>
  );
}
