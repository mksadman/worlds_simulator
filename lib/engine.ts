import { TEAMS, type Team } from "@/data/teams";

export const WINS_TO_QUALIFY = 3;
export const LOSSES_TO_ELIMINATE = 3;
export const SWISS_ROUNDS = 5;

export type Pair = [string, string];

export type Match = {
  a: string;
  b: string;
  /** Tag of the winner, or null if not picked yet. */
  winner: string | null;
};

export type RoundResult = { opponent: string; won: boolean };

export type TeamRecord = {
  tag: string;
  seed: number;
  wins: number;
  losses: number;
  /** One entry per round the team played, in order. */
  results: RoundResult[];
};

export type SwissStatus = "qualified" | "eliminated" | "active";

export type StandingRow = TeamRecord & {
  bh: number;
  status: SwissStatus;
  /** Result per Swiss round (index 0 = round 1), null if the team did not play it. */
  rounds: (RoundResult | null)[];
};

const bySeed = (teams: readonly Team[]) => [...teams].sort((x, y) => x.seed - y.seed);

/**
 * Round 1: seed 1 vs 9, 2 vs 10, ..., 8 vs 16. If a pair has two teams from the same league,
 * the lower seed is swapped with the nearest lower seed (+1, -1, +2, -2, ...) so that no pair clashes.
 */
export function round1Pairs(teams: readonly Team[] = TEAMS): Pair[] {
  const sorted = bySeed(teams);
  const half = sorted.length / 2;
  const top = sorted.slice(0, half);
  const low = sorted.slice(half);
  const ok = (i: number) => top[i].league !== low[i].league;
  const swap = (i: number, j: number) => ([low[i], low[j]] = [low[j], low[i]]);

  for (let i = 0; i < half; i++) {
    if (ok(i)) continue;
    let fixed = false;
    for (let k = 1; k < half && !fixed; k++) {
      for (const j of [i + k, i - k]) {
        if (j < 0 || j >= half) continue;
        swap(i, j);
        if (ok(i) && ok(j)) {
          fixed = true;
          break;
        }
        swap(i, j);
      }
    }
    if (!fixed) throw new Error(`Cannot avoid a same-league round 1 pair for ${top[i].tag}`);
  }
  return top.map((t, i) => [t.tag, low[i].tag]);
}

/** Win/loss records from decided matches. Undecided matches are ignored. */
export function computeRecords(rounds: readonly Match[][], teams: readonly Team[] = TEAMS): Map<string, TeamRecord> {
  const map = new Map<string, TeamRecord>();
  for (const t of teams) map.set(t.tag, { tag: t.tag, seed: t.seed, wins: 0, losses: 0, results: [] });
  for (const round of rounds) {
    for (const m of round) {
      if (!m.winner) continue;
      const a = map.get(m.a)!;
      const b = map.get(m.b)!;
      const aWon = m.winner === m.a;
      a.results.push({ opponent: m.b, won: aWon });
      b.results.push({ opponent: m.a, won: !aWon });
      if (aWon) {
        a.wins++;
        b.losses++;
      } else {
        b.wins++;
        a.losses++;
      }
    }
  }
  return map;
}

/** Buchholz: sum over a team's opponents so far of (opponent's current wins - current losses). */
export function buchholz(tag: string, records: Map<string, TeamRecord>): number {
  return records.get(tag)!.results.reduce((sum, r) => {
    const opp = records.get(r.opponent)!;
    return sum + opp.wins - opp.losses;
  }, 0);
}

export function swissStatus(rec: { wins: number; losses: number }): SwissStatus {
  if (rec.wins >= WINS_TO_QUALIFY) return "qualified";
  if (rec.losses >= LOSSES_TO_ELIMINATE) return "eliminated";
  return "active";
}

const recordKey = (r: { wins: number; losses: number }) => `${r.wins}-${r.losses}`;

/** Sort within a record group: BH high to low, then seed low to high. */
function sortGroup(group: TeamRecord[], records: Map<string, TeamRecord>): TeamRecord[] {
  return [...group].sort((x, y) => buchholz(y.tag, records) - buchholz(x.tag, records) || x.seed - y.seed);
}

/**
 * Pairs a sorted group top-vs-bottom without rematches. The highest remaining team takes the
 * lowest-sorted remaining team it hasn't played, backtracking if the rest can't be paired.
 */
function pairGroup(sorted: string[], played: (a: string, b: string) => boolean): Pair[] | null {
  if (sorted.length === 0) return [];
  const [top, ...rest] = sorted;
  for (let j = rest.length - 1; j >= 0; j--) {
    if (played(top, rest[j])) continue;
    const sub = pairGroup(
      rest.filter((_, k) => k !== j),
      played,
    );
    if (sub) return [[top, rest[j]], ...sub];
  }
  return null;
}

/** Pairings for the next Swiss round, given all previous rounds (fully decided). */
export function nextSwissPairs(rounds: readonly Match[][], teams: readonly Team[] = TEAMS): Pair[] {
  if (rounds.length === 0) return round1Pairs(teams);
  const records = computeRecords(rounds, teams);
  const active = [...records.values()].filter((r) => swissStatus(r) === "active");

  const groups = new Map<string, TeamRecord[]>();
  for (const r of active) {
    const key = recordKey(r);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const orderedGroups = [...groups.values()].sort((x, y) => y[0].wins - x[0].wins || x[0].losses - y[0].losses);

  const played = (a: string, b: string) => records.get(a)!.results.some((r) => r.opponent === b);
  const pairs: Pair[] = [];
  for (const group of orderedGroups) {
    if (group.length % 2 !== 0) throw new Error(`Odd record group ${recordKey(group[0])}`);
    const sorted = sortGroup(group, records).map((r) => r.tag);
    // A rematch is only allowed if there is no other way to pair the group.
    const groupPairs = pairGroup(sorted, played) ?? pairGroup(sorted, () => false)!;
    pairs.push(...groupPairs);
  }
  return pairs;
}

/** Live Swiss standings: wins (high), losses (low), BH (high), seed (low). */
export function swissStandings(rounds: readonly Match[][], teams: readonly Team[] = TEAMS): StandingRow[] {
  const records = computeRecords(rounds, teams);
  const rows: StandingRow[] = [...records.values()].map((r) => {
    const perRound: (RoundResult | null)[] = rounds.map((round) => {
      const m = round.find((x) => x.winner && (x.a === r.tag || x.b === r.tag));
      if (!m) return null;
      const opponent = m.a === r.tag ? m.b : m.a;
      return { opponent, won: m.winner === r.tag };
    });
    return { ...r, bh: buchholz(r.tag, records), status: swissStatus(r), rounds: perRound };
  });
  return rows.sort((x, y) => y.wins - x.wins || x.losses - y.losses || y.bh - x.bh || x.seed - y.seed);
}

export function isSwissComplete(rounds: readonly Match[][], teams: readonly Team[] = TEAMS): boolean {
  const records = computeRecords(rounds, teams);
  return [...records.values()].every((r) => swissStatus(r) !== "active");
}

/** Playoff seeds 1-8: the qualifiers in final Swiss standings order. */
export function playoffSeeds(rounds: readonly Match[][], teams: readonly Team[] = TEAMS): string[] {
  return swissStandings(rounds, teams)
    .filter((r) => r.status === "qualified")
    .map((r) => r.tag);
}

/** QF1 = 1 vs 8, QF2 = 4 vs 5, QF3 = 2 vs 7, QF4 = 3 vs 6. */
export function quarterfinalPairs(seeds: readonly string[]): Pair[] {
  const s = (n: number) => seeds[n - 1];
  return [
    [s(1), s(8)],
    [s(4), s(5)],
    [s(2), s(7)],
    [s(3), s(6)],
  ];
}

/** Next knockout round: winners of matches 1+2, 3+4, ... meet. */
export function nextKnockoutPairs(previous: readonly Match[]): Pair[] {
  const pairs: Pair[] = [];
  for (let i = 0; i < previous.length; i += 2) {
    const w1 = previous[i].winner;
    const w2 = previous[i + 1].winner;
    if (!w1 || !w2) throw new Error("Knockout round is not finished");
    pairs.push([w1, w2]);
  }
  return pairs;
}

export const toMatches = (pairs: Pair[]): Match[] => pairs.map(([a, b]) => ({ a, b, winner: null }));
