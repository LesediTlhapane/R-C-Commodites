import React, { useState } from "react";
import { X, Trash2, Plus, Minus, Phone, MessageSquare, ShoppingBag, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";
import type { CartItem } from "../types";
import { validateCartStock } from "../lib/productService";

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
  const [validating, setValidating] = useState(false);
  const [stockErrors, setStockErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getWhatsAppLink = () => {
    const lines = items.map(
      (item) => `• ${item.quantity}x ${item.title} (${item.subtitle}) - R${(item.price * item.quantity).toLocaleString("en-ZA")}.00`
    );
    const text = encodeURIComponent(
      `Hi Costa (R&C Commodities),\n\nI would like to order the following motorcycle tyres/accessories:\n\n${lines.join("\n")}\n\nTotal: R${total.toLocaleString("en-ZA")}.00\n\nPlease confirm availability and fitment/delivery in Selby, Johannesburg.`
    );
    return `https://wa.me/27832273237?text=${text}`;
  };

  const handleProceedToWhatsApp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setValidating(true);
    setStockErrors([]);

    try {
      const res = await validateCartStock(
        items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          title: it.title,
        }))
      );

      if (!res.valid) {
        setStockErrors(res.errors);
        setValidating(false);
        return;
      }

      // Stock is validated - open WhatsApp order window
      window.location.href = getWhatsAppLink();
    } catch (err) {
      console.warn("Stock verification error:", err);
      // Fallback
      window.location.href = getWhatsAppLink();
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-card text-foreground shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-5 bg-neutral-950 text-white">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary text-white shadow-md">
                <ShoppingBag size={19} />
              </div>
              <div>
                <h2 className="font-display text-lg tracking-tight uppercase text-white">Your Order Selection</h2>
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  {itemCount} {itemCount === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart"
              className="grid size-9 place-items-center rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="grid size-16 place-items-center rounded-2xl bg-surface-soft border border-border text-foreground-muted mb-4">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="font-display text-xl uppercase tracking-tight text-foreground">Your cart is empty</h3>
                <p className="mt-1.5 text-sm text-foreground-muted max-w-xs leading-relaxed">
                  Browse our Vredestein Centauro NS &amp; ST tyres, combo sets, or rider accessories to add fitments.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover shadow-md transition-all active:scale-95"
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
                        <span className="text-[9px] font-black uppercase mt-1 tracking-wider text-amber-500">COMBO</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-sm truncate uppercase text-foreground">{item.title}</h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        aria-label="Remove item"
                        className="text-foreground-muted hover:text-primary transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-foreground-muted mt-0.5">{item.subtitle}</p>
                    
                    <div className="mt-3.5 flex items-center justify-between">
                      <div className="flex items-center rounded-md border border-border bg-surface-soft">
                        <button
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="grid size-7 place-items-center text-foreground hover:bg-border transition-colors rounded-l-md"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="grid size-7 place-items-center text-foreground hover:bg-border transition-colors rounded-r-md"
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

          {/* Footer Checkout actions */}
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
                <span className="text-sm font-bold uppercase tracking-wider text-foreground-muted">Order Total</span>
                <span className="font-display text-2xl text-foreground font-black">
                  R{total.toLocaleString("en-ZA")}.00
                </span>
              </div>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                Direct importer pricing from R&amp;C Commodities. Wheel fitment &amp; dynamic balancing available in Selby. Nationwide insured courier delivery arranged.
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                <button
                  onClick={handleProceedToWhatsApp}
                  disabled={validating}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {validating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Checking Selby Stock...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={18} />
                      Order via WhatsApp Directly
                    </>
                  )}
                </button>
                <a
                  href="tel:+27832273237"
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800"
                >
                  <Phone size={17} className="text-primary" />
                  Call Costa (+27 83 227 3237)
                </a>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs">
                <button
                  onClick={onClearCart}
                  className="text-foreground-muted underline hover:text-primary transition-colors"
                >
                  Clear all items
                </button>
                <span className="text-foreground-muted font-medium">39 Webber St, Selby, JHB</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
