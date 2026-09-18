import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Flame, ShieldCheck, Wrench, Truck, Phone } from "lucide-react";
import { ShopButton } from "./ShopButton";

import logoAsset from "../assets/rc-logo.png";
import tyre2Asset from "../assets/tyre2.jpg";
import superbikeAsset from "../assets/01ecd86a0585bbcc8e8bb93c9de047f7.jpg";
import tyreMacroAsset from "../assets/0203d32f4212b2e0b2a9df4b0f0db2f3.jpg";
import riderTrackAsset from "../assets/a2e33fb2f4a33ac97cd10c97f2d215ed.jpg";
import { resolveAsset } from "../lib/assetHelper";

interface HeroProps {
  onScrollTo: (id: string) => void;
}

const heroMediaItems = [
  {
    src: resolveAsset(["cf1351f6", "cf13", "cornering"], riderTrackAsset),
    alt: "Superbike knee-down track cornering on Vredestein Centauro tyres",
    label: "Cornering Grip",
    badge: "Track Attack",
    aspect: "object-cover",
    caption: "Extreme Lean Stability & Dual-Compound Shoulder Grip",
  },
  {
    src: logoAsset,
    alt: "R&C Commodities official logo - Vredestein Motorcycle Tyre Importer",
    label: "R&C Commodities",
    badge: "Official Importer",
    aspect: "object-contain p-8 sm:p-12 bg-neutral-950",
    caption: "R&C Commodities · Direct Vredestein Motorcycle Tyre Distributor (Selby, JHB)",
  },
  {
    src: resolveAsset(["IMG_4936", "IMG4936", "4936", "warehouse"], tyre2Asset),
    alt: "Vredestein Centauro motorcycle tyre stock pair",
    label: "Centauro Tyre Stock",
    badge: "Official Stock",
    aspect: "object-contain p-4 sm:p-6",
    caption: "Centauro Sport Touring & Super Sport Profile Stock in Selby",
  },
  {
    src: resolveAsset(["IMG_4940", "IMG4940", "4940"], tyreMacroAsset),
    alt: "Macro close-up of Vredestein Centauro tread sipes and silica compound",
    label: "Tread Siping",
    badge: "Dutch R&D",
    aspect: "object-cover",
    caption: "Full-Silica Polymer Matrix & Water Evacuation Sipes",
  },
  {
    src: resolveAsset(["4441b341", "4441", "ducati", "superbike"], superbikeAsset),
    alt: "High-performance superbike fitted with Centauro tyres ready for the road",
    label: "Superbike Stance",
    badge: "Ready to Fit",
    aspect: "object-cover",
    caption: "Zero-Degree Steel Belt Stability on Naked & Superbike Chassis",
  },
];

export function Hero({ onScrollTo }: HeroProps) {
  const [photoIdx, setPhotoIdx] = useState(0);

  const prevPhoto = () => {
    setPhotoIdx((curr) => (curr === 0 ? heroMediaItems.length - 1 : curr - 1));
  };

  const nextPhoto = () => {
    setPhotoIdx((curr) => (curr === heroMediaItems.length - 1 ? 0 : curr + 1));
  };

  return (
    <section className="relative overflow-hidden border-b border-border bg-background/50">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-foreground-muted shadow-xs w-fit">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Made in the Netherlands · European Tyre Engineering Since 1909
            </div>

            <h1 className="font-display text-4xl uppercase leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              Superbike tyres, <span className="text-primary">fitted properly.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-foreground-muted">
              Official South African distributor of genuine <strong className="text-foreground font-bold">Vredestein Centauro NS</strong> (Super Sport) and <strong className="text-foreground font-bold">Centauro ST</strong> (Sport Touring) motorcycle tyres. Zero-degree steel belt engineering delivering supreme grip, high mileage, and unshakable stability.
            </p>

            {/* Quick Action CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <ShopButton onClick={() => onScrollTo("finder")}>
                Find Your Tyre <ArrowRight size={17} />
              </ShopButton>

              <ShopButton variant="outline" onClick={() => onScrollTo("tyres")}>
                Shop Tyres
              </ShopButton>

              <button
                onClick={() => onScrollTo("combos")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold tracking-wider text-foreground-muted hover:text-foreground transition-colors"
              >
                <span>Matched Combos (Save up to R650)</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Range Quick Badges Matrix */}
            <div className="mt-10 grid max-w-xl grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 border-y border-border py-4 text-xs">
              <div className="sm:pr-3">
                <span className="block font-display text-base text-steel">Centauro ST</span>
                <span className="text-foreground-muted text-[11px] block mt-0.5">From R1,350 (Touring)</span>
              </div>
              <div className="sm:border-l sm:border-border sm:px-3">
                <span className="block font-display text-base text-primary">Centauro NS</span>
                <span className="text-foreground-muted text-[11px] block mt-0.5">From R1,900 (Sport)</span>
              </div>
              <div className="sm:border-l sm:border-border sm:px-3">
                <span className="block font-display text-base text-amber-500 font-black">Combos</span>
                <span className="text-foreground-muted text-[11px] block mt-0.5">From R2,940 (Pairs)</span>
              </div>
              <div className="sm:border-l sm:border-border sm:pl-3">
                <span className="block font-display text-base text-foreground">17-inch</span>
                <span className="text-foreground-muted text-[11px] block mt-0.5">120 to 200 sizes</span>
              </div>
            </div>
          </div>

          {/* Right Showcase: Interactive Multi-Angle Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-3.5">
            <div className="group relative aspect-[16/11] overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-2xl">
              <img
                key={photoIdx}
                src={heroMediaItems[photoIdx].src}
                alt={heroMediaItems[photoIdx].alt}
                className={`h-full w-full ${heroMediaItems[photoIdx].aspect} transition-all duration-500 group-hover:scale-105`}
              />

              {/* Photo Badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="rounded-md bg-neutral-900/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400 border border-neutral-700 shadow-md">
                  {heroMediaItems[photoIdx].badge}
                </span>
                <span className="rounded-md bg-neutral-950/80 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-neutral-300">
                  {photoIdx + 1} / {heroMediaItems.length}
                </span>
              </div>

              {/* Prev / Next Arrows */}
              <button
                type="button"
                aria-label="Previous view"
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-neutral-900/80 text-white backdrop-blur-sm transition-all hover:bg-primary hover:scale-110 shadow-lg"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Next view"
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-neutral-900/80 text-white backdrop-blur-sm transition-all hover:bg-primary hover:scale-110 shadow-lg"
              >
                <ChevronRight size={22} />
              </button>

              {/* Bottom Caption Overlay */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent p-4 sm:p-5">
                <p className="font-display text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                  {heroMediaItems[photoIdx].label}
                </p>
                <p className="mt-0.5 text-xs text-neutral-300 line-clamp-1">
                  {heroMediaItems[photoIdx].caption}
                </p>
              </div>
            </div>

            {/* Gallery Thumbnails row */}
            <div className="grid grid-cols-5 gap-2">
              {heroMediaItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setPhotoIdx(idx)}
                  className={`group relative aspect-[4/3] overflow-hidden rounded-lg border transition-all ${
                    photoIdx === idx
                      ? "border-primary ring-2 ring-primary/40 scale-102 shadow-md bg-neutral-900"
                      : "border-border bg-surface-soft hover:border-neutral-400 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-transparent" />
                </button>
              ))}
            </div>

            {/* Quick trust strip under gallery */}
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-neutral-950">
                  Vredestein Centauro
                </span>
                <span className="font-bold text-foreground">Dutch Engineering</span>
              </div>
              <div className="text-right">
                <span className="font-display font-bold text-primary mr-2">ST from R1,350</span>
                <span className="text-amber-500 font-bold">NS from R1,900</span>
              </div>
            </div>
          </div>
        </div>

        {/* High-Impact Trust & Conversion Pillars Strip */}
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-6 border-t border-border">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
              <ShieldCheck size={19} />
            </span>
            <div>
              <strong className="block font-display text-sm uppercase text-foreground">100% Genuine Tyres</strong>
              <span className="text-xs text-foreground-muted leading-relaxed">Direct Dutch European factory import with verified date codes.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <span className="grid size-9 place-items-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Wrench size={19} />
            </span>
            <div>
              <strong className="block font-display text-sm uppercase text-foreground">Selby Fitment Bay</strong>
              <span className="text-xs text-foreground-muted leading-relaxed">Precision static &amp; dynamic superbike wheel balancing.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
              <Truck size={19} />
            </span>
            <div>
              <strong className="block font-display text-sm uppercase text-foreground">Fast Courier Nationwide</strong>
              <span className="text-xs text-foreground-muted leading-relaxed">Safe, reliable courier dispatch across South Africa.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <span className="grid size-9 place-items-center rounded-lg bg-steel/10 text-steel shrink-0">
              <Phone size={19} />
            </span>
            <div>
              <strong className="block font-display text-sm uppercase text-foreground">Talk to Costa</strong>
              <span className="text-xs text-foreground-muted leading-relaxed">Direct expert sizing advice via phone or WhatsApp.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
