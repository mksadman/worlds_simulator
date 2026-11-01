"use client";

import { getTeam } from "@/data/teams";
import { bhBeforeRound, finishedTeams, formatBh, groupRound } from "@/lib/board";
import { SWISS_ROUNDS, type Match, type StandingRow } from "@/lib/engine";
import TeamLogo from "./TeamLogo";
import MatchCard from "./MatchCard";
import { useHover } from "./HoverContext";

// Record groups each round will have, shown as placeholders before the round is paired.
const EXPECTED_GROUPS = [["0-0"], ["1-0", "0-1"], ["2-0", "1-1", "0-2"], ["2-1", "1-2"], ["2-2"]];

type Props = {
  stages: Match[][];
  locked: number;
  onPick: (round: number, matchIndex: number, tag: string) => void;
  /** Round shown on narrow screens (0-based). */
  mobileRound: number;
  setMobileRound: (round: number) => void;
};

export default function SwissBoard({ stages, locked, onPick, mobileRound, setMobileRound }: Props) {
  const lockedSwiss = stages.slice(0, Math.min(locked, SWISS_ROUNDS));
  const { qualified, eliminated } = finishedTeams(lockedSwiss);

  return (
    <div>
      <div className="mb-3 flex gap-1 overflow-x-auto lg:hidden" role="tablist" aria-label="Swiss rounds">
        {EXPECTED_GROUPS.map((_, r) => (
          <button
            key={r}
            role="tab"
            aria-selected={mobileRound === r}
            onClick={() => setMobileRound(r)}
            className={`shrink-0 rounded-md border px-3 py-1.5 text-sm ${
              mobileRound === r ? "border-accent bg-accent-soft font-semibold text-accent" : "border-line text-muted"
            }`}
          >
            Round {r + 1}
            {r < locked && <span className="ml-1 text-[10px]">✓</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_minmax(190px,0.85fr)]">
        {EXPECTED_GROUPS.map((expected, r) => (
          <section key={r} className={`flex-col gap-3 ${mobileRound === r ? "flex" : "hidden"} lg:flex`}>
            <h2 className="hidden font-display text-base font-bold uppercase tracking-[0.12em] text-muted lg:block">
              Round {r + 1}
              {r === locked && <span className="ml-2 text-accent">● picking</span>}
              {r < locked && <span className="ml-2">✓ locked</span>}
            </h2>
            {r < stages.length ? (
              <RoundGroups stages={stages} round={r} open={r === locked} onPick={onPick} />
            ) : (
              expected.map((rec) => (
                <Box key={rec} record={rec}>
                  <p className="px-1 py-3 text-center text-xs text-muted">Paired after Round {r} is locked in</p>
                </Box>
              ))
            )}
          </section>
        ))}

        <section className="flex flex-col gap-3">
          <h2 className="hidden font-display text-base font-bold uppercase tracking-[0.12em] text-muted lg:block">Results</h2>
          <ResultBox title="Qualified" rows={qualified} kind="qualified" />
          <ResultBox title="Eliminated" rows={eliminated} kind="eliminated" />
        </section>
      </div>
    </div>
  );
}

function RoundGroups({
  stages,
  round,
  open,
  onPick,
}: {
  stages: Match[][];
  round: number;
  open: boolean;
  onPick: Props["onPick"];
}) {
  const bh = bhBeforeRound(stages, round);
  return (
    <>
      {groupRound(stages, round).map((g) => (
        <Box key={`${g.wins}-${g.losses}`} record={`${g.wins}-${g.losses}`}>
          <div className="flex flex-col gap-2">
            {g.matches.map((m) => (
              <MatchCard
                key={m.index}
                match={m}
                open={open}
                onPick={(tag) => onPick(round, m.index, tag)}
                info={(tag) => [
                  ["Seed", `#${getTeam(tag).seed}`],
                  ["BH this round", formatBh(bh.get(tag)!)],
                ]}
              />
            ))}
          </div>
        </Box>
      ))}
    </>
  );
}

/** A record group (e.g. 2-1) with a large scoreboard-style header bar. */
function Box({ record, children }: { record: string; children: React.ReactNode }) {
  const [wins, losses] = record.split("-");
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel-2/60">
      <h3
        aria-label={`${wins} wins, ${losses} losses`}
        className="border-b border-line bg-panel py-1.5 text-center font-display text-3xl font-extrabold leading-none tracking-wide tabular"
      >
        {wins}
        <span className="mx-1.5 text-muted">–</span>
        {losses}
      </h3>
      <div className="p-2">{children}</div>
    </div>
  );
}

function ResultBox({ title, rows, kind }: { title: string; rows: StandingRow[]; kind: "qualified" | "eliminated" }) {
  const { hovered, setHovered } = useHover();
  const tone = kind === "qualified" ? "border-win/40 bg-win-soft" : "border-loss/40 bg-loss-soft";
  return (
    <div className={`rounded-xl border p-2 ${tone}`}>
      <h3 className={`mb-2 px-1 text-[11px] font-bold uppercase tracking-wider ${kind === "qualified" ? "text-win" : "text-loss"}`}>
        {title} <span className="tabular">({rows.length}/8)</span>
      </h3>
      {rows.length === 0 ? (
        <p className="px-1 pb-1 text-xs text-muted">No teams yet</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((r) => (
            <li
              key={r.tag}
              onMouseEnter={() => setHovered(r.tag)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-1.5 rounded-md bg-panel px-1.5 py-1 text-sm ${
                hovered === r.tag ? "outline outline-1 outline-hover-ring !bg-hover" : ""
              }`}
            >
              <TeamLogo tag={r.tag} size={22} className="rounded" />
              <span className="font-semibold">{r.tag}</span>
              <span className="truncate whitespace-nowrap text-[11px] text-muted tabular">
                #{r.seed} · BH {formatBh(r.bh)}
              </span>
              <span className="ml-auto text-xs font-semibold tabular">
                {r.wins}-{r.losses}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
