import { describe, expect, it } from "vitest";
import { simulateRetirement } from "./simulation";
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
});
