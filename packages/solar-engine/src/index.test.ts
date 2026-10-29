import { describe, expect, it } from 'vitest';
import { estimateSolar } from './index';

const base = { tariffBdtPerKwh: 10, panelWatt: 550, location: 'dhaka' as const, systemType: 'on-grid' as const };

describe('estimateSolar', () => {
  it('sizes from consumption', () => {
    const r = estimateSolar({ ...base, monthlyKwh: 1000 });
    // 1000 kWh/mo ≈ 32.9 kWh/day ÷ (4.3 × 0.78) ≈ 9.8 kWp
    expect(r.recommendedKwp).toBeGreaterThan(9.5);
    expect(r.recommendedKwp).toBeLessThan(10.2);
    expect(r.panels).toBe(Math.ceil((r.recommendedKwp * 1000) / 550));
    expect(r.monthlyProfile).toHaveLength(12);
  });

  it('derives consumption from bill when kWh missing', () => {
    const r = estimateSolar({ ...base, monthlyBillBdt: 10000 });
    expect(r.monthlyKwhUsed).toBe(1000);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('caps by roof area', () => {
    const r = estimateSolar({ ...base, monthlyKwh: 5000, roofSqft: 750 });
    expect(r.cappedByRoof).toBe(true);
    expect(r.installedKwp).toBeLessThanOrEqual(10.5);
  });

  it('rejects missing consumption', () => {
    expect(() => estimateSolar({ ...base })).toThrow(RangeError);
  });

  it('payback is investment / annual savings', () => {
    const r = estimateSolar({ ...base, monthlyKwh: 1500 });
    expect(r.paybackYears).toBeCloseTo(r.investmentBdt / r.annualSavingsBdt, 0);
  });
});
