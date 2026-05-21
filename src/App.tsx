import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { AssumptionsBox } from "./components/AssumptionsBox";
import { HomeChart } from "./components/HomeChart";
import { InputsPanel } from "./components/InputsPanel";
import { MainChart } from "./components/MainChart";
import { ProjectionTable } from "./components/ProjectionTable";
import { ResultsCards } from "./components/ResultsCards";
import { solveScenario } from "./model/solvers";
import type { RetirementScenario } from "./model/types";
import { scenarioSchema } from "./model/validation";

const storageKey = "retirement-runway-scenario-v2";

const defaultScenario: RetirementScenario = {
  people: {
    person1: { currentAge: 62 },
    person2: { currentAge: 62 },
  },
  plan: {
    currentYear: new Date().getFullYear(),
    planningEndAge: 90,
    targetEndingPortfolioBalance: 0,
  },
  portfolio: {
    retirementBalance: 450_000,
    taxableSavingsBalance: 60_000,
    includeTaxableInPortfolio: true,
    annualNominalReturn: 0.05,
    annualInflation: 0.03,
  },
  socialSecurity: {
    person1MonthlyBenefit: 2_200,
    person1ClaimingAge: 67,
    person2MonthlyBenefit: 1_600,
    person2ClaimingAge: 67,
    annualCOLA: 0.03,
  },
  spendingMode: {
    mode: "maintain_lifestyle",
    startingMonthlyLifestyleSpending: 5_500,
    startingMonthlyPortfolioWithdrawal: 3_500,
  },
  plannedExpenses: [
    {
      id: "travel",
      name: "Travel",
      category: "travel",
      amount: 5_000,
      startYear: new Date().getFullYear(),
      endYear: 2055,
      frequencyYears: 1,
      inflateWithInflation: true,
      enabled: false,
    },
    {
      id: "vehicle",
      name: "Vehicle",
      category: "vehicle",
      amount: 30_000,
      startYear: 2030,
      endYear: 2050,
      frequencyYears: 10,
      inflateWithInflation: true,
      enabled: false,
    },
    {
      id: "renovation",
      name: "Renovation",
      category: "home",
      amount: 12_000,
      startYear: 2027,
      endYear: 2045,
      frequencyYears: 3,
      inflateWithInflation: true,
      enabled: false,
    },
  ],
  home: {
    enabled: true,
    currentHomeValue: 350_000,
    mortgageBalance: 120_000,
    annualHomeAppreciation: 0.025,
    mortgagePayoffAge: 75,
  },
};

export function App() {
  const [scenario, setScenario] = useState<RetirementScenario>(() => loadStoredScenario());
  const result = useMemo(() => solveScenario(scenario), [scenario]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(scenario));
  }, [scenario]);

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            deterministic monthly cashflow
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Retirement Runway Calculator
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Every card and chart is generated from the same monthly ledger, then rolled into the yearly
          audit table below.
        </p>
      </header>

      <section className="grid items-start gap-5 lg:grid-cols-[390px_minmax(0,1fr)] 2xl:grid-cols-[420px_minmax(0,1fr)]">
        <InputsPanel
          scenario={scenario}
          onScenarioChange={setScenario}
          onReset={() => setScenario(defaultScenario)}
        />

        <div className="flex min-w-0 flex-col gap-5">
          <ResultsCards scenario={scenario} result={result} />
          <AnimatePresence mode="wait">
            <motion.div
              key={scenario.spendingMode.mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <MainChart scenario={scenario} rows={result.monthlyRows} />
            </motion.div>
          </AnimatePresence>
          {scenario.home.enabled && <HomeChart rows={result.monthlyRows} />}
          <AssumptionsBox />
        </div>
      </section>

      <ProjectionTable scenario={scenario} rows={result.yearlyRows} />
    </main>
  );
}

function loadStoredScenario(): RetirementScenario {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return defaultScenario;

    const parsed = scenarioSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : defaultScenario;
  } catch {
    return defaultScenario;
  }
}
