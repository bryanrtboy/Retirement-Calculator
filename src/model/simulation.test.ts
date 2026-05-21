import { describe, expect, it } from "vitest";
import { simulateRetirement } from "./simulation";
import { solveScenario } from "./solvers";
import type { RetirementScenario } from "./types";

const baseScenario: RetirementScenario = {
  people: {
    person1: { currentAge: 65 },
    person2: { currentAge: 63 },
  },
  plan: {
    currentYear: 2026,
    planningEndAge: 68,
    targetEndingPortfolioBalance: 0,
  },
  portfolio: {
    retirementBalance: 500_000,
    taxableSavingsBalance: 0,
    includeTaxableInPortfolio: false,
    annualNominalReturn: 0,
    annualInflation: 0,
  },
  socialSecurity: {
    person1MonthlyBenefit: 2_000,
    person1ClaimingAge: 67,
    person2MonthlyBenefit: 0,
    person2ClaimingAge: 65,
    annualCOLA: 0,
  },
  spendingMode: {
    mode: "maintain_lifestyle",
    startingMonthlyLifestyleSpending: 6_000,
    startingMonthlyPortfolioWithdrawal: 6_000,
  },
  plannedExpenses: [],
  home: {
    enabled: false,
    currentHomeValue: 0,
    mortgageBalance: 0,
    annualHomeAppreciation: 0,
    mortgagePayoffAge: 75,
  },
};

describe("retirement simulator spending modes", () => {
  it("uses Social Security to reduce withdrawals in lifestyle mode", () => {
    const result = simulateRetirement(baseScenario);

    expect(result.totalSocialSecurityReceived).toBe(24_000);
    expect(result.totalPortfolioWithdrawals).toBeCloseTo(201_963, 0);
    expect(result.totalFederalTaxEstimate).toBeCloseTo(9_963, 0);
    expect(result.endingPortfolioBalance).toBeCloseTo(298_037, 0);
  });

  it("adds Social Security on top in fixed withdrawal mode", () => {
    const result = simulateRetirement({
      ...baseScenario,
      spendingMode: {
        ...baseScenario.spendingMode,
        mode: "fixed_portfolio_withdrawal",
      },
    });

    expect(result.totalSocialSecurityReceived).toBe(24_000);
    expect(result.totalPortfolioWithdrawals).toBe(216_000);
    expect(result.endingPortfolioBalance).toBe(284_000);
  });

  it("adjusts Social Security benefits for claiming age", () => {
    const result = simulateRetirement({
      ...baseScenario,
      people: { person1: { currentAge: 62 }, person2: { currentAge: 62 } },
      plan: { ...baseScenario.plan, planningEndAge: 63 },
      socialSecurity: {
        ...baseScenario.socialSecurity,
        person1MonthlyBenefit: 3_600,
        person1ClaimingAge: 62,
      },
    });

    expect(result.monthlyRows[0].socialSecurityIncome).toBeCloseTo(2_520, 0);
  });

  it("uses yearly travel expenses to reduce ending portfolio", () => {
    const withoutTravel = simulateRetirement(baseScenario);
    const withTravel = simulateRetirement({
      ...baseScenario,
      plannedExpenses: [
        {
          id: "travel",
          name: "Travel",
          category: "travel",
          amount: 12_000,
          startYear: 2026,
          endYear: 2027,
          frequencyYears: 1,
          inflateWithInflation: false,
          enabled: true,
        },
      ],
    });

    expect(withTravel.totalPlannedExtras).toBe(24_000);
    expect(withTravel.endingPortfolioBalance).toBeLessThan(withoutTravel.endingPortfolioBalance);
  });

  it("schedules every-ten-years vehicle expenses only in matching years", () => {
    const result = simulateRetirement({
      ...baseScenario,
      plan: { ...baseScenario.plan, planningEndAge: 81 },
      plannedExpenses: [
        {
          id: "vehicle",
          name: "Vehicle",
          category: "vehicle",
          amount: 45_000,
          startYear: 2030,
          endYear: 2040,
          frequencyYears: 10,
          inflateWithInflation: false,
          enabled: true,
        },
      ],
    });
    const extrasByYear = new Map(result.yearlyRows.map((row) => [row.year, row.plannedExtrasExpense]));

    expect(extrasByYear.get(2030)).toBe(45_000);
    expect(extrasByYear.get(2040)).toBe(45_000);
    expect(extrasByYear.get(2031)).toBe(0);
  });

  it("lowers solved lifestyle spending when planned extras are enabled", () => {
    const baseline = solveScenario({
      ...baseScenario,
      spendingMode: { ...baseScenario.spendingMode, mode: "solve_max_lifestyle" },
    });
    const withExtras = solveScenario({
      ...baseScenario,
      spendingMode: { ...baseScenario.spendingMode, mode: "solve_max_lifestyle" },
      plannedExpenses: [
        {
          id: "travel",
          name: "Travel",
          category: "travel",
          amount: 12_000,
          startYear: 2026,
          endYear: 2027,
          frequencyYears: 1,
          inflateWithInflation: false,
          enabled: true,
        },
      ],
    });

    expect(withExtras.startingMonthlyLifestyleSpending).toBeLessThan(
      baseline.startingMonthlyLifestyleSpending,
    );
  });

  it("ignores disabled planned expenses", () => {
    const baseline = simulateRetirement(baseScenario);
    const withDisabledExpense = simulateRetirement({
      ...baseScenario,
      plannedExpenses: [
        {
          id: "disabled",
          name: "Disabled",
          category: "other",
          amount: 100_000,
          startYear: 2026,
          endYear: 2026,
          frequencyYears: 1,
          inflateWithInflation: false,
          enabled: false,
        },
      ],
    });

    expect(withDisabledExpense.totalPlannedExtras).toBe(0);
    expect(withDisabledExpense.endingPortfolioBalance).toBeCloseTo(
      baseline.endingPortfolioBalance,
      0,
    );
  });

  it("inflates planned expenses when enabled", () => {
    const result = simulateRetirement({
      ...baseScenario,
      portfolio: { ...baseScenario.portfolio, annualInflation: 0.12 },
      plannedExpenses: [
        {
          id: "travel",
          name: "Travel",
          category: "travel",
          amount: 12_000,
          startYear: 2026,
          endYear: 2027,
          frequencyYears: 1,
          inflateWithInflation: true,
          enabled: true,
        },
      ],
    });

    expect(result.yearlyRows.find((row) => row.year === 2026)?.plannedExtrasExpense).toBeCloseTo(
      12_000,
      0,
    );
    expect(result.yearlyRows.find((row) => row.year === 2027)?.plannedExtrasExpense).toBeCloseTo(
      13_440,
      0,
    );
  });
});
