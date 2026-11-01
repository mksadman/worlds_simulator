import { describe, expect, it } from "vitest";
import { getTeam } from "@/data/teams";
import { drawWinner, matchOdds, roundedPercents, seededRng, winProbability, type OddsMode } from "@/lib/odds";

const pct = (a: string, b: string, mode: OddsMode = "bias") => roundedPercents(matchOdds(getTeam(a), getTeam(b), mode));

describe("odds", () => {
  it.each([
    ["HLE", "KC", 94, 6],
    ["GEN", "TSW", 93, 7],
    ["BLG", "TL", 93, 7],
    ["TES", "G2", 75, 25],
    ["AL", "CFO", 91, 9],
    ["DK", "LØS", 96, 4],
  ])("bonus applies: %s vs %s = %i/%i", (a, b, pa, pb) => {
    expect(pct(a, b)).toEqual([pa, pb]);
    expect(matchOdds(getTeam(a), getTeam(b), "bias").biasTeam).toBe(a);
  });

  it.each([
    ["T1", "IG", 67, 33],
    ["LYON", "MKOI", 67, 33],
    ["G2", "KC", 64, 36],
    ["HLE", "GEN", 53, 47],
    ["AL", "DK", 50, 50],
  ])("no bonus: %s vs %s = %i/%i", (a, b, pa, pb) => {
    expect(pct(a, b)).toEqual([pa, pb]);
    expect(matchOdds(getTeam(a), getTeam(b), "bias").biasTeam).toBeNull();
  });

  it.each([
    ["HLE", "KC", 72, 28],
    ["TES", "G2", 35, 65],
    ["DK", "LØS", 79, 21],
    ["T1", "IG", 67, 33],
  ])("normal odds never add the bonus: %s vs %s = %i/%i", (a, b, pa, pb) => {
    expect(pct(a, b, "normal")).toEqual([pa, pb]);
    expect(matchOdds(getTeam(a), getTeam(b), "normal").biasTeam).toBeNull();
  });

  it("is symmetric and never 0% or 100%", () => {
    const o = matchOdds(getTeam("LØS"), getTeam("HLE"), "bias");
    expect(o.pA + o.pB).toBeCloseTo(1);
    expect(o.pA).toBeGreaterThan(0);
    expect(o.biasTeam).toBe("HLE");
    expect(roundedPercents({ pA: 0.999, pB: 0.001, biasTeam: null })).toEqual([99, 1]);
    expect(winProbability(5000, 0)).toBeLessThan(1);
  });

  it("100,000 seeded simulations of TES vs G2 give TES 74-76%, and G2 wins at least once", () => {
    const rng = seededRng(2026);
    const tes = getTeam("TES");
    const g2 = getTeam("G2");
    const n = 100_000;
    let tesWins = 0;
    for (let i = 0; i < n; i++) if (drawWinner(tes, g2, rng, "bias") === "TES") tesWins++;
    expect(tesWins / n).toBeGreaterThanOrEqual(0.74);
    expect(tesWins / n).toBeLessThanOrEqual(0.76);
    expect(n - tesWins).toBeGreaterThan(0);
  });
});
