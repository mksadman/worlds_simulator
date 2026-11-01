import { buchholz, computeRecords, swissStandings, type Match } from "./engine";

export type BoardMatch = Match & { index: number };

export type RecordGroup = {
  wins: number;
  losses: number;
  matches: BoardMatch[];
};

/** Splits one Swiss round into record groups (e.g. 1-0, 0-1), using the records before that round. */
export function groupRound(stages: Match[][], round: number): RecordGroup[] {
  const records = computeRecords(stages.slice(0, round));
  const groups: RecordGroup[] = [];
  stages[round].forEach((m, index) => {
    const r = records.get(m.a)!;
    let g = groups.find((x) => x.wins === r.wins && x.losses === r.losses);
    if (!g) groups.push((g = { wins: r.wins, losses: r.losses, matches: [] }));
    g.matches.push({ ...m, index });
  });
  return groups.sort((x, y) => y.wins - x.wins || x.losses - y.losses);
}

/** Buchholz of every team as it stood before `round` was paired. */
export function bhBeforeRound(stages: Match[][], round: number): Map<string, number> {
  const records = computeRecords(stages.slice(0, round));
  return new Map([...records.keys()].map((tag) => [tag, buchholz(tag, records)]));
}

/** Qualified and eliminated teams so far, in standings order, from locked Swiss rounds. */
export function finishedTeams(lockedSwiss: Match[][]) {
  const rows = swissStandings(lockedSwiss);
  return {
    qualified: rows.filter((r) => r.status === "qualified"),
    eliminated: rows.filter((r) => r.status === "eliminated"),
  };
}

export const formatBh = (bh: number) => (bh > 0 ? `+${bh}` : `${bh}`);
