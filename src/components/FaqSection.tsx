import React, { useState } from "react";
import {
  ChevronDown,
  Truck,
  RotateCcw,
  ShieldCheck,
  HelpCircle,
  Mail,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  tag?: string;
  action?: {
    type: "contact";
    email?: string;
    whatsapp?: string;
    whatsappFormatted?: string;
  };
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 1,
    question: "Do you deliver?",
    answer: "Yes, we deliver nationwide across South Africa.",
    icon: Truck,
    tag: "Free Nationwide Delivery",
  },
  {
    id: 2,
    question: "Can I return an item if it is incorrect?",
    answer:
      "Yes. Items can be returned provided they are couriered back to us in their original packaging.",
    icon: RotateCcw,
    tag: "Returns Policy",
  },
  {
    id: 3,
    question: "Do tyres come with a warranty?",
    answer:
      "Yes. Tyres carry a factory warranty, provided they are fitted by a registered and reputable fitment centre.",
    icon: ShieldCheck,
    tag: "Factory Warranty",
  },
  {
    id: 4,
    question: "How do I order from the catalogue?",
    answer:
      "You can place an order by emailing enquiries@bikesharp.co.za or via WhatsApp on 083 467 1394.",
    icon: HelpCircle,
    tag: "Ordering",
    action: {
      type: "contact",
      email: "enquiries@bikesharp.co.za",
      whatsapp: "27834671394",
      whatsappFormatted: "083 467 1394",
    },
  },
];

export function FaqSection() {
  // Keep first two open by default for immediate readability
  const [openItems, setOpenItems] = useState<number[]>([1, 2, 3, 4]);

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => setOpenItems([1, 2, 3, 4]);
  const collapseAll = () => setOpenItems([]);

  return (
    <section
      id="faq"
      className="relative scroll-mt-24 border-t border-neutral-800 bg-neutral-950 py-16 sm:py-20 text-white"
    >
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 size-80 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-10 border-b border-neutral-800/80">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-3">
              <Sparkles size={13} />
              <span>Customer Help &amp; Policies</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2.5 max-w-2xl text-sm sm:text-base text-neutral-400 leading-relaxed">
              Clear answers regarding our nationwide courier delivery, returns policy, tyre factory
              warranties, and how to place orders from the catalogue.
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <button
              onClick={expandAll}
              className="rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 font-semibold text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 font-semibold text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-8 space-y-4">
          {FAQ_DATA.map((faq) => {
            const isOpen = openItems.includes(faq.id);
            const Icon = faq.icon;

            return (
              <div
                key={faq.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? "border-primary/50 bg-neutral-900/80 shadow-lg shadow-black/40"
                    : "border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/60"
                }`}
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`grid size-11 sm:size-12 shrink-0 place-items-center rounded-xl transition-colors ${
                        isOpen
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
                          0{faq.id}
                        </span>
                        {faq.tag && (
                          <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold text-neutral-300 uppercase tracking-wider">
                            {faq.tag}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-base sm:text-lg uppercase tracking-tight text-white">
                        {faq.question}
                      </h3>
                    </div>
                  </div>

                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-lg border border-neutral-800 transition-transform duration-200 ${
                      isOpen
                        ? "rotate-180 bg-neutral-800 text-white"
                        : "bg-neutral-900 text-neutral-400"
                    }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1">
                    <div className="border-t border-neutral-800/80 pt-4 pl-0 sm:pl-16">
                      <p className="text-sm sm:text-base leading-relaxed text-neutral-300">
                        {faq.answer}
                      </p>

                      {/* Direct Interactive Links for Question 4 (Ordering) */}
                      {faq.action && (
                        <div className="mt-4 flex flex-wrap items-center gap-3 pt-2">
                          {faq.action.whatsapp && (
                            <a
                              href={`https://wa.me/${faq.action.whatsapp}?text=${encodeURIComponent(
                                "Hi, I would like to place an order from the R&C Commodities catalogue."
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-500 transition-all cursor-pointer active:scale-95"
                            >
                              <MessageSquare size={15} />
                              <span>WhatsApp ({faq.action.whatsappFormatted})</span>
                              <ExternalLink size={12} className="opacity-75" />
                            </a>
                          )}

                          {faq.action.email && (
                            <a
                              href={`mailto:${faq.action.email}?subject=${encodeURIComponent(
                                "Catalogue Order Request - R&C Commodities"
                              )}&body=${encodeURIComponent(
                                "Hi R&C Commodities / Bike Sharp,\n\nI would like to place an order for the following tyres/items from your catalogue:\n\n- Tyre / Item:\n- Quantity:\n- Delivery Address:\n- Contact Phone:\n\nThank you!"
                              )}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-700 transition-all cursor-pointer"
                            >
                              <Mail size={15} className="text-primary" />
                              <span>Email ({faq.action.email})</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Help Footer Box */}
        <div className="mt-10 rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-neutral-900/90 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h4 className="font-display text-lg uppercase tracking-tight text-white">
              Still have a question or need fitment guidance?
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-neutral-400">
              Our Selby workshop team is available Monday to Saturday to assist you with tyre sizing, stock availability, and advice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://wa.me/27834671394?text=Hi%2C%20I%20have%20an%20enquiry%20regarding%20motorcycle%20tyres"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-500 transition-colors"
            >
              <MessageSquare size={15} />
              <span>WhatsApp: 083 467 1394</span>
            </a>

            <a
              href="mailto:enquiries@bikesharp.co.za"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-700 transition-colors"
            >
              <Mail size={15} className="text-primary" />
              <span>enquiries@bikesharp.co.za</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
