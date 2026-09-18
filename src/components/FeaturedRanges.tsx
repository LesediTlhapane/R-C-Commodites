import { ArrowRight, ShieldCheck, Zap, Compass } from "lucide-react";
import type { Range } from "../types";
import nsAsset from "../assets/NS.png";
import stAsset from "../assets/ST.jpeg";

interface FeaturedRangesProps {
  onSelectRange: (range: Range) => void;
  onScrollToTyres: () => void;
}

export function FeaturedRanges({ onSelectRange, onScrollToTyres }: FeaturedRangesProps) {
  const handleRangeClick = (r: Range) => {
    onSelectRange(r);
    onScrollToTyres();
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary block">
            Vredestein Motorcycle Portfolio
          </span>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl uppercase tracking-tight text-foreground">
            Two distinct disciplines. One Dutch pedigree.
          </h2>
        </div>
        <button
          onClick={() => handleRangeClick("All")}
          className="text-xs font-bold uppercase tracking-wider text-primary hover:underline self-start sm:self-auto inline-flex items-center gap-1.5"
        >
          <span>View All 8 Fitments</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Centauro NS Card */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 transition-all hover:border-primary hover:shadow-lg">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Zap size={13} /> Super Sport
              </span>
              <span className="text-xs font-semibold text-foreground-muted">
                From <strong className="text-foreground text-sm">R1,900</strong>
              </span>
            </div>

            <div className="mt-5 grid sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-7">
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-foreground">
                  Centauro NS
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Track-Attack &amp; Fast Road Super Sport
                </p>
                <p className="mt-3 text-xs sm:text-sm text-foreground-muted leading-relaxed">
                  Zero-degree steel belt construction offering pinpoint apex accuracy, ultra-stable high-speed braking, and maximum shoulder adhesion at full lean angle.
                </p>

                <ul className="mt-4 space-y-1.5 text-xs text-foreground-muted">
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary shrink-0" />
                    <span>Zero-degree high-tensile steel belt</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary shrink-0" />
                    <span>Dual-compound shoulder rubber formulation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary shrink-0" />
                    <span>Superbike fitments: 120/70, 180/55, 190/55, 200/55</span>
                  </li>
                </ul>
              </div>

              <div className="sm:col-span-5 flex justify-center">
                <div className="h-44 w-44 rounded-xl bg-surface-soft p-3 flex items-center justify-center">
                  <img
                    src={nsAsset}
                    alt="Vredestein Centauro NS Super Sport Tyre"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">4 Superbike Sizes In Stock</span>
            <button
              onClick={() => handleRangeClick("NS")}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow-xs"
            >
              <span>Shop Centauro NS</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Centauro ST Card */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 transition-all hover:border-steel hover:shadow-lg">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-steel/10 border border-steel/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-steel">
                <Compass size={13} /> Sport Touring
              </span>
              <span className="text-xs font-semibold text-foreground-muted">
                From <strong className="text-foreground text-sm">R1,350</strong>
              </span>
            </div>

            <div className="mt-5 grid sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-7">
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-foreground">
                  Centauro ST
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-steel">
                  All-Weather &amp; High-Mileage Touring
                </p>
                <p className="mt-3 text-xs sm:text-sm text-foreground-muted leading-relaxed">
                  Full-silica matrix siping designed for immediate wet-weather braking, extended cross-country tread longevity, and smooth touring chassis balance.
                </p>

                <ul className="mt-4 space-y-1.5 text-xs text-foreground-muted">
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-steel shrink-0" />
                    <span>High-silica wet evacuation polymer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-steel shrink-0" />
                    <span>Even wear profile across high mileage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-steel shrink-0" />
                    <span>Touring fitments: 120/70, 180/55, 190/50, 190/55</span>
                  </li>
                </ul>
              </div>

              <div className="sm:col-span-5 flex justify-center">
                <div className="h-44 w-44 rounded-xl bg-surface-soft p-3 flex items-center justify-center">
                  <img
                    src={stAsset}
                    alt="Vredestein Centauro ST Sport Touring Tyre"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">4 Touring Sizes In Stock</span>
            <button
              onClick={() => handleRangeClick("ST")}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-background hover:opacity-90 transition-opacity shadow-xs"
            >
              <span>Shop Centauro ST</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
