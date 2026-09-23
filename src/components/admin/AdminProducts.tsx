import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Boxes,
  ArrowUpDown,
  X,
  Save,
  Check,
  Tag,
  ExternalLink,
  Layers,
  History,
} from "lucide-react";
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  getInventoryHistory,
} from "../../lib/productService";
import type { DbProduct, InventoryHistoryItem } from "../../types";

export function AdminProducts() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState<string>("All");
  const [positionFilter, setPositionFilter] = useState<string>("All");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("All");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    brand: "Vredestein",
    range: "ST",
    product_type: "tyre",
    position: "Front",
    width: "120",
    profile: "70",
    rim: "17",
    tyre_type: "ST",
    price: "1500",
    stock_quantity: "",
    stock_verified: false,
    description: "",
    image_url: "",
    active: true,
  });

  // Inline Quick Stock Edit state
  const [quickStockId, setQuickStockId] = useState<string | null>(null);
  const [quickStockVal, setQuickStockVal] = useState<string>("");
  const [quickStockVerified, setQuickStockVerified] = useState<boolean>(true);

  // Audit History drawer
  const [historyDrawerProductId, setHistoryDrawerProductId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<InventoryHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load products from Supabase
  const loadProducts = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load products from Supabase.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "Centauro ST Sport Touring",
      brand: "Vredestein",
      range: "ST",
      product_type: "tyre",
      position: "Front",
      width: "120",
      profile: "70",
      rim: "17",
      tyre_type: "ST",
      price: "1350",
      stock_quantity: "10",
      stock_verified: true,
      description: "Linear progressive turn-in. Exceptional wet evacuation.",
      image_url: "",
      active: true,
    });
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  // Open modal for Edit
  const handleOpenEdit = (p: DbProduct) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      brand: p.brand || "Vredestein",
      range: p.range || "ST",
      product_type: p.product_type || "tyre",
      position: p.position || "Front",
      width: p.width ? String(p.width) : "",
      profile: p.profile ? String(p.profile) : "",
      rim: p.rim ? String(p.rim) : "17",
      tyre_type: p.tyre_type || "ST",
      price: String(p.price),
      stock_quantity: p.stock_quantity !== null && p.stock_quantity !== undefined ? String(p.stock_quantity) : "",
      stock_verified: Boolean(p.stock_verified),
      description: p.description || "",
      image_url: p.image_url || "",
      active: p.active !== false,
    });
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  // Save Modal Form (Insert or Update)
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      setErrorMessage("Please enter a valid selling price.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const stockVal = formData.stock_quantity.trim() === "" ? null : parseInt(formData.stock_quantity, 10);
      const payload = {
        name: formData.name,
        brand: formData.brand,
        range: formData.range,
        product_type: formData.product_type,
        position: formData.position,
        width: formData.width ? parseInt(formData.width, 10) : null,
        profile: formData.profile ? parseInt(formData.profile, 10) : null,
        rim: formData.rim ? parseInt(formData.rim, 10) : null,
        tyre_type: formData.tyre_type,
        price: parseFloat(formData.price),
        stock_quantity: isNaN(stockVal as number) ? null : stockVal,
        stock_verified: formData.stock_verified,
        description: formData.description,
        image_url: formData.image_url.trim() || null,
        active: formData.active,
      };

      if (editingProduct) {
        // UPDATE
        const updated = await updateProduct(editingProduct.id, payload, editingProduct.stock_quantity);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showSuccess(`Product "${updated.name}" updated successfully.`);
      } else {
        // INSERT
        const created = await createProduct(payload);
        setProducts((prev) => [...prev, created]);
        showSuccess(`New product "${created.name}" created in Supabase.`);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product to Supabase.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  // Quick Stock Edit save
  const handleSaveQuickStock = async (product: DbProduct) => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const parsedStock = quickStockVal.trim() === "" ? null : parseInt(quickStockVal, 10);
      if (parsedStock !== null && (isNaN(parsedStock) || parsedStock < 0)) {
        throw new Error("Stock quantity must be a non-negative number.");
      }

      const updated = await updateProduct(
        product.id,
        {
          stock_quantity: parsedStock,
          stock_verified: quickStockVerified,
        },
        product.stock_quantity
      );

      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setQuickStockId(null);
      showSuccess(`Stock for "${product.name}" updated to ${updated.stock_quantity ?? "null"} (${quickStockVerified ? "Verified" : "Unverified"}).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update stock in Supabase.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  // Toggle active/inactive directly
  const handleToggleActive = async (p: DbProduct) => {
    try {
      const updated = await updateProduct(p.id, { active: !p.active });
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showSuccess(`Product "${p.name}" marked ${updated.active ? "Active" : "Inactive"}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update product status.";
      setErrorMessage(msg);
    }
  };

  // Open History Drawer
  const handleViewHistory = async (productId: string) => {
    setHistoryDrawerProductId(productId);
    setLoadingHistory(true);
    try {
      const history = await getInventoryHistory(productId);
      setHistoryItems(history);
    } catch (err) {
      console.warn("Could not load history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const searchMatch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.width && String(p.width).includes(searchQuery)) ||
        (p.range && p.range.toLowerCase().includes(searchQuery.toLowerCase()));

      // Range
      const rangeMatch = rangeFilter === "All" || p.range === rangeFilter;

      // Position
      const posMatch = positionFilter === "All" || p.position === positionFilter;

      // Stock status
      let stockMatch = true;
      if (stockStatusFilter === "in_stock") {
        stockMatch = Boolean(p.stock_verified && p.stock_quantity !== null && p.stock_quantity > 0);
      } else if (stockStatusFilter === "out_of_stock") {
        stockMatch = Boolean(p.stock_verified && p.stock_quantity === 0);
      } else if (stockStatusFilter === "unverified") {
        stockMatch = !p.stock_verified;
      }

      return searchMatch && rangeMatch && posMatch && stockMatch;
    });
  }, [products, searchQuery, rangeFilter, positionFilter, stockStatusFilter]);

  // Compute summary stats
  const totalVerifiedStock = products.reduce((acc, p) => (p.stock_verified ? acc + (p.stock_quantity || 0) : acc), 0);
  const unverifiedCount = products.filter((p) => !p.stock_verified).length;
  const outOfStockCount = products.filter((p) => p.stock_verified && p.stock_quantity === 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Package size={13} /> Supabase Realtime Connected
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl uppercase tracking-tight text-white">
            Product &amp; Inventory Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            Source of truth for the R&amp;C customer catalogue and Selby warehouse tyre stock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            Sync
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-primary-hover shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Status Toasts */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-950/80 border border-emerald-500/50 p-4 text-sm text-emerald-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-red-950/90 border border-red-500/60 p-4 text-sm text-red-200 shadow-xl space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-red-100">Operation Error</span>
                <div className="whitespace-pre-wrap font-mono text-xs text-red-200/90 leading-relaxed bg-black/40 p-3 rounded border border-red-900/50">
                  {errorMessage}
                </div>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white shrink-0 p-1 rounded hover:bg-red-900/50 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase">
            <span>Catalogue Total</span>
            <Package size={16} className="text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-white">{products.length}</p>
          <span className="text-[11px] text-neutral-400">Products in Supabase</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase">
            <span>Confirmed Stock</span>
            <Boxes size={16} className="text-emerald-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-emerald-400">{totalVerifiedStock}</p>
          <span className="text-[11px] text-neutral-400">Total units verified</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase">
            <span>Unverified Stock</span>
            <HelpCircle size={16} className="text-amber-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-amber-400">{unverifiedCount}</p>
          <span className="text-[11px] text-neutral-400">Awaiting stock audit</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase">
            <span>Out of Stock</span>
            <XCircle size={16} className="text-red-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-black text-red-400">{outOfStockCount}</p>
          <span className="text-[11px] text-neutral-400">Zero stock verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-sm p-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, brand, range, or size (e.g. 190, ST)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Range filter */}
        <select
          value={rangeFilter}
          onChange={(e) => setRangeFilter(e.target.value)}
          aria-label="Filter by Range"
          className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs font-semibold text-neutral-300 outline-none focus:border-primary"
        >
          <option value="All">All Ranges</option>
          <option value="ST">ST (Sport Touring)</option>
          <option value="NS">NS (Super Sport)</option>
        </select>

        {/* Position filter */}
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          aria-label="Filter by Position"
          className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs font-semibold text-neutral-300 outline-none focus:border-primary"
        >
          <option value="All">All Positions</option>
          <option value="Front">Front</option>
          <option value="Rear">Rear</option>
        </select>

        {/* Stock status filter */}
        <select
          value={stockStatusFilter}
          onChange={(e) => setStockStatusFilter(e.target.value)}
          aria-label="Filter by Stock Status"
          className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs font-semibold text-neutral-300 outline-none focus:border-primary"
        >
          <option value="All">All Stock Statuses</option>
          <option value="in_stock">In Stock (&gt;0)</option>
          <option value="out_of_stock">Out of Stock (=0)</option>
          <option value="unverified">Stock Not Verified</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/90 text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Type / Range</th>
                <th className="py-3.5 px-4">Size Specs</th>
                <th className="py-3.5 px-4">Selling Price</th>
                <th className="py-3.5 px-4">Authoritative Stock</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4">Storefront Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-500">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary" />
                    Loading tyre catalogue from Supabase...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isQuickEditing = quickStockId === p.id;
                  const sizeLabel = p.width && p.profile ? `${p.width}/${p.profile} ZR ${p.rim || 17}` : "N/A";

                  // Authoritative stock rendering according to prompt rules
                  let stockStatusBadge;
                  if (!p.stock_verified) {
                    stockStatusBadge = (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                        <HelpCircle size={12} /> Stock Not Verified
                      </span>
                    );
                  } else if (p.stock_quantity !== null && p.stock_quantity > 0) {
                    stockStatusBadge = (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 size={12} /> In Stock ({p.stock_quantity})
                      </span>
                    );
                  } else {
                    stockStatusBadge = (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-bold text-red-400">
                        <XCircle size={12} /> Out of Stock
                      </span>
                    );
                  }

                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                      {/* Name & Brand */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                              p.range === "NS" ? "bg-primary text-white" : "bg-neutral-700 text-white"
                            }`}
                          >
                            {p.range || "TYRE"}
                          </span>
                          <div>
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            <div className="text-[11px] text-neutral-400 font-normal">
                              {p.brand} {p.position ? `· ${p.position} Tyre` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type / Range */}
                      <td className="py-3.5 px-4 uppercase text-neutral-300">
                        <div>{p.product_type}</div>
                        <div className="text-[11px] text-neutral-500">{p.range ? `Centauro ${p.range}` : ""}</div>
                      </td>

                      {/* Size Specs */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        <div>{sizeLabel}</div>
                        <div className="text-[11px] text-neutral-500 font-sans font-normal">
                          {p.position || "Fitment"}
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-primary">
                        R{Number(p.price).toLocaleString("en-ZA")}.00
                      </td>

                      {/* Authoritative Stock & Quick Edit */}
                      <td className="py-3.5 px-4">
                        {isQuickEditing ? (
                          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-neutral-950 border border-primary/50 shadow-lg min-w-[140px]">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={quickStockVal}
                                onChange={(e) => setQuickStockVal(e.target.value)}
                                placeholder="Qty"
                                className="w-16 rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs text-white outline-none font-bold"
                              />
                              <label className="flex items-center gap-1 text-[10px] text-neutral-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={quickStockVerified}
                                  onChange={(e) => setQuickStockVerified(e.target.checked)}
                                  className="accent-primary"
                                />
                                Verified
                              </label>
                            </div>
                            <div className="flex items-center gap-1 pt-1 border-t border-neutral-800">
                              <button
                                onClick={() => handleSaveQuickStock(p)}
                                disabled={saving}
                                className="flex-1 rounded bg-primary py-1 text-[10px] font-bold uppercase text-white hover:bg-primary-hover"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setQuickStockId(null)}
                                className="rounded bg-neutral-800 px-2 py-1 text-[10px] text-neutral-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">
                              {p.stock_quantity !== null && p.stock_quantity !== undefined ? p.stock_quantity : "—"}
                            </span>
                            <button
                              onClick={() => {
                                setQuickStockId(p.id);
                                setQuickStockVal(p.stock_quantity !== null ? String(p.stock_quantity) : "");
                                setQuickStockVerified(Boolean(p.stock_verified));
                              }}
                              className="text-neutral-500 hover:text-primary transition-colors p-1"
                              title="Quick Stock Update"
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Availability status badge */}
                      <td className="py-3.5 px-4">{stockStatusBadge}</td>

                      {/* Storefront Active / Inactive switch */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold cursor-pointer transition-colors ${
                            p.active
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700"
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${p.active ? "bg-emerald-400" : "bg-neutral-500"}`} />
                          {p.active ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Edit actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewHistory(p.id)}
                            title="View Inventory History"
                            className="rounded-md border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
                          >
                            <History size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product"
                            className="inline-flex items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white hover:border-neutral-700 transition-colors"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h2 className="font-display text-xl uppercase tracking-tight text-white">
                  {editingProduct ? "Edit Product" : "Add New Tyre Product"}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Direct database update to Supabase <code className="font-mono text-primary">public.products</code>.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary font-medium"
                    placeholder="e.g. Centauro ST Sport Touring"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary font-medium"
                    placeholder="Vredestein"
                  />
                </div>

                {/* Range */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Product Range
                  </label>
                  <select
                    value={formData.range}
                    onChange={(e) => setFormData({ ...formData, range: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary font-medium"
                  >
                    <option value="ST">Centauro ST (Sport Touring)</option>
                    <option value="NS">Centauro NS (Super Sport)</option>
                  </select>
                </div>

                {/* Product Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Product Type
                  </label>
                  <input
                    type="text"
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary font-medium"
                    placeholder="tyre"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Position
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary font-medium"
                  >
                    <option value="Front">Front</option>
                    <option value="Rear">Rear</option>
                  </select>
                </div>

                {/* Tyre Specifics: Width, Profile, Rim, Tyre Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary font-mono"
                    placeholder="120"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Profile (%)
                  </label>
                  <input
                    type="number"
                    value={formData.profile}
                    onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary font-mono"
                    placeholder="70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Rim Diameter (inches)
                  </label>
                  <input
                    type="number"
                    value={formData.rim}
                    onChange={(e) => setFormData({ ...formData, rim: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary font-mono"
                    placeholder="17"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Tyre Type Code
                  </label>
                  <input
                    type="text"
                    value={formData.tyre_type}
                    onChange={(e) => setFormData({ ...formData, tyre_type: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary font-medium"
                    placeholder="ST or NS"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Selling Price (ZAR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-primary font-mono font-bold outline-none focus:border-primary"
                    placeholder="1350"
                  />
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white font-mono font-bold outline-none focus:border-primary"
                    placeholder="Leave empty for unverified"
                  />
                </div>

                {/* Stock Verified Checkbox */}
                <div className="flex items-center gap-3 pt-3">
                  <input
                    type="checkbox"
                    id="stock_verified_checkbox"
                    checked={formData.stock_verified}
                    onChange={(e) => setFormData({ ...formData, stock_verified: e.target.checked })}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                  <label htmlFor="stock_verified_checkbox" className="text-xs font-bold uppercase tracking-wider text-neutral-300 cursor-pointer">
                    Stock Verified &amp; Confirmed
                  </label>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-3 pt-3">
                  <input
                    type="checkbox"
                    id="active_checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                  <label htmlFor="active_checkbox" className="text-xs font-bold uppercase tracking-wider text-neutral-300 cursor-pointer">
                    Active on Storefront Catalogue
                  </label>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Description &amp; Key Features
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary"
                    placeholder="Linear progressive turn-in. Exceptional wet evacuation. Long-haul touring comfort."
                  />
                </div>

                {/* Image URL */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Custom Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-primary"
                    placeholder="https://... or leave empty to use bundled high-res tyre photography"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-primary-hover shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving to Supabase..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVENTORY HISTORY AUDIT DRAWER */}
      {historyDrawerProductId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-neutral-900 border-l border-neutral-800 p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-lg bg-primary/20 text-primary">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="font-display text-lg uppercase tracking-tight text-white">Inventory Audit Trail</h3>
                  <p className="text-xs text-neutral-400 font-mono">public.inventory_history</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryDrawerProductId(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {loadingHistory ? (
                <div className="py-12 text-center text-neutral-500">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-primary" />
                  Loading history log...
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-xs">
                  No stock adjustments recorded yet for this product.
                </div>
              ) : (
                historyItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-amber-400">
                        {item.change_type.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-300">
                        Quantity change:{" "}
                        <strong className={item.quantity_change >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {item.quantity_change > 0 ? `+${item.quantity_change}` : item.quantity_change}
                        </strong>
                      </span>
                      <span className="text-xs text-neutral-400">
                        Stock after: <strong className="text-white">{item.quantity_after}</strong>
                      </span>
                    </div>
                    {item.notes && <p className="text-[11px] text-neutral-400 pt-1 italic">{item.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
