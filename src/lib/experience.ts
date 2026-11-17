// The experience as the timeline shows it: the roles, joined by company.
import type { Role } from "./content.ts";

// From one month to another, each written as "2026-02". Without an end, the
// period goes up to today.
export interface Period {
  start: string;
  end: string | undefined;
}

// The whole period of some roles: from the start of the oldest one to the
// end of the last one to end. It has no end while one of the roles is the
// current one. Without roles there is no period.
export function periodOf(roles: Pick<Role, "start" | "end">[]): Period | undefined {
  const start = roles
    .map(({ start }) => start)
    .sort()
    .at(0);
  if (start === undefined) return undefined;
  const ends = roles.flatMap(({ end }) => end ?? []).sort();
  return { start, end: ends.length === roles.length ? ends.at(-1) : undefined };
}

export interface Company {
  name: string;
  period: Period;
  // In the order they were given.
  roles: Role[];
}

// The timeline: one entry per company, with the roles Shaihan had there. It
// keeps the order of the roles it is given. `content()` gives them from the
// most recent to the oldest, so the companies come out in that order too, by
// the most recent role of each one.
export function timelineOf(roles: Role[]): Company[] {
  return [...Map.groupBy(roles, ({ company }) => company)].flatMap(([name, roles]) => {
    const period = periodOf(roles);
    return period ? [{ name, period, roles }] : [];
  });
}
