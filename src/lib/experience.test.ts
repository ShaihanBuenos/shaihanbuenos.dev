import assert from "node:assert/strict";
import { test } from "node:test";
import type { Role } from "./content.ts";
import { periodOf, timelineOf } from "./experience.ts";

function role(company: string, start: string, end?: string): Role {
  return {
    id: `${company}-${start}`,
    company,
    title: "Software Engineer",
    start,
    end,
    context: { en: "Context.", "pt-br": "Contexto." },
    achievements: [{ en: "Achievement.", "pt-br": "Conquista." }],
  };
}

test("the period of some roles goes from the oldest start to the last end", () => {
  assert.deepEqual(
    periodOf([
      { start: "2021-07", end: "2022-12" },
      { start: "2020-09", end: "2021-07" },
    ]),
    { start: "2020-09", end: "2022-12" },
  );
});

test("the period has no end while one of the roles is the current one", () => {
  assert.deepEqual(periodOf([{ start: "2022-12" }, { start: "2020-09", end: "2022-12" }]), {
    start: "2020-09",
    end: undefined,
  });
});

test("without roles there is no period", () => {
  assert.equal(periodOf([]), undefined);
});

test("the timeline joins the roles of a company under its name, in the order they were given", () => {
  const current = role("Newer Company", "2022-12");
  const later = role("Older Company", "2021-07", "2022-12");
  const earlier = role("Older Company", "2020-09", "2021-07");
  assert.deepEqual(timelineOf([current, later, earlier]), [
    { name: "Newer Company", period: { start: "2022-12", end: undefined }, roles: [current] },
    {
      name: "Older Company",
      period: { start: "2020-09", end: "2022-12" },
      roles: [later, earlier],
    },
  ]);
});
