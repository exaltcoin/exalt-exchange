/*
 * Real runtime i18next resolution regression tests.
 *
 * Unlike i18nRegression.test.mjs (which only checks the raw JSON
 * files have enough keys), this file builds an ACTUAL i18next
 * instance, wired through i18next-resources-to-backend to the
 * exact same `resolveNamespaceResource` function config.js uses
 * in production, backed by the real files on disk under
 * src/i18n/locales/. It proves translations are actually
 * reachable through i18n.t(), not just present in a JSON file
 * that nothing loads.
 *
 * config.js itself can't be imported here because it calls
 * Vite's `import.meta.glob`, which doesn't exist outside a Vite
 * build. resourceResolver.js was extracted specifically so this
 * resolution logic can be exercised for real under plain Node.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import i18next from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

import {
  AVAILABLE_NAMESPACES,
  resolveNamespaceResource,
} from "../src/i18n/resourceResolver.js";

import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGE_CODES,
} from "../src/i18n/languages.js";

import {
  isLtrLanguage,
  isRtlLanguage,
} from "../src/i18n/direction.js";

const localesDir = fileURLToPath(
  new URL("../src/i18n/locales/", import.meta.url)
);

/*
 * Build the same shape import.meta.glob(...) produces in
 * config.js (pattern: "./locales/<lang>/<namespace>.json",
 * eager, default-imported), but by reading the real files from
 * disk. This is the real production data, not fixtures.
 */
const buildLocaleModulesFromDisk = async () => {
  const localeModules = {};
  const languageDirs = await readdir(localesDir, { withFileTypes: true });

  for (const dirent of languageDirs) {
    if (!dirent.isDirectory()) continue;
    const lang = dirent.name;
    const files = await readdir(path.join(localesDir, lang));

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const namespace = file.slice(0, -".json".length);
      const raw = await readFile(
        path.join(localesDir, lang, file),
        "utf8"
      );
      localeModules[`./locales/${lang}/${namespace}.json`] =
        JSON.parse(raw);
    }
  }

  return localeModules;
};

const localeModules = await buildLocaleModulesFromDisk();

/*
 * A fresh i18next instance per test run, initialized with the
 * same namespace/fallback configuration as config.js, backed by
 * the real production translation resolver.
 */
const createTestI18n = async (lng) => {
  const instance = i18next.createInstance();

  await instance
    .use(
      resourcesToBackend(async (languageCode, namespace) =>
        resolveNamespaceResource(languageCode, namespace, localeModules)
      )
    )
    .init({
      lng,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGE_CODES,
      nonExplicitSupportedLngs: true,
      load: "languageOnly",
      ns: AVAILABLE_NAMESPACES,
      defaultNS: "common",
      fallbackNS: ["common", "navigation"],
      interpolation: { escapeValue: false },
      returnNull: false,
      returnEmptyString: false,
      initImmediate: false,
    });

  return instance;
};

test("Urdu Dashboard resolves real Urdu text, not the English fallback string", async () => {
  const i18n = await createTestI18n("ur");
  await i18n.loadNamespaces("dashboard");

  const en = JSON.parse(
    await readFile(path.join(localesDir, "en/dashboard.json"), "utf8")
  );
  const ur = JSON.parse(
    await readFile(path.join(localesDir, "ur/dashboard.json"), "utf8")
  );

  // Pick a key we know exists in both, translated.
  const sampleKey = Object.keys(ur).find((k) => ur[k] !== en[k]);
  assert.ok(sampleKey, "expected at least one distinctly-translated key");

  const resolved = i18n.t(sampleKey, { ns: "dashboard" });
  assert.equal(resolved, ur[sampleKey]);
  assert.notEqual(resolved, en[sampleKey]);
});

test("Urdu Futures resolves real Urdu text", async () => {
  const i18n = await createTestI18n("ur");
  await i18n.loadNamespaces("futures");

  const ur = JSON.parse(
    await readFile(path.join(localesDir, "ur/futures.json"), "utf8")
  );
  const sampleKey = Object.keys(ur)[0];

  assert.equal(i18n.t(sampleKey, { ns: "futures" }), ur[sampleKey]);
});

test("Arabic Wallet resolves real Arabic text", async () => {
  const i18n = await createTestI18n("ar");
  await i18n.loadNamespaces("wallets");

  const ar = JSON.parse(
    await readFile(path.join(localesDir, "ar/wallets.json"), "utf8")
  );
  const sampleKey = Object.keys(ar)[0];

  assert.equal(i18n.t(sampleKey, { ns: "wallets" }), ar[sampleKey]);
});

test("Hindi P2P resolves real Hindi text", async () => {
  const i18n = await createTestI18n("hi");
  await i18n.loadNamespaces("p2p");

  const hi = JSON.parse(
    await readFile(path.join(localesDir, "hi/p2p.json"), "utf8")
  );
  const sampleKey = Object.keys(hi)[0];

  assert.equal(i18n.t(sampleKey, { ns: "p2p" }), hi[sampleKey]);
});

test("fallback to English occurs only for keys with no real translation, not for the whole namespace", async () => {
  // Synthetic locale data rather than relying on real production
  // files happening to have a gap: ur/auth now has full coverage
  // (the previous auth/settings translation gap was closed), which
  // is the correct end state - so this test proves the per-key
  // fallback mechanism itself, independent of whether today's real
  // data happens to have any incidental gaps left.
  const syntheticModules = {
    "./locales/en/auth.json": {
      translatedKey: "English translated value",
      untranslatedKey: "English only value",
    },
    "./locales/ur/auth.json": {
      // deliberately missing "untranslatedKey" to simulate a
      // partially-translated namespace file
      translatedKey: "اردو ترجمہ شدہ قدر",
    },
  };

  const i18n = i18next.createInstance();
  await i18n
    .use(
      resourcesToBackend((lng, ns) =>
        resolveNamespaceResource(lng, ns, syntheticModules)
      )
    )
    .init({
      lng: "ur",
      fallbackLng: "en",
      ns: ["auth"],
      defaultNS: "auth",
      interpolation: { escapeValue: false },
      returnNull: false,
      initImmediate: false,
    });

  // A key present in ur/auth.json resolves to the real Urdu value,
  // not English - this is the exact bug that was fixed (whole
  // namespace silently collapsing to English).
  assert.equal(
    i18n.t("translatedKey"),
    "اردو ترجمہ شدہ قدر"
  );

  // A key genuinely absent from ur/auth.json correctly falls back
  // to English at the individual-key level, without pulling the
  // rest of the namespace's real translations down with it.
  assert.equal(
    i18n.t("untranslatedKey"),
    "English only value"
  );
});

test("resolveNamespaceResource falls back to the full English file when a language has no file at all for a namespace", () => {
  const fakeModules = {
    "./locales/en/settings.json": { onlyEnglishKey: "English value" },
  };

  const resolved = resolveNamespaceResource("zz", "settings", fakeModules);
  assert.deepEqual(resolved, { onlyEnglishKey: "English value" });
});

test("RTL is correct for Urdu and Arabic; LTR is correct for Hindi and English", () => {
  assert.equal(isRtlLanguage("ur"), true);
  assert.equal(isRtlLanguage("ar"), true);
  assert.equal(isLtrLanguage("hi"), true);
  assert.equal(isLtrLanguage("en"), true);
  assert.equal(isRtlLanguage("hi"), false);
  assert.equal(isRtlLanguage("en"), false);
});

test("selected language persists across a simulated reload (changeLanguage + re-init reads the same lng)", async () => {
  const i18n = await createTestI18n("ar");
  assert.equal(i18n.language, "ar");

  await i18n.changeLanguage("hi");
  assert.equal(i18n.language, "hi");

  // Simulate a fresh app boot picking up the same stored language,
  // the same way config.js's getDetectedLanguage() -> i18n.init({lng})
  // does on page load.
  const reloaded = await createTestI18n(i18n.language);
  assert.equal(reloaded.language, "hi");
});

test("every namespace file that exists for ur/ar/hi/zh/tr only contains keys that are real English namespace keys (no fabricated/mismapped content)", async () => {
  for (const lang of ["ur", "ar", "hi", "zh", "tr"]) {
    for (const ns of AVAILABLE_NAMESPACES) {
      let translated;
      try {
        translated = JSON.parse(
          await readFile(path.join(localesDir, lang, `${ns}.json`), "utf8")
        );
      } catch {
        continue; // namespace not yet translated for this language - fine, falls back to English
      }

      const en = JSON.parse(
        await readFile(path.join(localesDir, "en", `${ns}.json`), "utf8")
      );
      const enKeys = new Set(Object.keys(en));

      for (const key of Object.keys(translated)) {
        assert.ok(
          enKeys.has(key),
          `${lang}/${ns}.json has key "${key}" that doesn't exist in en/${ns}.json`
        );
      }
    }
  }
});

test("Chinese Trading resolves real Simplified Chinese text through the same 16-namespace runtime architecture", async () => {
  const i18n = await createTestI18n("zh");
  await i18n.loadNamespaces("trading");

  const zh = JSON.parse(
    await readFile(path.join(localesDir, "zh/trading.json"), "utf8")
  );
  const sampleKey = Object.keys(zh)[0];

  assert.equal(i18n.t(sampleKey, { ns: "trading" }), zh[sampleKey]);
});

test("Turkish Futures resolves real Turkish text through the same 16-namespace runtime architecture", async () => {
  const i18n = await createTestI18n("tr");
  await i18n.loadNamespaces("futures");

  const tr = JSON.parse(
    await readFile(path.join(localesDir, "tr/futures.json"), "utf8")
  );
  const sampleKey = Object.keys(tr)[0];

  assert.equal(i18n.t(sampleKey, { ns: "futures" }), tr[sampleKey]);
});

test("Chinese and Turkish are both registered as LTR languages", () => {
  assert.equal(isLtrLanguage("zh"), true);
  assert.equal(isLtrLanguage("tr"), true);
  assert.equal(isRtlLanguage("zh"), false);
  assert.equal(isRtlLanguage("tr"), false);
});

test("changeLanguage to zh/tr does not throw and resolves the requested language (no 'changeLanguage is unavailable' failure)", async () => {
  const i18n = await createTestI18n("en");

  await assert.doesNotReject(i18n.changeLanguage("zh"));
  assert.equal(i18n.language, "zh");

  await assert.doesNotReject(i18n.changeLanguage("tr"));
  assert.equal(i18n.language, "tr");
});

test("core navigation and dashboard flows do not fall back to English for zh/tr (spot-checked across every key in both namespaces)", async () => {
  const en = {
    navigation: JSON.parse(
      await readFile(path.join(localesDir, "en/navigation.json"), "utf8")
    ),
    dashboard: JSON.parse(
      await readFile(path.join(localesDir, "en/dashboard.json"), "utf8")
    ),
  };

  // Deliberate exceptions: industry-standard crypto-exchange terms
  // real Turkish/Chinese exchanges keep in English/as loanwords
  // rather than force-translating into an awkward local phrase
  // (matches the Phase 2 instruction to translate professionally,
  // with brand/product-style terms as the documented exception).
  // Each entry here was verified against the actual dictionaries
  // above, not assumed - see the Phase 2 checkpoint report.
  const deliberatelyUntranslated = new Set([
    "tr:navigation:p2p", // "P2P" - universal industry acronym
    "tr:navigation:staking", // "Staking" - common Turkish crypto-exchange loanword
    "tr:navigation:ai-launchpad", // "AI Launchpad" - product-type term kept in English
  ]);

  for (const lang of ["zh", "tr"]) {
    const i18n = await createTestI18n(lang);
    await i18n.loadNamespaces(["navigation", "dashboard"]);

    for (const ns of ["navigation", "dashboard"]) {
      for (const key of Object.keys(en[ns])) {
        if (deliberatelyUntranslated.has(`${lang}:${ns}:${key}`)) {
          continue;
        }

        const resolved = i18n.t(key, { ns });
        assert.notEqual(
          resolved,
          en[ns][key],
          `${lang}/${ns}.${key} unexpectedly resolved to the English string - full core navigation/dashboard coverage was a Phase 2 requirement`
        );
      }
    }
  }
});

test("missing-key / fallback report: zh and tr have zero missing keys across all 16 namespaces (full coverage, unlike ur/ar/hi's pre-existing gaps)", async () => {
  const report = { zh: {}, tr: {} };

  for (const lang of ["zh", "tr"]) {
    for (const ns of AVAILABLE_NAMESPACES) {
      const en = JSON.parse(
        await readFile(path.join(localesDir, "en", `${ns}.json`), "utf8")
      );
      let translated = {};
      try {
        translated = JSON.parse(
          await readFile(path.join(localesDir, lang, `${ns}.json`), "utf8")
        );
      } catch {
        // no file at all for this namespace - would be 100% missing
      }

      const missing = Object.keys(en).filter((k) => !(k in translated));
      if (missing.length > 0) {
        report[lang][ns] = missing;
      }
    }
  }

  assert.deepEqual(
    report.zh,
    {},
    `zh missing-key report: ${JSON.stringify(report.zh)}`
  );
  assert.deepEqual(
    report.tr,
    {},
    `tr missing-key report: ${JSON.stringify(report.tr)}`
  );
});

test("interpolation-token integrity: no zh/tr value introduces a {{token}} or markup pattern absent from the corresponding English value", async () => {
  const tokenPattern = /\{\{.*?\}\}|<[^>]+>/g;

  for (const lang of ["zh", "tr", "ur", "ar", "hi"]) {
    for (const ns of AVAILABLE_NAMESPACES) {
      let translated;
      try {
        translated = JSON.parse(
          await readFile(path.join(localesDir, lang, `${ns}.json`), "utf8")
        );
      } catch {
        continue;
      }

      const en = JSON.parse(
        await readFile(path.join(localesDir, "en", `${ns}.json`), "utf8")
      );

      for (const [key, value] of Object.entries(translated)) {
        const enValue = en[key];
        if (enValue === undefined) continue;

        const enTokens = (enValue.match(tokenPattern) || []).sort();
        const translatedTokens = (value.match(tokenPattern) || []).sort();

        assert.deepEqual(
          translatedTokens,
          enTokens,
          `${lang}/${ns}.${key}: interpolation/markup token mismatch - English has ${JSON.stringify(enTokens)}, ${lang} has ${JSON.stringify(translatedTokens)}`
        );
      }
    }
  }
});

test("zh/tr key hierarchy exactly matches English key order per namespace (no renamed/reordered keys)", async () => {
  for (const lang of ["zh", "tr"]) {
    for (const ns of AVAILABLE_NAMESPACES) {
      const en = JSON.parse(
        await readFile(path.join(localesDir, "en", `${ns}.json`), "utf8")
      );
      const translated = JSON.parse(
        await readFile(path.join(localesDir, lang, `${ns}.json`), "utf8")
      );

      assert.deepEqual(
        Object.keys(translated),
        Object.keys(en),
        `${lang}/${ns}.json key order/hierarchy diverges from en/${ns}.json`
      );
    }
  }
});

test("ur/ar/hi auth and settings namespaces have full key coverage (previously-known gap, now closed)", async () => {
  for (const lang of ["ur", "ar", "hi"]) {
    for (const ns of ["auth", "settings"]) {
      const en = JSON.parse(
        await readFile(path.join(localesDir, `en/${ns}.json`), "utf8")
      );
      const translated = JSON.parse(
        await readFile(path.join(localesDir, `${lang}/${ns}.json`), "utf8")
      );

      const missing = Object.keys(en).filter((k) => !(k in translated));
      assert.deepEqual(
        missing,
        [],
        `${lang}/${ns}.json is missing keys: ${JSON.stringify(missing)}`
      );
    }
  }
});
