import { describe, expect, it } from 'vitest';

import { calculateFixedDeposit, calculateSavingsDeposit, calculateTieredDeposit } from '../deposit';

const toNumber = (value: number, precision = 6) => Number(value.toFixed(precision));

describe('calculateFixedDeposit', () => {
  it('matches simple interest for a 12 month term without rollover', () => {
    const result = calculateFixedDeposit({
      principal: 100_000,
      annualRatePercent: 1.8,
      termMonths: 12,
      termCount: 1,
      startDate: '2024-01-01',
    });

    expect(toNumber(result.grossInterest.toNumber(), 4)).toBeCloseTo(1_795.08, 4);
    expect(toNumber(result.netInterest.toNumber(), 4)).toBeCloseTo(1_795.08, 4);
    expect(toNumber(result.endingBalance.toNumber(), 4)).toBeCloseTo(101_795.08, 4);
  });

  it('compounding semi-annually yields higher net interest than single annual term', () => {
    const singleTerm = calculateFixedDeposit({
      principal: 50_000,
      annualRatePercent: 2.4,
      termMonths: 12,
      termCount: 1,
      startDate: '2024-01-01',
    });

    const twoTerms = calculateFixedDeposit({
      principal: 50_000,
      annualRatePercent: 2.4,
      termMonths: 6,
      termCount: 2,
      startDate: '2024-01-01',
    });

    expect(twoTerms.netInterest.toNumber()).toBeGreaterThan(singleTerm.netInterest.toNumber());
    expect(twoTerms.netInterest.toNumber()).toBeCloseTo(1_203.88, 4);
    expect(twoTerms.endingBalance.toNumber()).toBeCloseTo(51_203.88, 4);
  });

  it('applies withholding tax before compounding', () => {
    const taxed = calculateFixedDeposit({
      principal: 100_000,
      annualRatePercent: 1.8,
      termMonths: 12,
      termCount: 1,
      startDate: '2024-01-01',
      withholdingTax: true,
    });

    expect(toNumber(taxed.grossInterest.toNumber(), 2)).toBeCloseTo(1_795.08, 2);
    expect(toNumber(taxed.taxAmount.toNumber(), 2)).toBeCloseTo(269.26, 2);
    expect(toNumber(taxed.netInterest.toNumber(), 2)).toBeCloseTo(1_525.82, 2);
    expect(toNumber(taxed.endingBalance.toNumber(), 2)).toBeCloseTo(101_525.82, 2);
  });

  it('uses actual deposit days for each rollover period', () => {
    const result = calculateFixedDeposit({
      principal: 100_000,
      annualRatePercent: 2.4,
      termMonths: 6,
      termCount: 2,
      startDate: '2023-01-01',
      compoundOnRollover: false,
    });

    expect(result.schedule).toHaveLength(2);

    const firstTerm = result.schedule[0];
    const secondTerm = result.schedule[1];

    expect(firstTerm?.grossInterest.toNumber()).toBeCloseTo(1_183.56, 2);
    expect(secondTerm?.grossInterest.toNumber()).toBeCloseTo(1_209.86, 2);
    expect(result.grossInterest.toNumber()).toBeCloseTo(2_393.42, 2);
    expect(result.netInterest.toNumber()).toBeCloseTo(2_393.42, 2);
  });
});

describe('calculateSavingsDeposit (daily accrual)', () => {
  it('excludes the initial deposit day from interest accrual', () => {
    const result = calculateSavingsDeposit({
      principal: 10_000,
      annualRatePercent: 2,
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      accrualMode: 'daily',
      compoundOnCredit: true,
      withholdingTax: false,
    });

    const january = result.schedule.find((entry) => entry.date === '2023-01-31');

    expect(january).toBeDefined();
    expect(january?.interestCredited.toNumber()).toBeCloseTo(16.99, 2);
  });
});

describe('calculateTieredDeposit', () => {
  it('calculates interest correctly for a single tier', () => {
    const result = calculateTieredDeposit({
      principal: 100_000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      tiers: [
        { minBalance: 0, maxBalance: 500_000, rate: 2.0 },
      ],
      withholdingTax: false,
    });

    expect(result.totalContributions).toBe(100_000);
    expect(result.grossInterest).toBeCloseTo(2_000, 0); // 100k * 2% * 1 year
    expect(result.netInterest).toBeCloseTo(2_000, 0);
    expect(result.endingBalance).toBe(102_000);
    expect(result.tierBreakdown).toHaveLength(1);
    expect(result.tierBreakdown[0].balanceInTier).toBe(100_000);
    expect(result.tierBreakdown[0].grossInterest).toBeCloseTo(2_000, 0);
  });

  it('calculates interest correctly for multiple tiers', () => {
    const result = calculateTieredDeposit({
      principal: 300_000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      tiers: [
        { minBalance: 0, maxBalance: 100_000, rate: 1.0 },
        { minBalance: 100_000, maxBalance: 200_000, rate: 2.0 },
        { minBalance: 200_000, maxBalance: 500_000, rate: 3.0 },
      ],
      withholdingTax: false,
    });

    expect(result.totalContributions).toBe(300_000);
    // Tier 1: 100k * 1% = 1k
    // Tier 2: 100k * 2% = 2k
    // Tier 3: 100k * 3% = 3k
    // Total: 6k
    expect(result.grossInterest).toBeCloseTo(6_000, 0);
    expect(result.netInterest).toBeCloseTo(6_000, 0);
    expect(result.endingBalance).toBe(306_000);
    expect(result.tierBreakdown).toHaveLength(3);
    expect(result.tierBreakdown[0].balanceInTier).toBe(100_000);
    expect(result.tierBreakdown[0].grossInterest).toBeCloseTo(1_000, 0);
    expect(result.tierBreakdown[1].balanceInTier).toBe(100_000);
    expect(result.tierBreakdown[1].grossInterest).toBeCloseTo(2_000, 0);
    expect(result.tierBreakdown[2].balanceInTier).toBe(100_000);
    expect(result.tierBreakdown[2].grossInterest).toBeCloseTo(3_000, 0);
  });

  it('handles partial tier allocation correctly', () => {
    const result = calculateTieredDeposit({
      principal: 150_000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      tiers: [
        { minBalance: 0, maxBalance: 100_000, rate: 1.0 },
        { minBalance: 100_000, maxBalance: 200_000, rate: 2.0 },
      ],
      withholdingTax: false,
    });

    expect(result.totalContributions).toBe(150_000);
    // Tier 1: 100k * 1% = 1k
    // Tier 2: 50k * 2% = 1k
    // Total: 2k
    expect(result.grossInterest).toBeCloseTo(2_000, 0);
    expect(result.netInterest).toBeCloseTo(2_000, 0);
    expect(result.endingBalance).toBe(152_000);
    expect(result.tierBreakdown).toHaveLength(2);
    expect(result.tierBreakdown[0].balanceInTier).toBe(100_000);
    expect(result.tierBreakdown[0].grossInterest).toBeCloseTo(1_000, 0);
    expect(result.tierBreakdown[1].balanceInTier).toBe(50_000);
    expect(result.tierBreakdown[1].grossInterest).toBeCloseTo(1_000, 0);
  });

  it('applies withholding tax correctly', () => {
    const result = calculateTieredDeposit({
      principal: 100_000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      tiers: [
        { minBalance: 0, maxBalance: 500_000, rate: 2.0 },
      ],
      withholdingTax: true,
    });

    expect(result.totalContributions).toBe(100_000);
    expect(result.grossInterest).toBeCloseTo(2_000, 0);
    expect(result.taxAmount).toBeCloseTo(300, 0); // 2000 * 0.15
    expect(result.netInterest).toBeCloseTo(1_700, 0); // 2000 - 300
    expect(result.endingBalance).toBe(101_700);
  });

  it('throws error for empty tiers', () => {
    expect(() => {
      calculateTieredDeposit({
        principal: 100_000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        tiers: [],
        withholdingTax: false,
      });
    }).toThrow('At least one tier must be defined');
  });

  it('throws error for invalid tier ranges', () => {
    expect(() => {
      calculateTieredDeposit({
        principal: 100_000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        tiers: [
          { minBalance: 100_000, maxBalance: 50_000, rate: 1.0 },
        ],
        withholdingTax: false,
      });
    }).toThrow('Minimum balance must be less than maximum balance');
  });
});
