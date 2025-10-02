import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { computeSavingsDailyActual365 } from '../savingsActual365';

const parse = (value: string) => new Date(`${value}T00:00:00+07:00`);

const countDaysInclusive = (start: string, end: string) => {
  const startDate = parse(start);
  const endDate = parse(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
};

describe('computeSavingsDailyActual365', () => {
  it('compounds only on semiannual payout dates', () => {
    const result = computeSavingsDailyActual365({
      principalStart: 100_000,
      annualRatePct: 1,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      events: [],
      apply20kRule: true,
      overrideKeepCompounding: false,
      withholdingTax: { enabled: false, rate: 0 },
    });

    const ratePerDay = new Decimal(1).div(100).div(365);
    const firstDays = countDaysInclusive('2025-01-02', '2025-06-30');
    const secondDays = countDaysInclusive('2025-07-01', '2025-12-31');

    const principal = new Decimal(100_000);
    const grossFirst = principal.times(ratePerDay).times(firstDays);
    const netFirst = grossFirst.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const balanceAfterFirst = principal.plus(netFirst);
    const grossSecond = balanceAfterFirst.times(ratePerDay).times(secondDays);
    const netSecond = grossSecond.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const expectedEnding = balanceAfterFirst.plus(netSecond).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const expectedGrossTotal = grossFirst.plus(grossSecond).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    expect(result.payouts).toHaveLength(2);
    expect(result.payouts[0]).toMatchObject({ date: '2025-06-30' });
    expect(result.payouts[1]).toMatchObject({ date: '2025-12-31' });
    expect(result.yearSummaries[0]?.mode).toBe('CompoundAtPayout');

    expect(result.payouts[0]?.netInterest).toBeCloseTo(netFirst.toNumber(), 2);
    expect(result.payouts[0]?.balanceAfterPayout).toBeCloseTo(balanceAfterFirst.toNumber(), 2);
    expect(result.payouts[0]?.taxStatus).toBe('none');
    expect(result.payouts[0]?.interestMethod).toBe('compound');
    expect(result.payouts[0]?.thresholdCrossed).toBe(false);
    
    expect(result.payouts[1]?.netInterest).toBeCloseTo(netSecond.toNumber(), 2);
    expect(result.payouts[1]?.taxStatus).toBe('none');
    expect(result.payouts[1]?.interestMethod).toBe('compound');
    
    expect(result.endingBalance).toBeCloseTo(expectedEnding.toNumber(), 2);
    expect(result.grossInterestTotal).toBeCloseTo(expectedGrossTotal.toNumber(), 2);
  });

  it('excludes the deposit day from semiannual savings payouts', () => {
    const result = computeSavingsDailyActual365({
      principalStart: 10_000,
      annualRatePct: 2,
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      events: [],
    });

    expect(result.payouts).toHaveLength(2);

    const firstPayout = result.payouts[0];
    const secondPayout = result.payouts[1];

    expect(firstPayout).toMatchObject({ date: '2023-06-30' });
    expect(firstPayout?.netInterest).toBeCloseTo(98.63, 2);
    expect(firstPayout?.balanceAfterPayout).toBeCloseTo(10_098.63, 2);

    expect(secondPayout).toMatchObject({ date: '2023-12-31' });
    expect(secondPayout?.netInterest).toBeCloseTo(101.82, 2);
    expect(result.netInterestTotal).toBeCloseTo(200.45, 2);
    expect(result.endingBalance).toBeCloseTo(10_200.45, 2);

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]).toMatchObject({
      fromDate: '2023-01-01',
      toDate: '2023-06-29',
      days: 180,
      grossInterest: 98.63,
    });
    expect(result.steps[1]).toMatchObject({
      fromDate: '2023-06-30',
      toDate: '2023-12-30',
      days: 184,
      grossInterest: 101.82,
    });
  });

  it('includes leap day accrual in leap years', () => {
    const commonYear = computeSavingsDailyActual365({
      principalStart: 50_000,
      annualRatePct: 1,
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      events: [],
    });

    const leapYear = computeSavingsDailyActual365({
      principalStart: 50_000,
      annualRatePct: 1,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      events: [],
    });

    const dailyInterest = new Decimal(50_000).times(new Decimal(1).div(100).div(365));
    const expectedDifference = dailyInterest.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const actualDifference = new Decimal(leapYear.grossInterestTotal).minus(commonYear.grossInterestTotal);

    expect(actualDifference.toNumber()).toBeCloseTo(expectedDifference.toNumber(), 2);
  });

  it('handles deposits and withdrawals within the year', () => {
    const result = computeSavingsDailyActual365({
      principalStart: 200_000,
      annualRatePct: 2.2,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      events: [
        { date: '2025-03-15', type: 'deposit', amount: 50_000 },
        { date: '2025-09-01', type: 'withdraw', amount: 30_000 },
      ],
    });

    expect(result.totalContributions).toBeCloseTo(220_000, 2);
    expect(result.payouts).toHaveLength(2);
    expect(result.payouts[0]?.balanceAfterPayout).toBeGreaterThanOrEqual(250_000);
    expect(result.payouts[1]?.balanceAfterPayout).toBeCloseTo(result.endingBalance, 2);
    expect(result.grossInterestTotal).toBeGreaterThan(0);
  });

  it('switches to simple accrual when the 20k rule triggers', () => {
    const result = computeSavingsDailyActual365({
      principalStart: 2_000_000,
      annualRatePct: 5,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      events: [],
    });

    const ratePerDay = new Decimal(5).div(100).div(365);
    const firstDays = countDaysInclusive('2025-01-02', '2025-06-30');
    const secondDays = countDaysInclusive('2025-07-01', '2025-12-31');
    const principal = new Decimal(2_000_000);
    const grossFirst = principal.times(ratePerDay).times(firstDays);
    
    // First payout crosses 20k threshold
    // Tax so that total withheld = 15% of entire YTD gross interest
    // tax_this_payout = 0.15 * YTD_gross_after - YTD_tax_already_withheld
    // = 0.15 * grossFirst - 0 = 0.15 * grossFirst
    const taxFirst = grossFirst.times(0.15).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const netFirst = grossFirst.minus(taxFirst).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    
    // Second payout is fully taxed 15% since we're already above threshold
    const grossSecond = principal.times(ratePerDay).times(secondDays);
    const taxSecond = grossSecond.times(0.15).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const netSecond = grossSecond.minus(taxSecond).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    expect(result.yearSummaries[0]?.mode).toBe('SimpleDueTo20k');
    
    // First payout - threshold crossed
    expect(result.payouts[0]?.thresholdCrossed).toBe(true);
    expect(result.payouts[0]?.taxStatus).toBe('threshold-crossed');
    expect(result.payouts[0]?.interestMethod).toBe('simple');
    expect(result.payouts[0]?.cumulativeYtdGross).toBeCloseTo(grossFirst.toNumber(), 2);
    expect(result.payouts[0]?.remainingToThreshold).toBeCloseTo(0, 2);
    expect(result.payouts[0]?.balanceAfterPayout).toBeCloseTo(2_000_000, 2); // No compounding since threshold crossed
    
    // Second payout - above threshold
    expect(result.payouts[1]?.thresholdCrossed).toBe(false);
    expect(result.payouts[1]?.taxStatus).toBe('above-threshold');
    expect(result.payouts[1]?.interestMethod).toBe('simple');
    expect(result.payouts[1]?.balanceAfterPayout).toBeCloseTo(2_000_000, 2); // Still no compounding
    
    expect(result.withholdingTaxTotal).toBeCloseTo(taxFirst.plus(taxSecond).toNumber(), 2);
    expect(result.netInterestTotal).toBeCloseTo(netFirst.plus(netSecond).toNumber(), 2);
    expect(result.endingBalance).toBeCloseTo(principal.plus(netFirst).plus(netSecond).toNumber(), 2);
  });

  it('respects the override to keep compounding above the threshold', () => {
    const result = computeSavingsDailyActual365({
      principalStart: 2_000_000,
      annualRatePct: 5,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      events: [],
      overrideKeepCompounding: true,
    });

    expect(result.yearSummaries[0]?.mode).toBe('CompoundAtPayout');
    expect(result.payouts[0]?.balanceAfterPayout).toBeGreaterThan(2_000_000);
    expect(result.endingBalance).toBeGreaterThan(result.payouts[0]?.balanceAfterPayout ?? 0);
  });

  it('applies withholding tax at each payout', () => {
    const result = computeSavingsDailyActual365({
      principalStart: 150_000,
      annualRatePct: 1.2,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      events: [],
      withholdingTax: { enabled: true, rate: 0.15 },
    });

    expect(result.withholdingTaxTotal).toBeGreaterThan(0);
    expect(result.netInterestTotal).toBeCloseTo(result.grossInterestTotal - result.withholdingTaxTotal, 2);
    expect(result.payouts.every((payout) => payout.tax >= 0)).toBe(true);
  });

  it('provides clarity-first outputs with cumulative tracking', () => {
    const result = computeSavingsDailyActual365({
      principalStart: 1_500_000,
      annualRatePct: 3,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      events: [],
      apply20kRule: true,
    });

    expect(result.payouts).toHaveLength(2);

    const firstPayout = result.payouts[0];
    const secondPayout = result.payouts[1];

    // First payout should cross threshold
    expect(firstPayout?.thresholdCrossed).toBe(true);
    expect(firstPayout?.taxStatus).toBe('threshold-crossed');
    expect(firstPayout?.interestMethod).toBe('simple');
    expect(firstPayout?.cumulativeYtdGross).toBeGreaterThan(20_000);
    expect(firstPayout?.remainingToThreshold).toBe(0);
    expect(firstPayout?.taxableAmountThisPayout).toBeGreaterThan(0);
    expect(firstPayout?.taxWithheldThisPayout).toBeGreaterThan(0);
    expect(firstPayout?.runningYtdTax).toBe(firstPayout?.taxWithheldThisPayout);

    // Second payout should be above threshold
    expect(secondPayout?.thresholdCrossed).toBe(false);
    expect(secondPayout?.taxStatus).toBe('above-threshold');
    expect(secondPayout?.interestMethod).toBe('simple');
    expect(secondPayout?.cumulativeYtdGross).toBeGreaterThan(firstPayout?.cumulativeYtdGross ?? 0);
    expect(secondPayout?.remainingToThreshold).toBe(0);
    expect(secondPayout?.runningYtdTax).toBeGreaterThan(firstPayout?.runningYtdTax ?? 0);

    // Year summary should reflect simple mode and include closing balance
    expect(result.yearSummaries[0]?.mode).toBe('SimpleDueTo20k');
    expect(result.yearSummaries[0]?.closingBalance).toBe(result.endingBalance);
  });

  it('tracks threshold crossing with multiple years', () => {
    const result = computeSavingsDailyActual365({
      principalStart: 1_000_000,
      annualRatePct: 2.5,
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      events: [],
      apply20kRule: true,
    });

    // First year should cross threshold
    const year1Payouts = result.payouts.filter((p) => p.date.startsWith('2025'));
    expect(year1Payouts.some((p) => p.thresholdCrossed)).toBe(true);

    // Second year should start fresh - check if cumulative resets
    const year2FirstPayout = result.payouts.find((p) => p.date === '2026-06-30');
    expect(year2FirstPayout?.cumulativeYtdGross).toBeGreaterThan(0);
    // In the first payout of year 2, cumulative should equal the gross interest of that payout
    expect(year2FirstPayout?.cumulativeYtdGross).toBeCloseTo(year2FirstPayout?.grossInterest ?? 0, 2);

    expect(result.yearSummaries).toHaveLength(2);
    expect(result.yearSummaries[0]?.closingBalance).toBeGreaterThan(0);
    expect(result.yearSummaries[1]?.closingBalance).toBe(result.endingBalance);
  });

  it('shows no tax when below 20k threshold for entire year', () => {
    const result = computeSavingsDailyActual365({
      principalStart: 100_000,
      annualRatePct: 1.5,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      events: [],
      apply20kRule: true,
    });

    // All payouts should be below threshold
    expect(result.payouts.every((p) => p.taxStatus === 'none')).toBe(true);
    expect(result.payouts.every((p) => p.thresholdCrossed === false)).toBe(true);
    expect(result.payouts.every((p) => p.interestMethod === 'compound')).toBe(true);
    expect(result.payouts.every((p) => p.tax === 0)).toBe(true);
    expect(result.payouts.every((p) => p.remainingToThreshold > 0)).toBe(true);

    // Cumulative should increase but stay below 20k
    const lastPayout = result.payouts[result.payouts.length - 1];
    expect(lastPayout?.cumulativeYtdGross).toBeLessThan(20_000);

    expect(result.yearSummaries[0]?.mode).toBe('CompoundAtPayout');
    expect(result.withholdingTaxTotal).toBe(0);
  });
});
