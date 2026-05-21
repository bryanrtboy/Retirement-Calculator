import type {
  MonthlyProjectionRow,
  PlannedExtraEvent,
  RetirementScenario,
  SimulationResult,
  YearlyProjectionRow,
} from "./types";
import {
  estimateFederalTaxMarriedJointly2026,
  solveFederalTaxGrossUpMarriedJointly2026,
} from "./taxes";

const toMonthlyRate = (annualRate: number) => Math.pow(1 + annualRate, 1 / 12) - 1;
const fullRetirementAge = 67;

const monthWhenAgeReached = (currentAge: number, targetAge: number) =>
  Math.max(0, Math.ceil((targetAge - currentAge) * 12));

const projectAge = (currentAge: number, monthIndex: number) => currentAge + monthIndex / 12;

const socialSecurityForPerson = (
  currentAge: number,
  claimingAge: number,
  monthlyBenefitAtFullRetirementAge: number,
  monthIndex: number,
  monthlyCOLA: number,
) => {
  if (monthlyBenefitAtFullRetirementAge <= 0) return 0;
  const claimMonth = monthWhenAgeReached(currentAge, claimingAge);
  if (monthIndex < claimMonth) return 0;
  const claimingBenefit = adjustedSocialSecurityBenefit(
    monthlyBenefitAtFullRetirementAge,
    claimingAge,
  );
  return claimingBenefit * Math.pow(1 + monthlyCOLA, monthIndex);
};

export function adjustedSocialSecurityBenefit(
  monthlyBenefitAtFullRetirementAge: number,
  claimingAge: number,
) {
  const boundedClaimingAge = Math.min(70, Math.max(62, claimingAge));
  const monthsFromFullRetirementAge = Math.round((boundedClaimingAge - fullRetirementAge) * 12);

  if (monthsFromFullRetirementAge === 0) {
    return monthlyBenefitAtFullRetirementAge;
  }

  if (monthsFromFullRetirementAge < 0) {
    const earlyMonths = Math.abs(monthsFromFullRetirementAge);
    const first36Months = Math.min(36, earlyMonths);
    const additionalMonths = Math.max(0, earlyMonths - 36);
    const reduction = first36Months * (5 / 9 / 100) + additionalMonths * (5 / 12 / 100);
    return monthlyBenefitAtFullRetirementAge * Math.max(0, 1 - reduction);
  }

  const delayedMonths = Math.min(36, monthsFromFullRetirementAge);
  const increase = delayedMonths * (2 / 3 / 100);
  return monthlyBenefitAtFullRetirementAge * (1 + increase);
}

export function simulateRetirement(scenario: RetirementScenario): SimulationResult {
  const monthlyReturn = toMonthlyRate(scenario.portfolio.annualNominalReturn);
  const monthlyInflation = toMonthlyRate(scenario.portfolio.annualInflation);
  const monthlyCOLA = toMonthlyRate(scenario.socialSecurity.annualCOLA);
  const monthlyHomeAppreciation = toMonthlyRate(scenario.home.annualHomeAppreciation);

  const olderCurrentAge = Math.max(
    scenario.people.person1.currentAge,
    scenario.people.person2.currentAge,
  );
  const totalMonths = Math.max(
    1,
    Math.ceil((scenario.plan.planningEndAge - olderCurrentAge) * 12),
  );

  let portfolioBalance =
    scenario.portfolio.retirementBalance +
    (scenario.portfolio.includeTaxableInPortfolio ? scenario.portfolio.taxableSavingsBalance : 0);

  const monthlyRows: MonthlyProjectionRow[] = [];
  let depletionMonth: number | undefined;
  let totalPortfolioWithdrawals = 0;
  let totalFederalTaxEstimate = 0;
  let totalAfterTaxIncome = 0;
  let totalSocialSecurityReceived = 0;
  let totalShortfall = 0;
  const plannedExtraEvents: PlannedExtraEvent[] = [];
  const yearlyTaxEstimates = calculateYearlyTaxEstimates({
    scenario,
    totalMonths,
    monthlyInflation,
    monthlyCOLA,
  });

  for (let monthIndex = 0; monthIndex < totalMonths; monthIndex += 1) {
    const person1Age = projectAge(scenario.people.person1.currentAge, monthIndex);
    const person2Age = projectAge(scenario.people.person2.currentAge, monthIndex);
    const year = scenario.plan.currentYear + Math.floor(monthIndex / 12);
    const monthInYear = (monthIndex % 12) + 1;
    const startingPortfolioBalance = portfolioBalance;
    const investmentGrowth = startingPortfolioBalance * monthlyReturn;
    const balanceAfterGrowth = Math.max(0, startingPortfolioBalance + investmentGrowth);

    const targetLifestyleSpending =
      scenario.spendingMode.startingMonthlyLifestyleSpending *
      Math.pow(1 + monthlyInflation, monthIndex);
    const inflatedPortfolioWithdrawal =
      scenario.spendingMode.startingMonthlyPortfolioWithdrawal *
      Math.pow(1 + monthlyInflation, monthIndex);
    const plannedExtras = plannedExtrasForMonth({
      scenario,
      year,
      monthInYear,
      monthlyInflation,
    });
    const plannedExtrasExpense = plannedExtras.reduce((sum, event) => sum + event.amount, 0);
    plannedExtraEvents.push(...plannedExtras);
    const totalSpendingNeed = targetLifestyleSpending + plannedExtrasExpense;

    const socialSecurityIncome =
      socialSecurityForPerson(
        scenario.people.person1.currentAge,
        scenario.socialSecurity.person1ClaimingAge,
        scenario.socialSecurity.person1MonthlyBenefit,
        monthIndex,
        monthlyCOLA,
      ) +
      socialSecurityForPerson(
        scenario.people.person2.currentAge,
        scenario.socialSecurity.person2ClaimingAge,
        scenario.socialSecurity.person2MonthlyBenefit,
        monthIndex,
        monthlyCOLA,
      );

    const isLifestyleMode =
      scenario.spendingMode.mode === "maintain_lifestyle" ||
      scenario.spendingMode.mode === "solve_max_lifestyle";

    const basePortfolioWithdrawalRequested = isLifestyleMode
      ? Math.max(0, totalSpendingNeed - socialSecurityIncome)
      : inflatedPortfolioWithdrawal;
    const federalTaxPayment = yearlyTaxEstimates.get(year)?.monthlyTax ?? 0;
    const portfolioWithdrawalRequested =
      basePortfolioWithdrawalRequested +
      (isLifestyleMode ? federalTaxPayment : plannedExtrasExpense);

    const portfolioWithdrawalActual = Math.min(balanceAfterGrowth, portfolioWithdrawalRequested);
    const taxPaymentActual = Math.min(
      federalTaxPayment,
      isLifestyleMode
        ? Math.max(0, portfolioWithdrawalActual - basePortfolioWithdrawalRequested)
        : portfolioWithdrawalActual + socialSecurityIncome,
    );
    const portfolioWithdrawalForSpending = Math.max(
      0,
      portfolioWithdrawalActual - taxPaymentActual,
    );
    const shortfall = Math.max(0, portfolioWithdrawalRequested - portfolioWithdrawalActual);
    const endingPortfolioBalance = Math.max(0, balanceAfterGrowth - portfolioWithdrawalActual);

    if (depletionMonth === undefined && portfolioWithdrawalRequested > 0 && endingPortfolioBalance <= 0) {
      depletionMonth = monthIndex;
    }

    const homeValue = scenario.home.enabled
      ? scenario.home.currentHomeValue * Math.pow(1 + monthlyHomeAppreciation, monthIndex)
      : undefined;
    const monthsToPayoff = Math.max(
      1,
      monthWhenAgeReached(olderCurrentAge, scenario.home.mortgagePayoffAge),
    );
    const mortgageBalance = scenario.home.enabled
      ? Math.max(0, scenario.home.mortgageBalance * (1 - Math.min(monthIndex, monthsToPayoff) / monthsToPayoff))
      : undefined;

    monthlyRows.push({
      monthIndex,
      year,
      monthInYear,
      person1Age,
      person2Age,
      startingPortfolioBalance,
      investmentGrowth,
      targetLifestyleSpending,
      plannedExtrasExpense,
      totalSpendingNeed,
      portfolioWithdrawalRequested,
      portfolioWithdrawalActual,
      federalTaxPayment: taxPaymentActual,
      socialSecurityIncome,
      totalMonthlyIncomeAvailable: portfolioWithdrawalActual + socialSecurityIncome,
      afterTaxMonthlyIncomeAvailable:
        portfolioWithdrawalActual +
        socialSecurityIncome -
        taxPaymentActual -
        (isLifestyleMode ? 0 : plannedExtrasExpense),
      shortfall,
      endingPortfolioBalance,
      homeValue,
      mortgageBalance,
      homeEquity:
        homeValue === undefined || mortgageBalance === undefined ? undefined : homeValue - mortgageBalance,
    });

    portfolioBalance = endingPortfolioBalance;
    totalPortfolioWithdrawals += portfolioWithdrawalActual;
    totalFederalTaxEstimate += taxPaymentActual;
    totalAfterTaxIncome +=
      portfolioWithdrawalActual +
      socialSecurityIncome -
      taxPaymentActual -
      (isLifestyleMode ? 0 : plannedExtrasExpense);
    totalSocialSecurityReceived += socialSecurityIncome;
    totalShortfall += shortfall;
  }

  const yearlyRows = aggregateYearly(monthlyRows);
  const lastRow = monthlyRows[monthlyRows.length - 1];
  const largestPlannedExtraRow = yearlyRows.reduce<YearlyProjectionRow | undefined>(
    (largest, row) =>
      !largest || row.plannedExtrasExpense > largest.plannedExtrasExpense ? row : largest,
    undefined,
  );

  return {
    startingMonthlyLifestyleSpending: scenario.spendingMode.startingMonthlyLifestyleSpending,
    startingMonthlyPortfolioWithdrawal: scenario.spendingMode.startingMonthlyPortfolioWithdrawal,
    endingPortfolioBalance: lastRow?.endingPortfolioBalance ?? 0,
    depletionMonth,
    depletionAgePerson1:
      depletionMonth === undefined
        ? undefined
        : projectAge(scenario.people.person1.currentAge, depletionMonth),
    depletionAgePerson2:
      depletionMonth === undefined
        ? undefined
        : projectAge(scenario.people.person2.currentAge, depletionMonth),
    totalPortfolioWithdrawals,
    totalFederalTaxEstimate,
    totalAfterTaxIncome,
    totalSocialSecurityReceived,
    totalPlannedExtras: monthlyRows.reduce((sum, row) => sum + row.plannedExtrasExpense, 0),
    largestPlannedExtraYear:
      largestPlannedExtraRow && largestPlannedExtraRow.plannedExtrasExpense > 0
        ? largestPlannedExtraRow.year
        : undefined,
    largestPlannedExtraAmount:
      largestPlannedExtraRow && largestPlannedExtraRow.plannedExtrasExpense > 0
        ? largestPlannedExtraRow.plannedExtrasExpense
        : undefined,
    plannedExtraEvents,
    totalShortfall,
    monthlyRows,
    yearlyRows,
  };
}

function calculateYearlyTaxEstimates({
  scenario,
  totalMonths,
  monthlyInflation,
  monthlyCOLA,
}: {
  scenario: RetirementScenario;
  totalMonths: number;
  monthlyInflation: number;
  monthlyCOLA: number;
}) {
  const isLifestyleMode =
    scenario.spendingMode.mode === "maintain_lifestyle" ||
    scenario.spendingMode.mode === "solve_max_lifestyle";
  const byYear = new Map<
    number,
    {
      months: number;
      ordinaryIncomeBeforeTax: number;
      socialSecurityIncome: number;
      person1Age: number;
      person2Age: number;
    }
  >();

  for (let monthIndex = 0; monthIndex < totalMonths; monthIndex += 1) {
    const year = scenario.plan.currentYear + Math.floor(monthIndex / 12);
    const person1Age = projectAge(scenario.people.person1.currentAge, monthIndex);
    const person2Age = projectAge(scenario.people.person2.currentAge, monthIndex);
    const socialSecurityIncome =
      socialSecurityForPerson(
        scenario.people.person1.currentAge,
        scenario.socialSecurity.person1ClaimingAge,
        scenario.socialSecurity.person1MonthlyBenefit,
        monthIndex,
        monthlyCOLA,
      ) +
      socialSecurityForPerson(
        scenario.people.person2.currentAge,
        scenario.socialSecurity.person2ClaimingAge,
        scenario.socialSecurity.person2MonthlyBenefit,
        monthIndex,
        monthlyCOLA,
      );
    const targetLifestyleSpending =
      scenario.spendingMode.startingMonthlyLifestyleSpending *
      Math.pow(1 + monthlyInflation, monthIndex);
    const inflatedPortfolioWithdrawal =
      scenario.spendingMode.startingMonthlyPortfolioWithdrawal *
      Math.pow(1 + monthlyInflation, monthIndex);
    const plannedExtrasExpense = plannedExtrasForMonth({
      scenario,
      year,
      monthInYear: (monthIndex % 12) + 1,
      monthlyInflation,
    }).reduce((sum, event) => sum + event.amount, 0);
    const totalSpendingNeed = targetLifestyleSpending + plannedExtrasExpense;
    const ordinaryIncomeBeforeTax = isLifestyleMode
      ? Math.max(0, totalSpendingNeed - socialSecurityIncome)
      : inflatedPortfolioWithdrawal + plannedExtrasExpense;
    const existing = byYear.get(year) ?? {
      months: 0,
      ordinaryIncomeBeforeTax: 0,
      socialSecurityIncome: 0,
      person1Age,
      person2Age,
    };

    byYear.set(year, {
      months: existing.months + 1,
      ordinaryIncomeBeforeTax: existing.ordinaryIncomeBeforeTax + ordinaryIncomeBeforeTax,
      socialSecurityIncome: existing.socialSecurityIncome + socialSecurityIncome,
      person1Age,
      person2Age,
    });
  }

  return new Map(
    [...byYear.entries()].map(([year, values]) => {
      const taxEstimate = isLifestyleMode
        ? solveFederalTaxGrossUpMarriedJointly2026({
            ordinaryIncomeBeforeTax: values.ordinaryIncomeBeforeTax,
            socialSecurityIncome: values.socialSecurityIncome,
            person1Age: values.person1Age,
            person2Age: values.person2Age,
          })
        : estimateFederalTaxMarriedJointly2026({
            ordinaryIncome: values.ordinaryIncomeBeforeTax,
            socialSecurityIncome: values.socialSecurityIncome,
            person1Age: values.person1Age,
            person2Age: values.person2Age,
          });

      return [
        year,
        {
          annualTax: taxEstimate.federalTax,
          monthlyTax: taxEstimate.federalTax / values.months,
        },
      ];
    }),
  );
}

function aggregateYearly(monthlyRows: MonthlyProjectionRow[]): YearlyProjectionRow[] {
  const byYear = new Map<number, MonthlyProjectionRow[]>();
  monthlyRows.forEach((row) => {
    byYear.set(row.year, [...(byYear.get(row.year) ?? []), row]);
  });

  return [...byYear.entries()].map(([year, rows]) => {
    const first = rows[0];
    const last = rows[rows.length - 1];
    return {
      year,
      person1Age: first.person1Age,
      person2Age: first.person2Age,
      startingPortfolioBalance: first.startingPortfolioBalance,
      investmentGrowth: rows.reduce((sum, row) => sum + row.investmentGrowth, 0),
      plannedExtrasExpense: rows.reduce((sum, row) => sum + row.plannedExtrasExpense, 0),
      totalSpendingNeed: rows.reduce((sum, row) => sum + row.totalSpendingNeed, 0),
      portfolioWithdrawal: rows.reduce((sum, row) => sum + row.portfolioWithdrawalActual, 0),
      federalTaxEstimate: rows.reduce((sum, row) => sum + row.federalTaxPayment, 0),
      socialSecurityIncome: rows.reduce((sum, row) => sum + row.socialSecurityIncome, 0),
      totalIncomeOrSpending: rows.reduce((sum, row) => sum + row.totalMonthlyIncomeAvailable, 0),
      afterTaxIncomeOrSpending: rows.reduce(
        (sum, row) => sum + row.afterTaxMonthlyIncomeAvailable,
        0,
      ),
      shortfall: rows.reduce((sum, row) => sum + row.shortfall, 0),
      endingPortfolioBalance: last.endingPortfolioBalance,
      homeEquity: last.homeEquity,
    };
  });
}

function plannedExtrasForMonth({
  scenario,
  year,
  monthInYear,
  monthlyInflation,
}: {
  scenario: RetirementScenario;
  year: number;
  monthInYear: number;
  monthlyInflation: number;
}): PlannedExtraEvent[] {
  if (monthInYear !== 1) return [];

  return (scenario.plannedExpenses ?? [])
    .filter((expense) => {
      if (!expense.enabled) return false;
      if (year < expense.startYear || year > expense.endYear) return false;
      return (year - expense.startYear) % expense.frequencyYears === 0;
    })
    .map((expense) => {
      const monthsSinceCurrentYear = Math.max(0, (year - scenario.plan.currentYear) * 12);
      const inflatedAmount = expense.inflateWithInflation
        ? expense.amount * Math.pow(1 + monthlyInflation, monthsSinceCurrentYear)
        : expense.amount;
      return {
        year,
        monthInYear,
        name: expense.name,
        category: expense.category,
        amount: inflatedAmount,
      };
    });
}
