# Retirement Runway Calculator

A one-page retirement cashflow calculator for a retired couple.

It projects monthly portfolio balances, Social Security, taxes, planned one-time expenses, and optional home equity. The result cards, charts, and yearly table all come from the same monthly projection, so the output can be audited.

## Running Locally

```bash
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:5173/
```

For a production build:

```bash
npm run build
npm run preview
```

## Deploying To Cloudflare Pages

Use these Cloudflare Pages settings:

```txt
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

If Cloudflare needs a Node version, set:

```txt
NODE_VERSION=22
```

## What It Does

- Simulates retirement cashflow month by month.
- Supports a retired couple with separate Social Security claiming ages.
- Adjusts Social Security for claiming before or after age 67.
- Inflates spending, Social Security, and planned extras over time.
- Estimates federal taxes.
- Supports optional taxable savings, pooled with the retirement portfolio.
- Supports planned extras such as travel, vehicles, renovations, and other major expenses.
- Tracks optional home value, mortgage balance, and home equity separately.
- Saves settings locally in the browser.

## Spending Modes

The mode choice is important because it changes what the monthly amount means.

**Maintain Lifestyle Amount**

The monthly amount is desired after-tax household spending. Social Security replaces part of the portfolio withdrawal.

```txt
portfolio withdrawal = lifestyle spending + planned extras - Social Security + estimated federal tax
```

**Withdraw Fixed Amount From Portfolio**

The monthly amount is the gross portfolio withdrawal. Social Security is extra income on top.

```txt
after-tax surplus = portfolio withdrawal + Social Security - estimated federal tax - planned extras
```

**Solve Max Lifestyle Amount**

Finds the highest starting after-tax monthly lifestyle amount that meets the ending portfolio target.

**Solve Max Portfolio Withdrawal**

Finds the highest starting gross monthly portfolio withdrawal that meets the ending portfolio target.

## Planned Extras

Planned extras are separate from base monthly lifestyle spending.

Examples:

- yearly travel
- vehicle replacement every 10 years
- renovation or home project every 2 or 3 years

In this version, planned extras occur in January of scheduled years. They are included in solver calculations.

## Key Assumptions

- Investment return is nominal.
- Portfolio growth is applied monthly before withdrawals.
- Taxable savings are pooled with the retirement portfolio when enabled.
- Portfolio withdrawals are treated as ordinary taxable income.
- Federal tax is estimated using 2026 married-filing-jointly rules.
- Social Security inputs are age-67 benefits in today's dollars.
- Social Security COLA is applied from today through the payment month.
- Home equity is tracked only and does not fund withdrawals.
- Settings are stored only in the local browser with `localStorage`.

## Not Modeled

- State taxes
- RMDs
- Medicare premiums or IRMAA
- Roth accounts
- taxable cost basis or capital gains
- survivor benefits
- pensions or annuities
- market volatility
- Monte Carlo analysis
- long-term care
- spending shocks

This is a planning tool, not financial or tax advice.

## Development

```bash
npm test
npm run build
```

Main model files:

- `src/model/simulation.ts`
- `src/model/solvers.ts`
- `src/model/taxes.ts`
- `src/model/types.ts`
