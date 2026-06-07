// Shared settings helpers for defaults, validation, and beginner-friendly storage.
(function exposeSettings(global) {
  const STORAGE_KEY = "phishGuardSettings";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function defaultSettings() {
    return {
      brands: clone(global.PhishGuardBrandList || []),
      thresholds: clone(global.PhishGuardScoring.DEFAULT_THRESHOLDS)
    };
  }

  function normalizeBrand(brand) {
    const name = String(brand?.name || "").trim();
    const domain = String(brand?.domain || "").trim().toLowerCase();
    const keywords = Array.isArray(brand?.keywords)
      ? brand.keywords.map((keyword) => String(keyword).trim().toLowerCase()).filter(Boolean)
      : [];

    if (!name || !domain || !domain.includes(".")) {
      return null;
    }

    return {
      name,
      domain,
      keywords
    };
  }

  function normalizeSettings(settings) {
    const defaults = defaultSettings();
    const brands = Array.isArray(settings?.brands)
      ? settings.brands.map(normalizeBrand).filter(Boolean)
      : defaults.brands;
    const thresholds = global.PhishGuardScoring.normalizeThresholds(settings?.thresholds);

    return {
      brands: brands.length > 0 ? brands : defaults.brands,
      thresholds
    };
  }

  function formatBrandsForTextarea(brands) {
    return (brands || [])
      .map((brand) => {
        const keywords = (brand.keywords || []).join(", ");
        return `${brand.name} | ${brand.domain} | ${keywords}`;
      })
      .join("\n");
  }

  function parseBrandsFromTextarea(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = "", domain = "", keywords = ""] = line.split("|").map((part) => part.trim());
        return normalizeBrand({
          name,
          domain,
          keywords: keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean)
        });
      })
      .filter(Boolean);
  }

  global.PhishGuardSettings = {
    STORAGE_KEY,
    defaultSettings,
    formatBrandsForTextarea,
    normalizeSettings,
    parseBrandsFromTextarea
  };
})(globalThis);
