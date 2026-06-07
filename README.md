# PhishGuard Lite

PhishGuard Lite is a privacy-preserving Chrome extension that warns users about common phishing indicators while they browse. It analyzes page structure, URLs, domains, forms, and navigation behavior, then shows an explainable risk score in the extension popup.

PhishGuard Lite is a warning tool only. It does not block pages, submit forms, collect credentials, or send browsing data to a server.

## What It Detects

- Lookalike domains that resemble protected brands, such as `paypa1.com` resembling `paypal.com`.
- Simple leetspeak substitutions, including `0 -> o`, `1 -> l`, and `3 -> e`.
- Suspicious URL words such as `login`, `verify`, `secure`, `account`, `update`, `billing`, `support`, and `reset`.
- Login or account-related forms based on field structure.
- Credential-style forms on HTTP pages.
- Credential-style forms that submit to another domain.
- Form actions that submit to a raw IP address.
- Navigation chains with multiple redirects or suspicious domain changes.

## Privacy

PhishGuard Lite is designed to inspect security signals without reading private user input.

It does not collect, store, transmit, log, or read:

- Usernames
- Passwords
- Cookies
- Tokens
- Typed form values
- Submitted form contents
- Local storage or session storage secrets

The extension only inspects metadata and structure needed for phishing-risk analysis:

- Current page URL and domain
- Form action URLs
- Form methods
- Input field types and attributes
- Whether a form appears credential-related
- Browser navigation and redirect behavior

Scan results are stored locally with `chrome.storage.local` so the popup can show the current tab's findings. No scan data is sent to any external service.

## Risk Score

PhishGuard Lite assigns each page a score from `0` to `100`.

| Score | Label |
| --- | --- |
| 0-24 | Low Risk |
| 25-49 | Caution |
| 50-74 | Suspicious |
| 75-100 | Dangerous |

The score is based on findings such as lookalike domains, risky forms, HTTP login behavior, raw IP form actions, and redirect patterns. A higher score means the page has more indicators that are commonly associated with phishing.

The score is a heuristic, not a final verdict. A low score does not guarantee a page is safe, and a high score does not prove a page is malicious.

## Installation

PhishGuard Lite is distributed as an unpacked Chrome extension.

### Download From GitHub

1. Open the GitHub repository page.
2. Click **Code**.
3. Click **Download ZIP**.
4. Extract the ZIP file to a folder on your computer.

### Load in Chrome

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted PhishGuard Lite folder.
6. Pin **PhishGuard Lite** from the Chrome extensions menu.

After installation, reload any pages that were already open so Chrome can inject the content script.

## Using PhishGuard Lite

1. Visit a webpage.
2. Click the PhishGuard Lite icon in the Chrome toolbar.
3. Review the current page URL, risk score, risk label, and findings.
4. Read each finding's explanation to understand why the behavior may be risky.

PhishGuard Lite does not block navigation. If a page receives a high score, review the URL carefully, avoid entering sensitive information, and consider leaving the page.

## Popup Results

The popup displays:

- Current page URL
- Risk score
- Risk label
- Last scanned time
- Number of findings
- Finding severity
- Plain-language explanation for each finding
- Evidence such as matched suspicious words or mismatched form-action domains

The extension badge also changes when risk increases:

- No badge: Low Risk
- `?`: Caution
- `!`: Suspicious
- `!!`: Dangerous

## Options

Open the Options page from either:

- The **Options** button in the popup
- `chrome://extensions` -> PhishGuard Lite -> **Details** -> **Extension options**

The Options page lets users customize:

- Protected brands used for lookalike-domain detection
- Risk thresholds for Caution, Suspicious, and Dangerous labels

Brand entries use this format:

```text
Brand Name | domain.com | keyword1, keyword2
```

Example:

```text
Example Bank | examplebank.com | example, bank
```

Settings are stored locally in Chrome. Reload open tabs after changing settings so pages are rescanned with the updated configuration.

## Safe Local Test Page

The repository includes a safe test page:

```text
test-pages/fake-login.html
```

This page intentionally contains phishing indicators for testing:

- Credential-style fields
- HTTP form action
- Raw IP form destination

The test page uses a non-submitting button and does not collect credentials. Do not enter real credentials into any test or training page.

To test local `file://` pages:

1. Open `chrome://extensions`.
2. Open PhishGuard Lite **Details**.
3. Enable **Allow access to file URLs**.
4. Open `test-pages/fake-login.html` in Chrome.
5. Click the PhishGuard Lite icon.

## How Detection Works

### Domain Lookalike Detection

PhishGuard Lite compares the current domain against a protected brand list. It normalizes common leetspeak characters and uses a small string-distance check to identify close matches.

Example:

```text
paypa1.com -> paypal.com
```

This helps identify domains that visually or textually resemble trusted brands.

### Form Inspection

The content script scans form structure only. It checks field types and attributes such as `type`, `name`, `id`, `autocomplete`, `aria-label`, and `placeholder`.

It never reads `input.value` or any typed form content.

The background service worker checks whether credential-style forms:

- Appear on HTTP pages
- Submit over HTTP
- Submit to another domain
- Submit to a raw IP address

### Redirect Tracking

PhishGuard Lite uses Chrome `webNavigation` events to keep a short navigation chain for each tab. Multiple redirects or several domain changes can increase the risk score.

### Local Scoring

Findings are assigned severity values and converted into a local `0-100` score. Scores are capped at `100` and mapped to the risk labels shown in the popup.

## Troubleshooting

### The Popup Says No Scan Result Yet

Reload the current page. Chrome may not inject the content script into pages that were already open before the extension was installed.

### The Extension Does Not Work on chrome:// Pages

Chrome does not allow extensions to scan internal pages such as `chrome://extensions`, `chrome://settings`, or the Chrome Web Store.

### The Local Test Page Does Not Show Findings

Enable **Allow access to file URLs** in the extension details page, then reload the local test page.

### Settings Do Not Seem to Apply

Reload the page after saving Options changes. Existing tabs need a fresh scan before the popup reflects updated brands or thresholds.

## For Developers

PhishGuard Lite is built with:

- Manifest V3
- JavaScript
- Chrome Extension APIs
- Service worker background script
- Content scripts
- `chrome.storage.local`
- `chrome.runtime.sendMessage`
- `chrome.webNavigation`

### Project Structure

```text
manifest.json
background.js
content.js
popup.html
popup.css
popup.js
options.html
options.css
options.js
utils/domainUtils.js
utils/scoring.js
utils/settings.js
utils/formScanner.js
data/brandList.js
test-pages/fake-login.html
tests/run-tests.js
package.json
README.md
```

### Run Tests

The test suite uses Node's built-in `assert` module and does not require third-party packages.

```bash
npm test
```

The tests cover:

- Lookalike domain detection
- Avoiding false positives for real protected domains
- Suspicious URL word matching
- Raw IP address detection
- Default and custom risk thresholds
- Options-page brand parsing

## Limitations

- PhishGuard Lite uses heuristics and can produce false positives or false negatives.
- It does not use Google Safe Browsing or live threat intelligence feeds.
- It does not fully detect Unicode homograph or punycode attacks.
- Public suffix parsing is intentionally lightweight.
- Redirect analysis is limited to recent tab navigation events.
- Browser internal pages cannot be scanned by content scripts.

## Future Improvements

- Google Safe Browsing or threat-intelligence integration
- Punycode and Unicode homograph detection
- More complete public suffix parsing
- Richer redirect timeline analysis
- Optional warning page before visiting high-risk pages
- More tests for form analysis and redirect behavior
- User-managed allowlist for trusted domains

## Safety Boundary

PhishGuard Lite is defensive software. It does not include credential harvesting, phishing kits, page cloning, form-submission interception, or any feature designed to collect or exfiltrate sensitive user data.
