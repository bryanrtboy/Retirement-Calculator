import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, LineChart } from "lucide-react";
import { useState } from "react";
import type { MonthlyProjectionRow, RetirementScenario } from "../model/types";
import { cn } from "../lib/utils";

interface MainChartProps {
  scenario: RetirementScenario;
  rows: MonthlyProjectionRow[];
}

const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function MainChart({ scenario, rows }: MainChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const isLifestyleMode =
    scenario.spendingMode.mode === "maintain_lifestyle" ||
    scenario.spendingMode.mode === "solve_max_lifestyle";
  const chartRows = rows
    .filter((row) => row.monthIndex % 3 === 0 || row.monthIndex === rows.length - 1)
    .map((row) => ({
      label: `${row.year}.${String(row.monthInYear).padStart(2, "0")}`,
      portfolio: row.endingPortfolioBalance,
      socialSecurity: row.socialSecurityIncome,
      withdrawal: Math.max(0, row.portfolioWithdrawalActual - row.federalTaxPayment),
      federalTax: row.federalTaxPayment,
      plannedExtras: row.plannedExtrasExpense,
      shortfall: row.shortfall,
      incomeOrSpending: isLifestyleMode
        ? row.targetLifestyleSpending
        : row.afterTaxMonthlyIncomeAvailable,
    }));

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Runway Chart</h2>
          <p className="text-sm text-muted-foreground">
            {chartType === "line"
              ? isLifestyleMode
                ? "The orange line is after-tax lifestyle spending. The teal tax line is the estimated monthly federal tax funded from the portfolio."
                : "The orange line is after-tax income. The teal tax line estimates monthly federal tax."
              : isLifestyleMode
                ? "Bars show gross monthly cashflow: spending-funded withdrawals, federal tax, and Social Security."
                : "Bars show gross monthly cashflow: after-tax withdrawal, federal tax, and Social Security."}
          </p>
        </div>
        <div className="inline-grid grid-cols-2 rounded-md border border-border bg-white p-1 shadow-sm">
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition",
              chartType === "line" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={() => setChartType("line")}
            title="Show line chart"
          >
            <LineChart className="h-4 w-4" />
            Line
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded px-3 text-sm font-medium transition",
              chartType === "bar" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={() => setChartType("bar")}
            title="Show stacked bar chart"
          >
            <BarChart3 className="h-4 w-4" />
            Bars
          </button>
        </div>
      </div>

      <div className="h-[420px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <AreaChart data={chartRows} margin={{ top: 10, right: 18, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2d7d86" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2d7d86" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#d6ddd9" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={32} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => compactMoney.format(value)} />
              <Tooltip
                formatter={(value, name) => [
                  money.format(typeof value === "number" ? value : Number(value ?? 0)),
                  labelFor(String(name)),
                ]}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Legend />
              <Area
                isAnimationActive
                animationDuration={350}
                type="monotone"
                dataKey="portfolio"
                name="Portfolio balance"
                stroke="#2d7d86"
                strokeWidth={3}
                fill="url(#portfolioFill)"
              />
              <Line
                isAnimationActive
                animationDuration={350}
                type="monotone"
                dataKey="incomeOrSpending"
                name={isLifestyleMode ? "After-tax lifestyle spending" : "After-tax monthly income"}
                stroke="#b7672d"
                strokeWidth={3}
                dot={false}
              />
              <Line
                isAnimationActive
                animationDuration={350}
                type="monotone"
                dataKey="withdrawal"
                name="Portfolio withdrawal for spending"
                stroke="#58677b"
                strokeWidth={2}
                dot={false}
              />
              <Line
                isAnimationActive
                animationDuration={350}
                type="monotone"
                dataKey="federalTax"
                name="Federal tax estimate"
                stroke="#2f8f7b"
                strokeWidth={2}
                dot={false}
              />
              <Line
                isAnimationActive
                animationDuration={350}
                type="monotone"
                dataKey="plannedExtras"
                name="Planned extras"
                stroke="#c49a2c"
                strokeWidth={2}
                dot={false}
              />
              <Line
                isAnimationActive
                animationDuration={350}
                type="monotone"
                dataKey="socialSecurity"
                name="Social Security"
                stroke="#835b9b"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          ) : (
            <ComposedChart data={chartRows} margin={{ top: 10, right: 18, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#d6ddd9" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={32} />
              <YAxis
                yAxisId="cashflow"
                orientation="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => compactMoney.format(value)}
              />
              <YAxis
                yAxisId="portfolio"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => compactMoney.format(value)}
              />
              <Tooltip
                formatter={(value, name) => [
                  money.format(typeof value === "number" ? value : Number(value ?? 0)),
                  labelFor(String(name)),
                ]}
                labelFormatter={(label) => `Month ${label}`}
              />
              <Legend />
              <Bar
                isAnimationActive
                animationDuration={350}
                yAxisId="cashflow"
                dataKey="withdrawal"
                name="Portfolio withdrawal for spending"
                stackId="income"
                fill="#58677b"
                radius={[0, 0, 2, 2]}
              />
              <Bar
                isAnimationActive
                animationDuration={350}
                yAxisId="cashflow"
                dataKey="federalTax"
                name="Federal tax estimate"
                stackId="income"
                fill="#2f8f7b"
              />
              <Bar
                isAnimationActive
                animationDuration={350}
                yAxisId="cashflow"
                dataKey="plannedExtras"
                name="Planned extras"
                stackId="income"
                fill="#c49a2c"
              />
              <Bar
                isAnimationActive
                animationDuration={350}
                yAxisId="cashflow"
                dataKey="socialSecurity"
                name="Social Security"
                stackId="income"
                fill="#835b9b"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                isAnimationActive
                animationDuration={350}
                yAxisId="cashflow"
                dataKey="shortfall"
                name="Shortfall"
                stackId="income"
                fill="#b63830"
              />
              <Line
                isAnimationActive
                animationDuration={350}
                yAxisId="portfolio"
                type="monotone"
                dataKey="portfolio"
                name="Portfolio balance"
                stroke="#2d7d86"
                strokeWidth={3}
                dot={false}
              />
              {isLifestyleMode && (
                <Line
                  isAnimationActive
                  animationDuration={350}
                  yAxisId="cashflow"
                  type="monotone"
                  dataKey="incomeOrSpending"
                  name="After-tax lifestyle spending"
                  stroke="#b7672d"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function labelFor(key: string) {
  const labels: Record<string, string> = {
    portfolio: "Portfolio balance",
    incomeOrSpending: "After-tax income / spending",
    withdrawal: "Portfolio withdrawal for spending",
    federalTax: "Federal tax estimate",
    plannedExtras: "Planned extras",
    socialSecurity: "Social Security",
    shortfall: "Shortfall",
  };
  return labels[key] ?? key;
}
