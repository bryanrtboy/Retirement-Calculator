import {
  Calculator,
  ChevronDown,
  ChevronRight,
  Home,
  Landmark,
  LineChart,
  Plus,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type {
  PlannedExpenseCategory,
  PlannedExpenseInput,
  RetirementScenario,
  SpendingMode,
} from "../model/types";
import { cn } from "../lib/utils";
import { adjustedSocialSecurityBenefit } from "../model/simulation";
import { InfoTooltip } from "./InfoTooltip";

interface InputsPanelProps {
  scenario: RetirementScenario;
  onScenarioChange: Dispatch<SetStateAction<RetirementScenario>>;
  onReset: () => void;
}

const modeGroups: Array<{
  title: string;
  description: string;
  tooltip: string;
  options: Array<{ id: SpendingMode; title: string; description: string }>;
}> = [
  {
    title: "Lifestyle Spending",
    description: "Best for asking how much the household can spend.",
    tooltip:
      "This treats Social Security as part of the lifestyle budget. When benefits start, the portfolio usually withdraws less, so the household spending target stays steadier.",
    options: [
      {
        id: "solve_max_lifestyle",
        title: "Solve max lifestyle amount",
        description: "Recommended. Finds sustainable monthly spending.",
      },
      {
        id: "maintain_lifestyle",
        title: "Maintain lifestyle amount",
        description: "Test a specific budget. Social Security reduces withdrawals.",
      },
    ],
  },
  {
    title: "Portfolio Withdrawals",
    description: "Advanced view for recurring investment draws.",
    tooltip:
      "This keeps the recurring portfolio draw going after Social Security starts. Benefits stack on top as extra income, so the solver often needs a lower base withdrawal to protect the portfolio.",
    options: [
      {
        id: "fixed_portfolio_withdrawal",
        title: "Withdraw base amount",
        description: "Social Security is extra income; extras draw separately.",
      },
      {
        id: "solve_max_portfolio_withdrawal",
        title: "Solve max base withdrawal",
        description: "Finds recurring gross portfolio draw; SS is extra.",
      },
    ],
  },
];

export function InputsPanel({ scenario, onScenarioChange, onReset }: InputsPanelProps) {
  const [extrasOpen, setExtrasOpen] = useState(false);
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
  const setPlannedExpenses = (plannedExpenses: PlannedExpenseInput[]) => {
    onScenarioChange((previous) => ({ ...previous, plannedExpenses }));
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

      <div className="space-y-4">
        <SpendingModeSection
          mode={scenario.spendingMode.mode}
          onChange={(mode) => update(["spendingMode", "mode"], mode)}
        />

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
                  : "Starting base monthly portfolio withdrawal"
              }
              value={scenario.spendingMode.startingMonthlyPortfolioWithdrawal}
              disabled={scenario.spendingMode.mode === "solve_max_portfolio_withdrawal"}
              onChange={(value) =>
                update(["spendingMode", "startingMonthlyPortfolioWithdrawal"], value)
              }
            />
          )}
          <CheckboxField
            label="Start portfolio withdrawals now"
            checked={scenario.spendingMode.withdrawalsStartImmediately}
            onChange={(value) => {
              update(["spendingMode", "withdrawalsStartImmediately"], value);
              if (!value) {
                update(
                  ["spendingMode", "withdrawalStartAge"],
                  Math.max(
                    scenario.people.person1.currentAge,
                    scenario.people.person2.currentAge,
                  ),
                );
              }
            }}
          />
          {!scenario.spendingMode.withdrawalsStartImmediately && (
            <>
              <NumberField
                label="Portfolio withdrawal start age"
                value={scenario.spendingMode.withdrawalStartAge}
                onChange={(value) =>
                  update(["spendingMode", "withdrawalStartAge"], Math.round(value))
                }
              />
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
                Before this age, portfolio-funded lifestyle spending and planned extras are paused.
                Social Security and pension income can still appear if their own start ages are
                reached.
              </p>
            </>
          )}
        </Section>

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

        <Section icon={<Landmark />} title="Pension">
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
            Not all pensions adjust for inflation. Many private pensions are fixed nominal
            payments; public plans may have a full, capped, or occasional COLA.
          </p>
          <CurrencyField
            label="Person 1 monthly pension"
            value={scenario.pension.person1MonthlyBenefit}
            onChange={(value) => update(["pension", "person1MonthlyBenefit"], value)}
          />
          <NumberField
            label="Person 1 pension start age"
            value={scenario.pension.person1StartAge}
            onChange={(value) => update(["pension", "person1StartAge"], value)}
          />
          <CheckboxField
            label="Person 1 pension adjusts with inflation"
            checked={scenario.pension.person1InflationAdjusted}
            onChange={(value) => update(["pension", "person1InflationAdjusted"], value)}
          />
          <CurrencyField
            label="Person 2 monthly pension"
            value={scenario.pension.person2MonthlyBenefit}
            onChange={(value) => update(["pension", "person2MonthlyBenefit"], value)}
          />
          <NumberField
            label="Person 2 pension start age"
            value={scenario.pension.person2StartAge}
            onChange={(value) => update(["pension", "person2StartAge"], value)}
          />
          <CheckboxField
            label="Person 2 pension adjusts with inflation"
            checked={scenario.pension.person2InflationAdjusted}
            onChange={(value) => update(["pension", "person2InflationAdjusted"], value)}
          />
        </Section>

        <PlannedExtrasSection
          open={extrasOpen}
          onOpenChange={setExtrasOpen}
          currentYear={scenario.plan.currentYear}
          plannedExpenses={scenario.plannedExpenses}
          onChange={setPlannedExpenses}
        />

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

function SpendingModeSection({
  mode,
  onChange,
}: {
  mode: SpendingMode;
  onChange: (mode: SpendingMode) => void;
}) {
  return (
    <section className="rounded-lg border border-primary/25 bg-primary/8 p-3 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-primary">Spending Mode</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Choose whether you want to plan around household spending or portfolio withdrawals.
        </p>
      </div>
      <div className="grid gap-3">
        {modeGroups.map((group) => (
          <div key={group.title} className="rounded-md border border-primary/15 bg-white/50 p-2">
            <div className="mb-2 px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                <InfoTooltip label={group.title}>{group.tooltip}</InfoTooltip>
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                {group.description}
              </p>
            </div>
            <div className="grid gap-2">
              {group.options.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={cn(
                    "rounded-md border p-3 text-left transition",
                    mode === option.id
                      ? "border-primary bg-white shadow-sm"
                      : "border-border bg-white/70 hover:border-primary/60 hover:bg-white",
                  )}
                  onClick={() => onChange(option.id)}
                >
                  <span className="block text-sm font-semibold">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const categoryLabels: Record<PlannedExpenseCategory, string> = {
  travel: "Travel",
  vehicle: "Vehicle",
  home: "Home",
  medical: "Medical",
  family: "Family",
  other: "Other",
};

const quickAdds: Array<{
  label: string;
  category: PlannedExpenseCategory;
  name: string;
  amount: number;
  frequencyYears: number;
}> = [
  { label: "Add travel", category: "travel", name: "Travel", amount: 12_000, frequencyYears: 1 },
  { label: "Add vehicle", category: "vehicle", name: "Vehicle", amount: 45_000, frequencyYears: 10 },
  { label: "Add home project", category: "home", name: "Home project", amount: 25_000, frequencyYears: 3 },
  { label: "Add custom", category: "other", name: "Custom expense", amount: 10_000, frequencyYears: 1 },
];

function PlannedExtrasSection({
  open,
  onOpenChange,
  currentYear,
  plannedExpenses,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentYear: number;
  plannedExpenses: PlannedExpenseInput[];
  onChange: (expenses: PlannedExpenseInput[]) => void;
}) {
  const enabledExpenses = plannedExpenses.filter((expense) => expense.enabled);
  const firstYearTotal = enabledExpenses
    .filter((expense) => isExpenseScheduled(expense, currentYear))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const summary = `${enabledExpenses.length} planned extras · ${money.format(firstYearTotal)} first-year total`;

  const updateExpense = <K extends keyof PlannedExpenseInput>(
    id: string,
    key: K,
    value: PlannedExpenseInput[K],
  ) => {
    onChange(
      plannedExpenses.map((expense) =>
        expense.id === id ? { ...expense, [key]: value } : expense,
      ),
    );
  };

  const addExpense = (template: (typeof quickAdds)[number]) => {
    onChange([
      ...plannedExpenses,
      {
        id: `${template.category}-${Date.now()}`,
        name: template.name,
        category: template.category,
        amount: template.amount,
        startYear: currentYear,
        endYear: currentYear + 25,
        frequencyYears: template.frequencyYears,
        inflateWithInflation: true,
        enabled: true,
      },
    ]);
    onOpenChange(true);
  };

  return (
    <section className="rounded-lg border border-border bg-white/70 p-3 shadow-sm">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => onOpenChange(!open)}
      >
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {open ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-primary" />}
            Planned Extras
          </span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{summary}</span>
        </span>
      </button>

      {open && (
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            {quickAdds.map((template) => (
              <button
                key={template.label}
                type="button"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-white px-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:border-primary hover:text-primary"
                onClick={() => addExpense(template)}
              >
                <Plus className="h-3.5 w-3.5" />
                {template.label}
              </button>
            ))}
          </div>

          {plannedExpenses.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Add travel, vehicle, renovation, or custom expenses here. They stay separate from base monthly lifestyle spending.
            </p>
          ) : (
            plannedExpenses.map((expense) => (
              <article key={expense.id} className="grid gap-3 rounded-md border border-border bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <CheckboxField
                    label={`${categoryLabels[expense.category]} enabled`}
                    checked={expense.enabled}
                    onChange={(value) => updateExpense(expense.id, "enabled", value)}
                  />
                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground transition hover:border-destructive hover:text-destructive"
                    onClick={() => onChange(plannedExpenses.filter((item) => item.id !== expense.id))}
                    title="Remove planned extra"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <TextField
                  label="Name"
                  value={expense.name}
                  onChange={(value) => updateExpense(expense.id, "name", value)}
                />
                <SelectField
                  label="Category"
                  value={expense.category}
                  options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
                  onChange={(value) =>
                    updateExpense(expense.id, "category", value as PlannedExpenseCategory)
                  }
                />
                <CurrencyField
                  label="Amount"
                  value={expense.amount}
                  onChange={(value) => updateExpense(expense.id, "amount", value)}
                />
                <div className="grid gap-2">
                  <NumberField
                    label="Every years"
                    value={expense.frequencyYears}
                    onChange={(value) => updateExpense(expense.id, "frequencyYears", Math.max(1, Math.round(value)))}
                  />
                  <NumberField
                    label="Start"
                    value={expense.startYear}
                    onChange={(value) => updateExpense(expense.id, "startYear", Math.round(value))}
                  />
                  <NumberField
                    label="End"
                    value={expense.endYear}
                    onChange={(value) => updateExpense(expense.id, "endYear", Math.round(value))}
                  />
                </div>
                <CheckboxField
                  label="Inflate with inflation"
                  checked={expense.inflateWithInflation}
                  onChange={(value) => updateExpense(expense.id, "inflateWithInflation", value)}
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  {money.format(expense.amount)} every {expense.frequencyYears} year
                  {expense.frequencyYears === 1 ? "" : "s"} from {expense.startYear} to{" "}
                  {expense.endYear}, {plannedExpenseTimingText(expense.category)}.
                </p>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function plannedExpenseTimingText(category: PlannedExpenseCategory) {
  if (category === "travel") return "split between June and September";
  if (category === "home") return "spread evenly across the year";
  return "paid in January";
}

function isExpenseScheduled(expense: PlannedExpenseInput, year: number) {
  if (year < expense.startYear || year > expense.endYear) return false;
  return (year - expense.startYear) % expense.frequencyYears === 0;
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
    <section className="rounded-lg border border-border bg-white/70 p-3 shadow-sm">
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
        className="h-10 w-full min-w-0 rounded-md border border-input bg-white px-3 text-right shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function CurrencyField(props: Parameters<typeof NumberField>[0]) {
  const { label, value, onChange, disabled } = props;
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="h-10 w-full min-w-0 rounded-md border border-input bg-white px-3 text-right tabular-nums shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted"
        type="text"
        inputMode="numeric"
        value={formatCurrencyInput(value)}
        disabled={disabled}
        onChange={(event) => onChange(parseCurrencyInput(event.target.value))}
      />
    </label>
  );
}

function formatCurrencyInput(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-US");
}

function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="h-10 w-full min-w-0 rounded-md border border-input bg-white px-3 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="h-10 w-full min-w-0 rounded-md border border-input bg-white px-3 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
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
