import assert from "node:assert/strict";
import test from "node:test";
import { decideEscalation } from "../src/services/escalation.js";

test("negative sentiment at the threshold is escalated", () => {
  assert.deepEqual(decideEscalation("NEGATIVE", { Negative: 0.75 }, 0.75), {
    escalationStatus: "ESCALATED",
    priority: "HIGH",
  });
});

test("negative sentiment under the threshold stays open", () => {
  assert.deepEqual(decideEscalation("NEGATIVE", { Negative: 0.749 }, 0.75), {
    escalationStatus: "OPEN",
    priority: "MEDIUM",
  });
});

test("mixed sentiment is queued for a look and is not auto-escalated", () => {
  assert.deepEqual(decideEscalation("MIXED", { Negative: 0.4, Mixed: 0.9 }, 0.75), {
    escalationStatus: "OPEN",
    priority: "LOW",
  });
});

test("positive and neutral feedback are not escalated", () => {
  assert.deepEqual(decideEscalation("POSITIVE", { Positive: 0.99 }, 0.75), {
    escalationStatus: "NONE",
    priority: "LOW",
  });
  assert.deepEqual(decideEscalation("NEUTRAL", { Neutral: 0.8 }, 0.75), {
    escalationStatus: "NONE",
    priority: "LOW",
  });
});

test("the threshold is configurable", () => {
  assert.equal(decideEscalation("NEGATIVE", { Negative: 0.6 }, 0.5).escalationStatus, "ESCALATED");
  assert.equal(decideEscalation("NEGATIVE", { Negative: 0.6 }, 0.9).priority, "MEDIUM");
});
