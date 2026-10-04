import assert from "node:assert/strict";
import test from "node:test";
import { languageSupport } from "../src/utils/languages.js";

test("english and hindi are accepted for document sentiment", () => {
  assert.equal(languageSupport("en", 0.99).ok, true);
  assert.equal(languageSupport("hi", 0.8).ok, true);
  assert.equal(languageSupport("zh-TW", 0.7).ok, true);
});

test("tamil and other unsupported languages are rejected", () => {
  const tamil = languageSupport("ta", 0.98);
  assert.equal(tamil.ok, false);
  assert.equal(tamil.reason, "UNSUPPORTED_LANGUAGE");
  assert.match(tamil.message, /Tamil/);
  assert.equal(languageSupport("te", 0.9).ok, false);
});

test("a low confidence detection is rejected instead of scored", () => {
  const result = languageSupport("en", 0.2);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "LOW_CONFIDENCE");
  assert.equal(languageSupport("", 0).ok, false);
});
