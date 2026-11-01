import { describe, expect, it } from "vitest";
import { TEAMS, getTeam, type Team } from "@/data/teams";
import {
  buchholz,
  computeRecords,
  nextSwissPairs,
  playoffSeeds,
  quarterfinalPairs,
  round1Pairs,
  swissStatus,
  toMatches,
  type Match,
  type Pair,
} from "@/lib/engine";
import { seededRng } from "@/lib/odds";
import { initialState, simulateToEnd } from "@/lib/tournament";

const norm = (pairs: Pair[]) => pairs.map((p) => [...p].sort().join("-")).sort();
const parse = (s: string) => s.split(", ").map((p) => p.split("-") as Pair);

function decide(pairs: Pair[], winners: string[]): Match[] {
  return pairs.map(([a, b]) => {
    const w = winners.find((x) => x === a || x === b);
    if (!w) throw new Error(`No winner given for ${a}-${b}`);
    return { a, b, winner: w };
  });
}

describe("pairing fixture", () => {
  const fixture: [string, string[]][] = [
    ["HLE-KC, GEN-TSW, BLG-TL, G2-TES, T1-IG, LYON-MKOI, AL-CFO, DK-LØS", ["HLE", "GEN", "BLG", "TES", "T1", "LYON", "AL", "DK"]],
    ["HLE-TES, GEN-DK, BLG-AL, T1-LYON, G2-LØS, KC-CFO, TSW-MKOI, TL-IG", ["HLE", "GEN", "BLG", "T1", "G2", "KC", "MKOI", "IG"]],
    ["HLE-BLG, GEN-T1, LYON-G2, TES-MKOI, AL-IG, DK-KC, TSW-LØS, TL-CFO", ["HLE", "GEN", "LYON", "TES", "IG", "DK", "LØS", "TL"]],
    ["T1-TES, BLG-IG, DK-LYON, G2-MKOI, KC-LØS, AL-TL", ["T1", "BLG", "DK", "G2", "KC", "AL"]],
    ["TES-AL, LYON-KC, IG-G2", ["TES", "LYON", "IG"]],
  ];

  const rounds: Match[][] = [];
  fixture.forEach(([expected, winners], i) => {
    it(`round ${i + 1} pairings`, () => {
      const pairs = nextSwissPairs(rounds);
      expect(norm(pairs)).toEqual(norm(parse(expected)));
      rounds.push(decide(pairs, winners));
    });
  });

  it("final playoff seeds and BH", () => {
    expect(playoffSeeds(rounds)).toEqual(["HLE", "GEN", "T1", "BLG", "DK", "TES", "LYON", "IG"]);
    const records = computeRecords(rounds);
    const tags = ["HLE", "GEN", "T1", "BLG", "DK", "TES", "LYON", "IG"];
    const bh = Object.fromEntries(tags.map((t) => [t, buchholz(t, records)]));
    expect(bh).toEqual({ HLE: 2, GEN: 1, T1: 6, BLG: 1, DK: 1, TES: 1, LYON: 0, IG: 0 });
  });

  it("quarterfinals", () => {
    expect(norm(quarterfinalPairs(playoffSeeds(rounds)))).toEqual(norm(parse("HLE-IG, BLG-DK, GEN-LYON, T1-TES")));
  });
});

describe("round 1 league rule", () => {
  it("has no same-league pair with the real seeds", () => {
    for (const [a, b] of round1Pairs()) expect(getTeam(a).league).not.toBe(getTeam(b).league);
  });

  it("swaps a clashing lower seed with the nearest lower seed (+1 first)", () => {
    // Make seed 10 an LCK team so it clashes with seed 2 (GEN).
    const teams: Team[] = TEAMS.map((t) => (t.seed === 10 ? { ...t, league: "LCK" } : t));
    const pairs = round1Pairs(teams);
    expect(pairs[1]).toEqual(["GEN", "TL"]);
    expect(pairs[2]).toEqual(["BLG", "TSW"]);
  });

  it("skips a swap that would create a new clash", () => {
    // Seed 9 as LCK clashes with HLE; swapping with seed 10 would put it against GEN (LCK), so it goes +2.
    const teams: Team[] = TEAMS.map((t) => (t.seed === 9 ? { ...t, league: "LCK" } : t));
    const pairs = round1Pairs(teams);
    expect(pairs[0]).toEqual(["HLE", "TL"]);
    expect(pairs[2]).toEqual(["BLG", "KC"]);
    const league = (tag: string) => teams.find((t) => t.tag === tag)!.league;
    for (const [a, b] of pairs) expect(league(a)).not.toBe(league(b));
  });

  it("tries -1 when there is no +1", () => {
    // Seed 16 clashes with seed 8 and has no +1, so it swaps with seed 15.
    const teams: Team[] = TEAMS.map((t) => (t.seed === 16 ? { ...t, league: "LCK" } : t));
    const pairs = round1Pairs(teams);
    expect(pairs[7]).toEqual(["DK", "CFO"]);
    expect(pairs[6]).toEqual(["AL", "LØS"]);
  });
});

describe("engine rules over many random runs", () => {
  it("no round 1 same-league pairs, no rematches, everyone plays until qualified or eliminated", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const run = simulateToEnd(initialState(), seededRng(seed), seed % 2 ? "bias" : "normal");
      const swiss = run.stages.slice(0, 5);

      for (const m of swiss[0]) expect(getTeam(m.a).league).not.toBe(getTeam(m.b).league);

      const seen = new Set<string>();
      for (const round of swiss)
        for (const m of round) {
          const key = [m.a, m.b].sort().join("-");
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }

      for (let r = 0; r < 5; r++) {
        const before = computeRecords(swiss.slice(0, r));
        const playing = new Set(swiss[r].flatMap((m) => [m.a, m.b]));
        for (const rec of before.values()) expect(playing.has(rec.tag)).toBe(swissStatus(rec) === "active");
        // Teams only meet teams with the same record.
        for (const m of swiss[r]) {
          const a = before.get(m.a)!;
          const b = before.get(m.b)!;
          expect([a.wins, a.losses]).toEqual([b.wins, b.losses]);
        }
      }

      const statuses = [...computeRecords(swiss).values()].map(swissStatus);
      expect(statuses.filter((s) => s === "qualified")).toHaveLength(8);
      expect(statuses.filter((s) => s === "eliminated")).toHaveLength(8);
      expect(run.stages[7][0].winner).toBeTruthy();
    }
  });

  it("toMatches leaves winners empty", () => {
    expect(toMatches([["HLE", "KC"]])).toEqual([{ a: "HLE", b: "KC", winner: null }]);
  });
});
