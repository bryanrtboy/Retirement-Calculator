import { describe, expect, it } from "vitest";
import { displayDollarValue } from "./display";
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
  pension: {
    person1MonthlyBenefit: 0,
    person1StartAge: 65,
    person1InflationAdjusted: false,
    person2MonthlyBenefit: 0,
    person2StartAge: 63,
    person2InflationAdjusted: false,
  },
  spendingMode: {
    mode: "maintain_lifestyle",
    startingMonthlyLifestyleSpending: 6_000,
    startingMonthlyPortfolioWithdrawal: 6_000,
    withdrawalsStartImmediately: true,
    withdrawalStartAge: 65,
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

  it("uses pension income to reduce withdrawals in lifestyle mode", () => {
    const withoutPension = simulateRetirement(baseScenario);
    const withPension = simulateRetirement({
      ...baseScenario,
      pension: {
        ...baseScenario.pension,
        person1MonthlyBenefit: 1_000,
        person1StartAge: 65,
      },
    });

    expect(withPension.totalPensionReceived).toBe(36_000);
    expect(withPension.totalPortfolioWithdrawals).toBeLessThan(
      withoutPension.totalPortfolioWithdrawals,
    );
  });

  it("adds pension income on top in fixed withdrawal mode", () => {
    const result = simulateRetirement({
      ...baseScenario,
      spendingMode: {
        ...baseScenario.spendingMode,
        mode: "fixed_portfolio_withdrawal",
      },
      pension: {
        ...baseScenario.pension,
        person1MonthlyBenefit: 1_000,
        person1StartAge: 65,
      },
    });

    expect(result.totalPensionReceived).toBe(36_000);
    expect(result.totalPortfolioWithdrawals).toBe(216_000);
    expect(result.totalAfterTaxIncome).toBeGreaterThan(216_000);
  });

  it("inflates pension income only when marked inflation-adjusted", () => {
    const fixed = simulateRetirement({
      ...baseScenario,
      plan: { ...baseScenario.plan, planningEndAge: 66 },
      portfolio: { ...baseScenario.portfolio, annualInflation: 0.12 },
      pension: {
        ...baseScenario.pension,
        person1MonthlyBenefit: 1_000,
        person1StartAge: 65,
        person1InflationAdjusted: false,
      },
    });
    const inflationAdjusted = simulateRetirement({
      ...baseScenario,
      plan: { ...baseScenario.plan, planningEndAge: 66 },
      portfolio: { ...baseScenario.portfolio, annualInflation: 0.12 },
      pension: {
        ...baseScenario.pension,
        person1MonthlyBenefit: 1_000,
        person1StartAge: 65,
        person1InflationAdjusted: true,
      },
    });

    expect(fixed.monthlyRows[11].pensionIncome).toBe(1_000);
    expect(inflationAdjusted.monthlyRows[11].pensionIncome).toBeGreaterThan(1_000);
  });

  it("can delay portfolio withdrawals until a selected household age", () => {
    const result = simulateRetirement({
      ...baseScenario,
      spendingMode: {
        ...baseScenario.spendingMode,
        withdrawalsStartImmediately: false,
        withdrawalStartAge: 66,
      },
    });

    expect(result.monthlyRows[0].portfolioWithdrawalRequested).toBe(0);
    expect(result.monthlyRows[11].portfolioWithdrawalRequested).toBe(0);
    expect(result.monthlyRows[12].portfolioWithdrawalRequested).toBeGreaterThan(0);
  });

  it("treats planned extras as separate portfolio draws in fixed withdrawal mode", () => {
    const result = simulateRetirement({
      ...baseScenario,
      spendingMode: {
        ...baseScenario.spendingMode,
        mode: "fixed_portfolio_withdrawal",
      },
      plannedExpenses: [
        {
          id: "car",
          name: "Car",
          category: "vehicle",
          amount: 20_000,
          startYear: 2026,
          endYear: 2026,
          frequencyYears: 1,
          inflateWithInflation: false,
          enabled: true,
        },
      ],
    });

    expect(result.totalPlannedExtras).toBe(20_000);
    expect(result.totalPortfolioWithdrawals).toBe(236_000);
    expect(result.totalShortfall).toBe(0);
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

  it("splits travel expenses between June and September", () => {
    const result = simulateRetirement({
      ...baseScenario,
      plannedExpenses: [
        {
          id: "travel",
          name: "Travel",
          category: "travel",
          amount: 12_000,
          startYear: 2026,
          endYear: 2026,
          frequencyYears: 1,
          inflateWithInflation: false,
          enabled: true,
        },
      ],
    });

    expect(
      result.monthlyRows.find((row) => row.year === 2026 && row.monthInYear === 1)
        ?.plannedExtrasExpense,
    ).toBe(0);
    expect(
      result.monthlyRows.find((row) => row.year === 2026 && row.monthInYear === 6)
        ?.plannedExtrasExpense,
    ).toBe(6_000);
    expect(
      result.monthlyRows.find((row) => row.year === 2026 && row.monthInYear === 9)
        ?.plannedExtrasExpense,
    ).toBe(6_000);
  });

  it("spreads home project expenses evenly across scheduled years", () => {
    const result = simulateRetirement({
      ...baseScenario,
      plannedExpenses: [
        {
          id: "home",
          name: "Home project",
          category: "home",
          amount: 12_000,
          startYear: 2026,
          endYear: 2026,
          frequencyYears: 1,
          inflateWithInflation: false,
          enabled: true,
        },
      ],
    });
    const firstYearRows = result.monthlyRows.filter((row) => row.year === 2026);

    expect(firstYearRows).toHaveLength(12);
    firstYearRows.forEach((row) => {
      expect(row.plannedExtrasExpense).toBe(1_000);
    });
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

  it("lowers solved base portfolio withdrawal when planned extras are enabled", () => {
    const baseline = solveScenario({
      ...baseScenario,
      spendingMode: { ...baseScenario.spendingMode, mode: "solve_max_portfolio_withdrawal" },
    });
    const withExtras = solveScenario({
      ...baseScenario,
      spendingMode: { ...baseScenario.spendingMode, mode: "solve_max_portfolio_withdrawal" },
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

    expect(withExtras.startingMonthlyPortfolioWithdrawal).toBeGreaterThan(0);
    expect(withExtras.startingMonthlyPortfolioWithdrawal).toBeLessThan(
      baseline.startingMonthlyPortfolioWithdrawal,
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

    const monthlyInflation = Math.pow(1.12, 1 / 12) - 1;
    const firstYearExpected =
      6_000 * Math.pow(1 + monthlyInflation, 5) +
      6_000 * Math.pow(1 + monthlyInflation, 8);
    const secondYearExpected =
      6_000 * Math.pow(1 + monthlyInflation, 17) +
      6_000 * Math.pow(1 + monthlyInflation, 20);

    expect(result.yearlyRows.find((row) => row.year === 2026)?.plannedExtrasExpense).toBeCloseTo(
      firstYearExpected,
      0,
    );
    expect(result.yearlyRows.find((row) => row.year === 2027)?.plannedExtrasExpense).toBeCloseTo(
      secondYearExpected,
      0,
    );
  });

  it("keeps lifestyle spending flat in today's dollars when Social Security starts with an extra", () => {
    const scenario: RetirementScenario = {
      ...baseScenario,
      people: { person1: { currentAge: 62 }, person2: { currentAge: 62 } },
      plan: { ...baseScenario.plan, planningEndAge: 70 },
      portfolio: { ...baseScenario.portfolio, annualInflation: 0.03 },
      socialSecurity: {
        ...baseScenario.socialSecurity,
        person1ClaimingAge: 67,
        annualCOLA: 0.03,
      },
      plannedExpenses: [
        {
          id: "home",
          name: "Home project",
          category: "home",
          amount: 8_000,
          startYear: 2031,
          endYear: 2031,
          frequencyYears: 1,
          inflateWithInflation: true,
          enabled: true,
        },
      ],
    };
    const result = simulateRetirement(scenario);
    const socialSecurityStartRow = result.monthlyRows.find((row) => row.socialSecurityIncome > 0);

    expect(socialSecurityStartRow).toBeDefined();
    expect(socialSecurityStartRow?.plannedExtrasExpense).toBeGreaterThan(0);
    expect(
      displayDollarValue({
        value: socialSecurityStartRow?.targetLifestyleSpending ?? 0,
        scenario,
        monthIndex: socialSecurityStartRow?.monthIndex ?? 0,
        displayMode: "today",
      }),
    ).toBeCloseTo(scenario.spendingMode.startingMonthlyLifestyleSpending, 0);
    expect(socialSecurityStartRow?.afterTaxMonthlyIncomeAvailable).toBeGreaterThan(
      socialSecurityStartRow?.targetLifestyleSpending ?? 0,
    );
  });
});
