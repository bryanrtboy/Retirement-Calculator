export type SpendingMode =
  | "maintain_lifestyle"
  | "fixed_portfolio_withdrawal"
  | "solve_max_lifestyle"
  | "solve_max_portfolio_withdrawal";

export type PlannedExpenseCategory = "travel" | "vehicle" | "home" | "medical" | "family" | "other";

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

export interface PensionInput {
  person1MonthlyBenefit: number;
  person1StartAge: number;
  person1InflationAdjusted: boolean;
  person2MonthlyBenefit: number;
  person2StartAge: number;
  person2InflationAdjusted: boolean;
}

export interface SpendingModeInput {
  mode: SpendingMode;
  startingMonthlyLifestyleSpending: number;
  startingMonthlyPortfolioWithdrawal: number;
  withdrawalsStartImmediately: boolean;
  withdrawalStartAge: number;
}

export interface HomeInput {
  enabled: boolean;
  currentHomeValue: number;
  mortgageBalance: number;
  annualHomeAppreciation: number;
  mortgagePayoffAge: number;
}

export interface PlannedExpenseInput {
  id: string;
  name: string;
  category: PlannedExpenseCategory;
  amount: number;
  startYear: number;
  endYear: number;
  frequencyYears: number;
  inflateWithInflation: boolean;
  enabled: boolean;
}

export interface RetirementScenario {
  people: {
    person1: PersonInput;
    person2: PersonInput;
  };
  plan: PlanInput;
  portfolio: PortfolioInput;
  socialSecurity: SocialSecurityInput;
  pension: PensionInput;
  spendingMode: SpendingModeInput;
  plannedExpenses: PlannedExpenseInput[];
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
  plannedExtrasExpense: number;
  totalSpendingNeed: number;
  portfolioWithdrawalRequested: number;
  portfolioWithdrawalActual: number;
  federalTaxPayment: number;
  socialSecurityIncome: number;
  pensionIncome: number;
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
  plannedExtrasExpense: number;
  totalSpendingNeed: number;
  portfolioWithdrawal: number;
  federalTaxEstimate: number;
  socialSecurityIncome: number;
  pensionIncome: number;
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
  totalPensionReceived: number;
  totalPlannedExtras: number;
  largestPlannedExtraYear?: number;
  largestPlannedExtraAmount?: number;
  plannedExtraEvents: PlannedExtraEvent[];
  totalShortfall: number;
  monthlyRows: MonthlyProjectionRow[];
  yearlyRows: YearlyProjectionRow[];
}

export interface PlannedExtraEvent {
  year: number;
  monthInYear: number;
  name: string;
  category: PlannedExpenseCategory;
  amount: number;
}
