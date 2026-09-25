import React, { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Minus,
  Phone,
  MessageSquare,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Truck,
  ShieldCheck,
  CreditCard,
  Building,
  Copy,
  Check,
} from "lucide-react";
import type { CartItem } from "../types";
import { validateCartStock } from "../lib/productService";
import { createOrder, type CreateOrderResult } from "../lib/orderService";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  // Navigation inside drawer: cart -> checkout -> confirmation
  const [step, setStep] = useState<"cart" | "checkout" | "confirmation">("cart");

  // Stock validation & order submission state
  const [validating, setValidating] = useState(false);
  const [stockErrors, setStockErrors] = useState<string[]>([]);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<CreateOrderResult | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  // Customer Checkout Form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    deliveryMethod: "collection" as "collection" | "courier",
    streetAddress: "",
    city: "Johannesburg",
    postalCode: "",
    notes: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getWhatsAppLink = (orderNum?: string) => {
    const lines = items.map(
      (item) => `• ${item.quantity}x ${item.title} (${item.subtitle}) - R${(item.price * item.quantity).toLocaleString("en-ZA")}.00`
    );
    const prefix = orderNum
      ? `Hi Costa (R&C Commodities),\n\nI have placed Order #${orderNum} on the website:\n\n${lines.join("\n")}\n\nTotal: R${total.toLocaleString("en-ZA")}.00\nCustomer: ${formData.firstName} ${formData.lastName}\nPhone: ${formData.phone}\nDelivery: ${formData.deliveryMethod === "courier" ? `Courier to ${formData.streetAddress}, ${formData.city}` : "Collection at Selby Workshop"}\n\nPlease confirm availability and banking/EFT payment.`
      : `Hi Costa (R&C Commodities),\n\nI would like to order the following motorcycle tyres/combos:\n\n${lines.join("\n")}\n\nTotal: R${total.toLocaleString("en-ZA")}.00\n\nPlease confirm availability and fitment/delivery in Selby, Johannesburg.`;
    return `https://wa.me/27832273237?text=${encodeURIComponent(prefix)}`;
  };

  const handleStartCheckout = async () => {
    setValidating(true);
    setStockErrors([]);
    setFormError(null);

    try {
      const res = await validateCartStock(items);
      if (!res.valid) {
        setStockErrors(res.errors);
        setValidating(false);
        return;
      }
      setStep("checkout");
    } catch (err) {
      console.warn("Stock verification error:", err);
      setStep("checkout");
    } finally {
      setValidating(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.firstName.trim()) {
      setFormError("Please enter your first name.");
      return;
    }
    if (!formData.phone.trim()) {
      setFormError("Please enter your mobile phone number for order updates.");
      return;
    }
    if (formData.deliveryMethod === "courier" && !formData.streetAddress.trim()) {
      setFormError("Please enter your street delivery address for courier dispatch.");
      return;
    }

    setSubmittingOrder(true);

    try {
      const shippingAddress =
        formData.deliveryMethod === "courier"
          ? `${formData.streetAddress}, ${formData.city} ${formData.postalCode}`.trim()
          : undefined;

      const res = await createOrder({
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        items,
        deliveryMethod: formData.deliveryMethod,
        shippingAddress,
        notes: formData.notes,
      });

      setOrderResult(res);
      setStep("confirmation");
      onClearCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order.";
      setFormError(msg);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const copyBankDetails = () => {
    const text = `R&C Commodities (Pty) Ltd\nStandard Bank\nAccount: 022849102\nBranch: Selby (051001)\nReference: ${orderResult?.orderNumber || "RC-ORDER"}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handleCloseAndReset = () => {
    if (step === "confirmation") {
      setStep("cart");
      setOrderResult(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleCloseAndReset}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-card text-foreground shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-5 bg-neutral-950 text-white">
            <div className="flex items-center gap-3">
              {step === "checkout" && (
                <button
                  onClick={() => setStep("cart")}
                  className="grid size-8 place-items-center rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors mr-1 cursor-pointer"
                  title="Back to cart"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="grid size-10 place-items-center rounded-lg bg-primary text-white shadow-md shrink-0">
                <ShoppingBag size={19} />
              </div>
              <div>
                <h2 className="font-display text-lg tracking-tight uppercase text-white">
                  {step === "cart"
                    ? "Your Order Selection"
                    : step === "checkout"
                    ? "Checkout & Details"
                    : "Order Confirmed"}
                </h2>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  {step === "confirmation"
                    ? `Order ${orderResult?.orderNumber || ""}`
                    : `${itemCount} ${itemCount === 1 ? "item" : "items"} selected`}
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseAndReset}
              aria-label="Close cart"
              className="grid size-9 place-items-center rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* STEP 1: CART ITEMS LIST */}
          {step === "cart" && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="grid size-16 place-items-center rounded-2xl bg-surface-soft border border-border text-foreground-muted mb-4">
                      <ShoppingBag size={28} />
                    </div>
                    <h3 className="font-display text-xl uppercase tracking-tight text-foreground">
                      Your cart is empty
                    </h3>
                    <p className="mt-1.5 text-sm text-foreground-muted max-w-xs leading-relaxed">
                      Browse our Vredestein Centauro NS &amp; ST tyres or matched combo sets to add fitments.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Browse Tyre Catalog <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-neutral-400 shadow-xs"
                    >
                      <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-surface-soft p-1 flex items-center justify-center border border-border/50">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-1 text-primary">
                            <ShoppingBag size={22} />
                            <span className="text-[9px] font-black uppercase mt-1 tracking-wider text-amber-500">
                              COMBO
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-sm truncate uppercase text-foreground">
                            {item.title}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            aria-label="Remove item"
                            className="text-foreground-muted hover:text-primary transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-foreground-muted mt-0.5">{item.subtitle}</p>

                        <div className="mt-3.5 flex items-center justify-between">
                          <div className="flex items-center rounded-md border border-border bg-surface-soft">
                            <button
                              onClick={() => onUpdateQty(item.id, -1)}
                              className="grid size-7 place-items-center text-foreground hover:bg-border transition-colors rounded-l-md cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQty(item.id, 1)}
                              className="grid size-7 place-items-center text-foreground hover:bg-border transition-colors rounded-r-md cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <span className="font-display text-base text-primary font-bold">
                            R{(item.price * item.quantity).toLocaleString("en-ZA")}.00
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer Actions */}
              {items.length > 0 && (
                <div className="border-t border-border bg-surface-soft p-6 space-y-4">
                  {/* Stock Validation Error Warnings */}
                  {stockErrors.length > 0 && (
                    <div className="rounded-lg border border-red-500/40 bg-red-950/80 p-3.5 space-y-1.5 text-xs text-red-200">
                      <div className="flex items-center gap-1.5 font-bold text-red-400 uppercase tracking-wider text-[11px]">
                        <AlertTriangle size={14} className="shrink-0" /> Stock Verification Issue
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                        {stockErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-neutral-400 pt-1 italic">
                        Please adjust your cart quantity or contact Costa directly for Selby stock availability.
                      </p>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
                      Order Subtotal
                    </span>
                    <span className="font-display text-2xl text-foreground font-black">
                      R{total.toLocaleString("en-ZA")}.00
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Direct importer pricing from R&amp;C Commodities. Wheel fitment &amp; dynamic balancing available in Selby. Nationwide insured courier delivery arranged.
                  </p>

                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {/* PRIMARY ACTION: PROCEED TO REAL CHECKOUT */}
                    <button
                      onClick={handleStartCheckout}
                      disabled={validating}
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:bg-primary-hover active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {validating ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Verifying Selby Stock...</span>
                        </>
                      ) : (
                        <>
                          <span>Proceed to Checkout</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    {/* SECONDARY ACTION: WHATSAPP DIRECT */}
                    <a
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:bg-emerald-700 active:scale-98 cursor-pointer"
                    >
                      <MessageSquare size={17} />
                      <span>Order via WhatsApp Directly</span>
                    </a>

                    <a
                      href="tel:+27832273237"
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800"
                    >
                      <Phone size={15} className="text-primary" />
                      <span>Call Costa (+27 83 227 3237)</span>
                    </a>
                  </div>

                  <div className="flex justify-between items-center pt-2 text-xs">
                    <button
                      onClick={onClearCart}
                      className="text-foreground-muted underline hover:text-primary transition-colors cursor-pointer"
                    >
                      Clear all items
                    </button>
                    <span className="text-foreground-muted font-medium">39 Webber St, Selby, JHB</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2: CHECKOUT DETAILS FORM */}
          {step === "checkout" && (
            <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {formError && (
                  <div className="rounded-lg border border-red-500/40 bg-red-950/80 p-3 text-xs text-red-200 flex items-start gap-2">
                    <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Customer Information */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                    <span>1. Customer Contact Details</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-foreground-muted block mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                        className="w-full rounded-lg border border-border bg-surface-soft px-3 py-2 text-xs text-foreground placeholder-foreground-muted/60 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-foreground-muted block mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="van der Merwe"
                        className="w-full rounded-lg border border-border bg-surface-soft px-3 py-2 text-xs text-foreground placeholder-foreground-muted/60 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-foreground-muted block mb-1">
                      Mobile Phone (for WhatsApp &amp; Delivery) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="082 123 4567"
                      className="w-full rounded-lg border border-border bg-surface-soft px-3 py-2 text-xs text-foreground placeholder-foreground-muted/60 focus:border-primary focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-foreground-muted block mb-1">
                      Email Address (for order confirmation)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="rider@example.co.za"
                      className="w-full rounded-lg border border-border bg-surface-soft px-3 py-2 text-xs text-foreground placeholder-foreground-muted/60 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Fulfilment Method */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                    <span>2. Fulfilment &amp; Delivery Option</span>
                  </h3>

                  <div className="grid grid-cols-1 gap-2">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        formData.deliveryMethod === "collection"
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-surface-soft hover:border-neutral-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="collection"
                        checked={formData.deliveryMethod === "collection"}
                        onChange={() => setFormData({ ...formData, deliveryMethod: "collection" })}
                        className="mt-1 accent-primary"
                      />
                      <div>
                        <div className="text-xs font-bold text-foreground uppercase flex items-center gap-1.5">
                          <MapPin size={13} className="text-primary" />
                          <span>Workshop Collection (Free)</span>
                        </div>
                        <p className="text-[11px] text-foreground-muted mt-0.5 leading-snug">
                          39 Webber St, Selby, Johannesburg. Same-day collection &amp; professional wheel fitment available.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        formData.deliveryMethod === "courier"
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-surface-soft hover:border-neutral-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="courier"
                        checked={formData.deliveryMethod === "courier"}
                        onChange={() => setFormData({ ...formData, deliveryMethod: "courier" })}
                        className="mt-1 accent-primary"
                      />
                      <div>
                        <div className="text-xs font-bold text-foreground uppercase flex items-center gap-1.5">
                          <Truck size={13} className="text-primary" />
                          <span>Nationwide Insured Courier</span>
                        </div>
                        <p className="text-[11px] text-foreground-muted mt-0.5 leading-snug">
                          Insured delivery to your doorstep across South Africa. Driver will contact you prior to drop-off.
                        </p>
                      </div>
                    </label>
                  </div>

                  {formData.deliveryMethod === "courier" && (
                    <div className="space-y-2 p-3 rounded-xl border border-border bg-surface-soft animate-in fade-in">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-foreground-muted block mb-1">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.streetAddress}
                          onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                          placeholder="Unit 4, 12 Long Street"
                          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-foreground-muted block mb-1">
                            City / Suburb
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Johannesburg"
                            className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-foreground-muted block mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            placeholder="2001"
                            className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Motorcycle & Fitment Notes */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    3. Motorcycle Model / Fitment Notes (Optional)
                  </h3>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. 2022 Yamaha MT-09 — Requesting wheel balancing on Saturday morning."
                    className="w-full rounded-lg border border-border bg-surface-soft p-2.5 text-xs text-foreground placeholder-foreground-muted/60 focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Order Submission Footer */}
              <div className="border-t border-border bg-surface-soft p-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    Total Due (ZAR)
                  </span>
                  <span className="font-display text-2xl text-foreground font-black">
                    R{total.toLocaleString("en-ZA")}.00
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:bg-primary-hover active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {submittingOrder ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Recording Order in Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Place Confirmed Order</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-foreground-muted leading-tight">
                  By clicking Place Order, your items will be reserved in our Selby inventory and dispatched per your fulfilment request.
                </p>
              </div>
            </form>
          )}

          {/* STEP 3: ORDER CONFIRMATION SCREEN */}
          {step === "confirmation" && orderResult && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="text-center py-4">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 shadow-xl mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  Order Successfully Placed
                </span>
                <h3 className="font-display text-2xl uppercase tracking-tight text-foreground">
                  Thank You, {formData.firstName}!
                </h3>
                <p className="text-xs text-foreground-muted mt-1">
                  Your order reference number is{" "}
                  <strong className="font-mono text-primary font-bold">{orderResult.orderNumber}</strong>.
                </p>
              </div>

              {/* Fulfilment & Contact Summary */}
              <div className="rounded-xl border border-border bg-surface-soft p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Fulfilment</span>
                  <span className="font-semibold text-foreground">
                    {formData.deliveryMethod === "courier" ? "Nationwide Courier" : "Workshop Collection"}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Contact Mobile</span>
                  <span className="font-mono font-semibold text-foreground">{formData.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Total Amount</span>
                  <span className="font-display font-black text-primary text-base">
                    R{orderResult.total.toLocaleString("en-ZA")}.00
                  </span>
                </div>
              </div>

              {/* Bank EFT Instructions */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Building size={14} className="text-primary" />
                    <span>EFT Payment Details</span>
                  </span>
                  <button
                    onClick={copyBankDetails}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    {copiedBank ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copiedBank ? "Copied!" : "Copy Details"}</span>
                  </button>
                </div>

                <div className="rounded-lg bg-surface-soft p-3 font-mono text-[11px] space-y-1 text-foreground">
                  <div><strong>Bank:</strong> Standard Bank</div>
                  <div><strong>Account:</strong> R&amp;C Commodities (Pty) Ltd</div>
                  <div><strong>Account No:</strong> 022849102</div>
                  <div><strong>Branch Code:</strong> 051001 (Selby)</div>
                  <div><strong>Reference:</strong> <span className="text-primary font-bold">{orderResult.orderNumber}</span></div>
                </div>
              </div>

              {/* Direct WhatsApp Confirmation Button */}
              <div className="space-y-2 pt-1">
                <a
                  href={getWhatsAppLink(orderResult.orderNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-98 cursor-pointer"
                >
                  <MessageSquare size={17} />
                  <span>Send Order to Costa via WhatsApp</span>
                </a>

                <button
                  onClick={handleCloseAndReset}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 cursor-pointer"
                >
                  <span>Continue Browsing Storefront</span>
                </button>
              </div>

              <div className="text-center pt-2 text-[11px] text-foreground-muted">
                Need urgent fitment advice? Call Costa directly on{" "}
                <a href="tel:+27832273237" className="text-primary font-bold hover:underline">
                  +27 83 227 3237
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
