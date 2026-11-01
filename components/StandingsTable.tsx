"use client";

import { getTeam } from "@/data/teams";
import { formatBh } from "@/lib/board";
import { SWISS_ROUNDS, swissStandings, type Match } from "@/lib/engine";
import TeamLogo from "./TeamLogo";
import { useHover } from "./HoverContext";

const ROW_TONE = {
  qualified: "bg-win-soft",
  eliminated: "bg-loss-soft",
  active: "",
};

export default function StandingsTable({ lockedSwiss }: { lockedSwiss: Match[][] }) {
  const rows = swissStandings(lockedSwiss);
  const { hovered, setHovered } = useHover();

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel">
      <table className="w-full min-w-[640px] text-sm tabular">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
            <th className="px-3 py-2 font-semibold">#</th>
            <th className="px-3 py-2 font-semibold">Team</th>
            <th className="px-3 py-2 font-semibold">Record</th>
            <th className="px-3 py-2 font-semibold">BH</th>
            {Array.from({ length: SWISS_ROUNDS }, (_, r) => (
              <th key={r} className="px-2 py-2 text-center font-semibold">
                R{r + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const team = getTeam(row.tag);
            return (
              <tr
                key={row.tag}
                onMouseEnter={() => setHovered(row.tag)}
                onMouseLeave={() => setHovered(null)}
                className={`border-b border-line last:border-0 ${ROW_TONE[row.status]} ${
                  hovered === row.tag ? "outline outline-1 -outline-offset-1 outline-hover-ring" : ""
                }`}
              >
                <td className="px-3 py-2 text-muted">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <TeamLogo tag={team.tag} size={24} className="rounded" />
                    <span className="font-semibold">{team.tag}</span>
                    <span className="hidden truncate text-xs text-muted sm:inline">{team.name}</span>
                    <span className="text-[11px] text-muted">#{team.seed}</span>
                  </div>
                </td>
                <td className="px-3 py-2 font-semibold">
                  {row.wins}-{row.losses}
                  {row.status !== "active" && (
                    <span className={`ml-2 text-[10px] uppercase ${row.status === "qualified" ? "text-win" : "text-loss"}`}>
                      {row.status === "qualified" ? "Qualified" : "Out"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{formatBh(row.bh)}</td>
                {Array.from({ length: SWISS_ROUNDS }, (_, r) => {
                  const res = row.rounds[r];
                  return (
                    <td key={r} className="px-2 py-2 text-center">
                      {res ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <span className={`font-bold ${res.won ? "text-win" : "text-loss"}`}>{res.won ? "W" : "L"}</span>
                          <span className="text-xs text-muted">{res.opponent}</span>
                        </span>
                      ) : (
                        <span className="text-muted">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
