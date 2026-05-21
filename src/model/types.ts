export type SpendingMode =
  | "maintain_lifestyle"
  | "fixed_portfolio_withdrawal"
  | "solve_max_lifestyle"
  | "solve_max_portfolio_withdrawal";

export interface PersonInput {
  currentAge: number;
}

export interface PlanInput {
  currentYear: number;
  planningEndAge: number;
  targetEndingPortfolioBalance: number;
}

export interface PortfolioInput {
  retirementBalance: number;
  taxableSavingsBalance: number;
  includeTaxableInPortfolio: boolean;
  annualNominalReturn: number;
  annualInflation: number;
}

export interface SocialSecurityInput {
  person1MonthlyBenefit: number;
  person1ClaimingAge: number;
  person2MonthlyBenefit: number;
  person2ClaimingAge: number;
  annualCOLA: number;
}

export interface SpendingModeInput {
  mode: SpendingMode;
  startingMonthlyLifestyleSpending: number;
  startingMonthlyPortfolioWithdrawal: number;
}

export interface HomeInput {
  enabled: boolean;
  currentHomeValue: number;
  mortgageBalance: number;
  annualHomeAppreciation: number;
  mortgagePayoffAge: number;
}

export interface RetirementScenario {
  people: {
    person1: PersonInput;
    person2: PersonInput;
  };
  plan: PlanInput;
  portfolio: PortfolioInput;
  socialSecurity: SocialSecurityInput;
  spendingMode: SpendingModeInput;
  home: HomeInput;
}

export interface MonthlyProjectionRow {
  monthIndex: number;
  year: number;
  monthInYear: number;
  person1Age: number;
  person2Age: number;
  startingPortfolioBalance: number;
  investmentGrowth: number;
  targetLifestyleSpending: number;
  portfolioWithdrawalRequested: number;
  portfolioWithdrawalActual: number;
  federalTaxPayment: number;
  socialSecurityIncome: number;
  totalMonthlyIncomeAvailable: number;
  afterTaxMonthlyIncomeAvailable: number;
  shortfall: number;
  endingPortfolioBalance: number;
  homeValue?: number;
  mortgageBalance?: number;
  homeEquity?: number;
}

export interface YearlyProjectionRow {
  year: number;
  person1Age: number;
  person2Age: number;
  startingPortfolioBalance: number;
  investmentGrowth: number;
  portfolioWithdrawal: number;
  federalTaxEstimate: number;
  socialSecurityIncome: number;
  totalIncomeOrSpending: number;
  afterTaxIncomeOrSpending: number;
  shortfall: number;
  endingPortfolioBalance: number;
  homeEquity?: number;
}

export interface SimulationResult {
  startingMonthlyLifestyleSpending: number;
  startingMonthlyPortfolioWithdrawal: number;
  endingPortfolioBalance: number;
  depletionMonth?: number;
  depletionAgePerson1?: number;
  depletionAgePerson2?: number;
  totalPortfolioWithdrawals: number;
  totalFederalTaxEstimate: number;
  totalAfterTaxIncome: number;
  totalSocialSecurityReceived: number;
  totalShortfall: number;
  monthlyRows: MonthlyProjectionRow[];
  yearlyRows: YearlyProjectionRow[];
}
