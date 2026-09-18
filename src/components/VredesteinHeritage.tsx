import { Award, Clock3, Layers, Sparkles, ArrowRight, Phone } from "lucide-react";
import { ShopButton } from "./ShopButton";
import { vredesteinHeritage } from "../data/products";
import moodyBikeAsset from "../assets/4298f1d6724ee05cbb8ca427a0471e9c.jpg";

interface VredesteinHeritageProps {
  onScrollToCombos: () => void;
  onScrollToTyres: () => void;
}

export function VredesteinHeritage({ onScrollToCombos, onScrollToTyres }: VredesteinHeritageProps) {
  return (
    <section id="netherlands" className="border-t border-border bg-surface py-16 sm:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-primary">
              <Award size={15} />
              {vredesteinHeritage.headline} · {vredesteinHeritage.tagline}
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-foreground leading-[1.05]">
              European Tyre Innovation <span className="text-primary">Since 1909</span>
            </h2>

            <div className="p-6 rounded-2xl border border-border bg-surface-soft shadow-xs border-l-4 border-l-primary">
              <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                {vredesteinHeritage.description}
              </p>
            </div>

            <p className="text-sm text-foreground-muted leading-relaxed">
              {vredesteinHeritage.nsDescription} Born in Enschede, Netherlands, Vredestein blends over a century of European motorsport compounding with high-tech carcass computational simulation. Tested across European motorways and South African tarmac for maximum safety.
            </p>

            {/* 3 Key Pillars */}
            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              {vredesteinHeritage.keyPillars.map((pillar, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card p-4 shadow-xs">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">
                    {idx === 0 ? <Clock3 size={17} /> : idx === 1 ? <Layers size={17} /> : <Sparkles size={17} />}
                  </div>
                  <h4 className="font-display text-sm uppercase text-foreground leading-snug">
                    {pillar.title}
                  </h4>
                  <p className="mt-1.5 text-xs text-foreground-muted leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <ShopButton onClick={onScrollToCombos}>
                View Centauro ST Combos <ArrowRight size={16} />
              </ShopButton>
              <ShopButton variant="outline" onClick={onScrollToTyres}>
                Browse All Fitments
              </ShopButton>
            </div>
          </div>

          {/* Right Visual Tech Card */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl border border-border bg-neutral-950 p-8 sm:p-10 text-white shadow-2xl overflow-hidden">
              <img
                src={moodyBikeAsset}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-50 pointer-events-none filter contrast-110"
              />
              <div className="absolute inset-0 bg-neutral-950/60 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/98 via-neutral-950/80 to-neutral-950/50 pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 block mb-2">
                  CENTAURO SPORT TOURING &amp; SUPER SPORT
                </span>
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-white mb-4">
                  Built for Modern Superbikes &amp; Tourers
                </h3>

                <div className="space-y-4 text-xs sm:text-sm text-neutral-300 mb-8">
                  <div className="flex items-start gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white text-xs mt-0.5 font-black">
                      ✓
                    </span>
                    <div>
                      <strong className="text-white block font-bold">Zero-Degree Steel Belt Cords</strong>
                      <span className="text-neutral-400 text-xs">Delivers laser-precise line holding and feedback during high-speed directional changes.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white text-xs mt-0.5 font-black">
                      ✓
                    </span>
                    <div>
                      <strong className="text-white block font-bold">Advanced Full-Silica Polymer Matrix</strong>
                      <span className="text-neutral-400 text-xs">Rapid cold-tire warm up and consistent chemical grip on cold, damp South African asphalt.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white text-xs mt-0.5 font-black">
                      ✓
                    </span>
                    <div>
                      <strong className="text-white block font-bold">High Mileage Center Channel</strong>
                      <span className="text-neutral-400 text-xs">Even contact pressure distribution prevents premature flat-spotting on extended highway touring.</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-800 pt-5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-neutral-400 uppercase tracking-wider block">Official Stockist</span>
                    <strong className="font-display text-sm text-amber-300">R&amp;C Commodities · Selby, JHB</strong>
                  </div>
                  <a
                    href="tel:+27832273237"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-400 uppercase tracking-wider transition-colors"
                  >
                    <Phone size={14} className="text-amber-400" /> Costa: +27 83 227 3237
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
