import { motion } from "motion/react";
import {
  AlertTriangle,
  BadgeDollarSign,
  ChevronDown,
  ChevronRight,
  Landmark,
  PiggyBank,
  TimerReset,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
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
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);
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
      action: () => setTaxOpen((open) => !open),
      isOpen: taxOpen,
      detail: <TaxDetail result={result} />,
    },
    {
      label: "Planned extras total",
      value: money.format(result.totalPlannedExtras),
      icon: WalletCards,
      tone: "accent",
      action: () => setExtrasOpen((open) => !open),
      isOpen: extrasOpen,
      detail: <PlannedExtrasDetail result={result} />,
    },
    {
      label: "Largest planned extra year",
      value:
        result.largestPlannedExtraYear === undefined
          ? "None"
          : `${result.largestPlannedExtraYear} · ${money.format(result.largestPlannedExtraAmount ?? 0)}`,
      icon: WalletCards,
      tone: "primary",
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

      <div className="grid items-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {cards.map((card) => (
          <motion.article
            key={card.label}
            layout
            className={`rounded-lg border border-border bg-card p-4 shadow-soft ${"action" in card && card.action ? "cursor-pointer transition hover:border-primary/60" : ""}`}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={"action" in card ? card.action : undefined}
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
              <div className="flex flex-col items-end gap-2">
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
                {"action" in card && card.action ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    {card.isOpen ? "Hide details" : "Show details"}{" "}
                    {card.isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                ) : null}
              </div>
            </div>
            {"action" in card && card.action && card.isOpen ? card.detail : null}
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function PlannedExtrasDetail({ result }: { result: SimulationResult }) {
  const eventsByYear = result.plannedExtraEvents.reduce<
    Array<{ year: number; total: number; events: typeof result.plannedExtraEvents }>
  >((years, event) => {
    const existing = years.find((year) => year.year === event.year);
    if (existing) {
      existing.total += event.amount;
      existing.events.push(event);
    } else {
      years.push({ year: event.year, total: event.amount, events: [event] });
    }
    return years;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 border-t border-border pt-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          By Year
        </p>
      </div>

      {eventsByYear.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/30 p-2 text-xs leading-4 text-muted-foreground">
          No enabled planned extras are currently scheduled.
        </p>
      ) : (
        <div className="max-h-56 overflow-auto rounded-md border border-border bg-muted/20">
          {eventsByYear.map((year) => (
            <div key={year.year} className="border-b border-border/70 px-2 py-1.5 last:border-b-0">
              <div className="mb-0.5 flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold">{year.year}</span>
                <span className="font-semibold">{money.format(year.total)}</span>
              </div>
              <div className="grid gap-0.5">
                {year.events.map((event) => (
                  <div
                    key={`${event.year}-${event.name}-${event.amount}`}
                    className="flex items-center justify-between gap-2 text-[10px] leading-3.5 text-muted-foreground"
                  >
                    <span className="min-w-0 truncate">
                      {event.name} · {categoryLabel(event.category)}
                    </span>
                    <span className="shrink-0">{money.format(event.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TaxDetail({ result }: { result: SimulationResult }) {
  const taxRows = result.yearlyRows.filter((row) => row.federalTaxEstimate > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 border-t border-border pt-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          By Year
        </p>
      </div>

      {taxRows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-muted/30 p-2 text-xs leading-4 text-muted-foreground">
          No estimated federal tax in the projection.
        </p>
      ) : (
        <div className="max-h-56 overflow-auto rounded-md border border-border bg-muted/20">
          {taxRows.map((row) => (
            <div
              key={row.year}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-border/70 px-2 py-1.5 text-[11px] last:border-b-0"
            >
              <span className="font-semibold">{row.year}</span>
              <span className="truncate text-muted-foreground">
                gross {money.format(row.portfolioWithdrawal + row.socialSecurityIncome)}
              </span>
              <span className="font-semibold">{money.format(row.federalTaxEstimate)}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    travel: "Travel",
    vehicle: "Vehicle",
    home: "Home",
    medical: "Medical",
    family: "Family",
    other: "Other",
  };
  return labels[category] ?? category;
}

function getModeSummary(scenario: RetirementScenario, result: SimulationResult) {
  switch (scenario.spendingMode.mode) {
    case "maintain_lifestyle":
      return {
        title: "Maintain lifestyle amount",
        description: `${money.format(result.startingMonthlyLifestyleSpending)} is after-tax household spending before planned extras. Social Security is included inside that amount, while planned extras and estimated federal tax are funded from the portfolio.`,
        formula: "Portfolio withdrawal = lifestyle spending + planned extras - Social Security + estimated federal tax",
      };
    case "fixed_portfolio_withdrawal":
      return {
        title: "Withdraw fixed amount from portfolio",
        description: `${money.format(result.startingMonthlyPortfolioWithdrawal)} is the gross portfolio withdrawal. Social Security is added on top after benefits start; planned extras and estimated federal tax reduce after-tax surplus.`,
        formula: "After-tax surplus = portfolio withdrawal + Social Security - estimated federal tax - planned extras",
      };
    case "solve_max_lifestyle":
      return {
        title: "Solved maximum lifestyle amount",
        description: `${money.format(result.startingMonthlyLifestyleSpending)} is the highest starting after-tax household spending before planned extras that meets the ending portfolio target.`,
        formula: "Portfolio withdrawal = solved lifestyle spending + planned extras - Social Security + estimated federal tax",
      };
    case "solve_max_portfolio_withdrawal":
      return {
        title: "Solved maximum portfolio withdrawal",
        description: `${money.format(result.startingMonthlyPortfolioWithdrawal)} is the highest starting gross withdrawal from investments only. Social Security is extra income on top; planned extras and estimated federal tax reduce after-tax surplus.`,
        formula: "After-tax surplus = solved withdrawal + Social Security - estimated federal tax - planned extras",
      };
  }
}

function monthWhenAgeReached(currentAge: number, targetAge: number) {
  return Math.max(0, Math.ceil((targetAge - currentAge) * 12));
}
