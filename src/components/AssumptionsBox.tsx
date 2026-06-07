import { Info } from "lucide-react";

export function AssumptionsBox() {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <div className="flex gap-3">
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <Info className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Version 1 Assumptions</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            This is a deterministic projection that calculates monthly cashflow in nominal dollars,
            then can display results in today's dollars or future dollars. Federal tax is estimated
            using 2026 married-filing-jointly brackets, standard deduction, age-based deductions,
            the temporary senior deduction, and Social Security taxable-benefit rules. Pension
            income is treated as ordinary taxable income. State tax, itemized deductions, credits,
            RMDs, Medicare costs, IRMAA, long-term care, survivor benefits, market volatility,
            Monte Carlo analysis, and portfolio asset location are not modeled. Home equity is
            tracked separately and is not used to fund withdrawals.
          </p>
        </div>
      </div>
    </section>
  );
}
