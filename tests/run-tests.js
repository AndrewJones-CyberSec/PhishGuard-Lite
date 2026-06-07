const assert = require("assert");

require("../data/brandList.js");
require("../utils/domainUtils.js");
require("../utils/scoring.js");
require("../utils/settings.js");

const { PhishGuardBrandList, PhishGuardDomainUtils, PhishGuardScoring, PhishGuardSettings } = globalThis;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

test("detects paypa1.com as a PayPal lookalike", () => {
  const findings = PhishGuardDomainUtils.analyzeLookalikeDomain(
    "https://paypa1.com/login",
    PhishGuardBrandList
  );

  assert.ok(findings.some((finding) => finding.title.includes("PayPal")));
});

test("does not flag the real protected brand domain", () => {
  const findings = PhishGuardDomainUtils.analyzeLookalikeDomain(
    "https://www.paypal.com/signin",
    PhishGuardBrandList
  );

  assert.equal(findings.length, 0);
});

test("finds suspicious URL words", () => {
  const words = PhishGuardDomainUtils.findSuspiciousWords(
    "https://example.com/secure/account/verify"
  );

  assert.deepEqual(words, ["verify", "secure", "account"]);
});

test("detects raw IP addresses", () => {
  assert.equal(PhishGuardDomainUtils.isIpAddress("192.0.2.10"), true);
  assert.equal(PhishGuardDomainUtils.isIpAddress("example.com"), false);
});

test("scores and labels findings with default thresholds", () => {
  const result = PhishGuardScoring.scoreFindings([
    { id: "one", severity: "high", title: "High", explanation: "Test" },
    { id: "two", severity: "medium", title: "Medium", explanation: "Test" }
  ]);

  assert.equal(result.score, 55);
  assert.equal(result.label, "Suspicious");
});

test("supports custom risk thresholds", () => {
  const result = PhishGuardScoring.scoreFindings(
    [{ id: "one", severity: "medium", title: "Medium", explanation: "Test" }],
    { caution: 10, suspicious: 20, dangerous: 40 }
  );

  assert.equal(result.score, 20);
  assert.equal(result.label, "Suspicious");
});

test("parses option page brand lines", () => {
  const brands = PhishGuardSettings.parseBrandsFromTextarea(
    "Example Bank | examplebank.com | example, bank"
  );

  assert.deepEqual(brands, [
    {
      name: "Example Bank",
      domain: "examplebank.com",
      keywords: ["example", "bank"]
    }
  ]);
});
