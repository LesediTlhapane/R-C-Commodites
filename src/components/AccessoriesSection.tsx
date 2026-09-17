import { ExternalLink, ShoppingBag } from "lucide-react";
import type { AccessoryItem } from "../types";

interface AccessoriesSectionProps {
  accessories: AccessoryItem[];
  onAddAccessory: (item: AccessoryItem) => void;
}

export function AccessoriesSection({ accessories, onAddAccessory }: AccessoriesSectionProps) {
  return (
    <section id="accessories" className="border-y border-border bg-surface-soft/80 py-16 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Essential Rider &amp; Workshop Gear
            </p>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl uppercase tracking-tight text-foreground">
              Motorcycle Accessories
            </h2>
            <p className="mt-2 text-sm text-foreground-muted max-w-xl">
              Equip your superbike with crash bobbins, paddock stands, digital tyre warmers, and workshop maintenance supplies from our Selby depot.
            </p>
          </div>
          <a
            href="https://wa.me/27832273237?text=Hi%20Costa,%20I'm%20looking%20for%20specific%20motorcycle%20accessories"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors shadow-sm shrink-0"
          >
            Custom Part Enquiry <ExternalLink size={14} />
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accessories.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`h-1.5 w-10 rounded-full ${item.tagColor}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-display text-base uppercase leading-snug text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-foreground-muted leading-relaxed">
                  {item.subtitle}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className="font-display text-base text-primary font-bold">
                  R{item.price.toLocaleString("en-ZA")}.00
                </span>
                <button
                  onClick={() => onAddAccessory(item)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary transition-colors active:scale-95"
                >
                  <ShoppingBag size={13} /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
