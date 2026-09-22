import { useState } from "react";
import { Camera, ArrowRight, Eye, EyeOff, Layers } from "lucide-react";
import riderTrackAsset from "../assets/a2e33fb2f4a33ac97cd10c97f2d215ed.jpg";
import tyreMacroAsset from "../assets/0203d32f4212b2e0b2a9df4b0f0db2f3.jpg";
import superbikeAsset from "../assets/01ecd86a0585bbcc8e8bb93c9de047f7.jpg";
import moodyBikeAsset from "../assets/4298f1d6724ee05cbb8ca427a0471e9c.jpg";
import impossibleViewAsset from "../assets/impossibleview.png";
import { resolveAsset } from "../lib/assetHelper";

interface PerformanceGalleryProps {
  onScrollToTyres: () => void;
}

export function PerformanceGallery({ onScrollToTyres }: PerformanceGalleryProps) {
  const [activeTab, setActiveTab] = useState<"all" | "track" | "tech">("all");
  const [dimCards, setDimCards] = useState(false);

  const card1Img = resolveAsset(["cf1351f6", "cf13", "nissin", "front"], riderTrackAsset);
  const card2Img = resolveAsset(["IMG_4940", "IMG4940", "4940"], tyreMacroAsset);
  const card3Img = resolveAsset(["4441b341", "4441", "ducati", "stand"], superbikeAsset);
  const card4Img = resolveAsset(["13cc2253", "13cc", "swingarm", "chain"], moodyBikeAsset);
  const card5Img = resolveAsset(["e086514c", "e086", "exhaust"], riderTrackAsset);
  const card6Img = resolveAsset(["IMG_4939", "IMG4939", "4939", "tarmac"], superbikeAsset);
  const galleryBgPhoto = resolveAsset(
    ["impossibleview", "impossible view", "impossible"],
    impossibleViewAsset
  );

  const showcaseCards = [
    {
      id: "cornering",
      category: "track" as const,
      img: card1Img,
      alt: "Motorcycle track cornering with knee-down lean angle",
      badge: "Track-Day Grip",
      badgeColor: "text-amber-400",
      title: "Knee-Down Cornering",
      description: "Dual-compound shoulder rubber maintains razor-sharp footprint stability at extreme lean angles.",
    },
    {
      id: "tread",
      category: "tech" as const,
      img: card2Img,
      alt: "Vredestein Centauro tread sipe pattern and silica compound macro",
      badge: "Dutch Siping",
      badgeColor: "text-primary",
      title: "High-Silica Tread Matrix",
      description: "Engineered groove angles evacuate surface water rapidly for uncompromised wet weather safety.",
    },
    {
      id: "superbike",
      category: "track" as const,
      img: card3Img,
      alt: "High performance superbike fitted with Centauro performance tyres",
      badge: "Superbike Spec",
      badgeColor: "text-amber-400",
      title: "Chassis & Belt Harmony",
      description: "Zero-degree steel belt cords eliminate tyre growth at 200+ km/h for laser-true tracking.",
    },
    {
      id: "swingarm",
      category: "tech" as const,
      img: card4Img,
      alt: "Carbon fiber swingarm and tyre drive surface",
      badge: "Mechanical Drive",
      badgeColor: "text-primary",
      title: "High-Torque Transfer",
      description: "Engineered carcass structure handles brutal low-gear drive out of turns without spinning up.",
    },
    {
      id: "thermal",
      category: "tech" as const,
      img: card5Img,
      alt: "Motorcycle tyre heat dissipation and scrubbed surface",
      badge: "Thermal Endurance",
      badgeColor: "text-amber-400",
      title: "Even Shoulder Wear",
      description: "Advanced silica compounds resist thermal degradation even under aggressive acceleration.",
    },
    {
      id: "apex",
      category: "track" as const,
      img: card6Img,
      alt: "Sportbike tyre contact patch at high speed",
      badge: "Highway Touring",
      badgeColor: "text-primary",
      title: "High Mileage Balance",
      description: "Uniform contact pressure distribution prevents center squaring during extended highway journeys.",
    },
  ];

  const visibleCards = activeTab === "all"
    ? showcaseCards
    : showcaseCards.filter((c) => c.category === activeTab);

  return (
    <section id="showcase" className="border-b border-border bg-neutral-950 text-white py-16 sm:py-24 relative overflow-hidden">
      {/* Full background picture with tuned opacity lowered slightly for optimal dark theme balance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={galleryBgPhoto}
          alt="R&C Performance Showcase impossible view background"
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-75 sm:opacity-80 filter contrast-105"
        />
        {/* Soft edge darkening preserving high image visibility and readability */}
        <div className="absolute inset-0 bg-neutral-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/15 to-neutral-950/75" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
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

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setDimCards(!dimCards)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700/80 bg-neutral-900/80 backdrop-blur-md px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:border-amber-400 transition-colors"
              title="Dim cards to view background image clearly"
            >
              {dimCards ? <EyeOff size={14} className="text-amber-400" /> : <Eye size={14} className="text-amber-400" />}
              <span>{dimCards ? "Restore Cards" : "Peek Background"}</span>
            </button>
            <button
              onClick={onScrollToTyres}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors ml-2"
            >
              Explore Sizes &amp; Prices <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Split Out Filter Controls — Allows viewing subsets to expose more of the background image */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="inline-flex rounded-xl bg-neutral-900/85 p-1 border border-neutral-800/80 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-amber-500 text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All Highlights ({showcaseCards.length})
            </button>
            <button
              onClick={() => setActiveTab("track")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "track"
                  ? "bg-amber-500 text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Track Dynamics (3)
            </button>
            <button
              onClick={() => setActiveTab("tech")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "tech"
                  ? "bg-amber-500 text-neutral-950 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Compound &amp; Tech (3)
            </button>
          </div>

          <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
            Background: Selby Performance Studio
          </span>
        </div>

        {/* Spaced-Out Media Grid with Sleeker Aspect Ratio and Breathing Room */}
        <div
          className={`grid gap-6 sm:gap-7 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ${
            dimCards ? "opacity-25 hover:opacity-100" : "opacity-100"
          }`}
        >
          {visibleCards.map((card) => (
            <div
              key={card.id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xs shadow-xl transition-all duration-300 hover:border-amber-500/50 hover:shadow-2xl"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={card.img}
                  alt={card.alt}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/45 to-transparent flex flex-col justify-end p-5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${card.badgeColor}`}>
                  {card.badge}
                </span>
                <h4 className="font-display text-base font-bold text-white mt-0.5">
                  {card.title}
                </h4>
                <p className="text-xs text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
