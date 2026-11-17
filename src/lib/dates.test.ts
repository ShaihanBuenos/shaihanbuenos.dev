import assert from "node:assert/strict";
import { test } from "node:test";
import { dayIn, isoDayOf, monthIn } from "./dates.ts";

const day = new Date("2026-03-10T00:00:00Z");

test("a day is written in the language of the page", () => {
  assert.equal(dayIn(day, "en"), "Mar 10, 2026");
  assert.equal(dayIn(day, "pt-br"), "10 de mar. de 2026");
});

test("a day keeps its date in any time zone of the machine", () => {
  assert.equal(isoDayOf(day), "2026-03-10");
});

test("a month is written in the language of the page", () => {
  assert.equal(monthIn("2026-02", "en"), "Feb 2026");
  assert.equal(monthIn("2026-02", "pt-br"), "fev. de 2026");
});
