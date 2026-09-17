import { Phone, ShoppingBag, MessageSquare } from "lucide-react";

interface MobileQuickBarProps {
  totalCartCount: number;
  totalCartPrice: number;
  onOpenCart: () => void;
}

export function MobileQuickBar({
  totalCartCount,
  totalCartPrice,
  onOpenCart,
}: MobileQuickBarProps) {
  return (
    <aside aria-label="Mobile quick actions" className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-neutral-800 bg-neutral-950/95 p-2 backdrop-blur-md shadow-2xl">
      <div className="flex items-center gap-2">
        <a
          href="https://wa.me/27832273237?text=Hi%20Costa,%20I'm%20on%20the%20R%26C%20Commodities%20website%20and%20need%20tyre%20advice"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white active:bg-emerald-700 shadow-md"
        >
          <MessageSquare size={16} />
          <span>WhatsApp Costa</span>
        </a>

        <button
          onClick={onOpenCart}
          className="flex-1 relative flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-xs font-bold uppercase tracking-wider text-white active:bg-primary-hover shadow-md"
        >
          <ShoppingBag size={16} />
          {totalCartCount > 0 ? (
            <span>Cart ({totalCartCount}) · R{totalCartPrice.toLocaleString("en-ZA")}</span>
          ) : (
            <span>View Cart</span>
          )}
        </button>

        <a
          href="tel:+27832273237"
          aria-label="Call Costa"
          className="grid size-11 place-items-center rounded-lg border border-neutral-700 bg-neutral-900 text-white shrink-0 active:bg-neutral-800"
        >
          <Phone size={17} className="text-primary" />
        </a>
      </div>
    </aside>
  );
}
