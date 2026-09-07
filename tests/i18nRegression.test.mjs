import fs from "node:fs";

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

test("Urdu Arabic and Hindi locale migrations retain substantial coverage", async () => {
  const minimumKeys = {
    ur: 1035,
    ar: 1036,
    hi: 1045,
  };

  for (const [language, minimum] of Object.entries(minimumKeys)) {
    const localeDir = new URL(
      `../src/i18n/locales/${language}/`,
      import.meta.url
    );

    const namespaceFiles = fs
      .readdirSync(localeDir)
      .filter((file) => file.endsWith(".json"));

    let totalKeys = 0;

    for (const namespaceFile of namespaceFiles) {
      const locale = await readJson(
        `../src/i18n/locales/${language}/${namespaceFile}`
      );

      totalKeys += Object.keys(locale).length;
    }

    assert.ok(
      totalKeys >= minimum,
      `${language} total locale coverage fell below ${minimum}; got ${totalKeys}`
    );

    const common = await readJson(
      `../src/i18n/locales/${language}/common.json`
    );

    const auth = await readJson(
      `../src/i18n/locales/${language}/auth.json`
    );

    const navigation = await readJson(
      `../src/i18n/locales/${language}/navigation.json`
    );

    const settings = await readJson(
      `../src/i18n/locales/${language}/settings.json`
    );

    assert.ok(
      Object.keys(common).length > 0,
      `${language} common namespace is empty`
    );

    assert.ok(
      Object.keys(auth).length > 0,
      `${language} auth namespace is empty`
    );

    assert.ok(
      Object.keys(navigation).length > 0,
      `${language} navigation namespace is empty`
    );

    assert.ok(
      Object.keys(settings).length > 0,
      `${language} settings namespace is empty`
    );
  }
});
test("supported language normalization and direction remain correct", () => {
  assert.equal(DEFAULT_LANGUAGE, "en");

  assert.equal(normalizeLanguageCode("en-US"), "en");
  assert.equal(normalizeLanguageCode("ur-PK"), "ur");
  assert.equal(normalizeLanguageCode("ar-SA"), "ar");
  assert.equal(normalizeLanguageCode("hi-IN"), "hi");
  assert.equal(normalizeLanguageCode("unsupported"), "en");

  assert.equal(getLanguageDirection("en"), "ltr");
  assert.equal(getLanguageDirection("hi"), "ltr");
  assert.equal(getLanguageDirection("ur"), "rtl");
  assert.equal(getLanguageDirection("ar"), "rtl");

  assert.equal(resolveLanguageDirection("ur-PK"), "rtl");
  assert.equal(resolveLanguageDirection("ar-SA"), "rtl");
  assert.equal(resolveLanguageDirection("hi-IN"), "ltr");

  assert.equal(isRtlLanguage("ur"), true);
  assert.equal(isRtlLanguage("ar"), true);
  assert.equal(isLtrLanguage("en"), true);
  assert.equal(isLtrLanguage("hi"), true);
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