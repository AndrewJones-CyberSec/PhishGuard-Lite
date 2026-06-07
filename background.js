importScripts(
  "data/brandList.js",
  "utils/domainUtils.js",
  "utils/scoring.js",
  "utils/settings.js"
);

const { PhishGuardDomainUtils, PhishGuardScoring, PhishGuardSettings } = globalThis;
const tabState = new Map();

function emptyState(url = "") {
  return {
    url,
    forms: [],
    navigationChain: [],
    lastUpdated: Date.now()
  };
}

function storageKey(tabId) {
  return `tab-${tabId}`;
}

function getState(tabId) {
  if (!tabState.has(tabId)) {
    tabState.set(tabId, emptyState());
  }
  return tabState.get(tabId);
}

function finding(id, severity, title, explanation, evidence = "") {
  return { id, severity, title, explanation, evidence };
}

function analyzeSuspiciousWords(url) {
  const words = PhishGuardDomainUtils.findSuspiciousWords(url);

  if (words.length === 0) {
    return [];
  }

  return [
    finding(
      "suspicious-url-words",
      "low",
      "Sensitive words in URL",
      "Words such as login, verify, account, billing, or reset can be legitimate, but attackers often use them to make phishing pages feel urgent or official.",
      `Matched: ${words.join(", ")}`
    )
  ];
}

function analyzeForms(pageUrl, forms) {
  const parsedPage = PhishGuardDomainUtils.parseUrl(pageUrl);
  if (!parsedPage) {
    return [];
  }

  const findings = [];
  const pageIsHttp = parsedPage.protocol === "http:";

  for (const form of forms || []) {
    const actionUrl = PhishGuardDomainUtils.parseUrl(form.action);
    const isCredentialForm =
      form.hasPasswordField ||
      form.hasEmailField ||
      form.hasCredentialHints ||
      form.credentialFieldCount > 0;

    if (!isCredentialForm) {
      continue;
    }

    findings.push(
      finding(
        `credential-form-${form.index}`,
        "low",
        "Credential-style form detected",
        "This page contains form fields that look related to login or account access. PhishGuard Lite checks the form structure only and never reads typed values.",
        `Form ${form.index + 1} has ${form.credentialFieldCount} credential-related field(s).`
      )
    );

    if (pageIsHttp) {
      findings.push(
        finding(
          `http-login-form-${form.index}`,
          "high",
          "Credential form on HTTP page",
          "Login forms should use HTTPS so network observers cannot read traffic in transit. HTTP login pages are a strong warning sign.",
          "The page URL uses http://."
        )
      );
    }

    if (actionUrl && actionUrl.protocol === "http:") {
      findings.push(
        finding(
          `http-form-action-${form.index}`,
          "medium",
          "Credential form submits over HTTP",
          "Even if the visible page is local or HTTPS, a credential form action that uses HTTP could send submitted data without transport encryption.",
          `Form action: ${actionUrl.href}`
        )
      );
    }

    if (actionUrl && !PhishGuardDomainUtils.sameRegistrableDomain(parsedPage.hostname, actionUrl.hostname)) {
      findings.push(
        finding(
          `cross-domain-form-${form.index}`,
          "high",
          "Credential form submits to another domain",
          "A login form that sends data to a different domain can be a phishing indicator, especially when the visible site and submission destination do not match.",
          `Page domain: ${parsedPage.hostname}; form action domain: ${actionUrl.hostname}`
        )
      );
    }

    if (actionUrl && PhishGuardDomainUtils.isIpAddress(actionUrl.hostname)) {
      findings.push(
        finding(
          `raw-ip-form-action-${form.index}`,
          "high",
          "Credential form submits to a raw IP address",
          "Legitimate account portals usually submit to named domains. A raw IP address can make the destination harder for users to recognize.",
          `Form action host: ${actionUrl.hostname}`
        )
      );
    }
  }

  return findings;
}

function analyzeRedirects(navigationChain) {
  const chain = navigationChain || [];
  if (chain.length < 2) {
    return [];
  }

  const domains = chain
    .map((item) => PhishGuardDomainUtils.parseUrl(item.url))
    .filter(Boolean)
    .map((url) => PhishGuardDomainUtils.getRegistrableDomain(url.hostname));
  const uniqueDomains = [...new Set(domains)];
  const redirectLikeEvents = chain.filter((item) => item.redirectLike).length;
  const findings = [];

  if (chain.length >= 4 || redirectLikeEvents >= 3) {
    findings.push(
      finding(
        "multiple-redirects",
        "medium",
        "Multiple redirects observed",
        "Several redirects before a page settles can be legitimate, but phishing campaigns often use redirect chains to hide the final destination.",
        `Observed ${chain.length} navigation event(s) in this tab.`
      )
    );
  }

  if (uniqueDomains.length >= 3) {
    findings.push(
      finding(
        "domain-changing-redirects",
        "medium",
        "Redirect chain changed domains",
        "Moving across several unrelated domains can make it harder to understand who controls the final page.",
        `Domains seen: ${uniqueDomains.join(" -> ")}`
      )
    );
  }

  return findings;
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(PhishGuardSettings.STORAGE_KEY);
  return PhishGuardSettings.normalizeSettings(stored[PhishGuardSettings.STORAGE_KEY]);
}

async function buildScanResult(tabId, state) {
  const settings = await loadSettings();
  const url = state.url || "";
  const findings = [
    ...PhishGuardDomainUtils.analyzeLookalikeDomain(url, settings.brands),
    ...analyzeSuspiciousWords(url),
    ...analyzeForms(url, state.forms),
    ...analyzeRedirects(state.navigationChain)
  ];
  const scored = PhishGuardScoring.scoreFindings(findings, settings.thresholds);

  return {
    tabId,
    url,
    score: scored.score,
    label: scored.label,
    findings: scored.findings,
    formCount: (state.forms || []).length,
    navigationChain: state.navigationChain || [],
    thresholds: settings.thresholds,
    lastUpdated: Date.now()
  };
}

async function saveAndBadge(tabId) {
  const state = getState(tabId);
  const result = await buildScanResult(tabId, state);
  await chrome.storage.local.set({ [storageKey(tabId)]: result });

  const badge = PhishGuardScoring.badgeForScore(result.score, result.thresholds);
  await chrome.action.setBadgeText({ tabId, text: badge.text });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: badge.color });

  return result;
}

function addNavigationEvent(tabId, url, redirectLike = false) {
  const state = getState(tabId);
  const previous = state.navigationChain[state.navigationChain.length - 1];

  state.url = url;
  state.lastUpdated = Date.now();

  if (!previous || previous.url !== url) {
    state.navigationChain.push({
      url,
      redirectLike,
      at: Date.now()
    });
  }

  // Keep the chain small because it is only used for recent tab behavior.
  state.navigationChain = state.navigationChain.slice(-8);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PHISHGUARD_PAGE_SCAN" && sender.tab?.id !== undefined) {
    const tabId = sender.tab.id;
    const state = getState(tabId);
    state.url = message.url || sender.tab.url || state.url;
    state.forms = Array.isArray(message.forms) ? message.forms : [];
    state.lastUpdated = Date.now();

    saveAndBadge(tabId).then((result) => sendResponse({ ok: true, result }));
    return true;
  }

  if (message?.type === "PHISHGUARD_GET_RESULT") {
    chrome.storage.local.get(storageKey(message.tabId)).then((stored) => {
      sendResponse({ ok: true, result: stored[storageKey(message.tabId)] || null });
    });
    return true;
  }

  return false;
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) {
    return;
  }

  tabState.set(details.tabId, emptyState(details.url));
  addNavigationEvent(details.tabId, details.url, false);
  saveAndBadge(details.tabId);
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) {
    return;
  }

  const qualifiers = details.transitionQualifiers || [];
  const redirectLike =
    qualifiers.includes("server_redirect") ||
    qualifiers.includes("client_redirect") ||
    details.transitionType === "form_submit";

  addNavigationEvent(details.tabId, details.url, redirectLike);
  saveAndBadge(details.tabId);
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId !== 0) {
    return;
  }

  addNavigationEvent(details.tabId, details.url, false);
  saveAndBadge(details.tabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabState.delete(tabId);
  chrome.storage.local.remove(storageKey(tabId));
});
