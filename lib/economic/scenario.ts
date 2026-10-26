export type ScenarioInputs = {
  businesses: number;
  initialPerBusiness: number;
  recurringPerBusiness: number;
  years: number;
  sharedReductionPercent: number;
};

export function calculateScenario(inputs: ScenarioInputs) {
  const reduction = Math.max(0, Math.min(100, inputs.sharedReductionPercent)) / 100;
  const effectiveRecurring = inputs.recurringPerBusiness * (1 - reduction);
  const initial = inputs.businesses * inputs.initialPerBusiness;
  const recurringAnnual = inputs.businesses * effectiveRecurring;
  return { initial, recurringAnnual, cumulative: initial + recurringAnnual * inputs.years, effectiveRecurring };
}
