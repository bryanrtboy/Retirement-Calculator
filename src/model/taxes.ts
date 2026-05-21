export interface FederalTaxEstimate {
  ordinaryIncome: number;
  socialSecurityIncome: number;
  taxableSocialSecurity: number;
  adjustedGrossIncome: number;
  standardDeduction: number;
  agedDeduction: number;
  enhancedSeniorDeduction: number;
  taxableIncome: number;
  federalTax: number;
}

const standardDeductionMarriedJointly2026 = 32_200;
const agedDeductionPerPersonMarried2026 = 1_650;
const enhancedSeniorDeductionPerPerson = 6_000;
const enhancedSeniorDeductionPhaseoutStart = 150_000;
const enhancedSeniorDeductionPhaseoutRate = 0.06;

const marriedJointlyBrackets2026 = [
  { upTo: 24_800, rate: 0.1 },
  { upTo: 100_800, rate: 0.12 },
  { upTo: 211_400, rate: 0.22 },
  { upTo: 403_550, rate: 0.24 },
  { upTo: 512_450, rate: 0.32 },
  { upTo: 768_700, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

export function estimateFederalTaxMarriedJointly2026({
  ordinaryIncome,
  socialSecurityIncome,
  person1Age,
  person2Age,
}: {
  ordinaryIncome: number;
  socialSecurityIncome: number;
  person1Age: number;
  person2Age: number;
}): FederalTaxEstimate {
  const taxableSocialSecurity = calculateTaxableSocialSecurityMarriedJointly(
    ordinaryIncome,
    socialSecurityIncome,
  );
  const adjustedGrossIncome = ordinaryIncome + taxableSocialSecurity;
  const agedDeduction =
    (person1Age >= 65 ? agedDeductionPerPersonMarried2026 : 0) +
    (person2Age >= 65 ? agedDeductionPerPersonMarried2026 : 0);
  const eligibleSeniorDeduction =
    (person1Age >= 65 ? enhancedSeniorDeductionPerPerson : 0) +
    (person2Age >= 65 ? enhancedSeniorDeductionPerPerson : 0);
  const enhancedSeniorDeduction = Math.max(
    0,
    eligibleSeniorDeduction -
      Math.max(0, adjustedGrossIncome - enhancedSeniorDeductionPhaseoutStart) *
        enhancedSeniorDeductionPhaseoutRate,
  );
  const taxableIncome = Math.max(
    0,
    adjustedGrossIncome -
      standardDeductionMarriedJointly2026 -
      agedDeduction -
      enhancedSeniorDeduction,
  );

  return {
    ordinaryIncome,
    socialSecurityIncome,
    taxableSocialSecurity,
    adjustedGrossIncome,
    standardDeduction: standardDeductionMarriedJointly2026,
    agedDeduction,
    enhancedSeniorDeduction,
    taxableIncome,
    federalTax: calculateProgressiveTax(taxableIncome),
  };
}

export function solveFederalTaxGrossUpMarriedJointly2026({
  ordinaryIncomeBeforeTax,
  socialSecurityIncome,
  person1Age,
  person2Age,
}: {
  ordinaryIncomeBeforeTax: number;
  socialSecurityIncome: number;
  person1Age: number;
  person2Age: number;
}) {
  let low = 0;
  let high = Math.max(1_000, ordinaryIncomeBeforeTax + socialSecurityIncome);

  for (let i = 0; i < 32; i += 1) {
    const tax = estimateFederalTaxMarriedJointly2026({
      ordinaryIncome: ordinaryIncomeBeforeTax + high,
      socialSecurityIncome,
      person1Age,
      person2Age,
    }).federalTax;
    if (tax <= high) break;
    high *= 2;
  }

  for (let i = 0; i < 48; i += 1) {
    const mid = (low + high) / 2;
    const tax = estimateFederalTaxMarriedJointly2026({
      ordinaryIncome: ordinaryIncomeBeforeTax + mid,
      socialSecurityIncome,
      person1Age,
      person2Age,
    }).federalTax;

    if (tax > mid) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return estimateFederalTaxMarriedJointly2026({
    ordinaryIncome: ordinaryIncomeBeforeTax + high,
    socialSecurityIncome,
    person1Age,
    person2Age,
  });
}

function calculateTaxableSocialSecurityMarriedJointly(
  ordinaryIncome: number,
  socialSecurityIncome: number,
) {
  const provisionalIncome = ordinaryIncome + socialSecurityIncome * 0.5;

  if (provisionalIncome <= 32_000) {
    return 0;
  }

  if (provisionalIncome <= 44_000) {
    return Math.min(socialSecurityIncome * 0.5, (provisionalIncome - 32_000) * 0.5);
  }

  return Math.min(
    socialSecurityIncome * 0.85,
    (provisionalIncome - 44_000) * 0.85 + Math.min(6_000, socialSecurityIncome * 0.5),
  );
}

function calculateProgressiveTax(taxableIncome: number) {
  let tax = 0;
  let previous = 0;

  for (const bracket of marriedJointlyBrackets2026) {
    const taxableInBracket = Math.max(0, Math.min(taxableIncome, bracket.upTo) - previous);
    tax += taxableInBracket * bracket.rate;
    if (taxableIncome <= bracket.upTo) break;
    previous = bracket.upTo;
  }

  return tax;
}
