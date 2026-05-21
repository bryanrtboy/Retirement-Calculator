import type { MonthlyProjectionRow, RetirementScenario } from "./types";

export type DollarDisplayMode = "today" | "future";

export const dollarDisplayLabels: Record<DollarDisplayMode, string> = {
  today: "Today's dollars",
  future: "Future dollars",
};

export function displayDollarValue({
  value,
  scenario,
  monthIndex,
  displayMode,
}: {
  value: number;
  scenario: RetirementScenario;
  monthIndex: number;
  displayMode: DollarDisplayMode;
}) {
  if (displayMode === "future") return value;
  return value / inflationFactorForMonth(scenario, monthIndex);
}

export function displayDollarTotal({
  rows,
  scenario,
  displayMode,
  select,
}: {
  rows: MonthlyProjectionRow[];
  scenario: RetirementScenario;
  displayMode: DollarDisplayMode;
  select: (row: MonthlyProjectionRow) => number;
}) {
  return rows.reduce(
    (sum, row) =>
      sum +
      displayDollarValue({
        value: select(row),
        scenario,
        monthIndex: row.monthIndex,
        displayMode,
      }),
    0,
  );
}

function inflationFactorForMonth(scenario: RetirementScenario, monthIndex: number) {
  const monthlyInflation = Math.pow(1 + scenario.portfolio.annualInflation, 1 / 12) - 1;
  return Math.pow(1 + monthlyInflation, monthIndex);
}
