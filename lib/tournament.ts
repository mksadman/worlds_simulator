import { getTeam } from "@/data/teams";
import {
  SWISS_ROUNDS,
  isSwissComplete,
  nextKnockoutPairs,
  nextSwissPairs,
  playoffSeeds,
  quarterfinalPairs,
  toMatches,
  type Match,
} from "./engine";
import { drawWinner, type OddsMode, type Rng } from "./odds";

/**
 * A run is a list of stages (Swiss rounds 1-5, then quarterfinals, semifinals, grand final).
 * Stages before `locked` are locked in; stages[locked] (if present) is the one being picked.
 */
export type RunState = {
  stages: Match[][];
  locked: number;
};

export const STAGE_NAMES = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5", "Quarterfinals", "Semifinals", "Grand Final"];
export const TOTAL_STAGES = STAGE_NAMES.length;
export const FIRST_KNOCKOUT_STAGE = SWISS_ROUNDS;

export const isKnockoutStage = (stage: number) => stage >= FIRST_KNOCKOUT_STAGE;

export function initialState(): RunState {
  return { stages: [toMatches(nextSwissPairs([]))], locked: 0 };
}

/** Builds the matches for stage `index` from the locked stages before it. */
function buildStage(stages: Match[][], index: number): Match[] {
  if (index < SWISS_ROUNDS) return toMatches(nextSwissPairs(stages.slice(0, index)));
  if (index === FIRST_KNOCKOUT_STAGE) return toMatches(quarterfinalPairs(playoffSeeds(stages.slice(0, SWISS_ROUNDS))));
  return toMatches(nextKnockoutPairs(stages[index - 1]));
}

export const currentStage = (s: RunState): Match[] | null => (s.locked < s.stages.length ? s.stages[s.locked] : null);

export const isFinished = (s: RunState) => s.locked >= TOTAL_STAGES;

export function champion(s: RunState): string | null {
  return isFinished(s) ? s.stages[TOTAL_STAGES - 1][0].winner : null;
}

export const canLock = (s: RunState) => {
  const stage = currentStage(s);
  return !!stage && stage.every((m) => m.winner !== null);
};

/** Picks (or clears, if `tag` is already picked) the winner of a match in the open stage. */
export function pick(s: RunState, stageIndex: number, matchIndex: number, tag: string): RunState {
  if (stageIndex !== s.locked || stageIndex >= s.stages.length) return s;
  const match = s.stages[stageIndex][matchIndex];
  if (!match || (tag !== match.a && tag !== match.b)) return s;
  const winner = match.winner === tag ? null : tag;
  const stages = s.stages.map((stage, i) =>
    i === stageIndex ? stage.map((m, j) => (j === matchIndex ? { ...m, winner } : m)) : stage,
  );
  return { ...s, stages };
}

/** Locks the open stage and creates the next one. */
export function lock(s: RunState): RunState {
  if (!canLock(s)) return s;
  const locked = s.locked + 1;
  const stages = s.stages.slice(0, locked);
  // The Swiss always runs five rounds with 16 teams; guard anyway so a finished Swiss goes to knockouts.
  if (locked < SWISS_ROUNDS && isSwissComplete(stages)) throw new Error("Swiss finished early");
  if (locked < TOTAL_STAGES) stages.push(buildStage(stages, locked));
  return { stages, locked };
}

/** Reopens the latest locked stage (keeping its picks) and removes everything after it. */
export function undo(s: RunState): RunState {
  if (s.locked === 0) return s;
  const locked = s.locked - 1;
  return { stages: s.stages.slice(0, locked + 1), locked };
}

/** Fills unpicked matches in the open stage using the odds, then locks it in. User picks are kept. */
export function simulateStage(s: RunState, rng: Rng, mode: OddsMode): RunState {
  const stage = currentStage(s);
  if (!stage) return s;
  const filled = stage.map((m) => (m.winner ? m : { ...m, winner: drawWinner(getTeam(m.a), getTeam(m.b), rng, mode) }));
  return lock({ ...s, stages: s.stages.map((st, i) => (i === s.locked ? filled : st)) });
}

/** Simulates until the current phase ends: the Swiss stage (after round 5) or the knockouts (champion). */
export function simulatePhase(s: RunState, rng: Rng, mode: OddsMode): RunState {
  const end = s.locked < SWISS_ROUNDS ? SWISS_ROUNDS : TOTAL_STAGES;
  let state = s;
  while (state.locked < end) state = simulateStage(state, rng, mode);
  return state;
}

export function simulateToEnd(s: RunState, rng: Rng, mode: OddsMode): RunState {
  let state = s;
  while (!isFinished(state)) state = simulateStage(state, rng, mode);
  return state;
}

/** Checks that a value loaded from storage is a consistent run; returns null otherwise. */
export function parseRunState(value: unknown): RunState | null {
  try {
    const v = value as RunState;
    if (!v || !Array.isArray(v.stages) || typeof v.locked !== "number") return null;
    // Rebuild every stage from the stored picks so stale or tampered data can't break the engine.
    let state = initialState();
    for (let i = 0; i < v.stages.length && i < TOTAL_STAGES; i++) {
      const saved = v.stages[i];
      const stage = state.stages[i];
      if (!Array.isArray(saved) || saved.length !== stage.length) return null;
      stage.forEach((m, j) => {
        const w = saved[j]?.winner;
        if (saved[j]?.a !== m.a || saved[j]?.b !== m.b) throw new Error("mismatch");
        if (w) state = pick(state, i, j, w);
      });
      if (i < v.locked) state = lock(state);
    }
    return state.locked === v.locked ? state : null;
  } catch {
    return null;
  }
}
