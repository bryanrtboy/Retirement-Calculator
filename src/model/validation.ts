import { z } from "zod";

export const scenarioSchema = z.object({
  people: z.object({
    person1: z.object({ currentAge: z.number().min(18).max(120) }),
    person2: z.object({ currentAge: z.number().min(18).max(120) }),
  }),
  plan: z.object({
    currentYear: z.number().int().min(1900).max(2200),
    planningEndAge: z.number().min(19).max(120),
    targetEndingPortfolioBalance: z.number().min(0),
  }),
  portfolio: z.object({
    retirementBalance: z.number().min(0),
    taxableSavingsBalance: z.number().min(0),
    includeTaxableInPortfolio: z.boolean(),
    annualNominalReturn: z.number().min(-0.99).max(1),
    annualInflation: z.number().min(-0.5).max(1),
  }),
  socialSecurity: z.object({
    person1MonthlyBenefit: z.number().min(0),
    person1ClaimingAge: z.number().min(62).max(70),
    person2MonthlyBenefit: z.number().min(0),
    person2ClaimingAge: z.number().min(62).max(70),
    annualCOLA: z.number().min(-0.5).max(1),
  }),
  spendingMode: z.object({
    mode: z.enum([
      "maintain_lifestyle",
      "fixed_portfolio_withdrawal",
      "solve_max_lifestyle",
      "solve_max_portfolio_withdrawal",
    ]),
    startingMonthlyLifestyleSpending: z.number().min(0),
    startingMonthlyPortfolioWithdrawal: z.number().min(0),
  }),
  home: z.object({
    enabled: z.boolean(),
    currentHomeValue: z.number().min(0),
    mortgageBalance: z.number().min(0),
    annualHomeAppreciation: z.number().min(-0.5).max(1),
    mortgagePayoffAge: z.number().min(0).max(120),
  }),
});
