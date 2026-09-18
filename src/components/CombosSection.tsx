import { Flame, Tag, ShoppingBag, Phone, ShieldCheck, Check } from "lucide-react";
import type { TyreCombo } from "../types";
import riderTrackAsset from "../assets/a2e33fb2f4a33ac97cd10c97f2d215ed.jpg";
import detailAsset from "../assets/Centauro_detail.jpeg";
import { resolveAsset } from "../lib/assetHelper";

interface CombosSectionProps {
  combos: TyreCombo[];
  onAddCombo: (combo: TyreCombo) => void;
}

export function CombosSection({ combos, onAddCombo }: CombosSectionProps) {
  const comboBackdrop = resolveAsset(["IMG_4936", "IMG4936", "4936", "warehouse"], riderTrackAsset);
  const pairStockPhoto = resolveAsset(["IMG_4936", "IMG4936", "4936"], detailAsset);

  return (
    <section id="combos" className="relative overflow-hidden border-b border-neutral-800 bg-neutral-950 text-white py-16 sm:py-24">
      {/* Background graphic styling */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      <img
        src={comboBackdrop}
        alt=""
        aria-hidden="true"
        className="absolute -right-20 -top-10 h-[700px] w-auto object-cover opacity-20 pointer-events-none filter blur-[0.5px] mix-blend-screen hidden lg:block"
      />

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Header strip */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-10 border-b border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              <Flame size={14} className="text-amber-400" />
              Special Matched Deals · Save up to R650 on Sets
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight">
              Vredestein Centauro <span className="text-primary">Tyre Combos</span>
            </h2>
            <p className="mt-2.5 max-w-2xl text-sm sm:text-base text-neutral-400 leading-relaxed">
              Factory-matched front and rear Sport Touring tyre pairs. Built with Dutch silica compound innovation for balanced wear, sharp turn-in, and wet tarmac grip across South Africa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/27832273237?text=Hi%20Costa,%20I'm%20interested%20in%20the%20Vredestein%20Centauro%20Tyre%20Combos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-neutral-900 border border-neutral-700 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:border-amber-400 hover:text-white transition-colors"
            >
              <Phone size={14} className="text-amber-400" /> WhatsApp Costa
            </a>
          </div>
        </div>

        {/* Combo Cards 3-Column Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {combos.map((combo) => {
            const waMessage = encodeURIComponent(
              `Hi Costa (R&C Commodities), I would like to order the Vredestein Centauro Combo:\n\n• ${combo.frontSize} + ${combo.rearSize}\n• Combo Price: R${combo.price.toLocaleString("en-ZA")}.00 (Save R${combo.savings.toLocaleString("en-ZA")})\n\nPlease confirm availability and fitment/delivery.`
            );

            return (
              <div
                key={combo.id}
                className="relative flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/95 p-6 sm:p-7 shadow-2xl transition-all duration-300 hover:border-amber-400 hover:-translate-y-1 group"
              >
                {/* Top badges */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
                      <Tag size={12} /> {combo.tag}
                    </span>
                    <span className="rounded bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                      Matched Pair
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl uppercase tracking-tight text-white group-hover:text-amber-300 transition-colors">
                        {combo.frontSize} <span className="text-neutral-500 font-sans font-light">:</span> {combo.rearSize}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-400">
                        {combo.subtitle}
                      </p>
                    </div>
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 p-1">
                      <img
                        src={pairStockPhoto}
                        alt={`${combo.title} matched tyre set in warehouse`}
                        className="h-full w-full object-cover rounded"
                      />
                    </div>
                  </div>

                  {/* Front & Rear Breakdown - Clear Package Equation */}
                  <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/70 p-3">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 block mb-2">
                      Matched Pair Components
                    </span>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                      <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-2.5">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
                          Front Tyre
                        </span>
                        <strong className="font-display text-xs sm:text-sm font-bold text-white block mt-0.5">
                          {combo.frontSize}
                        </strong>
                        <span className="text-[10px] text-steel font-medium block">Centauro ST</span>
                      </div>

                      <div className="text-neutral-500 font-bold text-base px-1 text-center">+</div>

                      <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-2.5">
                        <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
                          Rear Tyre
                        </span>
                        <strong className="font-display text-xs sm:text-sm font-bold text-white block mt-0.5">
                          {combo.rearSize}
                        </strong>
                        <span className="text-[10px] text-steel font-medium block">Centauro ST</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-4 text-xs text-neutral-300 leading-relaxed">
                    {combo.description}
                  </p>

                  {/* Popular bike fitment */}
                  <div className="mt-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80 p-2.5 text-[11px] text-neutral-400">
                    <span className="text-amber-400 font-bold block mb-1">Common Bike Fitment:</span>
                    <span className="leading-normal">{combo.popularBikes}</span>
                  </div>
                </div>

                {/* Price and Add CTAs */}
                <div className="mt-6 pt-5 border-t border-neutral-800">
                  <div className="flex items-baseline justify-between gap-2 mb-4">
                    <div>
                      <span className="text-[11px] font-medium text-neutral-400 block">Complete Combo Price</span>
                      <span className="font-display text-2xl sm:text-3xl font-bold text-white">
                        R{combo.price.toLocaleString("en-ZA")}.00
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 line-through block">
                        R{combo.regularPrice.toLocaleString("en-ZA")}.00
                      </span>
                      <span className="inline-block rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-400">
                        Save R{combo.savings.toLocaleString("en-ZA")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => onAddCombo(combo)}
                      className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-primary-hover transition-all shadow-md active:scale-95"
                    >
                      <ShoppingBag size={15} /> Add Combo Set
                    </button>
                    <a
                      href={`https://wa.me/27832273237?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-700 transition-colors"
                    >
                      <Phone size={14} className="text-emerald-400" /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom guarantee strip */}
        <div className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} className="text-amber-400 shrink-0" />
            <span>
              <strong className="text-white">100% Genuine European Vredestein Stock:</strong> All combo sets include matching production batches, stored in temperature-controlled facilities in Selby, Johannesburg.
            </span>
          </div>
          <a
            href="tel:+27832273237"
            className="shrink-0 text-amber-400 font-bold uppercase tracking-wider hover:text-amber-300 flex items-center gap-1.5"
          >
            <Phone size={14} /> Selby Fitment Advice: +27 83 227 3237
          </a>
        </div>
      </div>
    </section>
  );
}
