"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SWISS_ROUNDS } from "@/lib/engine";
import { mathRandomRng, type OddsMode } from "@/lib/odds";
import {
  STAGE_NAMES,
  canLock,
  champion,
  currentStage,
  initialState,
  isFinished,
  lock,
  parseRunState,
  pick,
  simulatePhase,
  simulateStage,
  undo,
  type RunState,
} from "@/lib/tournament";
import Bracket from "./Bracket";
import { HoverContext } from "./HoverContext";
import OddsPrompt, { type SimRequest } from "./OddsPrompt";
import StandingsTable from "./StandingsTable";
import SwissBoard from "./SwissBoard";

type View = "swiss" | "knockouts" | "standings";

const STORAGE_KEY = "worlds26-run-v1";

const VIEW_TITLES: Record<View, string> = { swiss: "Swiss Stage", knockouts: "Knockouts", standings: "Standings" };

export default function Simulator() {
  const [run, setRun] = useState<RunState>(initialState);
  const [view, setView] = useState<View>("swiss");
  const [mobileRound, setMobileRound] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [request, setRequest] = useState<SimRequest | null>(null);
  const loaded = useRef(false);

  // Restore the saved run after mount (the server render always shows a fresh draw).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { run?: unknown; view?: View };
        const restored = parseRunState(saved.run);
        if (restored) {
          setRun(restored);
          setMobileRound(Math.min(restored.locked, SWISS_ROUNDS - 1));
          if (saved.view === "standings" || (saved.view === "knockouts" && restored.locked >= SWISS_ROUNDS)) setView(saved.view);
        }
      }
    } catch {
      // Ignore unreadable storage and start fresh.
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ run, view }));
    } catch {
      // Storage full or blocked: the run just won't survive a refresh.
    }
  }, [run, view]);

  const apply = useCallback((next: RunState) => {
    setRun(next);
    setMobileRound(Math.min(next.locked, SWISS_ROUNDS - 1));
    // Undoing back into the Swiss stage leaves the bracket.
    setView((v) => (next.locked < SWISS_ROUNDS && v === "knockouts" ? "swiss" : v));
  }, []);

  const swissDone = run.locked >= SWISS_ROUNDS;
  const inKnockouts = view === "knockouts";
  // The simulate buttons act on the phase of the page being viewed.
  const phaseOpen = inKnockouts ? swissDone && !isFinished(run) : !swissDone;

  const actions = {
    lock: () => apply(lock(run)),
    askRound: () => phaseOpen && setRequest({ kind: "round", stage: run.locked }),
    askPhase: () => phaseOpen && setRequest({ kind: "phase", stage: run.locked }),
    undo: () => run.locked > 0 && apply(undo(run)),
    reset: () => {
      apply(initialState());
      setView("swiss");
    },
  };
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  function runSimulation(mode: OddsMode) {
    if (!request) return;
    apply(request.kind === "round" ? simulateStage(run, mathRandomRng, mode) : simulatePhase(run, mathRandomRng, mode));
    setRequest(null);
  }

  useEffect(() => {
    if (request) return; // The odds prompt handles its own keys.
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      const map: Record<string, () => void> = {
        s: actionsRef.current.askRound,
        a: actionsRef.current.askPhase,
        u: actionsRef.current.undo,
        r: actionsRef.current.reset,
      };
      const fn = map[e.key.toLowerCase()];
      if (fn) {
        e.preventDefault();
        fn();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request]);

  const onPick = (stage: number, matchIndex: number, tag: string) => setRun((s) => pick(s, stage, matchIndex, tag));

  const stage = currentStage(run);
  const picked = stage ? stage.filter((m) => m.winner).length : 0;
  const champ = champion(run);
  const showLock = canLock(run) && (inKnockouts ? swissDone : !swissDone);

  return (
    <HoverContext.Provider value={{ hovered, setHovered }}>
      <main className="mx-auto max-w-[1500px] px-4 pb-16 pt-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-accent-2">Worlds 2026</div>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-none tracking-wide sm:text-5xl">
              {VIEW_TITLES[view]}
            </h1>
            <p className="text-sm text-muted">
              {champ ? (
                <>
                  Tournament complete · <span className="font-semibold text-accent">{champ}</span> are champions
                </>
              ) : (
                <>
                  Now: <span className="font-semibold text-text">{STAGE_NAMES[run.locked]}</span> ·{" "}
                  <span className="tabular">
                    {picked}/{stage?.length ?? 0}
                  </span>{" "}
                  picked · tap a team to pick the winner
                </>
              )}
            </p>
          </div>
          <div className="flex rounded-lg border border-line bg-panel p-0.5 text-sm" role="tablist" aria-label="View">
            {(
              [
                ["swiss", "Swiss"],
                ["knockouts", "Knockouts"],
                ["standings", "Standings"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                disabled={v === "knockouts" && !swissDone}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40 ${
                  view === v ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="sticky top-[59px] z-20 -mx-4 mb-5 border-y border-line bg-bg/95 px-4 py-2 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            {showLock && (
              <Button primary onClick={actions.lock}>
                Lock in {STAGE_NAMES[run.locked]}
              </Button>
            )}
            {swissDone && !inKnockouts && (
              <Button primary onClick={() => setView("knockouts")}>
                Go to knockouts →
              </Button>
            )}
            <Button onClick={actions.askRound} disabled={!phaseOpen} shortcut="S">
              Simulate round
            </Button>
            <Button onClick={actions.askPhase} disabled={!phaseOpen} shortcut="A">
              {inKnockouts ? "Simulate knockouts" : "Simulate Swiss"}
            </Button>
            <Button onClick={actions.undo} disabled={run.locked === 0} shortcut="U">
              Undo lock-in
            </Button>
            <Button onClick={actions.reset} shortcut="R">
              Full reset
            </Button>
          </div>
        </div>

        {view === "swiss" && (
          <SwissBoard
            stages={run.stages}
            locked={run.locked}
            onPick={onPick}
            mobileRound={mobileRound}
            setMobileRound={setMobileRound}
          />
        )}
        {inKnockouts && swissDone && <Bracket stages={run.stages} locked={run.locked} champion={champ} onPick={onPick} />}
        {view === "standings" && <StandingsTable lockedSwiss={run.stages.slice(0, Math.min(run.locked, SWISS_ROUNDS))} />}
      </main>
      {request && <OddsPrompt request={request} onChoose={runSimulation} onCancel={() => setRequest(null)} />}
    </HoverContext.Provider>
  );
}

function Button({
  children,
  onClick,
  disabled,
  primary,
  shortcut,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `Shortcut: ${shortcut}` : undefined}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "border-accent bg-accent text-on-accent hover:brightness-110"
          : "border-line bg-panel text-text hover:bg-panel-2"
      }`}
    >
      {children}
      {shortcut && (
        <kbd className="hidden rounded border border-line px-1 font-mono text-[10px] text-muted sm:inline">{shortcut}</kbd>
      )}
    </button>
  );
}
