import { Calculator, Home, Landmark, LineChart, RotateCcw, Users } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { RetirementScenario, SpendingMode } from "../model/types";
import { cn } from "../lib/utils";
import { adjustedSocialSecurityBenefit } from "../model/simulation";

interface InputsPanelProps {
  scenario: RetirementScenario;
  onScenarioChange: Dispatch<SetStateAction<RetirementScenario>>;
  onReset: () => void;
}

const modes: Array<{ id: SpendingMode; title: string; description: string }> = [
  {
    id: "maintain_lifestyle",
    title: "Maintain lifestyle amount",
    description: "Social Security reduces portfolio withdrawals.",
  },
  {
    id: "fixed_portfolio_withdrawal",
    title: "Withdraw from portfolio",
    description: "Social Security is extra income.",
  },
  {
    id: "solve_max_lifestyle",
    title: "Solve max lifestyle amount",
    description: "Finds the highest total lifestyle amount.",
  },
  {
    id: "solve_max_portfolio_withdrawal",
    title: "Solve max portfolio withdrawal",
    description: "Finds the highest investment withdrawal. SS is extra.",
  },
];

export function InputsPanel({ scenario, onScenarioChange, onReset }: InputsPanelProps) {
  const update = <T,>(path: string[], value: T) => {
    onScenarioChange((previous) => {
      const next = structuredClone(previous) as RetirementScenario;
      let cursor: Record<string, unknown> = next as unknown as Record<string, unknown>;
      path.slice(0, -1).forEach((key) => {
        cursor = cursor[key] as Record<string, unknown>;
      });
      cursor[path[path.length - 1]] = value;
      return next;
    });
  };

  return (
    <aside className="rounded-lg border border-border bg-card p-4 shadow-soft lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-auto">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Scenario Inputs</h2>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-medium text-muted-foreground shadow-sm transition hover:border-primary hover:text-primary"
          onClick={onReset}
          title="Reset saved settings"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      <div className="space-y-5">
        <Section icon={<Users />} title="Household">
          <NumberField
            label="Person 1 current age"
            value={scenario.people.person1.currentAge}
            onChange={(value) => update(["people", "person1", "currentAge"], value)}
          />
          <NumberField
            label="Person 2 current age"
            value={scenario.people.person2.currentAge}
            onChange={(value) => update(["people", "person2", "currentAge"], value)}
          />
          <NumberField
            label="Planning end age"
            value={scenario.plan.planningEndAge}
            onChange={(value) => update(["plan", "planningEndAge"], value)}
          />
        </Section>

        <Section icon={<LineChart />} title="Portfolio">
          <CurrencyField
            label="Retirement portfolio"
            value={scenario.portfolio.retirementBalance}
            onChange={(value) => update(["portfolio", "retirementBalance"], value)}
          />
          <CurrencyField
            label="Taxable savings"
            value={scenario.portfolio.taxableSavingsBalance}
            onChange={(value) => update(["portfolio", "taxableSavingsBalance"], value)}
          />
          <CheckboxField
            label="Include taxable savings in runway"
            checked={scenario.portfolio.includeTaxableInPortfolio}
            onChange={(value) => update(["portfolio", "includeTaxableInPortfolio"], value)}
          />
          {scenario.portfolio.includeTaxableInPortfolio && (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
              Taxable savings are pooled with the retirement portfolio, invested at the same return,
              and used for withdrawals. Tax estimates conservatively treat portfolio withdrawals as
              ordinary taxable income.
            </p>
          )}
          <PercentField
            label="Expected annual nominal return"
            value={scenario.portfolio.annualNominalReturn}
            onChange={(value) => update(["portfolio", "annualNominalReturn"], value)}
          />
          <PercentField
            label="Annual inflation"
            value={scenario.portfolio.annualInflation}
            onChange={(value) => {
              update(["portfolio", "annualInflation"], value);
              update(["socialSecurity", "annualCOLA"], value);
            }}
          />
          <CurrencyField
            label="Target ending portfolio"
            value={scenario.plan.targetEndingPortfolioBalance}
            onChange={(value) => update(["plan", "targetEndingPortfolioBalance"], value)}
          />
        </Section>

        <Section icon={<Landmark />} title="Social Security">
          <CurrencyField
            label="Person 1 age 67 benefit in today's dollars"
            value={scenario.socialSecurity.person1MonthlyBenefit}
            onChange={(value) => update(["socialSecurity", "person1MonthlyBenefit"], value)}
          />
          <NumberField
            label="Person 1 claiming age"
            value={scenario.socialSecurity.person1ClaimingAge}
            onChange={(value) => update(["socialSecurity", "person1ClaimingAge"], value)}
          />
          <CalculatedBenefit
            label="Person 1 claiming benefit in today's dollars"
            fraBenefit={scenario.socialSecurity.person1MonthlyBenefit}
            claimingAge={scenario.socialSecurity.person1ClaimingAge}
          />
          <CurrencyField
            label="Person 2 age 67 benefit in today's dollars"
            value={scenario.socialSecurity.person2MonthlyBenefit}
            onChange={(value) => update(["socialSecurity", "person2MonthlyBenefit"], value)}
          />
          <NumberField
            label="Person 2 claiming age"
            value={scenario.socialSecurity.person2ClaimingAge}
            onChange={(value) => update(["socialSecurity", "person2ClaimingAge"], value)}
          />
          <CalculatedBenefit
            label="Person 2 claiming benefit in today's dollars"
            fraBenefit={scenario.socialSecurity.person2MonthlyBenefit}
            claimingAge={scenario.socialSecurity.person2ClaimingAge}
          />
          <PercentField
            label="Annual COLA"
            value={scenario.socialSecurity.annualCOLA}
            onChange={(value) => update(["socialSecurity", "annualCOLA"], value)}
          />
        </Section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Spending Mode</h3>
          <div className="grid gap-2">
            {modes.map((mode) => (
              <button
                type="button"
                key={mode.id}
                className={cn(
                  "rounded-md border p-3 text-left transition",
                  scenario.spendingMode.mode === mode.id
                    ? "border-primary bg-primary/8 shadow-sm"
                    : "border-border bg-white hover:border-primary/60",
                )}
                onClick={() => update(["spendingMode", "mode"], mode.id)}
              >
                <span className="block text-sm font-semibold">{mode.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {mode.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        <Section icon={<Calculator />} title="Mode Amounts">
          {(scenario.spendingMode.mode === "maintain_lifestyle" ||
            scenario.spendingMode.mode === "solve_max_lifestyle") && (
            <CurrencyField
              label={
                scenario.spendingMode.mode === "solve_max_lifestyle"
                  ? "Solver starting guess"
                  : "Target monthly spending"
              }
              value={scenario.spendingMode.startingMonthlyLifestyleSpending}
              disabled={scenario.spendingMode.mode === "solve_max_lifestyle"}
              onChange={(value) =>
                update(["spendingMode", "startingMonthlyLifestyleSpending"], value)
              }
            />
          )}
          {(scenario.spendingMode.mode === "fixed_portfolio_withdrawal" ||
            scenario.spendingMode.mode === "solve_max_portfolio_withdrawal") && (
            <CurrencyField
              label={
                scenario.spendingMode.mode === "solve_max_portfolio_withdrawal"
                  ? "Solver starting guess"
                  : "Starting monthly portfolio withdrawal"
              }
              value={scenario.spendingMode.startingMonthlyPortfolioWithdrawal}
              disabled={scenario.spendingMode.mode === "solve_max_portfolio_withdrawal"}
              onChange={(value) =>
                update(["spendingMode", "startingMonthlyPortfolioWithdrawal"], value)
              }
            />
          )}
        </Section>

        <Section icon={<Home />} title="Home Tracking">
          <CheckboxField
            label="Track home equity"
            checked={scenario.home.enabled}
            onChange={(value) => update(["home", "enabled"], value)}
          />
          <CurrencyField
            label="Home value"
            value={scenario.home.currentHomeValue}
            onChange={(value) => update(["home", "currentHomeValue"], value)}
          />
          <CurrencyField
            label="Mortgage balance"
            value={scenario.home.mortgageBalance}
            onChange={(value) => update(["home", "mortgageBalance"], value)}
          />
          <PercentField
            label="Home appreciation"
            value={scenario.home.annualHomeAppreciation}
            onChange={(value) => update(["home", "annualHomeAppreciation"], value)}
          />
          <NumberField
            label="Mortgage payoff age"
            value={scenario.home.mortgagePayoffAge}
            onChange={(value) => update(["home", "mortgagePayoffAge"], value)}
          />
        </Section>
      </div>
    </aside>
  );
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const fullRetirementAge = 67;

function CalculatedBenefit({
  label,
  fraBenefit,
  claimingAge,
}: {
  label: string;
  fraBenefit: number;
  claimingAge: number;
}) {
  const adjustedBenefit = adjustedSocialSecurityBenefit(fraBenefit, claimingAge);
  const multiplier = fraBenefit > 0 ? adjustedBenefit / fraBenefit : 0;

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{money.format(adjustedBenefit)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {(multiplier * 100).toFixed(1)}% of the age {fullRetirementAge} amount when claiming at{" "}
        {claimingAge}. Projection inflates payments by COLA from today.
      </p>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="[&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-primary">{icon}</span>
        {title}
      </h3>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="h-10 rounded-md border border-input bg-white px-3 text-right shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function CurrencyField(props: Parameters<typeof NumberField>[0]) {
  return <NumberField {...props} />;
}

function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex h-10 rounded-md border border-input bg-white shadow-sm transition-within focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          className="min-w-0 flex-1 bg-transparent px-3 text-right outline-none"
          type="number"
          step="0.1"
          value={Number.isFinite(value) ? +(value * 100).toFixed(2) : 0}
          onChange={(event) => onChange(Number(event.target.value) / 100)}
        />
        <span className="grid w-10 place-items-center border-l border-border text-sm text-muted-foreground">
          %
        </span>
      </div>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="h-4 w-4 accent-primary"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
