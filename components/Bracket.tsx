"use client";

import { getTeam } from "@/data/teams";
import { formatBh } from "@/lib/board";
import { SWISS_ROUNDS, swissStandings, type Match } from "@/lib/engine";
import { FIRST_KNOCKOUT_STAGE } from "@/lib/tournament";
import TeamLogo from "./TeamLogo";
import MatchCard, { type InfoLine } from "./MatchCard";

type Props = {
  stages: Match[][];
  locked: number;
  champion: string | null;
  onPick: (stage: number, matchIndex: number, tag: string) => void;
};

const COLUMNS = [
  { title: "Quarterfinals", labels: ["QF1 · 1 vs 8", "QF2 · 4 vs 5", "QF3 · 2 vs 7", "QF4 · 3 vs 6"] },
  { title: "Semifinals", labels: ["SF1", "SF2"] },
  { title: "Grand Final", labels: ["Final"] },
];

// Width of the gap between columns; connector lines span it.
const GAP = "3rem";

export default function Bracket({ stages, locked, champion, onPick }: Props) {
  const standings = swissStandings(stages.slice(0, SWISS_ROUNDS));
  const playoff = new Map(
    standings.filter((r) => r.status === "qualified").map((r, i) => [r.tag, { seed: i + 1, bh: r.bh }]),
  );
  const info = (tag: string): InfoLine[] => {
    const p = playoff.get(tag)!;
    return [
      ["Playoff seed", `#${p.seed}`],
      ["Swiss BH", formatBh(p.bh)],
      ["Original seed", `#${getTeam(tag).seed}`],
    ];
  };

  return (
    <div>
      {champion && <ChampionBanner tag={champion} />}
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[700px] grid-cols-[repeat(3,minmax(200px,300px))] justify-center" style={{ columnGap: GAP }}>
          {COLUMNS.map((col, c) => {
            const stage = FIRST_KNOCKOUT_STAGE + c;
            const matches = stages[stage];
            return (
              <div key={col.title} className="flex flex-col">
                <h2 className="mb-3 font-display text-base font-bold uppercase tracking-[0.12em] text-muted">
                  {col.title}
                  {stage === locked && <span className="ml-2 text-accent">● picking</span>}
                  {stage < locked && <span className="ml-2">✓ locked</span>}
                </h2>
                <div className="flex h-[600px] flex-col">
                  {chunk(col.labels, 2).map((pairLabels, p) => (
                    <div key={p} className="relative flex flex-1 flex-col justify-around">
                      {pairLabels.map((label, k) => {
                        const i = p * 2 + k;
                        const m = matches?.[i];
                        return (
                          <div key={label} className="relative">
                            {c > 0 && <Stub side="left" />}
                            {c < COLUMNS.length - 1 && <Stub side="right" />}
                            {m ? (
                              <MatchCard
                                match={m}
                                open={stage === locked}
                                onPick={(tag) => onPick(stage, i, tag)}
                                info={info}
                                label={label}
                              />
                            ) : (
                              <Placeholder label={label} />
                            )}
                          </div>
                        );
                      })}
                      {pairLabels.length === 2 && (
                        <span
                          aria-hidden
                          className="absolute top-1/4 bottom-1/4 border-r border-line"
                          style={{ right: `calc(${GAP} / -2)` }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Horizontal line from a card's edge to the middle of the column gap. */
function Stub({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className="absolute top-1/2 border-t border-line"
      style={{ width: `calc(${GAP} / 2)`, [side]: `calc(${GAP} / -2)` }}
    />
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-[112px] flex-col rounded-lg border border-dashed border-line bg-panel/50 px-2.5 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <span className="m-auto text-xs text-muted">TBD</span>
    </div>
  );
}

function ChampionBanner({ tag }: { tag: string }) {
  const team = getTeam(tag);
  return (
    <div className="mb-5 flex items-center gap-4 rounded-xl border border-accent/60 bg-gradient-to-r from-accent-soft to-transparent px-5 py-4 shadow-[0_0_32px_var(--glow)]">
      <TeamLogo tag={tag} size={56} className="rounded-lg" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
          </svg>
          Worlds 2026 Champion
        </div>
        <div className="font-display text-3xl font-extrabold uppercase leading-tight tracking-wide">{team.name}</div>
      </div>
    </div>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
