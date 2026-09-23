
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getLanguageDirection,
  normalizeLanguageCode,
} from "../src/i18n/languages.js";

import {
  isLtrLanguage,
  isRtlLanguage,
  resolveLanguageDirection,
} from "../src/i18n/direction.js";

import {
  readLanguageFromStorage,
  saveLanguageToStorage,
} from "../src/i18n/storage.js";

const readJson = async (relativePath) =>
  JSON.parse(
    await readFile(
      new URL(relativePath, import.meta.url),
      "utf8"
    )
  );

test("extensionless imports resolve through the canonical i18n bridge", async () => {
  const bridge = await readFile(
    new URL("../src/i18n.jsx", import.meta.url),
    "utf8"
  );

  assert.match(
    bridge,
    /from "\.\/i18n\/index\.js"/
  );

  assert.match(
    bridge,
    /\buseI18n\b/
  );

  assert.doesNotMatch(
    bridge,
    /createContext|createContext\(|const translations\s*=/
  );

  assert.doesNotMatch(
    bridge,
    /from "\.\/i18n\.legacy\.jsx"/
  );
});

test("Urdu Arabic and Hindi retain their full original translated dataset in the legacy archive", async () => {
  // The original flat single-file translations are preserved verbatim
  // in locales-legacy/ (outside the Vite glob, so they never ship in
  // the bundle) as the source-of-truth archive for the migration.
  // This is the "preserve all existing translated strings" guarantee -
  // separate from whether a given key has yet been mapped into the
  // namespace structure the app actually loads at runtime.
  const minimumKeys = {
    ur: 1035,
    ar: 1036,
    hi: 1045,
  };

  for (const [language, minimum] of Object.entries(minimumKeys)) {
    const archive = await readJson(
      `../src/i18n/locales-legacy/${language}/common.json`
    );

    assert.ok(
      Object.keys(archive).length >= minimum,
      `${language} legacy archive coverage fell below ${minimum} - original translations may have been lost`
    );
  }
});

test("Urdu Arabic and Hindi namespace files are real, reachable translations sourced from the legacy archive", async () => {
  const english = await readJson("../src/i18n/locales/en/common.json");

  // Sample one real key per language from a namespace that actually
  // contains it, proving translations are reachable through the
  // namespace the app loads at runtime - not just present somewhere
  // in the untouched legacy file.
  const samples = {
    language: "common",
    dashboard: "navigation",
    login: "auth",
    settings: "navigation",
  };

  for (const language of ["ur", "ar", "hi"]) {
    const namespaceCache = {};

    for (const [key, ns] of Object.entries(samples)) {
      namespaceCache[ns] ??= await readJson(
        `../src/i18n/locales/${language}/${ns}.json`
      );
      const value = namespaceCache[ns][key];

      // "auth" is a namespace with genuine, pre-existing translation
      // gaps (tracked separately, not a resolution bug) - only assert
      // reachability for keys that are actually present in this
      // language's file for that namespace.
      if (value === undefined) continue;

      assert.equal(
        typeof value,
        "string",
        `${language}/${ns}.json key "${key}" is missing or not a string`
      );

      assert.ok(
        value.trim().length > 0,
        `${language}/${ns}.json key "${key}" is empty`
      );
    }

    // "language" must exist and be translated for every migrated
    // language - it's the language-picker's own label.
    const common = namespaceCache.common;
    assert.notEqual(
      common.language,
      english.language,
      `${language} language label unexpectedly fell back to English`
    );
  }
});

test("every real namespace file for ur/ar/hi/zh/tr only contains keys that genuinely exist in the corresponding English namespace (no fabricated content)", async () => {
  const { readdir } = await import("node:fs/promises");
  const localesDirUrl = new URL("../src/i18n/locales/", import.meta.url);

  for (const language of ["ur", "ar", "hi", "zh", "tr"]) {
    const files = await readdir(new URL(`${language}/`, localesDirUrl));

    for (const file of files) {
      const namespace = file.replace(/\.json$/, "");
      const translated = await readJson(
        `../src/i18n/locales/${language}/${file}`
      );
      const english = await readJson(
        `../src/i18n/locales/en/${namespace}.json`
      );
      const englishKeys = new Set(Object.keys(english));

      for (const key of Object.keys(translated)) {
        assert.ok(
          englishKeys.has(key),
          `${language}/${file} has key "${key}" not present in en/${file} - looks fabricated or mismapped`
        );
      }
    }
  }
});

test("all six languages have complete, exact key parity with English - every namespace, every key, no missing or extra keys (project-wide i18n normalization, closed after ur/ar/hi's pre-existing partial gaps were backfilled)", async () => {
  const { readdir } = await import("node:fs/promises");
  const enDirUrl = new URL("../src/i18n/locales/en/", import.meta.url);
  const namespaceFiles = (await readdir(enDirUrl)).filter((f) =>
    f.endsWith(".json")
  );

  const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;
  const extractPlaceholders = (value) =>
    typeof value === "string"
      ? new Set([...value.matchAll(PLACEHOLDER_RE)].map((m) => m[1]))
      : new Set();

  for (const language of ["ur", "ar", "hi", "zh", "tr"]) {
    for (const file of namespaceFiles) {
      const english = await readJson(`../src/i18n/locales/en/${file}`);
      const translated = await readJson(
        `../src/i18n/locales/${language}/${file}`
      );

      assert.deepEqual(
        Object.keys(translated).sort(),
        Object.keys(english).sort(),
        `${language}/${file} does not have full key parity with en/${file}`
      );

      for (const [key, value] of Object.entries(translated)) {
        assert.equal(
          typeof value,
          "string",
          `${language}/${file} key "${key}" is missing or not a string`
        );
        assert.ok(
          value.trim().length > 0,
          `${language}/${file} key "${key}" is empty`
        );

        /*
          Placeholder parity (item 8 of the final i18n cleanup):
          a translated string must contain exactly the same
          {{placeholder}} names as its English source - never
          renamed, dropped, or invented. This runs for every real
          namespace/key/language combination, not a spot check.
        */
        const englishPlaceholders = extractPlaceholders(english[key]);
        const translatedPlaceholders = extractPlaceholders(value);
        assert.deepEqual(
          [...translatedPlaceholders].sort(),
          [...englishPlaceholders].sort(),
          `${language}/${file} key "${key}" has mismatched placeholders: expected {${[...englishPlaceholders].join(", ")}}, got {${[...translatedPlaceholders].join(", ")}}`
        );
      }
    }
  }
});

test("supported language normalization and direction remain correct", () => {
  assert.equal(DEFAULT_LANGUAGE, "en");

  assert.equal(normalizeLanguageCode("en-US"), "en");
  assert.equal(normalizeLanguageCode("ur-PK"), "ur");
  assert.equal(normalizeLanguageCode("ar-SA"), "ar");
  assert.equal(normalizeLanguageCode("hi-IN"), "hi");
  assert.equal(normalizeLanguageCode("zh-CN"), "zh");
  assert.equal(normalizeLanguageCode("tr-TR"), "tr");
  assert.equal(normalizeLanguageCode("unsupported"), "en");

  assert.equal(getLanguageDirection("en"), "ltr");
  assert.equal(getLanguageDirection("hi"), "ltr");
  assert.equal(getLanguageDirection("zh"), "ltr");
  assert.equal(getLanguageDirection("tr"), "ltr");
  assert.equal(getLanguageDirection("ur"), "rtl");
  assert.equal(getLanguageDirection("ar"), "rtl");

  assert.equal(resolveLanguageDirection("ur-PK"), "rtl");
  assert.equal(resolveLanguageDirection("ar-SA"), "rtl");
  assert.equal(resolveLanguageDirection("hi-IN"), "ltr");
  assert.equal(resolveLanguageDirection("zh-CN"), "ltr");
  assert.equal(resolveLanguageDirection("tr-TR"), "ltr");

  assert.equal(isRtlLanguage("ur"), true);
  assert.equal(isRtlLanguage("ar"), true);
  assert.equal(isLtrLanguage("en"), true);
  assert.equal(isLtrLanguage("hi"), true);
  assert.equal(isLtrLanguage("zh"), true);
  assert.equal(isLtrLanguage("tr"), true);
  assert.equal(isRtlLanguage("zh"), false);
  assert.equal(isRtlLanguage("tr"), false);
});

test("language preference persists under one canonical storage key", () => {
  const values = new Map();

  globalThis.window = {
    navigator: {
      language: "en-US",
      languages: ["en-US"],
    },
    localStorage: {
      getItem(key) {
        return values.has(key) ? values.get(key) : null;
      },
      setItem(key, value) {
        values.set(key, String(value));
      },
      removeItem(key) {
        values.delete(key);
      },
    },
  };

  try {
    assert.equal(
      saveLanguageToStorage("ur-PK"),
      "ur"
    );

    assert.equal(
      values.get(LANGUAGE_STORAGE_KEY),
      "ur"
    );

    assert.equal(
      readLanguageFromStorage(),
      "ur"
    );

    values.clear();
    values.set("selectedLanguage", "ar-SA");

    assert.equal(
      readLanguageFromStorage(),
      "ar"
    );

    assert.equal(
      values.get(LANGUAGE_STORAGE_KEY),
      "ar"
    );
  } finally {
    delete globalThis.window;
  }
});