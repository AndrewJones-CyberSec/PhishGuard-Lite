// Scans page forms by structure only.
// Privacy rule: this file never reads input.value, typed text, cookies, or tokens.
(function exposeFormScanner(global) {
  const CREDENTIAL_FIELD_TYPES = new Set(["password", "email"]);
  const CREDENTIAL_NAME_HINTS = [
    "email",
    "user",
    "username",
    "login",
    "account",
    "password",
    "passwd",
    "pwd"
  ];

  function safeUrl(value, baseUrl) {
    try {
      return value ? new URL(value, baseUrl).href : new URL(baseUrl).href;
    } catch (error) {
      return "";
    }
  }

  function fieldLooksCredentialRelated(input) {
    const type = (input.getAttribute("type") || "text").toLowerCase();
    const descriptor = [
      input.getAttribute("name"),
      input.getAttribute("id"),
      input.getAttribute("autocomplete"),
      input.getAttribute("aria-label"),
      input.getAttribute("placeholder")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      CREDENTIAL_FIELD_TYPES.has(type) ||
      CREDENTIAL_NAME_HINTS.some((hint) => descriptor.includes(hint))
    );
  }

  function summarizeInput(input) {
    const type = (input.getAttribute("type") || "text").toLowerCase();

    return {
      type,
      hasName: Boolean(input.getAttribute("name")),
      hasId: Boolean(input.getAttribute("id")),
      autocomplete: input.getAttribute("autocomplete") || "",
      credentialRelated: fieldLooksCredentialRelated(input)
    };
  }

  function scanForms(documentRef, pageUrl) {
    const forms = Array.from(documentRef.forms || []);

    return forms.map((form, index) => {
      const inputs = Array.from(form.querySelectorAll("input"));
      const summarizedInputs = inputs.map(summarizeInput);
      const hasPasswordField = summarizedInputs.some((input) => input.type === "password");
      const hasEmailField = summarizedInputs.some((input) => input.type === "email");
      const hasCredentialHints = summarizedInputs.some((input) => input.credentialRelated);
      const rawAction = form.getAttribute("action") || "";
      const method = (form.getAttribute("method") || "get").toLowerCase();

      return {
        index,
        action: safeUrl(rawAction, pageUrl),
        rawActionPresent: Boolean(rawAction),
        method,
        hasPasswordField,
        hasEmailField,
        hasCredentialHints,
        inputCount: inputs.length,
        credentialFieldCount: summarizedInputs.filter((input) => input.credentialRelated).length,
        // Store field metadata only; never store field values.
        fields: summarizedInputs
      };
    });
  }

  global.PhishGuardFormScanner = {
    scanForms
  };
})(globalThis);
