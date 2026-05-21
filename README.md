# Retirement Runway Calculator

A local, deterministic retirement cashflow calculator for a retired couple.

The app projects month-by-month from current age to a selected planning end age, then rolls the monthly ledger into an auditable yearly table. Charts and result cards are generated from the same projection rows as the table.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```txt
http://127.0.0.1:5173/
```

## Core Functionality

- Projects retirement portfolio balances monthly.
- Supports retirement portfolio plus optional taxable savings.
- Models Social Security claiming ages for both people.
- Adjusts Social Security benefits based on claiming age.
- Applies inflation, investment return, and Social Security COLA monthly.
- Tracks federal tax estimates.
- Supports planned extras for irregular expenses such as travel, vehicles, renovations, and major purchases.
- Shows portfolio depletion, ending balance, total withdrawals, total Social Security, and estimated federal tax.
- Includes line and stacked-bar chart views.
- Includes optional home equity tracking, separate from retirement funding.
- Saves settings locally in the browser with `localStorage`.

## Spending Modes

### Maintain Lifestyle Amount

The entered amount is the desired after-tax household lifestyle spending.

Social Security is included inside that lifestyle amount, so it reduces the amount needed from the portfolio.

```txt
portfolio withdrawal = lifestyle spending - Social Security + estimated federal tax
```

Planned extras are added separately:

```txt
portfolio withdrawal = lifestyle spending + planned extras - Social Security + estimated federal tax
```

### Withdraw Fixed Amount From Portfolio

The entered amount is the gross portfolio withdrawal.

Social Security is added on top after benefits start, and estimated federal tax reduces after-tax income.

```txt
after-tax income = portfolio withdrawal + Social Security - estimated federal tax
```

Planned extras reduce the after-tax surplus in this mode:

```txt
after-tax surplus = portfolio withdrawal + Social Security - estimated federal tax - planned extras
```

### Solve Max Lifestyle Amount

The app solves for the highest starting after-tax monthly lifestyle amount that reaches the selected ending portfolio target.

This behaves like Maintain Lifestyle Amount.

### Solve Max Portfolio Withdrawal

The app solves for the highest starting gross monthly portfolio withdrawal that reaches the selected ending portfolio target.

This behaves like Withdraw Fixed Amount From Portfolio.

## Planned Extras

Planned extras are separate from the base monthly lifestyle amount.

Each planned extra has:

- name
- category
- amount
- start year
- end year
- frequency in years
- inflation toggle
- enabled toggle

Examples:

- travel every year
- car replacement every 10 years
- renovation every 2 or 3 years

For v1:

- expenses land in January of each scheduled year
- enabled expenses are included in solver calculations
- inflation-adjusted extras grow from the current year when enabled
- extras are funded from the same pooled portfolio model
- no loans, home-equity draws, reimbursements, or separate savings buckets are modeled

## Social Security Assumptions

Social Security inputs are entered as each person's age-67 benefit in today's dollars.

The app adjusts the benefit based on claiming age:

- age 62 is reduced using the standard early-claiming reduction for FRA 67
- age 67 is 100%
- age 70 is 124%

Projected payments are inflated by the selected COLA assumption from today through the payment month.

Survivor benefits are not modeled.

## Portfolio Assumptions

The app uses one pooled portfolio for withdrawals.

If taxable savings are included, they are pooled with the retirement portfolio:

- same expected return
- same withdrawal source
- same monthly compounding
- conservative tax treatment as ordinary taxable withdrawal income

The app does not currently model separate taxable cost basis, capital gains, dividends, asset location, Roth balances, or withdrawal ordering.

## Tax Assumptions

Federal tax is estimated using:

- 2026 married filing jointly brackets
- 2026 standard deduction
- age 65+ additional deductions
- temporary senior deduction
- taxable Social Security benefit rules
- portfolio withdrawals treated as ordinary income

Not modeled:

- state income tax
- itemized deductions
- credits
- RMDs
- Medicare premiums
- IRMAA
- Roth withdrawals
- capital gains treatment
- tax-loss harvesting
- real tax withholding or payment timing

This is an estimate for planning, not tax advice.

## Projection Assumptions

- Investment return is nominal, not real.
- Monthly return is calculated as:

```txt
monthlyReturn = (1 + annualReturn)^(1 / 12) - 1
```

- Monthly inflation is calculated as:

```txt
monthlyInflation = (1 + annualInflation)^(1 / 12) - 1
```

- Monthly Social Security COLA is calculated as:

```txt
monthlyCOLA = (1 + annualCOLA)^(1 / 12) - 1
```

- Portfolio grows each month before withdrawals are subtracted.
- Portfolio balance is not allowed to go below zero.
- If the portfolio depletes, the app records the depletion month and continues showing shortfall.

## Not Modeled

- Market volatility
- Monte Carlo simulation
- sequence-of-returns risk
- survivor benefits
- long-term care
- Medicare expenses
- RMDs
- state taxes
- detailed taxable-account tax lots
- annuities
- pensions
- spending shocks

## Development

```bash
npm run build
npm test
```

Main model files:

- `src/model/simulation.ts`
- `src/model/solvers.ts`
- `src/model/taxes.ts`
- `src/model/types.ts`
