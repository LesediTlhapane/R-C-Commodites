import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
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
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  getAdminCombos,
  createCombo,
  updateCombo,
  updateComboStock,
  deactivateCombo,
  getAdminProducts,
  subscribeToCombosRealtime,
  mapDbProductToTyre,
} from "../../lib/productService";
import type { DbCombo, DbProduct, TyreProduct } from "../../types";

export function AdminCombos() {
  const [combos, setCombos] = useState<DbCombo[]>([]);
  const [products, setProducts] = useState<TyreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState<string>("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("All");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<DbCombo | null>(null);

  // Dedicated Stock Adjustment Modal state
  const [stockAdjustCombo, setStockAdjustCombo] = useState<DbCombo | null>(null);
  const [targetSetsInput, setTargetSetsInput] = useState<string>("0");
  const [frontStockInput, setFrontStockInput] = useState<string>("0");
  const [rearStockInput, setRearStockInput] = useState<string>("0");
  const [stockModalError, setStockModalError] = useState<string | null>(null);
  const [savingStock, setSavingStock] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    front_product_id: "",
    rear_product_id: "",
    regular_price: "",
    combo_price: "",
    savings: "",
    description: "",
    active: true,
  });

  // Map of products by ID for fast lookup
  const productsMap = useMemo(() => {
    const map = new Map<string, TyreProduct>();
    products.forEach((p) => {
      map.set(String(p.id), p);
      if (p.supabaseId) map.set(p.supabaseId, p);
    });
    return map;
  }, [products]);

  // Front tyres and Rear tyres filtered for selection dropdowns
  const frontTyres = useMemo(() => {
    return products.filter((p) => p.position === "Front");
  }, [products]);

  const rearTyres = useMemo(() => {
    return products.filter((p) => p.position === "Rear");
  }, [products]);

  // Load all data from Supabase
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [combosData, dbProducts] = await Promise.all([
        getAdminCombos(),
        getAdminProducts(),
      ]);
      setCombos(combosData);
      setProducts(dbProducts.map(mapDbProductToTyre));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load combo management data.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates on combos
    const unsubscribe = subscribeToCombosRealtime((payload) => {
      console.log("[AdminCombos] Realtime event on combos:", payload.eventType);
      loadData();
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
    setEditingCombo(null);
    const defaultFront = frontTyres[0]?.supabaseId || frontTyres[0]?.id || "";
    const defaultRear = rearTyres[0]?.supabaseId || rearTyres[0]?.id || "";

    const frontObj = productsMap.get(String(defaultFront));
    const rearObj = productsMap.get(String(defaultRear));
    const regPrice = (frontObj?.price || 0) + (rearObj?.price || 0);
    const comboPrice = regPrice > 0 ? Math.round(regPrice * 0.88) : 0;
    const savings = Math.max(0, regPrice - comboPrice);

    const suggestedName =
      frontObj && rearObj
        ? `${frontObj.size} ${frontObj.range} + ${rearObj.size} ${rearObj.range} Combo`
        : "";

    setFormData({
      name: suggestedName,
      front_product_id: String(defaultFront),
      rear_product_id: String(defaultRear),
      regular_price: regPrice > 0 ? String(regPrice) : "",
      combo_price: comboPrice > 0 ? String(comboPrice) : "",
      savings: savings > 0 ? String(savings) : "",
      description: "Official factory-matched front and rear tyre pair.",
      active: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (combo: DbCombo) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      front_product_id: combo.front_product_id,
      rear_product_id: combo.rear_product_id,
      regular_price: String(combo.regular_price),
      combo_price: String(combo.combo_price),
      savings: String(combo.savings),
      description: combo.description || "",
      active: combo.active,
    });
    setIsModalOpen(true);
  };

  // Handle tyre selection change in create/edit form
  const handleFrontChange = (productId: string) => {
    const frontObj = productsMap.get(productId);
    const rearObj = productsMap.get(formData.rear_product_id);
    const regPrice = (frontObj?.price || 0) + (rearObj?.price || 0);
    const currentComboPrice = parseFloat(formData.combo_price) || Math.round(regPrice * 0.88);
    const savings = Math.max(0, regPrice - currentComboPrice);

    let name = formData.name;
    if (!editingCombo && frontObj && rearObj) {
      name = `${frontObj.size} ${frontObj.range} + ${rearObj.size} ${rearObj.range} Combo`;
    }

    setFormData({
      ...formData,
      front_product_id: productId,
      regular_price: String(regPrice),
      savings: String(savings),
      name,
    });
  };

  const handleRearChange = (productId: string) => {
    const frontObj = productsMap.get(formData.front_product_id);
    const rearObj = productsMap.get(productId);
    const regPrice = (frontObj?.price || 0) + (rearObj?.price || 0);
    const currentComboPrice = parseFloat(formData.combo_price) || Math.round(regPrice * 0.88);
    const savings = Math.max(0, regPrice - currentComboPrice);

    let name = formData.name;
    if (!editingCombo && frontObj && rearObj) {
      name = `${frontObj.size} ${frontObj.range} + ${rearObj.size} ${rearObj.range} Combo`;
    }

    setFormData({
      ...formData,
      rear_product_id: productId,
      regular_price: String(regPrice),
      savings: String(savings),
      name,
    });
  };

  const handleComboPriceChange = (priceVal: string) => {
    const comboPriceNum = parseFloat(priceVal) || 0;
    const regPriceNum = parseFloat(formData.regular_price) || 0;
    const savings = Math.max(0, regPriceNum - comboPriceNum);

    setFormData({
      ...formData,
      combo_price: priceVal,
      savings: String(savings),
    });
  };

  // Save (Create or Update)
  const handleSaveCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage("Combo name is required.");
      return;
    }
    if (!formData.front_product_id || !formData.rear_product_id) {
      setErrorMessage("Please select both a front tyre and a rear tyre.");
      return;
    }

    const regPrice = parseFloat(formData.regular_price);
    const comboPrice = parseFloat(formData.combo_price);
    if (isNaN(regPrice) || isNaN(comboPrice) || comboPrice <= 0) {
      setErrorMessage("Please enter valid prices in ZAR.");
      return;
    }

    const savings = Math.max(0, regPrice - comboPrice);

    setSaving(true);
    setErrorMessage(null);

    try {
      if (editingCombo) {
        const updated = await updateCombo(editingCombo.id, {
          name: formData.name,
          front_product_id: formData.front_product_id,
          rear_product_id: formData.rear_product_id,
          regular_price: regPrice,
          combo_price: comboPrice,
          savings,
          description: formData.description || null,
          active: formData.active,
        });

        setCombos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showSuccess(`Updated "${updated.name}" successfully.`);
      } else {
        const created = await createCombo({
          name: formData.name,
          front_product_id: formData.front_product_id,
          rear_product_id: formData.rear_product_id,
          regular_price: regPrice,
          combo_price: comboPrice,
          savings,
          description: formData.description || null,
          active: formData.active,
        });

        setCombos((prev) => [created, ...prev]);
        showSuccess(`Created "${created.name}" combo successfully.`);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save combo.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  // Open dedicated Stock Adjustment Modal
  const handleOpenStockModal = (combo: DbCombo) => {
    setStockAdjustCombo(combo);
    setStockModalError(null);

    const front = productsMap.get(combo.front_product_id);
    const rear = productsMap.get(combo.rear_product_id);

    const fStock = front?.stockQuantity !== null && front?.stockQuantity !== undefined ? front.stockQuantity : 0;
    const rStock = rear?.stockQuantity !== null && rear?.stockQuantity !== undefined ? rear.stockQuantity : 0;
    const available = Math.min(fStock, rStock);

    setFrontStockInput(String(fStock));
    setRearStockInput(String(rStock));
    setTargetSetsInput(String(available));
  };

  // Save stock adjustment to Supabase
  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustCombo) return;

    const parsedSets = parseInt(targetSetsInput, 10);
    const parsedFront = parseInt(frontStockInput, 10);
    const parsedRear = parseInt(rearStockInput, 10);

    if (isNaN(parsedSets) || parsedSets < 0) {
      setStockModalError("Target combo sets must be a non-negative integer (0 or greater).");
      return;
    }
    if (isNaN(parsedFront) || parsedFront < 0) {
      setStockModalError("Front tyre stock must be a non-negative integer (0 or greater).");
      return;
    }
    if (isNaN(parsedRear) || parsedRear < 0) {
      setStockModalError("Rear tyre stock must be a non-negative integer (0 or greater).");
      return;
    }

    setSavingStock(true);
    setStockModalError(null);

    try {
      const res = await updateComboStock(stockAdjustCombo.id, parsedSets, {
        frontStock: parsedFront,
        rearStock: parsedRear,
      });

      // Update local products cache with new stock values
      const updatedFrontTyre = mapDbProductToTyre(res.frontProduct);
      const updatedRearTyre = mapDbProductToTyre(res.rearProduct);

      setProducts((prev) =>
        prev.map((p) => {
          if (String(p.id) === String(updatedFrontTyre.id) || p.supabaseId === updatedFrontTyre.supabaseId) {
            return updatedFrontTyre;
          }
          if (String(p.id) === String(updatedRearTyre.id) || p.supabaseId === updatedRearTyre.supabaseId) {
            return updatedRearTyre;
          }
          return p;
        })
      );

      showSuccess(
        `Updated stock for "${stockAdjustCombo.name}": Front ${parsedFront}, Rear ${parsedRear} (${res.availableSets} available sets).`
      );
      setStockAdjustCombo(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to adjust combo stock.";
      setStockModalError(msg);
      setErrorMessage(msg);
    } finally {
      setSavingStock(false);
    }
  };

  // Toggle active / soft-delete
  const handleToggleActive = async (combo: DbCombo) => {
    const nextState = !combo.active;
    const action = nextState ? "activate" : "deactivate";

    try {
      const updated = await updateCombo(combo.id, { active: nextState });
      setCombos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showSuccess(
        `"${combo.name}" has been ${nextState ? "activated" : "deactivated (hidden from store)"}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${action} combo.`;
      setErrorMessage(msg);
    }
  };

  // Helper to determine component tyre stock status
  const evaluateComboAvailability = (combo: DbCombo) => {
    const front = productsMap.get(combo.front_product_id);
    const rear = productsMap.get(combo.rear_product_id);

    if (!front || !rear) {
      return {
        status: "Missing Components",
        badgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
        availableSets: 0,
        frontStock: 0,
        rearStock: 0,
        canPurchase: false,
      };
    }

    if (!front.active || !rear.active) {
      return {
        status: "Inactive Component",
        badgeColor: "bg-neutral-800 text-neutral-400 border-neutral-700",
        availableSets: 0,
        frontStock: front.stockQuantity ?? 0,
        rearStock: rear.stockQuantity ?? 0,
        canPurchase: false,
      };
    }

    if (!front.stockVerified || !rear.stockVerified) {
      return {
        status: "Stock Not Verified",
        badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        availableSets: 0,
        frontStock: front.stockQuantity ?? 0,
        rearStock: rear.stockQuantity ?? 0,
        canPurchase: false,
      };
    }

    const frontQty = front.stockQuantity ?? 0;
    const rearQty = rear.stockQuantity ?? 0;
    const availableSets = Math.min(frontQty, rearQty);

    if (availableSets <= 0) {
      return {
        status: "Out of Stock (0)",
        badgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
        availableSets: 0,
        frontStock: frontQty,
        rearStock: rearQty,
        canPurchase: false,
      };
    }

    return {
      status: `In Stock (${availableSets} Sets)`,
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      availableSets,
      frontStock: frontQty,
      rearStock: rearQty,
      canPurchase: true,
    };
  };

  // Filtered Combos
  const filteredCombos = useMemo(() => {
    return combos.filter((combo) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = combo.name.toLowerCase().includes(q);
        const matchesDesc = (combo.description || "").toLowerCase().includes(q);
        const front = productsMap.get(combo.front_product_id);
        const rear = productsMap.get(combo.rear_product_id);
        const matchesFront = front ? front.name.toLowerCase().includes(q) : false;
        const matchesRear = rear ? rear.name.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesDesc && !matchesFront && !matchesRear) return false;
      }

      // Range Filter (NS / ST)
      if (rangeFilter !== "All") {
        if (!combo.name.includes(rangeFilter)) return false;
      }

      // Availability Filter
      const avail = evaluateComboAvailability(combo);
      if (availabilityFilter === "In Stock" && !avail.canPurchase) return false;
      if (availabilityFilter === "Out of Stock" && avail.status !== "Out of Stock (0)") return false;
      if (availabilityFilter === "Unverified" && avail.status !== "Stock Not Verified") return false;
      if (availabilityFilter === "Inactive" && combo.active) return false;

      return true;
    });
  }, [combos, searchQuery, rangeFilter, availabilityFilter, productsMap]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Tyre Bundles &amp; Pairs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display uppercase tracking-tight text-white mt-1">
            Combo Management
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Configure matched Front + Rear tyre packages with bundle discounts. Stock is automatically evaluated from component tyre inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:border-neutral-700 transition cursor-pointer"
            title="Refresh combos"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition shadow-lg cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Combo</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Total Combos</span>
          <span className="text-2xl font-display font-black text-white mt-1 block">{combos.length}</span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">Active Bundles</span>
          <span className="text-2xl font-display font-black text-emerald-400 mt-1 block">
            {combos.filter((c) => c.active).length}
          </span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">Available for Sale</span>
          <span className="text-2xl font-display font-black text-primary mt-1 block">
            {combos.filter((c) => c.active && evaluateComboAvailability(c).canPurchase).length}
          </span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">Catalogue Tyres</span>
          <span className="text-2xl font-display font-black text-amber-400 mt-1 block">{products.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by combo name, tyre sizes (e.g. 180/55), or range..."
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
          <select
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-primary focus:outline-none"
          >
            <option value="All">All Ranges</option>
            <option value="ST">Centauro ST</option>
            <option value="NS">Centauro NS</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 focus:border-primary focus:outline-none"
          >
            <option value="All">All Availabilities</option>
            <option value="In Stock">In Stock (Both Tyres)</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Unverified">Unverified</option>
            <option value="Inactive">Inactive / Hidden</option>
          </select>
        </div>
      </div>

      {/* Combos Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw size={28} className="animate-spin text-primary mx-auto mb-3" />
            <p className="text-xs text-neutral-400 font-mono">Loading tyre combos from Supabase...</p>
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="size-14 rounded-2xl bg-neutral-800/60 grid place-items-center text-neutral-500 mx-auto mb-3">
              <Layers size={24} />
            </div>
            <h3 className="font-display text-lg uppercase text-white">No Combos Found</h3>
            <p className="text-xs text-neutral-400 mt-1">
              {combos.length === 0
                ? "No tyre combos currently configured in Supabase. Click 'Create Combo' to set up your first bundle pair."
                : "No combos match your current search and filter filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-3.5">Combo Bundle</th>
                  <th className="px-4 py-3.5">Front Tyre Component</th>
                  <th className="px-4 py-3.5">Rear Tyre Component</th>
                  <th className="px-4 py-3.5">Pricing &amp; Savings</th>
                  <th className="px-4 py-3.5">Availability</th>
                  <th className="px-4 py-3.5">Active</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredCombos.map((combo) => {
                  const front = productsMap.get(combo.front_product_id);
                  const rear = productsMap.get(combo.rear_product_id);
                  const avail = evaluateComboAvailability(combo);

                  return (
                    <tr
                      key={combo.id}
                      className={`hover:bg-neutral-800/40 transition-colors ${
                        !combo.active ? "opacity-60 bg-neutral-950/30" : ""
                      }`}
                    >
                      {/* Combo Details */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-neutral-950 border border-neutral-800 grid place-items-center text-primary shrink-0">
                            <Layers size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block leading-snug">
                              {combo.name}
                            </span>
                            {combo.description && (
                              <span className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                                {combo.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Front Component */}
                      <td className="px-4 py-3.5">
                        {front ? (
                          <div>
                            <span className="font-bold text-white block">{front.size}</span>
                            <span className="text-[10px] text-neutral-400">
                              {front.name} • R{front.price} (Stock: {front.stockQuantity ?? "Unverified"})
                            </span>
                          </div>
                        ) : (
                          <span className="text-red-400 font-bold text-[11px]">Tyre not found</span>
                        )}
                      </td>

                      {/* Rear Component */}
                      <td className="px-4 py-3.5">
                        {rear ? (
                          <div>
                            <span className="font-bold text-white block">{rear.size}</span>
                            <span className="text-[10px] text-neutral-400">
                              {rear.name} • R{rear.price} (Stock: {rear.stockQuantity ?? "Unverified"})
                            </span>
                          </div>
                        ) : (
                          <span className="text-red-400 font-bold text-[11px]">Tyre not found</span>
                        )}
                      </td>

                      {/* Pricing & Savings */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-display text-sm font-bold text-primary">
                              R{combo.combo_price.toLocaleString("en-ZA")}.00
                            </span>
                            <span className="text-[11px] text-neutral-500 line-through">
                              R{combo.regular_price.toLocaleString("en-ZA")}.00
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            Save R{combo.savings.toLocaleString("en-ZA")}.00
                          </span>
                        </div>
                      </td>

                      {/* Availability & Stock */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${avail.badgeColor}`}
                          >
                            {avail.canPurchase ? (
                              <CheckCircle2 size={11} />
                            ) : avail.status.includes("Unverified") ? (
                              <AlertTriangle size={11} />
                            ) : (
                              <XCircle size={11} />
                            )}
                            <span>{avail.status}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenStockModal(combo)}
                            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover font-bold uppercase tracking-wider cursor-pointer transition hover:underline"
                            title="Adjust front & rear component stock for this combo"
                          >
                            <Boxes size={11} />
                            <span>Adjust Stock</span>
                          </button>
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleActive(combo)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition ${
                            combo.active
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700"
                          }`}
                          title="Click to toggle active state"
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              combo.active ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                            }`}
                          />
                          <span>{combo.active ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenStockModal(combo)}
                            className="rounded-lg bg-neutral-800/80 hover:bg-primary/20 hover:text-primary p-1.5 text-neutral-300 transition cursor-pointer"
                            title="Adjust combo stock"
                          >
                            <Boxes size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(combo)}
                            className="rounded-lg bg-neutral-800/80 hover:bg-neutral-700 p-1.5 text-neutral-300 hover:text-white transition cursor-pointer"
                            title="Edit combo"
                          >
                            <Edit2 size={13} />
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

      {/* CREATE / EDIT COMBO MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/20 border border-primary/30 grid place-items-center text-primary">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="font-display text-base uppercase text-white">
                    {editingCombo ? "Edit Tyre Combo" : "Create New Tyre Combo"}
                  </h3>
                  <span className="text-[10px] text-neutral-400">Supabase combos table</span>
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
            <form onSubmit={handleSaveCombo} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                  Combo Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 120/70/17 ST + 180/55/17 ST Combo"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                />
              </div>

              {/* Tyre Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/60">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                    Front Tyre Component *
                  </label>
                  <select
                    required
                    value={formData.front_product_id}
                    onChange={(e) => handleFrontChange(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  >
                    <option value="" disabled>Select Front Tyre</option>
                    {frontTyres.map((p) => {
                      const idVal = p.supabaseId || String(p.id);
                      return (
                        <option key={idVal} value={idVal}>
                          {p.size} {p.range} — R{p.price} ({p.stockQuantity ?? 0} in stock)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                    Rear Tyre Component *
                  </label>
                  <select
                    required
                    value={formData.rear_product_id}
                    onChange={(e) => handleRearChange(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                  >
                    <option value="" disabled>Select Rear Tyre</option>
                    {rearTyres.map((p) => {
                      const idVal = p.supabaseId || String(p.id);
                      return (
                        <option key={idVal} value={idVal}>
                          {p.size} {p.range} — R{p.price} ({p.stockQuantity ?? 0} in stock)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/60">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Regular Price (ZAR)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={formData.regular_price}
                    onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-300 font-mono focus:border-primary focus:outline-none"
                  />
                  <span className="text-[9px] text-neutral-500 mt-0.5 block">Front + Rear Sum</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                    Combo Price (ZAR) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={formData.combo_price}
                    onChange={(e) => handleComboPriceChange(e.target.value)}
                    placeholder="2940"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white font-mono focus:border-primary focus:outline-none font-bold"
                  />
                  <span className="text-[9px] text-primary mt-0.5 block">Customer Price</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Savings (ZAR)
                  </label>
                  <input
                    type="number"
                    step="1"
                    readOnly
                    value={formData.savings}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none cursor-default"
                  />
                  <span className="text-[9px] text-emerald-500/80 mt-0.5 block">Auto-calculated</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block mb-1">
                  Description / Application Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. The ideal matched pair for standard sport tourers and 600cc-900cc naked roadsters."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white placeholder-neutral-600 focus:border-primary focus:outline-none resize-none"
                />
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
                    <span className="font-bold text-white block">Active in Storefront</span>
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
                  <span>{editingCombo ? "Save Combo" : "Create Combo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED ADJUST COMBO STOCK MODAL */}
      {stockAdjustCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                  <Boxes size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight font-display">
                    Adjust Combo Stock
                  </h3>
                  <p className="text-xs text-neutral-400 truncate max-w-[240px]">
                    {stockAdjustCombo.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStockAdjustCombo(null);
                  setStockModalError(null);
                }}
                className="text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
              {stockModalError && (
                <div className="rounded-xl border border-red-500/50 bg-red-950/80 p-3 text-xs text-red-200 flex items-start gap-2">
                  <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{stockModalError}</span>
                </div>
              )}

              {/* Quick Target Sets */}
              <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70">
                <label className="text-[11px] font-bold uppercase tracking-wider text-primary block mb-1">
                  Target Available Sets
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={targetSetsInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTargetSetsInput(val);
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed) && parsed >= 0) {
                        setFrontStockInput(String(parsed));
                        setRearStockInput(String(parsed));
                      }
                    }}
                    className="w-28 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white font-mono font-bold focus:border-primary focus:outline-none"
                  />
                  <span className="text-xs text-neutral-400">
                    Sets available to customers
                  </span>
                </div>
              </div>

              {/* Component Tyres Breakdown */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Component Tyre Inventory
                </span>

                {/* Front Tyre */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                      Front Tyre
                    </span>
                    <strong className="text-xs font-semibold text-white truncate block">
                      {productsMap.get(stockAdjustCombo.front_product_id)?.size || "Front Tyre"}
                    </strong>
                    <span className="text-[10px] text-neutral-500 block">
                      {productsMap.get(stockAdjustCombo.front_product_id)?.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <label className="text-[10px] text-neutral-400 block mb-0.5">Stock</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={frontStockInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFrontStockInput(val);
                        const f = parseInt(val, 10);
                        const r = parseInt(rearStockInput, 10);
                        if (!isNaN(f) && !isNaN(r)) {
                          setTargetSetsInput(String(Math.min(Math.max(0, f), Math.max(0, r))));
                        }
                      }}
                      className="w-20 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Rear Tyre */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                      Rear Tyre
                    </span>
                    <strong className="text-xs font-semibold text-white truncate block">
                      {productsMap.get(stockAdjustCombo.rear_product_id)?.size || "Rear Tyre"}
                    </strong>
                    <span className="text-[10px] text-neutral-500 block">
                      {productsMap.get(stockAdjustCombo.rear_product_id)?.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <label className="text-[10px] text-neutral-400 block mb-0.5">Stock</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={rearStockInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRearStockInput(val);
                        const f = parseInt(frontStockInput, 10);
                        const r = parseInt(val, 10);
                        if (!isNaN(f) && !isNaN(r)) {
                          setTargetSetsInput(String(Math.min(Math.max(0, f), Math.max(0, r))));
                        }
                      }}
                      className="w-20 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Informational Notice */}
              <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-950/60 border border-neutral-800/80 p-2.5 rounded-lg">
                ℹ️ Combo stock is derived from physical front &amp; rear tyre inventory. Saving updates the respective tyre stock in Supabase, logs inventory history, and keeps storefront inventory synchronized.
              </p>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setStockAdjustCombo(null);
                    setStockModalError(null);
                  }}
                  disabled={savingStock}
                  className="px-4 py-2 rounded-xl border border-neutral-800 text-xs font-bold uppercase text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStock}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                >
                  {savingStock ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save &amp; Update Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
