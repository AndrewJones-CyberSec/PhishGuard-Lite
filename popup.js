const scoreBadge = document.getElementById("scoreBadge");
const statusText = document.getElementById("statusText");
const riskLabel = document.getElementById("riskLabel");
const lastScanned = document.getElementById("lastScanned");
const meterFill = document.getElementById("meterFill");
const pageUrl = document.getElementById("pageUrl");
const findingCount = document.getElementById("findingCount");
const findingList = document.getElementById("findingList");
const optionsButton = document.getElementById("optionsButton");

function normalizeThresholds(thresholds = {}) {
  const caution = Number(thresholds.caution) || 25;
  const suspicious = Number(thresholds.suspicious) || 50;
  const dangerous = Number(thresholds.dangerous) || 75;

  return { caution, suspicious, dangerous };
}

function riskClass(score, thresholds) {
  const normalizedThresholds = normalizeThresholds(thresholds);

  if (score >= normalizedThresholds.dangerous) {
    return "dangerous";
  }
  if (score >= normalizedThresholds.suspicious) {
    return "suspicious";
  }
  if (score >= normalizedThresholds.caution) {
    return "caution";
  }
  return "low";
}

function formatTimestamp(value) {
  if (!value) {
    return "Not scanned yet";
  }

  return `Last scanned ${new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  })}`;
}

function renderEmpty(tabUrl) {
  statusText.textContent = "No scan result yet";
  scoreBadge.textContent = "--";
  scoreBadge.className = "score-badge low";
  riskLabel.textContent = "Unknown";
  lastScanned.textContent = "Not scanned yet";
  meterFill.style.width = "0%";
  pageUrl.textContent = tabUrl || "Open a webpage to scan it.";
  findingCount.textContent = "0";
  findingList.innerHTML = "";

  const item = document.createElement("li");
  item.className = "finding low";
  item.innerHTML = `
    <div class="finding-title">
      <span>Waiting for page scan</span>
      <span class="severity">Info</span>
    </div>
    <p>Reload the page if Chrome has not injected the content script yet. Local browser pages such as chrome:// cannot be scanned by extensions.</p>
  `;
  findingList.append(item);
}

function renderFindings(findings) {
  findingList.innerHTML = "";

  if (!findings || findings.length === 0) {
    const item = document.createElement("li");
    item.className = "finding low";
    item.innerHTML = `
      <div class="finding-title">
        <span>No phishing indicators found</span>
        <span class="severity">Info</span>
      </div>
      <p>PhishGuard Lite did not see risky form, domain, or redirect patterns on this page. This does not guarantee the page is safe.</p>
    `;
    findingList.append(item);
    return;
  }

  for (const finding of findings) {
    const item = document.createElement("li");
    item.className = `finding ${finding.severity}`;

    const title = document.createElement("div");
    title.className = "finding-title";

    const titleText = document.createElement("span");
    titleText.textContent = finding.title;

    const severity = document.createElement("span");
    severity.className = "severity";
    severity.textContent = finding.severity;

    const explanation = document.createElement("p");
    explanation.textContent = finding.explanation;

    title.append(titleText, severity);
    item.append(title, explanation);

    if (finding.evidence) {
      const evidence = document.createElement("div");
      evidence.className = "evidence";
      evidence.textContent = finding.evidence;
      item.append(evidence);
    }

    findingList.append(item);
  }
}

function renderResult(result, tabUrl) {
  const score = Number(result.score || 0);
  const className = riskClass(score, result.thresholds);

  statusText.textContent = "Current tab analyzed";
  scoreBadge.textContent = String(score);
  scoreBadge.className = `score-badge ${className}`;
  riskLabel.textContent = result.label || "Low Risk";
  lastScanned.textContent = formatTimestamp(result.lastUpdated);
  meterFill.style.width = `${score}%`;
  meterFill.style.background = getComputedStyle(scoreBadge).backgroundColor;
  pageUrl.textContent = result.url || tabUrl || "Unknown URL";
  findingCount.textContent = String((result.findings || []).length);
  renderFindings(result.findings || []);
}

async function loadCurrentTabResult() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.id === undefined) {
    renderEmpty("");
    return;
  }

  chrome.runtime.sendMessage(
    { type: "PHISHGUARD_GET_RESULT", tabId: tab.id },
    (response) => {
      if (chrome.runtime.lastError || !response?.result) {
        renderEmpty(tab.url);
        return;
      }

      renderResult(response.result, tab.url);
    }
  );
}

optionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

loadCurrentTabResult();
