"use client";

import { useEffect, useRef } from "react";
import { LCK_LPL_BONUS } from "@/lib/config";
import type { OddsMode } from "@/lib/odds";
import { FIRST_KNOCKOUT_STAGE, STAGE_NAMES } from "@/lib/tournament";

export type SimRequest = { kind: "round" | "phase"; stage: number };

type Props = {
  request: SimRequest;
  onChoose: (mode: OddsMode) => void;
  onCancel: () => void;
};

/** Asks which odds to use before auto-simulating. Keys: N = normal, B = bias, Esc = cancel. */
export default function OddsPrompt({ request, onChoose, onCancel }: Props) {
  const firstButton = useRef<HTMLButtonElement>(null);
  const title =
    request.kind === "round"
      ? `Simulate ${STAGE_NAMES[request.stage]}`
      : request.stage >= FIRST_KNOCKOUT_STAGE
        ? "Simulate knockouts"
        : "Simulate Swiss";

  useEffect(() => {
    firstButton.current?.focus();
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === "escape") onCancel();
      else if (key === "n") onChoose("normal");
      else if (key === "b") onChoose("bias");
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChoose, onCancel]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="odds-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-line bg-panel p-5 shadow-2xl"
      >
        <h2 id="odds-title" className="text-lg font-bold">
          {title}
        </h2>
        <p className="mb-4 text-sm text-muted">Which odds should decide the unpicked matches? Your picks are kept.</p>
        <div className="flex flex-col gap-2">
          <Choice
            ref={firstButton}
            onClick={() => onChoose("normal")}
            title="Normal odds"
            hint="Riot points only"
            shortcut="N"
          />
          <Choice
            onClick={() => onChoose("bias")}
            title="LCK/LPL bias"
            hint={`LCK and LPL teams get +${LCK_LPL_BONUS} points against other leagues`}
            shortcut="B"
          />
        </div>
        <button type="button" onClick={onCancel} className="mt-3 w-full rounded-lg py-1.5 text-sm text-muted hover:text-text">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Choice({
  ref,
  onClick,
  title,
  hint,
  shortcut,
}: {
  ref?: React.Ref<HTMLButtonElement>;
  onClick: () => void;
  title: string;
  hint: string;
  shortcut: string;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-left hover:border-accent focus-visible:border-accent focus-visible:outline-none"
    >
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <kbd className="rounded border border-line px-1.5 font-mono text-[10px] text-muted">{shortcut}</kbd>
    </button>
  );
}
