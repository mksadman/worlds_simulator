import type { Team } from "@/data/teams";
import { BONUS_LEAGUES, LCK_LPL_BONUS } from "./config";

/** "normal" uses Riot points only; "bias" adds the LCK/LPL bonus. Chosen each time the user auto-simulates. */
export type OddsMode = "normal" | "bias";

export type MatchOdds = {
  /** Chance that team A wins the series (0-1, never exactly 0 or 1). */
  pA: number;
  pB: number;
  /** Tag of the team that got the LCK/LPL bonus, or null. */
  biasTeam: string | null;
};

const hasBonusLeague = (t: Team) => BONUS_LEAGUES.includes(t.league);

/** Points used for this one match. In bias mode, the LCK/LPL bonus applies when exactly one side qualifies. */
export function matchPoints(
  a: Team,
  b: Team,
  mode: OddsMode,
): { pointsA: number; pointsB: number; biasTeam: string | null } {
  const bias = mode === "bias";
  const aBonus = bias && hasBonusLeague(a) && !hasBonusLeague(b);
  const bBonus = bias && hasBonusLeague(b) && !hasBonusLeague(a);
  return {
    pointsA: a.points + (aBonus ? LCK_LPL_BONUS : 0),
    pointsB: b.points + (bBonus ? LCK_LPL_BONUS : 0),
    biasTeam: aBonus ? a.tag : bBonus ? b.tag : null,
  };
}

/** Elo-style chance for one series: P(A) = 1 / (1 + 10^((B - A) / 400)). */
export function winProbability(pointsA: number, pointsB: number): number {
  return 1 / (1 + Math.pow(10, (pointsB - pointsA) / 400));
}

export function matchOdds(a: Team, b: Team, mode: OddsMode): MatchOdds {
  const { pointsA, pointsB, biasTeam } = matchPoints(a, b, mode);
  const pA = winProbability(pointsA, pointsB);
  return { pA, pB: 1 - pA, biasTeam };
}

/** Whole-number percentages that always add up to 100 and are never 0 or 100. */
export function roundedPercents(odds: MatchOdds): [number, number] {
  const a = Math.min(99, Math.max(1, Math.round(odds.pA * 100)));
  return [a, 100 - a];
}

/** Source of randomness: next() returns a number in [0, 1). */
export interface Rng {
  next(): number;
}

export const mathRandomRng: Rng = { next: () => Math.random() };

/** Small deterministic generator (mulberry32) for tests and reproducible runs. */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Draws the series winner using the match odds. Returns the winning team's tag. */
export function drawWinner(a: Team, b: Team, rng: Rng, mode: OddsMode): string {
  return rng.next() < matchOdds(a, b, mode).pA ? a.tag : b.tag;
}
