import React, { useState, useEffect } from "react";
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
  Truck,
  ShieldCheck,
  CreditCard,
  Building,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import type { CartItem } from "../types";
import { validateCartStock } from "../lib/productService";
import { createOrder, type CreateOrderResult } from "../lib/orderService";
import {
  initializeOrderPayment,
  submitPayfastPaymentForm,
  fetchServerPaymentStatus,
  type PaymentMethod,
} from "../lib/paymentService";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  initialOrderNumber?: string | null;
  initialPaymentStatus?: "return" | "cancelled" | null;
  onClearInitialPayment?: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  initialOrderNumber,
  initialPaymentStatus,
  onClearInitialPayment,
}: CartDrawerProps) {
  // Navigation inside drawer: cart -> checkout -> confirmation
  const [step, setStep] = useState<"cart" | "checkout" | "confirmation">("cart");

  // Stock validation & order submission state
  const [validating, setValidating] = useState(false);
  const [stockErrors, setStockErrors] = useState<string[]>([]);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [redirectingToPayfast, setRedirectingToPayfast] = useState(false);
  const [orderResult, setOrderResult] = useState<CreateOrderResult | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  // Live payment status verification for Payfast ITN confirmation
  const [verifiedPaymentStatus, setVerifiedPaymentStatus] = useState<string>("pending");
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(false);

  // Customer Checkout Form
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    deliveryMethod: "Nationwide Delivery",
    paymentMethod: "card_payfast" as PaymentMethod,
    streetAddress: "",
    city: "Johannesburg",
    postalCode: "",
    notes: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Handle return or cancel from Payfast gateway
  useEffect(() => {
    if (initialOrderNumber && initialPaymentStatus === "return") {
      setStep("confirmation");
      setVerifiedPaymentStatus("pending");

      // Check local storage for recent order details
      const cached = sessionStorage.getItem("rc_recent_order");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.orderNumber === initialOrderNumber) {
            setOrderResult(parsed);
          }
        } catch {
          // ignore
        }
      }

      // Check server-side status immediately
      fetchServerPaymentStatus(initialOrderNumber).then((st) => {
        if (st.success) {
          setVerifiedPaymentStatus(st.paymentStatus);
          if (st.order) {
            setOrderResult((prev) => {
              if (prev) return { ...prev, paymentStatus: st.paymentStatus };
              return {
                success: true,
                orderNumber: st.order.order_number,
                orderId: st.order.id,
                subtotal: st.order.subtotal,
                total: st.order.total,
                paymentMethod: st.order.payment_method,
                paymentReference: st.order.payment_reference,
                paymentStatus: st.order.payment_status,
                deliveryMethod: st.order.delivery_method || "Nationwide Delivery",
                deliveryAddress: st.order.delivery_address_line1 || "",
                customer: {
                  firstName: st.order.customer?.first_name || "Valued",
                  lastName: st.order.customer?.last_name || "Customer",
                  email: st.order.customer?.email || "",
                  phone: st.order.customer?.phone || "",
                },
                items: (st.order.order_items || []).map((i: any) => ({
                  title: i.product_name,
                  subtitle: "",
                  quantity: i.quantity,
                  price: i.unit_price,
                })),
                savedToDatabase: true,
              };
            });
          }
        }
      });

      // Poll server for ITN completion (up to 5 times every 3 seconds)
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > 5) {
          clearInterval(interval);
          return;
        }
        const st = await fetchServerPaymentStatus(initialOrderNumber);
        if (st.success) {
          setVerifiedPaymentStatus(st.paymentStatus);
          setOrderResult((prev) => (prev ? { ...prev, paymentStatus: st.paymentStatus } : null));
          if (st.paymentStatus === "paid") {
            clearInterval(interval);
          }
        }
      }, 3000);

      return () => clearInterval(interval);
    } else if (initialOrderNumber && initialPaymentStatus === "cancelled") {
      setFormError(
        `Your online payment session on Payfast for Order #${initialOrderNumber} was cancelled. Your order details are saved, and you can try Payfast again or pay via Direct Bank EFT.`
      );
      setStep("checkout");
    }
  }, [initialOrderNumber, initialPaymentStatus]);

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Generates authoritative WhatsApp order link using the successfully created order
  const getWhatsAppLink = (orderRes?: CreateOrderResult | null) => {
    if (orderRes) {
      const orderLines = orderRes.items.map(
        (item) =>
          `• ${item.quantity}x ${item.title} (${item.subtitle}) - R${(
            item.price * item.quantity
          ).toLocaleString("en-ZA")}.00`
      );
      const prefix = `Hi Costa (R&C Commodities),\n\nI have placed Order #${orderRes.orderNumber} on the website:\n\n${orderLines.join(
        "\n"
      )}\n\nTotal: R${orderRes.total.toLocaleString("en-ZA")}.00\nCustomer: ${orderRes.customer.firstName} ${
        orderRes.customer.lastName
      }\nPhone: ${orderRes.customer.phone}\nPayment Method: ${
        orderRes.paymentMethod === "card_payfast"
          ? "Pay Online (Payfast: Apple Pay / Card / Instant EFT)"
          : "Direct Bank EFT"
      }\nPayment Status: ${
        verifiedPaymentStatus === "paid" ? "Paid (Verified via Payfast)" : orderRes.paymentStatus
      }\nFulfilment: Free Nationwide Delivery\nDelivery Address: ${
        orderRes.deliveryAddress || `${formData.streetAddress}, ${formData.city} ${formData.postalCode}`.trim()
      }\n\nPlease confirm order receipt and delivery schedule.`;
      return `https://wa.me/27832273237?text=${encodeURIComponent(prefix)}`;
    }

    // Direct pre-checkout enquiry link using current cart items
    const lines = items.map(
      (item) =>
        `• ${item.quantity}x ${item.title} (${item.subtitle}) - R${(
          item.price * item.quantity
        ).toLocaleString("en-ZA")}.00`
    );
    const prefix = `Hi Costa (R&C Commodities),\n\nI would like to order the following motorcycle tyres/combos:\n\n${lines.join(
      "\n"
    )}\n\nTotal: R${total.toLocaleString(
      "en-ZA"
    )}.00\n\nPlease confirm availability and Free Nationwide Delivery across South Africa.`;
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

  const checkLiveStatus = async () => {
    if (!orderResult?.orderNumber) return;
    setCheckingPaymentStatus(true);
    try {
      const st = await fetchServerPaymentStatus(orderResult.orderNumber);
      if (st.success) {
        setVerifiedPaymentStatus(st.paymentStatus);
        setOrderResult((prev) => (prev ? { ...prev, paymentStatus: st.paymentStatus } : null));
      }
    } finally {
      setCheckingPaymentStatus(false);
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
      setFormError("Please enter your mobile phone number for delivery coordination.");
      return;
    }
    if (!formData.streetAddress.trim()) {
      setFormError("Please enter your delivery street address for Free Nationwide Delivery.");
      return;
    }
    if (!formData.city.trim()) {
      setFormError("Please enter your delivery city or suburb.");
      return;
    }

    setSubmittingOrder(true);

    try {
      const fullShippingAddress = `${formData.streetAddress.trim()}, ${formData.city.trim()}${
        formData.postalCode.trim() ? ` ${formData.postalCode.trim()}` : ""
      }`;

      // Initial payment status: 'pending' for Payfast, 'unpaid' for direct EFT
      const initialStatus = formData.paymentMethod === "card_payfast" ? "pending" : "unpaid";

      // 1. Authoritative order persistence into Supabase
      const res = await createOrder({
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        items,
        deliveryMethod: "Nationwide Delivery",
        shippingAddress: fullShippingAddress,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
        paymentStatus: initialStatus,
      });

      // 2. Strictly check database confirmation: never proceed if order not saved!
      if (!res.savedToDatabase) {
        throw new Error("We couldn't place your order. Please try again or contact R&C Commodities.");
      }

      setOrderResult(res);
      sessionStorage.setItem("rc_recent_order", JSON.stringify(res));

      // 3. For Payfast Online payment: generate signed payment request and redirect
      if (formData.paymentMethod === "card_payfast") {
        setRedirectingToPayfast(true);

        const paymentInit = await initializeOrderPayment("card_payfast", {
          orderNumber: res.orderNumber,
          amount: res.total,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          deliveryMethod: "Nationwide Delivery",
        });

        if (!paymentInit.success || !paymentInit.processUrl || !paymentInit.fields) {
          setFormError(
            paymentInit.error ||
              "Could not initialize Payfast checkout. Your order is registered; please choose Direct Bank EFT."
          );
          setRedirectingToPayfast(false);
          setSubmittingOrder(false);
          return;
        }

        // Clear cart and redirect customer to Payfast hosted checkout
        onClearCart();
        setTimeout(() => {
          submitPayfastPaymentForm(paymentInit.processUrl!, paymentInit.fields!);
        }, 900);
        return;
      }

      // 4. For Direct Bank EFT: show confirmation screen immediately
      setVerifiedPaymentStatus("unpaid");
      setStep("confirmation");
      onClearCart();
    } catch (err: unknown) {
      console.error("[checkout] Order submission failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "We couldn't place your order. Please try again or contact R&C Commodities.";
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
      if (onClearInitialPayment) onClearInitialPayment();
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
                      Browse our Vredestein Centauro NS &amp; ST tyres, combo bundles or accessories.
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
                        Please adjust your quantity or contact Costa for Selby stock availability.
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
                    Direct importer pricing from R&amp;C Commodities. Free Nationwide Delivery across South Africa. Pay Online (Apple Pay / Instant EFT / Card) or Direct Bank EFT.
                  </p>

                  <div className="grid grid-cols-1 gap-2.5 pt-1">
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
                    <span className="leading-relaxed">{formError}</span>
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
                      Mobile Phone (for Delivery &amp; WhatsApp) *
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
                      Email Address (for Payfast receipt &amp; order confirmation)
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

                {/* Fulfilment & Delivery Address */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                      <Truck size={14} className="text-primary" />
                      <span>2. Free Nationwide Delivery</span>
                    </h3>
                    <span className="text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Free Delivery
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-primary/40 bg-primary/10 space-y-1 text-xs">
                    <div className="flex items-center gap-2 font-bold text-foreground uppercase tracking-wide text-[11px]">
                      <Truck size={15} className="text-primary shrink-0" />
                      <span>Free Doorstep Delivery Across South Africa</span>
                    </div>
                    <p className="text-[11px] text-foreground-muted leading-relaxed pl-5">
                      Insured courier dispatch directly from our Selby warehouse to your doorstep in Johannesburg, Cape Town, Durban, Pretoria, or nationwide.
                    </p>
                  </div>

                  <div className="space-y-2.5 p-3.5 rounded-xl border border-border bg-surface-soft">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-foreground-muted block mb-1">
                        Street Delivery Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.streetAddress}
                        onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                        placeholder="e.g. Unit 4, 12 Long Street"
                        className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground placeholder-foreground-muted/60 focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-foreground-muted block mb-1">
                          City / Suburb *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Johannesburg"
                          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground placeholder-foreground-muted/60 focus:border-primary focus:outline-none"
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
                          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground placeholder-foreground-muted/60 focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Payment Method: Pay Online (Payfast) or Direct Bank EFT */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                      <Lock size={13} className="text-primary" />
                      <span>3. Choose Payment Method</span>
                    </h3>
                    <span className="text-[10px] text-primary font-bold uppercase font-mono">ZAR (Rands)</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* OPTION 1: PAY ONLINE (PAYFAST) */}
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        formData.paymentMethod === "card_payfast"
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-surface-soft hover:border-neutral-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card_payfast"
                        checked={formData.paymentMethod === "card_payfast"}
                        onChange={() => setFormData({ ...formData, paymentMethod: "card_payfast" })}
                        className="mt-1 accent-primary"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-foreground uppercase flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CreditCard size={14} className="text-primary" />
                            <span>Pay Online (Payfast)</span>
                          </div>
                          <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Instant
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground-muted mt-1 leading-snug">
                          Pay instantly using <strong>Apple Pay</strong>, <strong>Instant EFT</strong>, <strong>Visa</strong>, <strong>Mastercard</strong>, or <strong>Capitec Pay</strong>.
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-400">
                          <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[9px]">
                            Apple Pay
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[9px]">
                            Instant EFT
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-[9px]">
                            Credit / Debit Cards
                          </span>
                        </div>
                      </div>
                    </label>

                    {/* OPTION 2: DIRECT BANK EFT (STANDARD BANK SELBY) */}
                    <label
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        formData.paymentMethod === "eft"
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border bg-surface-soft hover:border-neutral-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="eft"
                        checked={formData.paymentMethod === "eft"}
                        onChange={() => setFormData({ ...formData, paymentMethod: "eft" })}
                        className="mt-1 accent-primary"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-foreground uppercase flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Building size={14} className="text-primary" />
                            <span>Direct Bank EFT (Standard Bank)</span>
                          </div>
                          <span className="text-[9px] bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded font-bold uppercase">
                            Manual
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground-muted mt-1 leading-snug">
                          Transfer directly to our official Standard Bank Selby account using your order reference number.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Motorcycle & Fitment Notes */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    4. Bike Model / Fitment Notes (Optional)
                  </h3>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. 2023 BMW S1000RR — Requesting Saturday morning fitment advice."
                    className="w-full rounded-lg border border-border bg-surface-soft p-2.5 text-xs text-foreground placeholder-foreground-muted/60 focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Order Submission Footer */}
              <div className="border-t border-border bg-surface-soft p-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    Total Due (Free Delivery)
                  </span>
                  <span className="font-display text-2xl text-foreground font-black">
                    R{total.toLocaleString("en-ZA")}.00
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder || redirectingToPayfast}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:bg-primary-hover active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {submittingOrder ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Creating Order in Supabase...</span>
                    </>
                  ) : redirectingToPayfast ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Proceeding to Payfast Gateway...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>
                        {formData.paymentMethod === "card_payfast"
                          ? "Place Order & Pay via Payfast"
                          : "Place Order with Direct Bank EFT"}
                      </span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-foreground-muted leading-tight">
                  Orders are recorded in our Selby inventory system. Free insured nationwide delivery across South Africa.
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
                  Thank You, {orderResult.customer?.firstName || formData.firstName}!
                </h3>
                <p className="text-xs text-foreground-muted mt-1">
                  Your order reference number is{" "}
                  <strong className="font-mono text-primary font-bold">{orderResult.orderNumber}</strong>.
                </p>
              </div>

              {/* Fulfilment & Contact Summary */}
              <div className="rounded-xl border border-border bg-surface-soft p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Order Number</span>
                  <span className="font-mono font-bold text-primary">{orderResult.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Customer</span>
                  <span className="font-semibold text-foreground">
                    {orderResult.customer.firstName} {orderResult.customer.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Payment Method</span>
                  <span className="font-semibold text-foreground">
                    {orderResult.paymentMethod === "card_payfast"
                      ? "Pay Online (Payfast: Apple Pay / Cards / EFT)"
                      : "Direct Bank EFT"}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Payment Status</span>
                  {verifiedPaymentStatus === "paid" || orderResult.paymentStatus === "paid" ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      <Check size={11} /> Paid (Verified via Payfast)
                    </span>
                  ) : orderResult.paymentMethod === "card_payfast" ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                        <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Awaiting ITN Confirmation</span>
                      </span>
                      <button
                        onClick={checkLiveStatus}
                        disabled={checkingPaymentStatus}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        title="Check payment status with Payfast"
                      >
                        <RefreshCw size={11} className={checkingPaymentStatus ? "animate-spin" : ""} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-amber-400">
                      <span className="size-1.5 rounded-full bg-amber-400" />
                      <span>Unpaid (Pending EFT)</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Fulfilment</span>
                  <span className="font-semibold text-emerald-400">Nationwide Delivery (Free)</span>
                </div>
                <div className="flex items-start justify-between pb-2 border-b border-border/60">
                  <span className="text-foreground-muted font-bold uppercase text-[10px] shrink-0">
                    Delivery Address
                  </span>
                  <span className="text-right font-medium text-foreground text-[11px] max-w-[220px]">
                    {orderResult.deliveryAddress || `${formData.streetAddress}, ${formData.city}`}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Contact Mobile</span>
                  <span className="font-mono font-semibold text-foreground">
                    {orderResult.customer.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted font-bold uppercase text-[10px]">Total Amount</span>
                  <span className="font-display font-black text-primary text-base">
                    R{orderResult.total.toLocaleString("en-ZA")}.00
                  </span>
                </div>
              </div>

              {/* Payfast Status Notice or Bank EFT Instructions */}
              {orderResult.paymentMethod === "card_payfast" ? (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-foreground uppercase text-[11px]">
                    <ShieldCheck size={14} className="text-primary" />
                    <span>Payfast Online Payment Security</span>
                  </div>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Online card, Apple Pay, and Instant EFT transactions are verified authoritatively through Payfast server notifications (ITN). Your order has been placed in our system and will be dispatched once verified.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Building size={14} className="text-primary" />
                      <span>Official EFT Banking Details</span>
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
                    <div>
                      <strong>Bank:</strong> Standard Bank
                    </div>
                    <div>
                      <strong>Account:</strong> R&amp;C Commodities (Pty) Ltd
                    </div>
                    <div>
                      <strong>Account No:</strong> 022849102
                    </div>
                    <div>
                      <strong>Branch Code:</strong> 051001 (Selby)
                    </div>
                    <div>
                      <strong>Payment Reference:</strong>{" "}
                      <span className="text-primary font-bold">{orderResult.orderNumber}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground-muted leading-tight">
                    Please use your Order Number{" "}
                    <strong className="text-primary font-mono">{orderResult.orderNumber}</strong> as the beneficiary reference for rapid matching.
                  </p>
                </div>
              )}

              {/* Direct WhatsApp Confirmation Button (Uses real order total) */}
              <div className="space-y-2 pt-1">
                <a
                  href={getWhatsAppLink(orderResult)}
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
