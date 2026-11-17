export interface TyreModelGroup {
  category: string;
  models: string[];
}

export const TYRE_BRAND_TAXONOMY: Record<string, TyreModelGroup[]> = {
  Vredestein: [
    { category: "Sport Touring", models: ["Centauro ST"] },
    { category: "Sport", models: ["Centauro NS"] },
  ],
  Pirelli: [
    {
      category: "Road Race",
      models: [
        "Superbike Full Slicks",
        "Supercorsa SC Cut Slicks",
        "Supercorsa SP Track Days",
      ],
    },
    {
      category: "Sport & Road",
      models: ["Diablo Rosso 4 Corsa", "Diablo Rosso 4", "Diablo Rosso 3", "Sport Demon"],
    },
    {
      category: "Touring",
      models: ["Angel GT2", "Angel GT", "Angel ST"],
    },
    {
      category: "Custom & Cruiser",
      models: ["Night Dragon", "PowerCruiser"],
    },
    {
      category: "Adventure/Dual Purpose",
      models: [
        "Scorpion Trail 3",
        "Scorpion Trail 2",
        "Scorpion MT60 & MT60RS",
        "Scorpion MT90",
        "Scorpion Rally STR",
        "Scorpion Rally",
        "Scorpion MT21 Rallycross",
      ],
    },
    {
      category: "Off Road & MX",
      models: [
        "Scorpion MX Soft Sand",
        "Scorpion MX32 Mid Soft",
        "Scorpion MX32 Mid Hard",
        "Scorpion MX Extra X",
        "Scorpion XC Mid Soft",
        "Scorpion XC Mid Hard",
      ],
    },
    {
      category: "Scooter",
      models: ["Angel Scooter", "Diablo Rosso Scooter", "Angel CiTy"],
    },
  ],
  Metzeler: [
    {
      category: "Road Race",
      models: [
        "Racetec RR Full Slick",
        "Racetec RR Cut Slick",
        "Racetec RR Rain",
        "Racetec TD Slick",
        "Racetec SuperMoto",
      ],
    },
    {
      category: "Sport Road",
      models: ["Sportec M9 RR", "Sportec M7 RR", "Sportec M5 Interact"],
    },
    {
      category: "Touring",
      models: ["Roadtec 02", "Roadtec 01 SE", "Roadtec 01", "Roadtec Z8 Interact"],
    },
    {
      category: "Cruiser & Custom",
      models: ["Cruisetec", "ME888 Marathon"],
    },
    {
      category: "Dual Purpose/Adventure",
      models: ["Tourance Next 2", "Tourance Next", "Tourance", "Karoo Street", "Karoo 4", "Karoo Extreme"],
    },
    {
      category: "Off Road",
      models: ["MC360 Mid Soft", "6 Days Extreme"],
    },
    {
      category: "Scooter & Commuter",
      models: ["Block C", "ME22", "FeelFree"],
    },
  ],
  Kenda: [
    {
      category: "Road Tyres",
      models: ["Challenger K657", "Cruiser K671", "Cruz K673", "KM1 Radial"],
    },
    {
      category: "Dual Purpose",
      models: [
        "Big Block K784 50/50",
        "Dual K761 70/30",
        "Trakmaster DT 70/30",
        "K270 Dual Sport 50/50",
        "K280 Trail 60/40",
        "Paver K678 80/20",
        "Small Block K262 50/50",
      ],
    },
    {
      category: "Commercial & Scooter",
      models: ["Commercial Street", "Commercial Dual", "K413 Sporty Scooter", "Kenda Scooter Misc"],
    },
    {
      category: "Off Road Tyres",
      models: [
        "Carlsbad K772",
        "Ibex K774",
        "K774 Budds Creek",
        "Gauntlet K776 & K779",
        "Klassic MX K257",
        "Knarly K777",
        "Washougal",
      ],
    },
    {
      category: "ATV Sport",
      models: [
        "K300 Dominator",
        "Havok K3210F & K3211",
        "Klaw XC K532/3",
        "Scorpion K290",
        "Speed Racer K546/7",
      ],
    },
  ],
};

export const TYRE_BRANDS = Object.keys(TYRE_BRAND_TAXONOMY);

export const TYRE_CATEGORIES = Array.from(
  new Set(
    Object.values(TYRE_BRAND_TAXONOMY)
      .flat()
      .map((group) => group.category)
  )
);

export function getTyreModelCategory(brand: string | null | undefined, model: string): string | null {
  if (!brand || !model) return null;
  const groups = TYRE_BRAND_TAXONOMY[brand];
  if (!groups) return null;
  const normalizedModel = model.trim().toLowerCase();
  return (
    groups.find((group) =>
      group.models.some((candidate) => {
        const normalizedCandidate = candidate.toLowerCase();
        return (
          normalizedModel === normalizedCandidate ||
          normalizedModel.includes(normalizedCandidate) ||
          normalizedCandidate.includes(normalizedModel)
        );
      })
    )?.category || null
  );
}

export function getBrandModels(brand: string): string[] {
  return (TYRE_BRAND_TAXONOMY[brand] || []).flatMap((group) => group.models);
}
