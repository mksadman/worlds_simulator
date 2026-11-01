"use client";

import { useEffect, useRef, useState } from "react";
import { getTeam } from "@/data/teams";
import type { Match } from "@/lib/engine";
import { matchOdds, roundedPercents } from "@/lib/odds";
import TeamLogo from "./TeamLogo";
import { useHover } from "./HoverContext";

export type InfoLine = [label: string, value: string];

type Props = {
  match: Match;
  /** True when this match belongs to the open stage and can be picked. */
  open: boolean;
  onPick?: (tag: string) => void;
  /** Extra lines for a team's info popover, e.g. seed and BH. */
  info: (tag: string) => InfoLine[];
  label?: string;
};

export default function MatchCard({ match, open, onPick, info, label }: Props) {
  // Cards show plain odds; the LCK/LPL bias is only an option when auto-simulating.
  const [pa, pb] = roundedPercents(matchOdds(getTeam(match.a), getTeam(match.b), "normal"));

  return (
    <div className={`rounded-lg border bg-panel p-1.5 ${open && !match.winner ? "border-accent/50" : "border-line"}`}>
      {label && <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
        <TeamCell tag={match.a} pct={pa} match={match} open={open} onPick={onPick} info={info(match.a)} side="left" />
        <span className="px-0.5 text-[10px] font-bold tracking-widest text-muted">VS</span>
        <TeamCell tag={match.b} pct={pb} match={match} open={open} onPick={onPick} info={info(match.b)} side="right" />
      </div>
    </div>
  );
}

function TeamCell({
  tag,
  pct,
  match,
  open,
  onPick,
  info,
  side,
}: {
  tag: string;
  pct: number;
  match: Match;
  open: boolean;
  onPick?: (tag: string) => void;
  info: InfoLine[];
  /** Which side of the card the cell is on; the info popover opens towards the card's middle. */
  side: "left" | "right";
}) {
  const { hovered, setHovered } = useHover();
  const team = getTeam(tag);
  const won = match.winner === tag;
  const lost = match.winner !== null && !won;
  const [showInfo, setShowInfo] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInfo) return;
    const close = (e: PointerEvent) => !cellRef.current?.contains(e.target as Node) && setShowInfo(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [showInfo]);

  const tone = won ? "border-win bg-win-soft" : "border-line bg-panel-2";
  const hoverRing = hovered === tag ? "outline outline-2 outline-offset-1 outline-hover-ring" : "";
  const lines: InfoLine[] = [...info, ["Riot points", String(team.points)], ["League", team.league]];

  return (
    <div
      ref={cellRef}
      className="relative"
      onMouseEnter={() => setHovered(tag)}
      onMouseLeave={() => {
        setHovered(null);
        setShowInfo(false);
      }}
    >
      <button
        type="button"
        data-tag={tag}
        aria-pressed={won}
        aria-disabled={!open}
        aria-label={`${team.name}, ${pct}%`}
        onClick={() => open && onPick?.(tag)}
        className={`flex w-full flex-col items-center gap-1 rounded-md border px-1 pb-1.5 pt-2 transition-colors ${tone} ${hoverRing} ${
          open ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <span className={`flex flex-col items-center gap-1 ${lost ? "opacity-[var(--dim)] grayscale" : ""}`}>
          <TeamLogo tag={tag} size={34} />
          <span className="text-xs font-bold leading-none tracking-wide">{tag}</span>
        </span>
        <span className={`text-[10px] leading-none tabular ${won ? "font-semibold text-win" : "text-muted"}`}>{pct}%</span>
      </button>
      <button
        type="button"
        aria-label={`About ${team.name}`}
        aria-expanded={showInfo}
        onClick={() => setShowInfo(true)}
        onPointerEnter={(e) => e.pointerType === "mouse" && setShowInfo(true)}
        className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full border border-muted/60 text-[9px] font-bold italic leading-none text-muted hover:border-text hover:text-text"
      >
        i
      </button>
      {showInfo && (
        <div
          role="tooltip"
          className={`absolute top-full z-40 mt-1 w-44 rounded-lg border border-line bg-panel p-2.5 text-left text-xs shadow-xl ${
            side === "left" ? "left-0" : "right-0"
          }`}
        >
          <div className="mb-1.5 font-semibold">{team.name}</div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 tabular">
            {lines.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
