import { Phone, Mail, MapPin, Clock3, Sparkles } from "lucide-react";
import logoAsset from "../assets/rc-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
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

              <div className="flex gap-3 text-sm">
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  <strong className="block text-white">Location</strong>
                  <span className="mt-1 block leading-5 text-neutral-400">
                    39 Webber Street<br />
                    Selby<br />
                    Johannesburg
                  </span>
                </span>
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
    </footer>
  );
}
