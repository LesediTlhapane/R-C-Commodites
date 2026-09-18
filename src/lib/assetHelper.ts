// Helper for resolving dynamic and uploaded assets in src/assets/ and public/
const assetModules = import.meta.glob<{ default: string }>("../assets/*", { eager: true });

/**
 * Searches the bundled assets in `../assets/*` for an image matching any of the candidate names or patterns.
 * If found, returns the resolved URL. Otherwise, returns the specified fallback URL.
 */
export function resolveAsset(candidates: string | string[], fallback: string): string {
  const candidateList = Array.isArray(candidates) ? candidates : [candidates];

  for (const candidate of candidateList) {
    // Normalization: lowercase, strip punctuation and spaces
    const cleanCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");

    for (const [path, mod] of Object.entries(assetModules)) {
      const fileName = path.split("/").pop() || "";
      const cleanFileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (cleanFileName.includes(cleanCandidate) || cleanCandidate.includes(cleanFileName)) {
        if (mod && mod.default) {
          return mod.default;
        }
      }
    }
  }

  return fallback;
}

/**
 * Resolves the specific profile photo for a tyre product if an uploaded photo matches its dimensions and range.
 * Specifically checks for uploaded photos like:
 * - "200 55 ZR 17 NS.PNG" -> 200/55 ZR 17 NS
 * - "190 50 ZR 17 ST.PNG" -> 190/50 ZR 17 ST
 * - "190 55 ZR 17 NS .PNG" -> 190/55 ZR 17 NS
 */
export function getTyreProfileImage(
  size: string,
  range: "NS" | "ST",
  fallback: string
): string {
  // e.g. "200/55 ZR 17" -> "200 55 zr 17"
  const cleanSize = size.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
  const searchPatterns = [
    `${cleanSize} ${range.toLowerCase()}`,
    `${cleanSize.replace(/\s+/g, "")}${range.toLowerCase()}`,
    `${size} ${range}`,
  ];

  return resolveAsset(searchPatterns, fallback);
}
