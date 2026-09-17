import { X, Trash2, Plus, Minus, Phone, MessageSquare, ShoppingBag, ArrowRight } from "lucide-react";
import type { CartItem } from "../types";

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
  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getWhatsAppLink = () => {
    const lines = items.map(
      (item) => `• ${item.quantity}x ${item.title} (${item.subtitle}) - R${(item.price * item.quantity).toLocaleString("en-ZA")}`
    );
    const text = encodeURIComponent(
      `Hi Costa (R&C Commodities),\n\nI would like to enquire/order the following tyres/accessories:\n\n${lines.join("\n")}\n\nTotal: R${total.toLocaleString("en-ZA")}\n\nPlease confirm availability and fitment/delivery guidance.`
    );
    return `https://wa.me/27832273237?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-card text-foreground shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5 bg-neutral-900 text-white">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded bg-primary text-white">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="font-display text-lg tracking-tight uppercase">Your Cart</h2>
                <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                  {itemCount} {itemCount === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart"
              className="grid size-8 place-items-center rounded-md text-white/70 hover:bg-neutral-800 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-surface-soft border border-border text-foreground-muted mb-4">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="font-display text-lg">Your cart is empty</h3>
                <p className="mt-1 text-sm text-foreground-muted max-w-xs">
                  Explore the Vredestein Centauro tyre range or bike accessories to add fitments.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-primary-hover shadow-md"
                >
                  Browse Tyres <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-border bg-surface p-4 transition-all hover:border-neutral-400"
                >
                  <div className="size-20 shrink-0 overflow-hidden rounded bg-surface-soft p-1 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-1 text-primary">
                        <ShoppingBag size={20} />
                        <span className="text-[10px] font-black uppercase mt-1 tracking-wider text-amber-500">COMBO</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-sm truncate uppercase">{item.title}</h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        aria-label="Remove item"
                        className="text-foreground-muted hover:text-primary transition-colors p-0.5"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-foreground-muted mt-0.5">{item.subtitle}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded border border-border bg-surface-soft">
                        <button
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="grid size-7 place-items-center text-foreground hover:bg-border"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="grid size-7 place-items-center text-foreground hover:bg-border"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="font-display text-base text-primary">
                        R{(item.price * item.quantity).toLocaleString("en-ZA")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border bg-surface-soft p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Subtotal</span>
                <span className="font-display text-xl text-foreground">
                  R{total.toLocaleString("en-ZA")}
                </span>
              </div>
              <p className="text-[11px] text-foreground-muted">
                Prices include standard fitment guidance from our Selby workshop. Delivery arranged nationwide across South Africa.
              </p>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-emerald-700"
                >
                  <MessageSquare size={18} />
                  Enquire via WhatsApp
                </a>
                <a
                  href="tel:+27832273237"
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800"
                >
                  <Phone size={18} className="text-primary" />
                  Call Costa (+27 83 227 3237)
                </a>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={onClearCart}
                  className="text-xs text-foreground-muted underline hover:text-primary"
                >
                  Clear all items
                </button>
                <span className="text-xs text-foreground-muted">Selby, Johannesburg</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
