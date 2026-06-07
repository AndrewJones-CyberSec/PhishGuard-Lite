// Content scripts run inside the page but only inspect structure.
// This script never reads typed values from forms.
(function runPhishGuardContentScan() {
  function sendScan() {
    const forms = globalThis.PhishGuardFormScanner.scanForms(document, location.href);

    chrome.runtime.sendMessage({
      type: "PHISHGUARD_PAGE_SCAN",
      url: location.href,
      title: document.title,
      forms
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sendScan, { once: true });
  } else {
    sendScan();
  }

  // Modern sites often add login forms after load. Rescan structure when the DOM changes.
  let rescanTimer = null;
  const observer = new MutationObserver(() => {
    window.clearTimeout(rescanTimer);
    rescanTimer = window.setTimeout(sendScan, 500);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["action", "method", "type", "name", "id", "autocomplete"]
  });
})();
