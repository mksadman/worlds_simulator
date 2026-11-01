export type League = "LCK" | "LPL" | "LEC" | "LCS" | "LCP" | "CBLOL";

export type Team = {
  seed: number;
  tag: string;
  name: string;
  league: League;
  /** Rank in Riot's Global Power Ranking (as published, ties marked). */
  riotRank: string;
  /** Riot Global Power Ranking points. Fixed for the whole run. */
  points: number;
  record: string;
};

// Seeds come from Riot's Global Power Ranking before Worlds. Ties were broken by win rate.
export const TEAMS: readonly Team[] = [
  { seed: 1, tag: "HLE", name: "Hanwha Life Esports", league: "LCK", riotRank: "1", points: 1540, record: "28-13" },
  { seed: 2, tag: "GEN", name: "Gen.G", league: "LCK", riotRank: "2", points: 1519, record: "33-9" },
  { seed: 3, tag: "BLG", name: "Bilibili Gaming", league: "LPL", riotRank: "3", points: 1513, record: "48-11" },
  { seed: 4, tag: "G2", name: "G2 Esports", league: "LEC", riotRank: "4", points: 1475, record: "33-15" },
  { seed: 5, tag: "T1", name: "T1", league: "LCK", riotRank: "5", points: 1471, record: "29-16" },
  { seed: 6, tag: "LYON", name: "LYON", league: "LCS", riotRank: "6", points: 1438, record: "25-10" },
  { seed: 7, tag: "AL", name: "Anyone's Legend", league: "LPL", riotRank: "7 (tied)", points: 1409, record: "32-18" },
  { seed: 8, tag: "DK", name: "Dplus Kia", league: "LCK", riotRank: "7 (tied)", points: 1409, record: "27-16" },
  { seed: 9, tag: "KC", name: "Karmine Corp", league: "LEC", riotRank: "10", points: 1375, record: "33-13" },
  { seed: 10, tag: "TSW", name: "Team Secret Whales", league: "LCP", riotRank: "11", points: 1372, record: "26-6" },
  { seed: 11, tag: "TL", name: "Team Liquid", league: "LCS", riotRank: "12", points: 1368, record: "21-11" },
  { seed: 12, tag: "TES", name: "Top Esports", league: "LPL", riotRank: "13", points: 1364, record: "27-24" },
  { seed: 13, tag: "IG", name: "Invictus Gaming", league: "LPL", riotRank: "15", points: 1348, record: "18-25" },
  { seed: 14, tag: "MKOI", name: "Movistar KOI", league: "LEC", riotRank: "18 (tied)", points: 1317, record: "22-18" },
  { seed: 15, tag: "CFO", name: "CTBC Flying Oyster", league: "LCP", riotRank: "18 (tied)", points: 1317, record: "12-14" },
  { seed: 16, tag: "LØS", name: "LØS", league: "CBLOL", riotRank: "40", points: 1174, record: "22-9" },
];

const BY_TAG = new Map(TEAMS.map((t) => [t.tag, t]));

export function getTeam(tag: string): Team {
  const team = BY_TAG.get(tag);
  if (!team) throw new Error(`Unknown team tag: ${tag}`);
  return team;
}
