import { motion } from "motion/react";
import {
  AlertTriangle,
  BadgeDollarSign,
  Landmark,
  PiggyBank,
  TimerReset,
  WalletCards,
} from "lucide-react";
import type { RetirementScenario, SimulationResult } from "../model/types";

interface ResultsCardsProps {
  scenario: RetirementScenario;
  result: SimulationResult;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function ResultsCards({ scenario, result }: ResultsCardsProps) {
  const isLifestyleMode =
    scenario.spendingMode.mode === "maintain_lifestyle" ||
    scenario.spendingMode.mode === "solve_max_lifestyle";
  const firstRow = result.monthlyRows[0];
  const bothSsStartMonth = Math.max(
    monthWhenAgeReached(
      scenario.people.person1.currentAge,
      scenario.socialSecurity.person1ClaimingAge,
    ),
    monthWhenAgeReached(
      scenario.people.person2.currentAge,
      scenario.socialSecurity.person2ClaimingAge,
    ),
  );
  const firstBothSsRow =
    result.monthlyRows.find((row) => row.monthIndex >= bothSsStartMonth) ??
    result.monthlyRows.find((row) => row.socialSecurityIncome > 0);
  const referenceIncomeRow = firstBothSsRow ?? firstRow;
  const referenceIncomeLabel = isLifestyleMode
    ? firstBothSsRow
      ? "Lifestyle amount when both SS start"
      : "Lifestyle amount when SS starts"
    : firstBothSsRow
      ? "After-tax income when both SS start"
      : "After-tax income when SS starts";
  const referenceIncomeNote = isLifestyleMode
    ? `Future nominal dollars; same purchasing power as ${money.format(result.startingMonthlyLifestyleSpending)} today.`
    : "Future nominal dollars after estimated federal tax.";
  const startingTax = firstRow.federalTaxPayment;
  const modeSummary = getModeSummary(scenario, result);

  const cards = [
    {
      label: isLifestyleMode ? "Starting after-tax lifestyle spending" : "Starting gross income before SS",
      value: money.format(
        isLifestyleMode
          ? result.startingMonthlyLifestyleSpending
          : firstRow.totalMonthlyIncomeAvailable,
      ),
      icon: BadgeDollarSign,
      tone: "primary",
    },
    {
      label: isLifestyleMode ? "Starting gross portfolio withdrawal needed" : "Starting gross portfolio withdrawal only",
      value: money.format(firstRow.portfolioWithdrawalRequested),
      note: startingTax > 0 ? `Includes ${money.format(startingTax)} estimated monthly federal tax.` : undefined,
      icon: PiggyBank,
      tone: "accent",
    },
    {
      label: referenceIncomeLabel,
      value: money.format(referenceIncomeRow.afterTaxMonthlyIncomeAvailable),
      note: referenceIncomeNote,
      icon: WalletCards,
      tone: "primary",
    },
    {
      label: "Ending portfolio",
      value: money.format(result.endingPortfolioBalance),
      icon: Landmark,
      tone: "primary",
    },
    {
      label: result.depletionMonth === undefined ? "Depletion age" : "Portfolio depletes",
      value:
        result.depletionMonth === undefined
          ? "Not projected"
          : `P1 ${result.depletionAgePerson1?.toFixed(1)} / P2 ${result.depletionAgePerson2?.toFixed(1)}`,
      icon: result.depletionMonth === undefined ? TimerReset : AlertTriangle,
      tone: result.depletionMonth === undefined ? "primary" : "danger",
    },
    {
      label: "Total withdrawals",
      value: money.format(result.totalPortfolioWithdrawals),
      icon: PiggyBank,
      tone: "accent",
    },
    {
      label: "Estimated federal tax",
      value: money.format(result.totalFederalTaxEstimate),
      icon: Landmark,
      tone: "accent",
    },
    {
      label: "Total Social Security",
      value: money.format(result.totalSocialSecurityReceived),
      icon: Landmark,
      tone: "primary",
    },
  ];

  return (
    <section className="space-y-3">
      <motion.article
        key={modeSummary.title}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-primary/30 bg-primary/8 p-4 shadow-soft"
      >
        <p className="text-sm font-semibold text-primary">{modeSummary.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{modeSummary.description}</p>
        <p className="mt-2 text-sm font-medium text-foreground">{modeSummary.formula}</p>
      </motion.article>

      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {cards.map((card) => (
          <motion.article
            key={card.label}
            layout
            className="rounded-lg border border-border bg-card p-4 shadow-soft"
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <motion.p
                  key={card.value}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-2xl font-semibold tracking-normal"
                >
                  {card.value}
                </motion.p>
                {"note" in card && card.note ? (
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.note}</p>
                ) : null}
              </div>
              <span
                className={
                  card.tone === "danger"
                    ? "rounded-md bg-destructive/10 p-2 text-destructive"
                    : card.tone === "accent"
                      ? "rounded-md bg-accent/15 p-2 text-accent"
                      : "rounded-md bg-primary/10 p-2 text-primary"
                }
              >
                <card.icon className="h-5 w-5" />
              </span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function getModeSummary(scenario: RetirementScenario, result: SimulationResult) {
  switch (scenario.spendingMode.mode) {
    case "maintain_lifestyle":
      return {
        title: "Maintain lifestyle amount",
        description: `${money.format(result.startingMonthlyLifestyleSpending)} is after-tax household spending. Social Security is included inside that amount, so it reduces what must come from the portfolio. Estimated federal tax is paid from the portfolio separately.`,
        formula: "Portfolio withdrawal = lifestyle spending - Social Security + estimated federal tax",
      };
    case "fixed_portfolio_withdrawal":
      return {
        title: "Withdraw fixed amount from portfolio",
        description: `${money.format(result.startingMonthlyPortfolioWithdrawal)} is the gross portfolio withdrawal. Social Security is added on top after benefits start, then estimated federal tax reduces after-tax income.`,
        formula: "After-tax income = portfolio withdrawal + Social Security - estimated federal tax",
      };
    case "solve_max_lifestyle":
      return {
        title: "Solved maximum lifestyle amount",
        description: `${money.format(result.startingMonthlyLifestyleSpending)} is the highest starting after-tax household spending that meets the ending portfolio target. Social Security reduces withdrawals, while tax is funded from the portfolio.`,
        formula: "Portfolio withdrawal = solved lifestyle spending - Social Security + estimated federal tax",
      };
    case "solve_max_portfolio_withdrawal":
      return {
        title: "Solved maximum portfolio withdrawal",
        description: `${money.format(result.startingMonthlyPortfolioWithdrawal)} is the highest starting gross withdrawal from investments only. Social Security is extra income on top, then estimated federal tax reduces after-tax income.`,
        formula: "After-tax income = solved portfolio withdrawal + Social Security - estimated federal tax",
      };
  }
}

function monthWhenAgeReached(currentAge: number, targetAge: number) {
  return Math.max(0, Math.ceil((targetAge - currentAge) * 12));
}
