import { describe, expect, it } from "vitest";
import { seededRng } from "@/lib/odds";
import {
  canLock,
  champion,
  initialState,
  lock,
  parseRunState,
  pick,
  simulatePhase,
  simulateStage,
  simulateToEnd,
  undo,
} from "@/lib/tournament";

describe("run state", () => {
  it("picks, toggles and changes winners only in the open stage", () => {
    let s = initialState();
    s = pick(s, 0, 0, "HLE");
    expect(s.stages[0][0].winner).toBe("HLE");
    s = pick(s, 0, 0, "KC");
    expect(s.stages[0][0].winner).toBe("KC");
    s = pick(s, 0, 0, "KC");
    expect(s.stages[0][0].winner).toBeNull();
    expect(pick(s, 1, 0, "HLE")).toBe(s);
    expect(pick(s, 0, 0, "GEN")).toBe(s);
  });

  it("only locks when every match is picked", () => {
    let s = pick(initialState(), 0, 0, "HLE");
    expect(canLock(s)).toBe(false);
    expect(lock(s)).toBe(s);
    s.stages[0].forEach((m, i) => i > 0 && (s = pick(s, 0, i, m.a)));
    expect(canLock(s)).toBe(true);
    s = lock(s);
    expect(s.locked).toBe(1);
    expect(s.stages).toHaveLength(2);
  });

  it("simulate round keeps user picks", () => {
    let s = pick(initialState(), 0, 0, "KC");
    s = simulateStage(s, seededRng(1), "normal");
    expect(s.stages[0][0].winner).toBe("KC");
    expect(s.locked).toBe(1);
  });

  it("simulate phase stops after the Swiss stage, then finishes the knockouts", () => {
    let s = pick(initialState(), 0, 0, "KC");
    s = simulatePhase(s, seededRng(11), "bias");
    expect(s.locked).toBe(5);
    expect(s.stages[0][0].winner).toBe("KC");
    expect(s.stages[5].every((m) => m.winner === null)).toBe(true);
    s = pick(s, 5, 0, s.stages[5][0].b);
    s = simulatePhase(s, seededRng(12), "normal");
    expect(champion(s)).toBeTruthy();
    expect(s.stages[5][0].winner).toBe(s.stages[5][0].b);
    expect(simulatePhase(s, seededRng(13), "normal")).toBe(s);
  });

  it("undo reopens the last locked stage with its picks, back to round 1", () => {
    let s = simulateToEnd(initialState(), seededRng(7), "normal");
    expect(champion(s)).toBeTruthy();
    const finalPick = s.stages[7][0].winner;
    s = undo(s);
    expect(s.locked).toBe(7);
    expect(champion(s)).toBeNull();
    expect(s.stages[7][0].winner).toBe(finalPick);
    while (s.locked > 0) s = undo(s);
    expect(s.stages).toHaveLength(1);
    expect(s.stages[0].every((m) => m.winner)).toBe(true);
    expect(undo(s)).toBe(s);
  });

  it("restores a saved run and rejects broken data", () => {
    const s = simulateStage(simulateStage(initialState(), seededRng(3), "normal"), seededRng(4), "normal");
    expect(parseRunState(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(parseRunState({ stages: [[{ a: "X", b: "Y", winner: null }]], locked: 0 })).toBeNull();
    expect(parseRunState(null)).toBeNull();
    expect(parseRunState({ ...s, locked: 5 })).toBeNull();
  });
});
