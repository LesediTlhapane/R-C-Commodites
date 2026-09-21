import { Search, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import moodyBikeAsset from "../assets/4298f1d6724ee05cbb8ca427a0471e9c.jpg";
import { resolveAsset } from "../lib/assetHelper";
import { PERFORMANCE_EASE, TACTILE_EASE } from "../lib/motionTokens";

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
  const finderBgPhoto = resolveAsset(["13cc2253", "4298f1d6", "swingarm", "moody"], moodyBikeAsset);

  return (
    <motion.section
      id="finder"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: PERFORMANCE_EASE }}
      className="relative overflow-hidden bg-neutral-950 text-white py-12 sm:py-16 shadow-2xl border-y border-neutral-800"
    >
      {/* Full background picture with tuned opacity for optimal readability and black theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={finderBgPhoto}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-60 filter contrast-105"
        />
        {/* Balanced dark overlay ensuring the form fields and text are sharp and effortlessly readable */}
        <div className="absolute inset-0 bg-neutral-950/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/70 to-neutral-950/85" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2.5fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: PERFORMANCE_EASE }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-semibold text-neutral-300">
              <span className="size-1.5 rounded-full bg-primary" />
              Fitment Tool
            </div>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl uppercase tracking-tight text-white">
              Find Your Tyre
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Select your motorcycle wheel dimensions to find matching genuine Vredestein stock in Selby.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.1, ease: PERFORMANCE_EASE }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-5 items-end"
          >
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Position
              <select
                value={finderPosition}
                onChange={(e) => onPositionChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs sm:text-sm text-white outline-none focus:border-primary font-medium transition-colors"
              >
                <option value="All">All Positions</option>
                <option value="Front">Front Tyre</option>
                <option value="Rear">Rear Tyre</option>
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Width (mm)
              <select
                value={finderWidth}
                onChange={(e) => onWidthChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs sm:text-sm text-white outline-none focus:border-primary font-medium transition-colors"
              >
                <option value="All">All Widths</option>
                <option value="120">120 mm (Front)</option>
                <option value="180">180 mm (Rear)</option>
                <option value="190">190 mm (Rear)</option>
                <option value="200">200 mm (Rear)</option>
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Profile (%)
              <select
                value={finderProfile}
                onChange={(e) => onProfileChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs sm:text-sm text-white outline-none focus:border-primary font-medium transition-colors"
              >
                <option value="All">All Profiles</option>
                <option value="50">50</option>
                <option value="55">55</option>
                <option value="70">70</option>
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Rim Diameter
              <select
                disabled
                className="mt-1.5 h-11 w-full rounded-md border border-neutral-800 bg-neutral-900/60 px-3 text-xs sm:text-sm text-neutral-500 outline-none font-medium cursor-not-allowed"
              >
                <option>17" (ZR17)</option>
              </select>
            </label>

            <div className="col-span-2 sm:col-span-1 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.025, transition: { duration: 0.15, ease: PERFORMANCE_EASE } }}
                whileTap={{ scale: 0.96, transition: { duration: 0.1, ease: TACTILE_EASE } }}
                onClick={onApply}
                className="h-11 flex-1 rounded-md bg-primary px-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search size={14} />
                <span className="truncate">Find Tyres</span>
              </motion.button>
              <motion.button
                whileHover={{ rotate: -45, scale: 1.06, transition: { duration: 0.2, ease: PERFORMANCE_EASE } }}
                whileTap={{ scale: 0.94 }}
                onClick={onReset}
                title="Reset finder"
                aria-label="Reset tyre finder filters"
                className="h-11 px-3 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

