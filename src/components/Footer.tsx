import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Clock3, Sparkles, Maximize2, X, ExternalLink, Navigation } from "lucide-react";
import logoAsset from "../assets/rc-logo.png";
import superbikeAsset from "../assets/4441b341551467148ef7784290a470fd.jpg";
import { resolveAsset } from "../lib/assetHelper";

export function Footer() {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const footerBgPhoto = resolveAsset(["4441b341", "4441", "paddock", "superbike"], superbikeAsset);

  // Close modal on Escape key
  useEffect(() => {
    if (!isMapOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMapOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMapOpen]);

  return (
    <footer className="relative overflow-hidden border-t border-neutral-800 bg-neutral-950 text-white">
      {/* Full background picture with tuned opacity, maintaining the black colour theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={footerBgPhoto}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-bottom opacity-55 filter contrast-105"
        />
        <div className="absolute inset-0 bg-neutral-950/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/98 via-neutral-950/65 to-neutral-950/85" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          {/* Brand Col */}
          <div>
            <img
              src={logoAsset}
              alt="R&C Commodities logo"
              className="h-16 w-auto object-contain"
            />
            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-400">
              R&amp;C Commodities — Premier distributor of Vredestein Centauro NS and ST
              superbike motorcycle tyres and motorcycle accessories in Selby, Johannesburg.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <Sparkles size={14} /> Direct Importer Pricing · Selby Fitting
            </div>
          </div>

          {/* Contact Col */}
          <div>
            <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-amber-400">
              Contact &amp; Selby Workshop
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="tel:+27832273237"
                className="group flex gap-3 text-sm transition-colors hover:text-amber-300"
              >
                <Phone size={18} className="mt-0.5 shrink-0 text-primary group-hover:scale-110 transition-transform" />
                <span>
                  <strong className="block text-white">Phone</strong>
                  <span className="mt-1 block text-neutral-400">+27 83 227 3237</span>
                </span>
              </a>

              <a
                href="mailto:costa08@gmail.com"
                className="group flex gap-3 text-sm transition-colors hover:text-amber-300"
              >
                <Mail size={18} className="mt-0.5 shrink-0 text-primary group-hover:scale-110 transition-transform" />
                <span>
                  <strong className="block text-white">Email</strong>
                  <span className="mt-1 block text-neutral-400">costa08@gmail.com</span>
                </span>
              </a>

              {/* Location with Small Clickable Map */}
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                <div className="space-y-2.5">
                  <div>
                    <strong className="block text-white">Location</strong>
                    <span className="mt-0.5 block leading-5 text-neutral-400">
                      39 Webber Street<br />
                      Selby, Johannesburg
                    </span>
                  </div>

                  {/* Small Map Thumbnail Button */}
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="group relative h-20 w-36 sm:w-40 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-md hover:border-primary/80 hover:shadow-lg hover:shadow-primary/10 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer text-left block"
                    title="Click to open interactive map"
                    aria-label="Click to open interactive map of 39 Webber Street, Selby"
                  >
                    <iframe
                      title="Location thumbnail"
                      src="https://maps.google.com/maps?q=39%20Webber%20Street%2C%20Selby%2C%20Johannesburg&t=&z=14&ie=UTF8&iwloc=&output=embed"
                      className="h-full w-full border-0 pointer-events-none opacity-70 group-hover:opacity-95 group-hover:scale-105 transition-all duration-300 filter contrast-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-transparent pointer-events-none" />
                    <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-semibold text-white pointer-events-none">
                      <span className="flex items-center gap-1 text-amber-400">
                        <MapPin size={11} className="text-primary fill-primary" />
                        Open Map
                      </span>
                      <span className="grid size-4.5 place-items-center rounded-full bg-neutral-900/90 border border-neutral-700 text-neutral-300 group-hover:text-white group-hover:border-primary">
                        <Maximize2 size={9} />
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 text-sm">
                <Clock3 size={18} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  <strong className="block text-white">Hours</strong>
                  <span className="mt-1 block leading-5 text-neutral-400">
                    Monday – Friday<br />
                    08:00 – 17:00
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-neutral-800/80 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 R&amp;C Commodities. All rights reserved.</span>
          <span>Official South African importer of Vredestein Centauro Super Sport &amp; Sport Touring motorcycle tyres.</span>
        </div>
      </div>

      {/* Interactive Expanded Map Modal */}
      {isMapOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsMapOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 text-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 id="map-modal-title" className="text-base sm:text-lg font-bold uppercase tracking-tight text-white">
                    R&amp;C Commodities Workshop &amp; Fitment Bay
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400">
                    39 Webber Street, Selby, Johannesburg, 2001
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="grid size-9 place-items-center rounded-xl border border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close map"
              >
                <X size={18} />
              </button>
            </div>

            {/* Interactive Map Frame */}
            <div className="relative h-80 sm:h-[420px] w-full bg-neutral-950">
              <iframe
                title="Interactive Google Map of 39 Webber Street, Selby"
                src="https://maps.google.com/maps?q=39%20Webber%20Street%2C%20Selby%2C%20Johannesburg&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="h-full w-full border-0"
                loading="eager"
                allowFullScreen
              />
            </div>

            {/* Modal Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-950/80 px-5 py-3.5 sm:px-6">
              <div className="text-xs text-neutral-400 text-center sm:text-left">
                Conveniently situated in Selby with quick highway access via the M2 &amp; Booysens Road.
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=39+Webber+Street,+Selby,+Johannesburg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow-md"
                >
                  <Navigation size={14} /> Get Directions
                </a>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=39+Webber+Street,+Selby,+Johannesburg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <ExternalLink size={14} /> Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
