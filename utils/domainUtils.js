// Domain and URL helpers used by the background service worker.
(function exposeDomainUtils(global) {
  const SUSPICIOUS_WORDS = [
    "login",
    "verify",
    "secure",
    "account",
    "update",
    "billing",
    "support",
    "reset"
  ];

  const LEET_MAP = {
    "0": "o",
    "1": "l",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "@": "a",
    "$": "s"
  };

  function parseUrl(value) {
    try {
      return new URL(value);
    } catch (error) {
      return null;
    }
  }

  function normalizeHostname(hostname) {
    return String(hostname || "")
      .toLowerCase()
      .replace(/\.$/, "");
  }

  function stripCommonSubdomains(hostname) {
    return normalizeHostname(hostname).replace(/^(www|m|login|secure)\./, "");
  }

  function getRegistrableDomain(hostname) {
    const clean = stripCommonSubdomains(hostname);
    const parts = clean.split(".").filter(Boolean);

    if (parts.length <= 2) {
      return clean;
    }

    // Lightweight handling for common second-level public suffix patterns.
    const twoPartSuffixes = new Set(["co.uk", "com.au", "co.nz", "com.br"]);
    const lastTwo = parts.slice(-2).join(".");
    if (twoPartSuffixes.has(lastTwo) && parts.length >= 3) {
      return parts.slice(-3).join(".");
    }

    return parts.slice(-2).join(".");
  }

  function getDomainLabel(hostname) {
    const registrableDomain = getRegistrableDomain(hostname);
    return registrableDomain.split(".")[0] || "";
  }

  function normalizeLeetspeak(value) {
    return String(value || "")
      .toLowerCase()
      .split("")
      .map((char) => LEET_MAP[char] || char)
      .join("")
      .replace(/[^a-z0-9]/g, "");
  }

  function levenshteinDistance(a, b) {
    const left = String(a || "");
    const right = String(b || "");
    const rows = left.length + 1;
    const cols = right.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i += 1) {
      matrix[i][0] = i;
    }
    for (let j = 0; j < cols; j += 1) {
      matrix[0][j] = j;
    }

    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + substitutionCost
        );
      }
    }

    return matrix[left.length][right.length];
  }

  function isIpAddress(hostname) {
    const clean = normalizeHostname(hostname);
    const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
    const ipv6Pattern = /^\[?[a-f0-9:]+\]?$/i;
    return ipv4Pattern.test(clean) || (clean.includes(":") && ipv6Pattern.test(clean));
  }

  function sameRegistrableDomain(leftHostname, rightHostname) {
    return getRegistrableDomain(leftHostname) === getRegistrableDomain(rightHostname);
  }

  function findSuspiciousWords(urlValue) {
    const parsed = parseUrl(urlValue);
    const haystack = parsed
      ? `${parsed.hostname} ${parsed.pathname}`.toLowerCase()
      : String(urlValue || "").toLowerCase();

    return SUSPICIOUS_WORDS.filter((word) => haystack.includes(word));
  }

  function analyzeLookalikeDomain(urlValue, brands) {
    const parsed = parseUrl(urlValue);
    if (!parsed || !parsed.hostname) {
      return [];
    }

    const hostname = normalizeHostname(parsed.hostname);
    const registrableDomain = getRegistrableDomain(hostname);
    const domainLabel = getDomainLabel(hostname);
    const normalizedLabel = normalizeLeetspeak(domainLabel);
    const findings = [];

    for (const brand of brands || []) {
      const brandDomain = normalizeHostname(brand.domain);
      const brandLabel = getDomainLabel(brandDomain);
      const normalizedBrand = normalizeLeetspeak(brandLabel);

      if (registrableDomain === brandDomain || hostname.endsWith(`.${brandDomain}`)) {
        continue;
      }

      const distance = levenshteinDistance(normalizedLabel, normalizedBrand);
      const containsBrandKeyword = (brand.keywords || []).some((keyword) => {
        const normalizedKeyword = normalizeLeetspeak(keyword);
        return normalizedLabel.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedLabel);
      });
      const likelyLookalike =
        normalizedLabel.length >= 4 &&
        (distance > 0 && distance <= 2 || containsBrandKeyword);

      if (likelyLookalike) {
        findings.push({
          id: `lookalike-${brand.name.toLowerCase().replace(/\s+/g, "-")}`,
          severity: distance <= 1 ? "high" : "medium",
          title: `Possible ${brand.name} lookalike domain`,
          explanation: `${registrableDomain} is visually or textually close to ${brand.domain}. Phishing sites often use small spelling changes or leetspeak to imitate trusted brands.`,
          evidence: `Compared "${domainLabel}" with "${brandLabel}" after simple normalization.`
        });
      }
    }

    return findings;
  }

  global.PhishGuardDomainUtils = {
    SUSPICIOUS_WORDS,
    analyzeLookalikeDomain,
    findSuspiciousWords,
    getRegistrableDomain,
    isIpAddress,
    normalizeHostname,
    parseUrl,
    sameRegistrableDomain
  };
})(globalThis);
