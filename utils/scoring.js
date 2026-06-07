// Risk scoring converts findings into a 0-100 score and a user-friendly label.
(function exposeScoring(global) {
  const SEVERITY_POINTS = {
    info: 5,
    low: 10,
    medium: 20,
    high: 35,
    critical: 50
  };
  const DEFAULT_THRESHOLDS = {
    caution: 25,
    suspicious: 50,
    dangerous: 75
  };

  function normalizeThresholds(thresholds = {}) {
    const requestedCaution = Number(thresholds.caution) || DEFAULT_THRESHOLDS.caution;
    const requestedSuspicious = Number(thresholds.suspicious) || DEFAULT_THRESHOLDS.suspicious;
    const requestedDangerous = Number(thresholds.dangerous) || DEFAULT_THRESHOLDS.dangerous;
    const caution = Math.max(1, Math.min(98, requestedCaution));
    const suspicious = Math.max(caution + 1, Math.min(99, requestedSuspicious));
    const dangerous = Math.max(suspicious + 1, Math.min(100, requestedDangerous));

    return {
      caution,
      suspicious,
      dangerous
    };
  }

  function severityRank(severity) {
    return {
      info: 0,
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    }[severity] || 0;
  }

  function dedupeFindings(findings) {
    const seen = new Set();
    const unique = [];

    for (const finding of findings || []) {
      const key = finding.id || `${finding.title}-${finding.evidence}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(finding);
      }
    }

    return unique;
  }

  function scoreFindings(findings, thresholds) {
    const normalizedThresholds = normalizeThresholds(thresholds);
    const uniqueFindings = dedupeFindings(findings);
    const rawScore = uniqueFindings.reduce((total, finding) => {
      return total + (SEVERITY_POINTS[finding.severity] || 0);
    }, 0);
    const score = Math.min(100, rawScore);

    return {
      score,
      label: labelForScore(score, normalizedThresholds),
      findings: uniqueFindings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    };
  }

  function labelForScore(score, thresholds) {
    const normalizedThresholds = normalizeThresholds(thresholds);

    if (score >= normalizedThresholds.dangerous) {
      return "Dangerous";
    }
    if (score >= normalizedThresholds.suspicious) {
      return "Suspicious";
    }
    if (score >= normalizedThresholds.caution) {
      return "Caution";
    }
    return "Low Risk";
  }

  function badgeForScore(score, thresholds) {
    const normalizedThresholds = normalizeThresholds(thresholds);

    if (score >= normalizedThresholds.dangerous) {
      return { text: "!!", color: "#b42318" };
    }
    if (score >= normalizedThresholds.suspicious) {
      return { text: "!", color: "#d97706" };
    }
    if (score >= normalizedThresholds.caution) {
      return { text: "?", color: "#ca8a04" };
    }
    return { text: "", color: "#2563eb" };
  }

  global.PhishGuardScoring = {
    badgeForScore,
    DEFAULT_THRESHOLDS,
    labelForScore,
    normalizeThresholds,
    scoreFindings
  };
})(globalThis);
