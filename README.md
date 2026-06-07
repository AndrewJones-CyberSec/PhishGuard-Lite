# PhishGuard Lite

PhishGuard Lite is a defensive cybersecurity learning project: a Manifest V3 Chrome extension that analyzes webpage structure, URLs, domains, forms, and navigation behavior to flag possible phishing indicators.

Version 1 warns only. It does not block pages.

## Features

- Domain lookalike checks against a small protected brand list.
- Simple leetspeak normalization such as `0 -> o`, `1 -> l`, and `3 -> e`.
- Levenshtein distance checks for domains like `paypa1.com` that resemble `paypal.com`.
- Suspicious URL word detection for terms such as `login`, `verify`, `secure`, `account`, `update`, `billing`, `support`, and `reset`.
- Form structure inspection for password, email, username, and login-related fields.
- Warnings when credential-style forms are on HTTP, submit to a different domain, or submit to a raw IP address.
- Redirect and navigation-chain tracking with Chrome `webNavigation` APIs.
- 0-100 risk scoring with clear labels:
  - `0-24`: Low Risk
  - `25-49`: Caution
  - `50-74`: Suspicious
  - `75-100`: Dangerous
- Popup UI showing the current page URL, score, label, findings, and educational explanations.
- Badge warnings for elevated risk pages.
- Options page for editing protected brands and score thresholds.
- Scan timestamp in the popup so demo results are easier to explain.
- No-dependency unit tests for the core detection helpers.
- Local test page with simulated phishing indicators.

## Privacy Statement

PhishGuard Lite is designed as a defensive learning tool and does not collect, store, transmit, log, or read usernames, passwords, cookies, tokens, or typed form input values.

The content script only inspects page structure and metadata, such as:

- Current page URL and domain.
- Form action URLs.
- Form methods.
- Input field types and attribute names.
- Whether fields look credential-related.
- Browser navigation and redirect behavior.

It does not read `input.value`, form submissions, cookies, local storage tokens, session storage tokens, or page secrets.

Scan results are stored locally with `chrome.storage.local` per tab so the popup can display findings. No data is sent to any server.

## Project Structure

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

## Install in Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder.
5. Pin **PhishGuard Lite** from the extensions menu.
6. To test `file://` pages, open the extension details page and enable **Allow access to file URLs**.

## Options Page

Open the extension details page and click **Extension options**, or click **Options** in the popup.

The options page lets you edit:

- Protected brands used by the lookalike-domain detector.
- Risk thresholds for Caution, Suspicious, and Dangerous labels.

Settings are stored locally in `chrome.storage.local`. Reload open tabs after changing settings so the content script and background scan refresh the result.

## Testing

### Portfolio demo checklist

Use this checklist for a short, safe demo:

1. Open `https://example.com` and show a Low Risk result.
2. Open `test-pages/fake-login.html` and show credential-form, HTTP action, and raw-IP findings.
3. Open the Options page and show the editable protected brand list.
4. Explain that the scanner stores findings locally and never reads typed form values.
5. Run `npm test` to show the domain, IP, scoring, and settings helper tests.

### Test the local form scanner

1. Load the extension using the steps above.
2. Open `test-pages/fake-login.html` in Chrome.
3. Click the PhishGuard Lite extension icon.
4. The popup should show warnings for:
   - A credential-style form.
   - A form action that uses HTTP.
   - A form action that submits to a raw IP address.

The test page uses a non-submitting button and does not collect credentials. Do not enter real credentials into any training page.

### Test lookalike domain logic

Visit a safe domain that you control or a local development page with a hostname that resembles a protected brand, such as `paypa1.test`, then inspect the popup. Chrome may require local DNS or hosts-file setup for custom test hostnames.

### Run unit tests

The tests use Node's built-in `assert` module and do not need any packages.

```bash
npm test
```

The test suite checks:

- Lookalike domain detection.
- Avoiding false positives for real protected domains.
- Suspicious URL word matching.
- Raw IP address detection.
- Default and custom risk thresholds.
- Options-page brand parsing.

## How It Works

### Domain analysis

`utils/domainUtils.js` normalizes domains, applies simple leetspeak replacement, and compares the current domain label against entries in `data/brandList.js`. A small Levenshtein distance can indicate a possible lookalike.

Example:

```text
paypa1.com -> paypal.com
```

This does not prove a page is malicious. It is a learning-friendly heuristic that explains why the domain deserves caution.

### Form inspection

`utils/formScanner.js` runs as a content script. It scans forms for structural indicators only, including field types, field names, autocomplete attributes, form methods, and form actions. It never reads typed values.

`background.js` compares form action domains with the current page domain and raises warnings for risky patterns.

### Redirect tracking

`background.js` uses Chrome `webNavigation` events to keep a short navigation chain per tab. Multiple redirects or several domain changes can increase the risk score.

### Risk scoring

`utils/scoring.js` assigns points by finding severity:

- `info`: 5
- `low`: 10
- `medium`: 20
- `high`: 35
- `critical`: 50

Scores are capped at 100 and mapped to Low Risk, Caution, Suspicious, or Dangerous.

The default thresholds are:

- `0-24`: Low Risk
- `25-49`: Caution
- `50-74`: Suspicious
- `75-100`: Dangerous

The Options page can adjust those thresholds for local demos or experimentation.

## Limitations

- This extension uses simple heuristics and can produce false positives or false negatives.
- It does not use threat intelligence feeds or Google Safe Browsing.
- It does not fully detect Unicode homograph or punycode attacks.
- Public suffix parsing is intentionally lightweight for beginner readability.
- Redirect analysis is basic and limited to recent tab navigation events.
- Browser internal pages such as `chrome://` cannot be scanned by content scripts.

## Future Improvements

- Integrate Google Safe Browsing API or another reputable threat intelligence source.
- Add punycode and Unicode homograph detection.
- Improve public suffix parsing with a maintained library.
- Add richer redirect-chain analysis and clearer timeline display.
- Add an optional warning page while keeping user override controls.
- Add more automated tests for form analysis and redirect behavior.

## Portfolio and Resume Wording

Built **PhishGuard Lite**, a defensive Manifest V3 Chrome extension that detects phishing indicators using domain similarity checks, form action analysis, redirect tracking, local-only risk scoring, and a privacy-preserving popup UI. The project demonstrates Chrome Extension APIs, JavaScript modular design, secure handling of sensitive browser contexts, and cybersecurity-focused user education.

## Safety Boundary

This project is for defensive education only. It does not include credential harvesting, phishing kits, page cloning, form submission interception, or any feature that collects or exfiltrates sensitive user data.
