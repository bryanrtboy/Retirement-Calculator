import { describe, expect, it } from "vitest";
import { filterChartRows } from "./MainChart";
import type { MonthlyProjectionRow } from "../model/types";

const baseRow: MonthlyProjectionRow = {
  monthIndex: 0,
  year: 2026,
  monthInYear: 1,
  person1Age: 62,
  person2Age: 62,
  startingPortfolioBalance: 0,
  investmentGrowth: 0,
  targetLifestyleSpending: 0,
  plannedExtrasExpense: 0,
  totalSpendingNeed: 0,
  portfolioWithdrawalRequested: 0,
  portfolioWithdrawalActual: 0,
  federalTaxPayment: 0,
  socialSecurityIncome: 0,
  totalMonthlyIncomeAvailable: 0,
  afterTaxMonthlyIncomeAvailable: 0,
  shortfall: 0,
  endingPortfolioBalance: 0,
};

describe("main chart rows", () => {
  it("keeps off-cadence months with planned extras", () => {
    const rows = Array.from({ length: 12 }, (_, monthIndex) => ({
      ...baseRow,
      monthIndex,
      monthInYear: monthIndex + 1,
      plannedExtrasExpense: monthIndex === 5 || monthIndex === 8 ? 6_000 : 0,
    }));
    const chartRows = filterChartRows(rows);

    expect(chartRows.map((row) => row.monthInYear)).toContain(6);
    expect(chartRows.map((row) => row.monthInYear)).toContain(9);
  });
});
