import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyProjectionRow } from "../model/types";

interface HomeChartProps {
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

export function HomeChart({ rows }: HomeChartProps) {
  const chartRows = rows
    .filter((row) => row.monthIndex % 3 === 0 || row.monthIndex === rows.length - 1)
    .map((row) => ({
      label: `${row.year}.${String(row.monthInYear).padStart(2, "0")}`,
      homeValue: row.homeValue ?? 0,
      mortgageBalance: row.mortgageBalance ?? 0,
      homeEquity: row.homeEquity ?? 0,
    }));

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Home Equity Tracker</h2>
        <p className="text-sm text-muted-foreground">
          Home values are tracked separately and do not fund portfolio withdrawals.
        </p>
      </div>
      <div className="h-[300px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartRows} margin={{ top: 10, right: 18, bottom: 8, left: 0 }}>
            <defs>
              <linearGradient id="homeEquityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b7672d" stopOpacity={0.26} />
                <stop offset="95%" stopColor="#b7672d" stopOpacity={0.02} />
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
              dataKey="homeEquity"
              name="Home equity"
              stroke="#b7672d"
              strokeWidth={3}
              fill="url(#homeEquityFill)"
            />
            <Line
              isAnimationActive
              animationDuration={350}
              type="monotone"
              dataKey="homeValue"
              name="Home value"
              stroke="#2d7d86"
              strokeWidth={2}
              dot={false}
            />
            <Line
              isAnimationActive
              animationDuration={350}
              type="monotone"
              dataKey="mortgageBalance"
              name="Mortgage balance"
              stroke="#835b9b"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function labelFor(key: string) {
  const labels: Record<string, string> = {
    homeEquity: "Home equity",
    homeValue: "Home value",
    mortgageBalance: "Mortgage balance",
  };
  return labels[key] ?? key;
}
