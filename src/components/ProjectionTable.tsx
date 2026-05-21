import type { RetirementScenario, YearlyProjectionRow } from "../model/types";

interface ProjectionTableProps {
  scenario: RetirementScenario;
  rows: YearlyProjectionRow[];
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function ProjectionTable({ scenario, rows }: ProjectionTableProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Yearly Projection Table</h2>
          <p className="text-sm text-muted-foreground">
            Annual rows are summed directly from the monthly ledger that drives the chart.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <th className="py-3 pr-4">Year</th>
              <th className="py-3 pr-4">P1 Age</th>
              <th className="py-3 pr-4">P2 Age</th>
              <th className="py-3 pr-4 text-right">Start Portfolio</th>
              <th className="py-3 pr-4 text-right">Growth</th>
              <th className="py-3 pr-4 text-right">Planned Extras</th>
              <th className="py-3 pr-4 text-right">Total Spending Need</th>
              <th className="py-3 pr-4 text-right">Withdrawal</th>
              <th className="py-3 pr-4 text-right">Federal Tax</th>
              <th className="py-3 pr-4 text-right">Social Security</th>
              <th className="py-3 pr-4 text-right">Income / Spending</th>
              <th className="py-3 pr-4 text-right">After Tax</th>
              <th className="py-3 pr-4 text-right">Shortfall</th>
              <th className="py-3 pr-4 text-right">End Portfolio</th>
              {scenario.home.enabled && <th className="py-3 text-right">Home Equity</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year} className="border-b border-border/70 last:border-b-0">
                <td className="py-3 pr-4 font-medium">{row.year}</td>
                <td className="py-3 pr-4">{row.person1Age.toFixed(0)}</td>
                <td className="py-3 pr-4">{row.person2Age.toFixed(0)}</td>
                <td className="py-3 pr-4 text-right">{money.format(row.startingPortfolioBalance)}</td>
                <td className="py-3 pr-4 text-right">{money.format(row.investmentGrowth)}</td>
                <td className="py-3 pr-4 text-right">{money.format(row.plannedExtrasExpense)}</td>
                <td className="py-3 pr-4 text-right">{money.format(row.totalSpendingNeed)}</td>
                <td className="py-3 pr-4 text-right">{money.format(row.portfolioWithdrawal)}</td>
                <td className="py-3 pr-4 text-right">{money.format(row.federalTaxEstimate)}</td>
                <td className="py-3 pr-4 text-right">{money.format(row.socialSecurityIncome)}</td>
                <td className="py-3 pr-4 text-right">{money.format(row.totalIncomeOrSpending)}</td>
                <td className="py-3 pr-4 text-right">{money.format(row.afterTaxIncomeOrSpending)}</td>
                <td className="py-3 pr-4 text-right text-destructive">
                  {row.shortfall > 0 ? money.format(row.shortfall) : "-"}
                </td>
                <td className="py-3 pr-4 text-right font-medium">
                  {money.format(row.endingPortfolioBalance)}
                </td>
                {scenario.home.enabled && (
                  <td className="py-3 text-right">{money.format(row.homeEquity ?? 0)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
