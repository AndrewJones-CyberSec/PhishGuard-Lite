# Security Policy

## Security Model

PhishGuard Lite is a local, defensive Chrome extension. It analyzes phishing indicators using page metadata and structure, then displays warnings in the browser extension popup.

The extension does not collect, transmit, or store sensitive user secrets.

PhishGuard Lite does not read:

- Typed form values
- Submitted form contents
- Passwords
- Cookies
- Tokens
- Local storage secrets
- Session storage secrets

The extension only inspects:

- Page URLs and domains
- Form action URLs
- Form methods
- Input field types and non-secret attributes
- Redirect and navigation behavior

## External Services

PhishGuard Lite v1 does not call external APIs and does not send scan results to any server.

## Permissions

The extension uses:

- `storage` to keep local scan results and user settings.
- `webNavigation` to track navigation and redirect behavior.
- `<all_urls>` host access so content scripts can inspect page structure across normal websites.

The extension does not request cookie access and does not expose web-accessible resources.

## Reporting Security Issues

If you find a security issue, please open a GitHub issue with:

- A clear description of the behavior.
- Steps to reproduce.
- The affected file or feature.
- Any suggested fix, if available.

Do not include real credentials, tokens, cookies, or private user data in reports.

## Known Limitations

PhishGuard Lite uses heuristic detection. It may produce false positives or false negatives and should not be treated as a replacement for browser security features, password managers, Safe Browsing, or endpoint protection.
