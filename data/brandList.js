// Protected brand examples for defensive lookalike checks.
// Keep this list small and explainable for a learning project.
(function exposeBrandList(global) {
  const brands = [
    {
      name: "PayPal",
      domain: "paypal.com",
      keywords: ["paypal"]
    },
    {
      name: "Google",
      domain: "google.com",
      keywords: ["google", "gmail"]
    },
    {
      name: "Microsoft",
      domain: "microsoft.com",
      keywords: ["microsoft", "outlook", "office365", "live"]
    },
    {
      name: "Apple",
      domain: "apple.com",
      keywords: ["apple", "icloud"]
    },
    {
      name: "Amazon",
      domain: "amazon.com",
      keywords: ["amazon"]
    },
    {
      name: "Facebook",
      domain: "facebook.com",
      keywords: ["facebook", "meta"]
    },
    {
      name: "Instagram",
      domain: "instagram.com",
      keywords: ["instagram"]
    },
    {
      name: "Netflix",
      domain: "netflix.com",
      keywords: ["netflix"]
    },
    {
      name: "Chase",
      domain: "chase.com",
      keywords: ["chase"]
    },
    {
      name: "Bank of America",
      domain: "bankofamerica.com",
      keywords: ["bankofamerica", "bofa"]
    }
  ];

  global.PhishGuardBrandList = brands;
})(globalThis);
