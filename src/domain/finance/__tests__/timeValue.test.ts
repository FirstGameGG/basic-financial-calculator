import { describe, expect, it } from 'vitest';

import {
  calculateFutureValue,
  calculateNetPresentValue,
} from '../timeValue';

describe('calculateFutureValue', () => {
  it('computes growth for a single lump sum', () => {
    const result = calculateFutureValue({
      presentValue: 1000,
      annualRatePercent: 5,
      totalPeriods: 10,
      compoundingFrequency: 'annually',
      recurringContribution: 0,
      contributionTiming: 'end',
    });

    expect(result.futureValue.toNumber()).toBeCloseTo(1628.8946, 4);
    expect(result.totalInvested.toNumber()).toBeCloseTo(1000, 4);
    expect(result.totalGrowth.toNumber()).toBeCloseTo(628.8946, 4);
    expect(result.totalPeriods.toNumber()).toBeCloseTo(10, 4);
    expect(result.schedule).toHaveLength(11);
  });

  it('includes recurring contributions made at period end', () => {
    const result = calculateFutureValue({
      presentValue: 0,
      annualRatePercent: 6,
      totalPeriods: 60,
      compoundingFrequency: 'monthly',
      recurringContribution: 200,
      contributionTiming: 'end',
    });

    expect(result.futureValue.toNumber()).toBeCloseTo(13954.01, 2);
    expect(result.totalInvested.toNumber()).toBeCloseTo(12000, 2);
    expect(result.totalGrowth.toNumber()).toBeCloseTo(1954.01, 2);
    expect(result.schedule).toHaveLength(61);
  });
});

describe('calculateNetPresentValue', () => {
  it('discounts uneven cash flows', () => {
    const result = calculateNetPresentValue({
      initialInvestment: 10000,
      discountRatePercent: 8,
      periodsPerYear: 1,
      cashFlows: [3500, 4000, 4500, 4500],
    });

    expect(result.npv.toNumber()).toBeCloseTo(3549.98, 2);
    expect(result.totalCashFlow.toNumber()).toBe(3500 + 4000 + 4500 + 4500 - 10000);
    expect(result.discountedCashFlows).toHaveLength(5);
    expect(result.discountedCashFlows[0].period).toBe(0);
  });

  it('handles a zero discount rate by summing cash flows', () => {
    const result = calculateNetPresentValue({
      initialInvestment: 1000,
      discountRatePercent: 0,
      periodsPerYear: 1,
      cashFlows: [200, 200],
    });

    expect(result.ratePerPeriod.toNumber()).toBe(0);
    expect(result.npv.toNumber()).toBeCloseTo(-600, 5);
    expect(result.discountedCashFlows[0].presentValue.toNumber()).toBe(-1000);
  });
});
