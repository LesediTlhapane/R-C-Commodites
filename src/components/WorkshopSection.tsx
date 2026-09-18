import { Wrench, Truck, Check, Phone } from "lucide-react";
import superbikeAsset from "../assets/01ecd86a0585bbcc8e8bb93c9de047f7.jpg";
import detailAsset from "../assets/Centauro_detail.jpeg";
import { resolveAsset } from "../lib/assetHelper";

export function WorkshopSection() {
  const workshopBayImage = resolveAsset(["IMG_4951", "IMG4951", "4951", "fitment"], superbikeAsset);
  const warehouseStockImage = resolveAsset(["IMG_4936", "IMG4936", "4936", "warehouse"], detailAsset);

  return (
    <section id="workshop" className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid gap-8 lg:grid-cols-12 items-stretch">
        {/* Workshop & Selby Fitment Photos */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-xl relative group">
            <img
              src={workshopBayImage}
              alt="Motorcycle tyre fitment and bead seating on pneumatic machine in Selby workshop"
              className="h-full min-h-[360px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent flex flex-col justify-end p-5 text-white">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Selby Fitment Bay</span>
              <strong className="font-display text-base text-white">Superbike Specialist Care</strong>
              <span className="text-xs text-neutral-300 mt-0.5">Pneumatic bead breaker &amp; precision wheel balancing</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-xl relative group">
            <img
              src={warehouseStockImage}
              alt="Genuine European Vredestein Centauro motorcycle tyre stock in warehouse"
              className="h-full min-h-[360px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent flex flex-col justify-end p-5 text-white">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Direct From Holland</span>
              <strong className="font-display text-base text-white">Genuine Factory Stock</strong>
              <span className="text-xs text-neutral-300 mt-0.5">Matching date codes &amp; temperature stored</span>
            </div>
          </div>
        </div>

        {/* Why R&C Commodities info */}
        <div className="lg:col-span-6 relative overflow-hidden flex flex-col justify-center rounded-3xl bg-neutral-950 p-8 sm:p-12 text-white shadow-2xl border border-neutral-800">
          {/* Full background picture with tuned opacity, maintaining the black colour theme */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src={workshopBayImage}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-center opacity-50 filter contrast-105"
            />
            <div className="absolute inset-0 bg-neutral-950/65" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/98 via-neutral-950/80 to-neutral-950/50" />
          </div>

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              Workshop &amp; Direct Importer Service
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl uppercase tracking-tight text-white">
              Bought right. Fitted right.
            </h2>
            <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
              R&amp;C Commodities is your dedicated motorcycle tyre distributor and fitment specialist in Selby, Johannesburg.
              We provide tailored fitment advice for high-performance superbikes, naked roadsters, and touring machines.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-white shadow-md">
                  <Wrench size={18} />
                </span>
                <p className="text-sm text-neutral-200 pt-1">
                  Expert size, speed index, and compound guidance for your motorcycle model.
                </p>
              </div>

              <div className="flex items-start gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-white shadow-md">
                  <Truck size={18} />
                </span>
                <p className="text-sm text-neutral-200 pt-1">
                  Safe, insured courier delivery arranged across Johannesburg &amp; nationwide South Africa.
                </p>
              </div>

              <div className="flex items-start gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-white shadow-md">
                  <Check size={18} />
                </span>
                <p className="text-sm text-neutral-200 pt-1">
                  100% genuine factory-fresh Vredestein Centauro NS &amp; ST tyres direct from the European factory.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="tel:+27832273237"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover transition-colors shadow-lg active:scale-95"
              >
                <Phone size={16} /> Call Costa (+27 83 227 3237)
              </a>
              <a
                href="https://wa.me/27832273237?text=Hi%20Costa,%20I%20would%20like%20to%20check%20tyre%20fitment%20for%20my%20motorcycle"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900/90 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors backdrop-blur-xs"
              >
                WhatsApp Fitment Check
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
