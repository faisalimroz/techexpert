/**
 * Solar sizing & savings estimator.
 * Pure and deterministic so the browser preview and the API return identical numbers.
 * Every default below is an ENGINEERING ASSUMPTION, not a guarantee — admins can override
 * them from Site Settings, and the UI must show them next to the result.
 */

export * from './ems';

export type SystemType = 'on-grid' | 'off-grid' | 'hybrid';

/** Indicative daily peak-sun-hours by division. Replace with site irradiance data (e.g. PVGIS/NASA POWER) before quoting. */
export const LOCATIONS = {
  dhaka: { name: 'Dhaka', psh: 4.3 },
  chattogram: { name: 'Chattogram', psh: 4.4 },
  rajshahi: { name: 'Rajshahi', psh: 4.6 },
  khulna: { name: 'Khulna', psh: 4.5 },
  sylhet: { name: 'Sylhet', psh: 4.1 },
  rangpur: { name: 'Rangpur', psh: 4.4 },
  barishal: { name: 'Barishal', psh: 4.4 },
  mymensingh: { name: 'Mymensingh', psh: 4.2 },
} as const;
export type LocationKey = keyof typeof LOCATIONS;

/** Relative monthly yield for Bangladesh (monsoon dip Jun–Sep). Mean = 1. */
export const SEASONAL = [0.97, 1.06, 1.12, 1.12, 1.06, 0.86, 0.81, 0.86, 0.88, 0.99, 1.02, 0.95] as const;
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export interface Assumptions {
  /** Performance ratio: wiring, heat, inverter, soiling losses */
  performanceRatio: number;
  /** Installed cost, BDT per kWp — PLACEHOLDER until sales confirms price book */
  costPerKwp: Record<SystemType, number>;
  /** Roof area needed per kWp, sq ft (spacing + walkways) */
  sqftPerKwp: number;
  /** Share of exported energy credited at the import tariff (net-metering policy) */
  exportCreditPct: number;
  /** Share of solar consumed on site (rest exported) */
  selfConsumptionPct: number;
  /** Grid emission factor, kg CO2 per kWh */
  gridEmissionKgPerKwh: number;
  /** Yearly module degradation used for 25-year totals */
  degradationPct: number;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  performanceRatio: 0.78,
  costPerKwp: { 'on-grid': 60000, hybrid: 85000, 'off-grid': 95000 },
  sqftPerKwp: 75,
  exportCreditPct: 1,
  selfConsumptionPct: 0.8,
  gridEmissionKgPerKwh: 0.67,
  degradationPct: 0.5,
};

export interface CalcInput {
  monthlyBillBdt?: number;
  monthlyKwh?: number;
  tariffBdtPerKwh: number;
  roofSqft?: number;
  panelWatt: number;
  location: LocationKey;
  systemType: SystemType;
  /** fraction of consumption to offset, 0.1–1 */
  offsetPct?: number;
}

export interface CalcResult {
  monthlyKwhUsed: number;
  recommendedKwp: number;
  panels: number;
  installedKwp: number;
  roofSqftNeeded: number;
  dailyKwh: number;
  monthlyKwh: number;
  annualKwh: number;
  monthlyProfile: { month: string; kwh: number }[];
  annualSavingsBdt: number;
  investmentBdt: number;
  paybackYears: number | null;
  co2TonnesPerYear: number;
  savings25yBdt: number;
  cappedByRoof: boolean;
  warnings: string[];
  assumptions: Assumptions & { psh: number; locationName: string };
}

const round = (n: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

export function estimateSolar(input: CalcInput, overrides: Partial<Assumptions> = {}): CalcResult {
  const a: Assumptions = {
    ...DEFAULT_ASSUMPTIONS,
    ...overrides,
    costPerKwp: { ...DEFAULT_ASSUMPTIONS.costPerKwp, ...(overrides.costPerKwp ?? {}) },
  };
  const loc = LOCATIONS[input.location] ?? LOCATIONS.dhaka;
  const warnings: string[] = [];

  if (!(input.tariffBdtPerKwh > 0)) throw new RangeError('tariffBdtPerKwh must be > 0');
  if (!(input.panelWatt >= 100 && input.panelWatt <= 800)) throw new RangeError('panelWatt must be 100–800');

  let used = input.monthlyKwh && input.monthlyKwh > 0 ? input.monthlyKwh : 0;
  if (!used && input.monthlyBillBdt && input.monthlyBillBdt > 0) {
    used = input.monthlyBillBdt / input.tariffBdtPerKwh;
    warnings.push('Consumption estimated from bill ÷ tariff; demand and VAT charges are not separated.');
  }
  if (!used) throw new RangeError('Provide monthlyKwh or monthlyBillBdt');

  const offset = Math.min(1, Math.max(0.1, input.offsetPct ?? 1));
  const kwhPerKwpDay = loc.psh * a.performanceRatio;
  const recommendedKwp = (used * offset * 12) / (kwhPerKwpDay * 365);

  let targetKwp = recommendedKwp;
  let cappedByRoof = false;
  if (input.roofSqft && input.roofSqft > 0) {
    const maxKwp = input.roofSqft / a.sqftPerKwp;
    if (maxKwp < targetKwp) {
      targetKwp = maxKwp;
      cappedByRoof = true;
      warnings.push('System limited by available roof area; consider carport or ground-mount for the balance.');
    }
  }

  const panels = Math.max(1, Math.ceil((targetKwp * 1000) / input.panelWatt));
  const installedKwp = (panels * input.panelWatt) / 1000;
  const dailyKwh = installedKwp * kwhPerKwpDay;
  const annualKwh = dailyKwh * 365;
  const monthlyProfile = SEASONAL.map((f, i) => ({
    month: MONTHS[i] as string,
    kwh: round((annualKwh / 12) * f),
  }));

  // savings: self-consumed at tariff, exported at credit share (off-grid: nothing exported)
  const selfShare = input.systemType === 'off-grid' ? 1 : a.selfConsumptionPct;
  const annualSavingsBdt =
    annualKwh * selfShare * input.tariffBdtPerKwh +
    annualKwh * (1 - selfShare) * input.tariffBdtPerKwh * (input.systemType === 'off-grid' ? 0 : a.exportCreditPct);

  const investmentBdt = installedKwp * a.costPerKwp[input.systemType];
  const paybackYears = annualSavingsBdt > 0 ? investmentBdt / annualSavingsBdt : null;

  let savings25 = 0;
  for (let y = 0; y < 25; y++) savings25 += annualSavingsBdt * (1 - a.degradationPct / 100) ** y;

  if (input.systemType === 'off-grid') warnings.push('Off-grid cost includes indicative battery autonomy; final sizing needs a load audit.');

  return {
    monthlyKwhUsed: round(used),
    recommendedKwp: round(recommendedKwp, 2),
    panels,
    installedKwp: round(installedKwp, 2),
    roofSqftNeeded: round(installedKwp * a.sqftPerKwp),
    dailyKwh: round(dailyKwh, 1),
    monthlyKwh: round(annualKwh / 12),
    annualKwh: round(annualKwh),
    monthlyProfile,
    annualSavingsBdt: round(annualSavingsBdt),
    investmentBdt: round(investmentBdt),
    paybackYears: paybackYears === null ? null : round(paybackYears, 1),
    co2TonnesPerYear: round((annualKwh * a.gridEmissionKgPerKwh) / 1000, 2),
    savings25yBdt: round(savings25),
    cappedByRoof,
    warnings,
    assumptions: { ...a, psh: loc.psh, locationName: loc.name },
  };
}

export const ESTIMATE_DISCLAIMER =
  'Estimates only. Actual generation depends on shading, orientation, equipment, weather and grid policy. A site survey is required for a binding proposal.';
