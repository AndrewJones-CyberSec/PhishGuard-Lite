const brandTextarea = document.getElementById("brandTextarea");
const cautionInput = document.getElementById("cautionInput");
const suspiciousInput = document.getElementById("suspiciousInput");
const dangerousInput = document.getElementById("dangerousInput");
const saveButton = document.getElementById("saveButton");
const resetButton = document.getElementById("resetButton");
const statusMessage = document.getElementById("statusMessage");

function showStatus(message) {
  statusMessage.textContent = message;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    statusMessage.textContent = "";
  }, 3500);
}

function fillForm(settings) {
  brandTextarea.value = PhishGuardSettings.formatBrandsForTextarea(settings.brands);
  cautionInput.value = settings.thresholds.caution;
  suspiciousInput.value = settings.thresholds.suspicious;
  dangerousInput.value = settings.thresholds.dangerous;
}

async function loadOptions() {
  const stored = await chrome.storage.local.get(PhishGuardSettings.STORAGE_KEY);
  fillForm(PhishGuardSettings.normalizeSettings(stored[PhishGuardSettings.STORAGE_KEY]));
}

function readFormSettings() {
  const brands = PhishGuardSettings.parseBrandsFromTextarea(brandTextarea.value);
  const thresholds = PhishGuardScoring.normalizeThresholds({
    caution: Number(cautionInput.value),
    suspicious: Number(suspiciousInput.value),
    dangerous: Number(dangerousInput.value)
  });

  return PhishGuardSettings.normalizeSettings({
    brands,
    thresholds
  });
}

async function saveOptions() {
  const settings = readFormSettings();
  await chrome.storage.local.set({ [PhishGuardSettings.STORAGE_KEY]: settings });
  fillForm(settings);
  showStatus("Settings saved locally. Reload open tabs to rescan with the new settings.");
}

async function resetOptions() {
  const defaults = PhishGuardSettings.defaultSettings();
  await chrome.storage.local.set({ [PhishGuardSettings.STORAGE_KEY]: defaults });
  fillForm(defaults);
  showStatus("Defaults restored.");
}

saveButton.addEventListener("click", saveOptions);
resetButton.addEventListener("click", resetOptions);
loadOptions();
