import { simulateRetirement } from "./simulation";
import type { RetirementScenario, SimulationResult } from "./types";

const withLifestyleSpending = (scenario: RetirementScenario, amount: number): RetirementScenario => ({
  ...scenario,
  spendingMode: {
    ...scenario.spendingMode,
    startingMonthlyLifestyleSpending: amount,
    startingMonthlyPortfolioWithdrawal: 0,
  },
});

const withPortfolioWithdrawal = (scenario: RetirementScenario, amount: number): RetirementScenario => ({
  ...scenario,
  spendingMode: {
    ...scenario.spendingMode,
    startingMonthlyLifestyleSpending: 0,
    startingMonthlyPortfolioWithdrawal: amount,
  },
});

export function solveScenario(scenario: RetirementScenario): SimulationResult {
  if (scenario.spendingMode.mode === "solve_max_lifestyle") {
    return solveForAmount(scenario, withLifestyleSpending);
  }

  if (scenario.spendingMode.mode === "solve_max_portfolio_withdrawal") {
    return solveForAmount(scenario, withPortfolioWithdrawal);
  }

  return simulateRetirement(scenario);
}

function solveForAmount(
  scenario: RetirementScenario,
  assignAmount: (scenario: RetirementScenario, amount: number) => RetirementScenario,
) {
  const target = scenario.plan.targetEndingPortfolioBalance;
  let low = 0;
  let high = 1_000;

  while (simulateRetirement(assignAmount(scenario, high)).endingPortfolioBalance > target && high < 1_000_000) {
    high *= 2;
  }

  for (let iteration = 0; iteration < 64; iteration += 1) {
    const mid = (low + high) / 2;
    const result = simulateRetirement(assignAmount(scenario, mid));
    if (result.endingPortfolioBalance >= target && result.totalShortfall === 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return simulateRetirement(assignAmount(scenario, low));
}
