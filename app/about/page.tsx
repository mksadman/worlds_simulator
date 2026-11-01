import type { Metadata } from "next";
import { TEAMS, getTeam } from "@/data/teams";
import TeamLogo from "@/components/TeamLogo";
import { LCK_LPL_BONUS } from "@/lib/config";
import { matchOdds, roundedPercents } from "@/lib/odds";

export const metadata: Metadata = {
  title: "About · Worlds 2026 Simulator",
  description: "How seeds, Swiss pairings, knockouts and odds work in the Worlds 2026 simulator.",
};

export default function About() {
  const t1 = getTeam("T1");
  const ig = getTeam("IG");
  const tes = getTeam("TES");
  const g2 = getTeam("G2");
  const [t1Pct] = roundedPercents(matchOdds(t1, ig, "normal"));
  const [tesNoBonus] = roundedPercents(matchOdds(tes, g2, "normal"));
  const [tesWithBonus] = roundedPercents(matchOdds(tes, g2, "bias"));

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 leading-relaxed">
      <div className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-accent-2">Worlds 2026</div>
      <h1 className="mb-2 font-display text-5xl font-extrabold uppercase leading-none tracking-wide">How it works</h1>
      <p className="mb-10 text-muted">
        Pick winners or let the odds decide, from the first Swiss round to the Grand Final. Everything runs in your
        browser and your run is saved on this device.
      </p>

      <Section title="Seeds">
        <p>
          Seeds come from Riot&apos;s Global Power Ranking, published before Worlds. Teams with the same points were
          ordered by win rate. Seeds are fixed and can&apos;t be changed.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full min-w-[460px] text-sm tabular">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-3 py-2">Seed</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">League</th>
                <th className="px-3 py-2">Riot rank</th>
                <th className="px-3 py-2 text-right">Points</th>
                <th className="px-3 py-2 text-right">Record</th>
              </tr>
            </thead>
            <tbody>
              {TEAMS.map((t) => (
                <tr key={t.tag} className="border-b border-line last:border-0">
                  <td className="px-3 py-1.5 text-muted">{t.seed}</td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <TeamLogo tag={t.tag} size={24} className="rounded" />
                      <span className="font-semibold">{t.tag}</span>
                      <span className="hidden text-muted sm:inline">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-muted">{t.league}</td>
                  <td className="px-3 py-1.5 text-muted">{t.riotRank}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{t.points}</td>
                  <td className="px-3 py-1.5 text-right text-muted">{t.record}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Swiss stage">
        <p>
          All 16 teams start at 0-0. Three wins and you&apos;re through to the knockouts, three losses and you&apos;re
          out. It takes at most five rounds, and eight teams qualify.
        </p>
        <h3>Round 1</h3>
        <p>
          Seed 1 plays seed 9, seed 2 plays seed 10, and so on down to 8 vs 16. Teams from the same league can&apos;t
          meet in round 1. If they would, the lower seed swaps places with the nearest lower seed (one below, one
          above, two below, two above, …) until no pair clashes.
        </p>
        <h3>Rounds 2 to 5</h3>
        <p>
          Teams only play teams with the same record (2-0 vs 2-0, 1-1 vs 1-1, and so on). Within each record group,
          teams are sorted by <strong>Buchholz (BH)</strong>: add up the current wins minus losses of every team
          you&apos;ve played so far. A high BH means you&apos;ve had tough opponents. Ties go to the higher seed.
        </p>
        <p>
          The top team plays the bottom team, the second plays the second-to-last, and so on. Nobody plays the same
          team twice in the Swiss stage: if the natural opponent is a rematch, the top team takes the next-lowest
          team it hasn&apos;t met. The league rule only applies to round 1.
        </p>
        <h3>Knockouts</h3>
        <p>
          The eight qualifiers are seeded 1 to 8 by final Swiss standings: wins, then fewer losses, then BH, then
          original seed. The quarterfinals are 1 vs 8, 4 vs 5, 2 vs 7 and 3 vs 6. The winners of the first two
          meet in one semifinal, the winners of the last two in the other. Swiss rematches can happen here.
        </p>
      </Section>

      <Section title="How odds work">
        <p>
          Each team&apos;s chance comes from its Riot points, using the same formula as chess Elo ratings. The bigger
          the gap in Riot points, the bigger the favourite&apos;s chance. For example, T1 ({t1.points}) vs Invictus (
          {ig.points}) is a {t1.points - ig.points}-point gap, so T1 wins {t1Pct}% of the time.
        </p>
        <p>
          The chance is for the whole series, not for single games. No match is ever certain: the underdog always
          has some chance. The percentage under each team is only a guide when you pick: you can always pick the
          underdog.
        </p>
        <p>
          The auto-simulate buttons (&ldquo;Simulate round&rdquo;, &ldquo;Simulate Swiss&rdquo; and &ldquo;Simulate
          knockouts&rdquo;) draw each winner using these odds. Each time, you choose between normal odds and the
          LCK/LPL bias below. Picks you already made are always kept.
        </p>
      </Section>

      <Section title="The LCK/LPL bias">
        <p>
          With the bias on, LCK and LPL teams get a {LCK_LPL_BONUS}-point boost when they play a team from another
          league. For example,
          Top Esports would normally have a {tesNoBonus}% chance against G2, but with the boost it&apos;s{" "}
          {tesWithBonus}%. Upsets are still possible.
        </p>
        <p>
          There is no boost when an LCK team plays an LPL team, when two teams from the same league meet, or when
          neither team is from the LCK or LPL.
        </p>
        <p>
          The bias is optional: it only applies when you choose &ldquo;LCK/LPL bias&rdquo; while auto-simulating. The
          percentages shown on the match cards are always the normal odds.
        </p>
      </Section>

      <Section title="Shortcuts">
        <ul className="list-disc pl-5">
          <li>
            <Kbd>S</Kbd> Simulate round
          </li>
          <li>
            <Kbd>A</Kbd> Simulate Swiss (on the Swiss page) or Simulate knockouts (on the bracket)
          </li>
          <li>
            <Kbd>U</Kbd> Undo lock-in
          </li>
          <li>
            <Kbd>R</Kbd> Full reset
          </li>
        </ul>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 [&_h3]:mb-1 [&_h3]:mt-5 [&_h3]:font-semibold [&_p]:mb-3">
      <h2 className="mb-3 border-b border-line pb-2 font-display text-2xl font-bold uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="mr-2 rounded border border-line bg-panel px-1.5 font-mono text-xs">{children}</kbd>;
}
