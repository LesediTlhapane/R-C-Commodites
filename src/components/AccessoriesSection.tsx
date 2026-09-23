import { ExternalLink, ShoppingBag } from "lucide-react";
import type { AccessoryItem } from "../types";
import moodyBikeAsset from "../assets/4298f1d6724ee05cbb8ca427a0471e9c.jpg";
import { resolveAsset } from "../lib/assetHelper";

interface AccessoriesSectionProps {
  accessories: AccessoryItem[];
  onAddAccessory: (item: AccessoryItem) => void;
}

export function AccessoriesSection({ accessories, onAddAccessory }: AccessoriesSectionProps) {
  const accessoriesBg = resolveAsset(["4298f1d6", "e086514c", "accessories", "paddock"], moodyBikeAsset);

  return (
    <section id="accessories" className="relative overflow-hidden border-y border-neutral-800 bg-neutral-950 py-16 sm:py-24 text-white">
      {/* Full background picture with tuned opacity, maintaining the black performance theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={accessoriesBg}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-40 filter contrast-110"
        />
        {/* Dark overlays ensuring crisp legibility and high contrast */}
        <div className="absolute inset-0 bg-neutral-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/98 via-neutral-950/60 to-neutral-950/85" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Essential Rider &amp; Workshop Gear
            </p>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl uppercase tracking-tight text-white">
              Motorcycle Accessories
            </h2>
            <p className="mt-2 text-sm text-neutral-300 max-w-xl">
              Equip your superbike with crash bobbins, paddock stands, digital tyre warmers, and workshop maintenance supplies from our Selby depot.
            </p>
          </div>
          <a
            href="https://wa.me/27832273237?text=Hi%20Costa,%20I'm%20looking%20for%20specific%20motorcycle%20accessories"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-neutral-900 border border-neutral-800 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 hover:border-neutral-700 transition-colors shadow-sm shrink-0"
          >
            Custom Part Enquiry <ExternalLink size={14} />
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accessories.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-neutral-800/90 bg-neutral-900/85 backdrop-blur-xs p-5 shadow-lg transition-all hover:border-primary hover:shadow-2xl hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`h-1.5 w-10 rounded-full ${item.tagColor}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-display text-base uppercase leading-snug text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-display text-base text-primary font-bold block">
                    R{item.price.toLocaleString("en-ZA")}.00
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium">On-Demand Order</span>
                </div>
                <a
                  href={`https://wa.me/27832273237?text=${encodeURIComponent(`Hi Costa, I would like to order the ${item.title} (${item.category}) for R${item.price}. Please confirm stock availability.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-neutral-800 border border-neutral-700/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary hover:border-primary transition-colors active:scale-95 cursor-pointer"
                >
                  <ExternalLink size={13} /> Enquire
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
