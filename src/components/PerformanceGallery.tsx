import { Camera, ArrowRight } from "lucide-react";
import riderTrackAsset from "../assets/a2e33fb2f4a33ac97cd10c97f2d215ed.jpg";
import tyreMacroAsset from "../assets/0203d32f4212b2e0b2a9df4b0f0db2f3.jpg";
import superbikeAsset from "../assets/01ecd86a0585bbcc8e8bb93c9de047f7.jpg";
import moodyBikeAsset from "../assets/4298f1d6724ee05cbb8ca427a0471e9c.jpg";
import { resolveAsset } from "../lib/assetHelper";

interface PerformanceGalleryProps {
  onScrollToTyres: () => void;
}

export function PerformanceGallery({ onScrollToTyres }: PerformanceGalleryProps) {
  const card1Img = resolveAsset(["cf1351f6", "cf13", "nissin", "front"], riderTrackAsset);
  const card2Img = resolveAsset(["IMG_4940", "IMG4940", "4940"], tyreMacroAsset);
  const card3Img = resolveAsset(["4441b341", "4441", "ducati", "stand"], superbikeAsset);
  const card4Img = resolveAsset(["13cc2253", "13cc", "swingarm", "chain"], moodyBikeAsset);
  const card5Img = resolveAsset(["e086514c", "e086", "exhaust"], riderTrackAsset);
  const card6Img = resolveAsset(["IMG_4939", "IMG4939", "4939", "tarmac"], superbikeAsset);
  const galleryBgPhoto = resolveAsset(["cf1351f6", "e086514c", "track"], superbikeAsset);

  return (
    <section className="border-b border-border bg-neutral-950 text-white py-14 sm:py-20 relative overflow-hidden">
      {/* Full background picture with tuned opacity, maintaining the black colour theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={galleryBgPhoto}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-90 filter contrast-105"
        />
        <div className="absolute inset-0 bg-neutral-950/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-neutral-950/85" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Camera size={14} className="text-amber-400" />
              R&amp;C Performance Showcase
            </div>
            <h3 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-white">
              Tested On Track · Proven On Tarmac
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-400 max-w-xl">
              Centauro NS &amp; ST tyres deliver progressive feedback, extreme lean angle confidence, and enduring stability on South African mountain passes and highways.
            </p>
          </div>
          <div>
            <button
              onClick={onScrollToTyres}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors"
            >
              Explore Sizes &amp; Prices <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Track cornering & Front Braking */}
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={card1Img}
                alt="Motorcycle track cornering with knee-down lean angle"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Track-Day Grip</span>
              <h4 className="font-display text-base font-bold text-white mt-0.5">Knee-Down Cornering</h4>
              <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                Dual-compound shoulder rubber maintains razor-sharp footprint stability at extreme lean angles.
              </p>
            </div>
          </div>

          {/* Card 2: Tread Macro */}
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={card2Img}
                alt="Vredestein Centauro tread sipe pattern and silica compound macro"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">Dutch Siping</span>
              <h4 className="font-display text-base font-bold text-white mt-0.5">High-Silica Tread Matrix</h4>
              <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                Engineered groove angles evacuate surface water rapidly for uncompromised wet weather safety.
              </p>
            </div>
          </div>

          {/* Card 3: Superbike Machine */}
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={card3Img}
                alt="High performance superbike fitted with Centauro performance tyres"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Superbike Spec</span>
              <h4 className="font-display text-base font-bold text-white mt-0.5">Chassis &amp; Belt Harmony</h4>
              <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                Zero-degree steel belt cords eliminate tyre growth at 200+ km/h for laser-true tracking.
              </p>
            </div>
          </div>

          {/* Card 4: Swingarm & Drive Chain */}
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={card4Img}
                alt="Carbon fiber swingarm and tyre drive surface"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">Mechanical Drive</span>
              <h4 className="font-display text-base font-bold text-white mt-0.5">High-Torque Transfer</h4>
              <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                Engineered carcass structure handles brutal low-gear drive out of turns without spinning up.
              </p>
            </div>
          </div>

          {/* Card 5: Thermal Endurance */}
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={card5Img}
                alt="Motorcycle tyre heat dissipation and scrubbed surface"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Thermal Endurance</span>
              <h4 className="font-display text-base font-bold text-white mt-0.5">Even Shoulder Wear</h4>
              <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                Advanced silica compounds resist thermal degradation even under aggressive acceleration.
              </p>
            </div>
          </div>

          {/* Card 6: Apex Drive Stance */}
          <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={card6Img}
                alt="Sportbike tyre contact patch at high speed"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">Highway Touring</span>
              <h4 className="font-display text-base font-bold text-white mt-0.5">High Mileage Balance</h4>
              <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                Uniform contact pressure distribution prevents center squaring during extended highway journeys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
