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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <a
            href="https://wa.me/27832273237?text=Hi%20Costa,%20I'm%20on%20the%20R%26C%20Commodities%20website%20and%20need%20tyre%20advice"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white active:bg-emerald-700 shadow-md"
          >
            <MessageSquare size={14} />
            <span>WhatsApp Costa</span>
          </a>
          <a
            href="https://wa.me/27834671394?text=Hi%2C%20I'm%20on%20the%20R%26C%20Commodities%20website%20and%20need%20tyre%20advice"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white active:bg-emerald-700 shadow-md"
          >
            <MessageSquare size={14} />
            <span>WhatsApp Dhevan</span>
          </a>
        </div>
        <div className="flex items-center gap-2">
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
            aria-label="Call Costa on +27 83 227 3237"
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900 py-3 text-[10px] font-bold uppercase tracking-wider text-white active:bg-neutral-800"
          >
            <Phone size={14} className="text-primary" /> Costa
          </a>
          <a
            href="tel:+27834671394"
            aria-label="Call Dhevan on +27 83 4671394"
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900 py-3 text-[10px] font-bold uppercase tracking-wider text-white active:bg-neutral-800"
          >
            <Phone size={14} className="text-primary" /> Dhevan
          </a>
        </div>
      </div>
    </aside>
  );
}
