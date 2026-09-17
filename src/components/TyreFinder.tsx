import { Search, RotateCcw } from "lucide-react";

interface TyreFinderProps {
  finderPosition: string;
  finderWidth: string;
  finderProfile: string;
  onPositionChange: (pos: string) => void;
  onWidthChange: (w: string) => void;
  onProfileChange: (p: string) => void;
  onApply: () => void;
  onReset: () => void;
}

export function TyreFinder({
  finderPosition,
  finderWidth,
  finderProfile,
  onPositionChange,
  onWidthChange,
  onProfileChange,
  onApply,
  onReset,
}: TyreFinderProps) {
  return (
    <section id="finder" className="bg-neutral-950 text-white py-10 shadow-2xl border-y border-neutral-800">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2.5fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
              <span className="size-1.5 rounded-full bg-amber-400" />
              Precision Tyre Size Finder
            </div>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl uppercase tracking-tight text-white">
              Find Your Exact Wheel Fitment
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Select your motorcycle tyre dimensions to instantly isolate genuine Vredestein Centauro fitments.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 items-end">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Position
              <select
                value={finderPosition}
                onChange={(e) => onPositionChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs sm:text-sm text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-semibold"
              >
                <option value="All">All Positions</option>
                <option value="Front">Front Tyre</option>
                <option value="Rear">Rear Tyre</option>
              </select>
            </label>

            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Width (mm)
              <select
                value={finderWidth}
                onChange={(e) => onWidthChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs sm:text-sm text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-semibold"
              >
                <option value="All">All Widths</option>
                <option value="120">120 mm (Front)</option>
                <option value="180">180 mm (Rear)</option>
                <option value="190">190 mm (Rear)</option>
                <option value="200">200 mm (Rear)</option>
              </select>
            </label>

            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Profile (%)
              <select
                value={finderProfile}
                onChange={(e) => onProfileChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs sm:text-sm text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-semibold"
              >
                <option value="All">All Profiles</option>
                <option value="50">50</option>
                <option value="55">55</option>
                <option value="70">70</option>
              </select>
            </label>

            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Rim Diameter
              <select
                disabled
                className="mt-1.5 h-11 w-full rounded-md border border-neutral-800 bg-neutral-900/60 px-3 text-xs sm:text-sm text-neutral-400 outline-none font-semibold cursor-not-allowed"
              >
                <option>17 inch (ZR17)</option>
              </select>
            </label>

            <div className="col-span-2 sm:col-span-1 flex gap-2">
              <button
                onClick={onApply}
                className="h-11 flex-1 rounded-md bg-primary px-3 text-xs font-black uppercase tracking-wider text-white hover:bg-primary-hover transition-all shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Search size={15} /> Filter
              </button>
              <button
                onClick={onReset}
                title="Reset finder"
                className="h-11 px-3 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
