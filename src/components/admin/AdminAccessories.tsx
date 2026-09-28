import React, { useState, useEffect, useMemo } from "react";
import {
  Wrench,
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
  History,
  Sparkles,
  ShoppingBag,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import {
  getAdminAccessories,
  createAccessory,
  updateAccessory,
  deleteAccessory,
  deactivateAccessory,
  getAccessoryInventoryHistory,
  subscribeToAccessoriesRealtime,
} from "../../lib/productService";
import type { DbAccessory, InventoryHistoryItem } from "../../types";

const CATEGORY_OPTIONS = [
  "Maintenance & Care",
  "Paddock & Workshop",
  "Crash Protection",
  "Rider Gear",
  "Tyre Warmers & Tech",
  "Luggage & Touring",
  "General Accessories",
];

export function AdminAccessories() {
  const [accessories, setAccessories] = useState<DbAccessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("All");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<DbAccessory | null>(null);

  // Delete Confirmation Modal state
  const [itemToDelete, setItemToDelete] = useState<DbAccessory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    category: "Maintenance & Care",
    price: "450",
    stock_quantity: "5",
    is_verified: true,
    description: "",
    image_url: "",
    active: true,
  });

  // Image Upload / Preview state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<"file" | "url">("file");

  // Inline Quick Stock Edit state
  const [quickStockId, setQuickStockId] = useState<string | null>(null);
  const [quickStockVal, setQuickStockVal] = useState<string>("");
  const [quickStockVerified, setQuickStockVerified] = useState<boolean>(true);

  // Audit History drawer
  const [historyDrawerAccId, setHistoryDrawerAccId] = useState<string | null>(null);
  const [historyDrawerAccName, setHistoryDrawerAccName] = useState<string>("");
  const [historyItems, setHistoryItems] = useState<InventoryHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load accessories from Supabase
  const loadAccessories = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getAdminAccessories();
      setAccessories(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load accessories from Supabase.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccessories();

    // Realtime listener for accessory updates
    const unsubscribe = subscribeToAccessoriesRealtime((payload) => {
      console.log("[AdminAccessories] Realtime event:", payload.eventType);
      loadAccessories();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingAccessory(null);
    setImagePreview(null);
    setImageUploadMode("file");
    setModalError(null);
    setErrorMessage(null);
    setFormData({
      name: "",
      category: "Maintenance & Care",
      price: "450",
      stock_quantity: "5",
      is_verified: true,
      description: "",
      image_url: "",
      active: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (acc: DbAccessory) => {
    setEditingAccessory(acc);
    setImagePreview(acc.image_url || null);
    setImageUploadMode(acc.image_url?.startsWith("data:") ? "file" : "url");
    setModalError(null);
    setErrorMessage(null);
    const isVerified = acc.stock_quantity !== null && acc.stock_quantity !== undefined;
    setFormData({
      name: acc.name,
      category: acc.category || "General Accessories",
      price: String(acc.price),
      stock_quantity: acc.stock_quantity !== null ? String(acc.stock_quantity) : "",
      is_verified: isVerified,
      description: acc.description || "",
      image_url: acc.image_url || "",
      active: acc.active,
    });
    setIsModalOpen(true);
  };

  // Compress & convert selected image file to clean web-optimized base64 data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setModalError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setModalError("Image file exceeds 8MB. Please choose a smaller file.");
      return;
    }

    setImageProcessing(true);
    setModalError(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onload = () => {
        // Optimize dimensions: max 800px width/height while preserving aspect ratio
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setImageProcessing(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // High quality web JPEG compression (0.84)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.84);

        setImagePreview(compressedDataUrl);
        setFormData((prev) => ({ ...prev, image_url: compressedDataUrl }));
        setImageProcessing(false);
      };

      img.onerror = () => {
        setImageProcessing(false);
        setModalError("Could not parse image. Please try another file.");
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      setImageProcessing(false);
      setModalError("Error reading selected file from device.");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: "" }));
  };

  // Save (Create or Update)
  const handleSaveAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("Accessory name is required.");
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setModalError("Please enter a valid price in ZAR.");
      return;
    }

    let finalStockQty: number | null = null;
    if (formData.is_verified) {
      const qtyNum = parseInt(formData.stock_quantity, 10);
      finalStockQty = isNaN(qtyNum) ? 0 : Math.max(0, qtyNum);
    }

    setSaving(true);
    setModalError(null);
    setErrorMessage(null);

    try {
      if (editingAccessory) {
        // Update existing accessory
        const previousStock = editingAccessory.stock_quantity;
        const updated = await updateAccessory(
          editingAccessory.id,
          {
            name: formData.name,
            category: formData.category,
            price: priceNum,
            stock_quantity: finalStockQty,
            description: formData.description || null,
            image_url: formData.image_url || null,
            active: formData.active,
          },
          previousStock
        );

        setAccessories((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        showSuccess(`Updated "${updated.name}" successfully.`);
      } else {
        // Create new accessory
        const created = await createAccessory({
          name: formData.name,
          category: formData.category,
          price: priceNum,
          stock_quantity: finalStockQty,
          description: formData.description || null,
          image_url: formData.image_url || null,
          active: formData.active,
        });

        setAccessories((prev) => [created, ...prev]);
        showSuccess(`Added "${created.name}" to accessories catalogue.`);
      }

      setModalError(null);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save accessory.";
      setModalError(msg);
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (acc: DbAccessory) => {
    setItemToDelete(acc);
    setDeleteError(null);
  };

  // Execute confirmed permanent deletion
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccessory(itemToDelete.id);
      setAccessories((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      showSuccess(`"${itemToDelete.name}" has been permanently removed.`);
      setItemToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete accessory.";
      setDeleteError(msg);
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle active / soft-delete
  const handleToggleActive = async (acc: DbAccessory) => {
    const nextState = !acc.active;
    const actionWord = nextState ? "activate" : "deactivate";

    try {
      const updated = await updateAccessory(acc.id, { active: nextState });
      setAccessories((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      showSuccess(
        `"${acc.name}" has been ${nextState ? "activated" : "deactivated (hidden from store)"}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${actionWord} accessory.`;
      setErrorMessage(msg);
    }
  };

  // Quick inline stock save
  const handleSaveQuickStock = async (acc: DbAccessory) => {
    let newQty: number | null = null;
    if (quickStockVerified) {
      const parsed = parseInt(quickStockVal, 10);
      newQty = isNaN(parsed) ? 0 : Math.max(0, parsed);
    }

    try {
      const updated = await updateAccessory(
        acc.id,
        { stock_quantity: newQty },
        acc.stock_quantity
      );
      setAccessories((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setQuickStockId(null);
      showSuccess(`Updated stock for "${acc.name}".`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update stock.";
      setErrorMessage(msg);
    }
  };

  // Open Inventory Audit History drawer
  const handleOpenHistoryDrawer = async (acc: DbAccessory) => {
    setHistoryDrawerAccId(acc.id);
    setHistoryDrawerAccName(acc.name);
    setLoadingHistory(true);
    try {
      const history = await getAccessoryInventoryHistory(acc.id);
      setHistoryItems(history);
    } catch (err) {
      console.warn("Error fetching history:", err);
      setHistoryItems([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filtered & Searched Accessories
  const filteredAccessories = useMemo(() => {
    return accessories.filter((item) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCategory = (item.category || "").toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDesc) return false;
      }

      // Category filter
      if (categoryFilter !== "All" && item.category !== categoryFilter) {
        return false;
      }

      // Stock Status filter
      if (stockStatusFilter === "In Stock") {
        if (item.stock_quantity === null || item.stock_quantity <= 0 || !item.active) return false;
      } else if (stockStatusFilter === "Out of Stock") {
        if (item.stock_quantity === null || item.stock_quantity > 0 || !item.active) return false;
      } else if (stockStatusFilter === "Unverified") {
        if (item.stock_quantity !== null || !item.active) return false;
      } else if (stockStatusFilter === "Inactive") {
        if (item.active) return false;
      }

      return true;
    });
  }, [accessories, searchQuery, categoryFilter, stockStatusFilter]);

  // Inventory Metrics
  const stats = useMemo(() => {
    const total = accessories.length;
    const active = accessories.filter((a) => a.active).length;
    const inStock = accessories.filter((a) => a.active && a.stock_quantity !== null && a.stock_quantity > 0).length;
    const outOfStock = accessories.filter((a) => a.active && a.stock_quantity === 0).length;
    const unverified = accessories.filter((a) => a.active && a.stock_quantity === null).length;
    return { total, active, inStock, outOfStock, unverified };
  }, [accessories]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Accessory Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display uppercase tracking-tight text-white mt-1">
            Motorcycle Accessories
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Manage paddock equipment, maintenance supplies, crash protection, and workshop accessories. Live updates synchronize directly to the customer storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAccessories}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:border-neutral-700 transition cursor-pointer"
            title="Refresh accessories from database"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition shadow-lg cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Accessory</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/80 p-4 text-xs text-red-200 flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error Processing Request</p>
              <p className="text-red-300 mt-0.5 whitespace-pre-wrap">{errorMessage}</p>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/80 p-4 text-xs text-emerald-200 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <p className="font-semibold">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Total Items</span>
          <span className="text-2xl font-display font-black text-white mt-1 block">{stats.total}</span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">In Stock</span>
          <span className="text-2xl font-display font-black text-emerald-400 mt-1 block">{stats.inStock}</span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block">Out of Stock</span>
          <span className="text-2xl font-display font-black text-red-400 mt-1 block">{stats.outOfStock}</span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">Unverified</span>
          <span className="text-2xl font-display font-black text-amber-400 mt-1 block">{stats.unverified}</span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Active Status</span>
          <span className="text-2xl font-display font-black text-primary mt-1 block">{stats.active} Active</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by accessory name, category, or keyword..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-primary focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-primary focus:outline-none"
          >
            <option value="All">All Categories</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-primary focus:outline-none"
          >
            <option value="All">All Stock Statuses</option>
            <option value="In Stock">In Stock (&gt; 0)</option>
            <option value="Out of Stock">Out of Stock (0)</option>
            <option value="Unverified">Unverified</option>
            <option value="Inactive">Inactive / Hidden</option>
          </select>
        </div>
      </div>

      {/* Accessories Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw size={28} className="animate-spin text-primary mx-auto mb-3" />
            <p className="text-xs text-neutral-400 font-mono">Loading accessories from Supabase...</p>
          </div>
        ) : filteredAccessories.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="size-14 rounded-2xl bg-neutral-800/60 grid place-items-center text-neutral-500 mx-auto mb-3">
              <ShoppingBag size={24} />
            </div>
            <h3 className="font-display text-lg uppercase text-white">No Accessories Found</h3>
            <p className="text-xs text-neutral-400 mt-1">
              {accessories.length === 0
                ? "Your accessories table in Supabase is currently empty. Click 'Add Accessory' above to add your first workshop item."
                : "No accessories match your current search and filter criteria."}
            </p>
            {accessories.length === 0 && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition cursor-pointer"
              >
                <Plus size={14} /> Add First Accessory
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-3.5">Accessory / Item</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price (ZAR)</th>
                  <th className="px-4 py-3.5">Stock Status</th>
                  <th className="px-4 py-3.5">Active</th>
                  <th className="px-4 py-3.5">Last Updated</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredAccessories.map((acc) => {
                  const isVerified = acc.stock_quantity !== null && acc.stock_quantity !== undefined;
                  const stockQty = acc.stock_quantity ?? 0;
                  const isQuickEditing = quickStockId === acc.id;

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-neutral-800/40 transition-colors ${
                        !acc.active ? "opacity-60 bg-neutral-950/30" : ""
                      }`}
                    >
                      {/* Name & Details */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {acc.image_url ? (
                            <img
                              src={acc.image_url}
                              alt=""
                              className="size-10 rounded-lg object-cover bg-neutral-950 border border-neutral-800 shrink-0"
                            />
                          ) : (
                            <div className="size-10 rounded-lg bg-neutral-950 border border-neutral-800 grid place-items-center text-neutral-500 shrink-0">
                              <Wrench size={16} />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white text-sm block leading-snug">
                              {acc.name}
                            </span>
                            {acc.description && (
                              <span className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                                {acc.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-800/80 px-2 py-1 text-[10px] font-bold text-neutral-300">
                          <Tag size={10} className="text-primary" />
                          <span>{acc.category || "General"}</span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 font-display text-sm font-bold text-primary">
                        R{acc.price.toLocaleString("en-ZA")}.00
                      </td>

                      {/* Stock Status & Quick Edit */}
                      <td className="px-4 py-3.5">
                        {isQuickEditing ? (
                          <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-neutral-950 border border-neutral-700 animate-in fade-in">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                disabled={!quickStockVerified}
                                value={quickStockVal}
                                onChange={(e) => setQuickStockVal(e.target.value)}
                                className="w-16 rounded bg-neutral-900 border border-neutral-700 px-2 py-1 text-xs text-white disabled:opacity-40"
                                placeholder="Qty"
                              />
                              <button
                                onClick={() => handleSaveQuickStock(acc)}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setQuickStockId(null)}
                                className="px-1.5 py-1 rounded bg-neutral-800 text-neutral-400 hover:text-white text-[10px] cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                            <label className="flex items-center gap-1.5 text-[10px] text-neutral-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={quickStockVerified}
                                onChange={(e) => setQuickStockVerified(e.target.checked)}
                                className="accent-primary size-3"
                              />
                              <span>Verified stock</span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {!isVerified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-300">
                                <AlertTriangle size={11} /> Stock Not Verified
                              </span>
                            ) : stockQty === 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-[10px] font-bold uppercase text-red-400">
                                <XCircle size={11} /> Out of Stock (0)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-400">
                                <CheckCircle2 size={11} /> In Stock ({stockQty})
                              </span>
                            )}

                            <button
                              onClick={() => {
                                setQuickStockId(acc.id);
                                setQuickStockVal(acc.stock_quantity !== null ? String(acc.stock_quantity) : "");
                                setQuickStockVerified(isVerified);
                              }}
                              className="text-neutral-500 hover:text-primary p-1 cursor-pointer transition"
                              title="Quick stock update"
                            >
                              <Boxes size={14} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleActive(acc)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition ${
                            acc.active
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700"
                          }`}
                          title="Click to toggle active state"
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              acc.active ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                            }`}
                          />
                          <span>{acc.active ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Updated Date */}
                      <td className="px-4 py-3.5 text-neutral-400 font-mono text-[11px]">
                        {acc.updated_at
                          ? new Date(acc.updated_at).toLocaleDateString("en-ZA", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenHistoryDrawer(acc)}
                            className="rounded-lg bg-neutral-800/80 hover:bg-neutral-700 p-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
                            title="View inventory audit trail"
                          >
                            <History size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(acc)}
                            className="rounded-lg bg-neutral-800/80 hover:bg-neutral-700 p-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
                            title="Edit accessory"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(acc)}
                            className="rounded-lg bg-neutral-800/80 hover:bg-red-950/80 p-1.5 text-neutral-400 hover:text-red-400 transition cursor-pointer"
                            title="Delete accessory"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/20 border border-primary/30 grid place-items-center text-primary">
                  <Wrench size={16} />
                </div>
                <div>
                  <h3 className="font-display text-base uppercase text-white">
                    {editingAccessory ? "Edit Accessory" : "Add New Accessory"}
                  </h3>
                  <span className="text-[10px] text-neutral-400">Supabase accessories table</span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAccessory} className="p-6 space-y-4">
              {/* Modal Error Alert Banner */}
              {modalError && (
                <div className="rounded-xl border border-red-500/50 bg-red-950/90 p-3.5 text-xs text-red-200 flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-red-300 block">Unable to Save Accessory</span>
                      <span className="text-[11px] text-red-200 whitespace-pre-wrap">{modalError}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalError(null)}
                    className="text-red-400 hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                  Accessory Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Motul Chain Care Kit or Front Paddock Stand"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                    Price (ZAR) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="450"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Stock Management Box */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                    <Boxes size={13} className="text-primary" />
                    <span>Warehouse Inventory &amp; Stock</span>
                  </span>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.is_verified}
                      onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                      className="accent-primary size-3.5"
                    />
                    <span className="font-semibold text-neutral-300">Stock Verified</span>
                  </label>
                </div>

                {formData.is_verified ? (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                      Available Quantity in Selby *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      placeholder="e.g. 5"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white font-mono focus:border-primary focus:outline-none"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">
                      Setting 0 will display "OUT OF STOCK". Numbers &gt; 0 will show "IN STOCK".
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-[11px] text-amber-300">
                    Stock is unverified (null). Customer storefront will mark item as "STOCK NOT VERIFIED" and require confirmation prior to checkout.
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                  Description / Specifications
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Universal rear paddock stand with heavy-duty rollers and protective rubber mounts."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white placeholder-neutral-600 focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* Accessory Image: File Upload from device or URL */}
              <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <ImageIcon size={13} className="text-primary" />
                    <span>Accessory Product Photo</span>
                  </label>
                  <div className="flex items-center gap-1 rounded-lg bg-neutral-900 p-0.5 border border-neutral-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setImageUploadMode("file")}
                      className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                        imageUploadMode === "file"
                          ? "bg-primary text-white"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode("url")}
                      className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                        imageUploadMode === "url"
                          ? "bg-primary text-white"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Paste URL
                    </button>
                  </div>
                </div>

                {/* Live Preview if available */}
                {imagePreview ? (
                  <div className="relative rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center gap-3 p-2.5">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="size-16 rounded-lg object-cover bg-neutral-950 border border-neutral-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white block">Image Selected &amp; Ready</span>
                      <span className="text-[10px] text-emerald-400 font-semibold block">
                        Will display on storefront accessory card
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-700 hover:border-red-800/60 transition cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null}

                {/* File picker input */}
                {imageUploadMode === "file" ? (
                  <div>
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-800 hover:border-primary/60 bg-neutral-950 p-4 cursor-pointer transition-colors group">
                      <div className="size-9 rounded-full bg-neutral-900 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary grid place-items-center transition-colors">
                        {imageProcessing ? (
                          <RefreshCw size={16} className="animate-spin text-primary" />
                        ) : (
                          <Upload size={16} />
                        )}
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold text-white block">
                          {imageProcessing ? "Processing photo..." : "Upload photo from your device"}
                        </span>
                        <span className="text-[10px] text-neutral-500 block mt-0.5">
                          Click to browse phone gallery or computer library (JPEG, PNG, WebP)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileChange}
                        disabled={imageProcessing}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, image_url: val });
                        setImagePreview(val.trim() || null);
                      }}
                      placeholder="https://images.example.com/item.jpg"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Direct HTTPS link to image hosted on cloud or manufacturer CDN.
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="accent-primary size-4"
                  />
                  <div>
                    <span className="font-bold text-white block">Active in Storefront Catalogue</span>
                    <span className="text-[10px] text-neutral-400 block">
                      Uncheck to soft-delete / hide from customers without affecting past orders.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="border-t border-neutral-800 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-800 text-xs font-bold uppercase text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-xs font-bold uppercase text-white hover:bg-primary-hover transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{editingAccessory ? "Save Changes" : "Create Accessory"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVENTORY AUDIT HISTORY DRAWER */}
      {historyDrawerAccId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-950/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 flex flex-col h-full animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 p-5 bg-neutral-950">
              <div className="flex items-center gap-2">
                <History size={18} className="text-primary" />
                <div>
                  <h3 className="font-display text-base uppercase text-white">Stock Audit Trail</h3>
                  <span className="text-[11px] text-neutral-400 font-mono line-clamp-1">
                    {historyDrawerAccName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setHistoryDrawerAccId(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingHistory ? (
                <div className="text-center py-12">
                  <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-2" />
                  <p className="text-xs text-neutral-400 font-mono">Fetching inventory history logs...</p>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  No stock adjustment logs recorded for this accessory yet.
                </div>
              ) : (
                historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                        {item.change_type.replace("_", " ")}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          item.quantity_change > 0
                            ? "text-emerald-400"
                            : item.quantity_change < 0
                            ? "text-red-400"
                            : "text-neutral-400"
                        }`}
                      >
                        {item.quantity_change > 0 ? `+${item.quantity_change}` : item.quantity_change}
                      </span>
                    </div>
                    {item.notes && <p className="text-xs text-neutral-300">{item.notes}</p>}
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-800/60">
                      <span>Stock after: {item.quantity_after}</span>
                      <span>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("en-ZA")
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight font-display">
                  Delete Accessory
                </h3>
                <p className="text-xs text-neutral-400">
                  Are you sure you want to permanently delete this item?
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3.5 space-y-1.5 text-xs">
              <div className="font-semibold text-white text-sm">{itemToDelete.name}</div>
              <div className="text-neutral-400 flex items-center gap-2">
                <span>{itemToDelete.category}</span>
                <span>•</span>
                <span className="text-primary font-bold">R{itemToDelete.price.toLocaleString("en-ZA")}</span>
                <span>•</span>
                <span>Stock: {itemToDelete.stock_quantity ?? "Unverified"}</span>
              </div>
            </div>

            <p className="text-xs text-amber-300/90 leading-relaxed bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-lg">
              ⚠️ This will remove the accessory from Supabase and the storefront catalogue. Past order history records will remain intact.
            </p>

            {deleteError && (
              <div className="rounded-xl border border-red-500/50 bg-red-950/80 p-3 text-xs text-red-200">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setItemToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-neutral-800 text-xs font-bold uppercase text-neutral-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
