import { useCallback, useEffect, useMemo, useState } from 'react';
import Decimal from 'decimal.js';

import type { LoanSummary } from '../../../domain/finance/loan';
import { calculateLoanSummary } from '../../../domain/finance/loan';
import { storage, storageKeys } from '../../../services/storage/local-storage';
import { loanFormSchema } from '../schema';
import type { LoanFormValues } from '../schema';

export type LoanResultView = {
  paymentPerPeriod: number;
  totalInterest: number;
  totalCost: number;
  currency: string;
  schedule: Array<{
    period: number;
    payment: number;
    interest: number;
    principal: number;
    balance: number;
    cumulativeInterest: number;
    cumulativePrincipal: number;
  }>;
};

const DEFAULT_VALUES: LoanFormValues = {
  principal: 250_000,
  annualRatePercent: 4.5,
  years: 30,
  paymentsPerYear: 12,
};

const mapSummaryToView = (summary: LoanSummary, currency: string): LoanResultView => {
  let cumulativeInterest = new Decimal(0);
  let cumulativePrincipal = new Decimal(0);

  const schedule = summary.schedule.map((entry) => {
    cumulativeInterest = cumulativeInterest.plus(entry.interest);
    cumulativePrincipal = cumulativePrincipal.plus(entry.principal);

    return {
      period: entry.period,
      payment: entry.payment.toNumber(),
      interest: entry.interest.toNumber(),
      principal: entry.principal.toNumber(),
      balance: entry.balance.toNumber(),
      cumulativeInterest: cumulativeInterest.toNumber(),
      cumulativePrincipal: cumulativePrincipal.toNumber(),
    };
  });

  return {
    paymentPerPeriod: summary.paymentPerPeriod.toNumber(),
    totalInterest: summary.totalInterest.toNumber(),
    totalCost: summary.totalCost.toNumber(),
    currency,
    schedule,
  };
};

const calculateSummary = (values: LoanFormValues) =>
  calculateLoanSummary({
    principal: values.principal,
    annualRatePercent: values.annualRatePercent,
    years: values.years,
    paymentsPerYear: values.paymentsPerYear,
  });

export const useLoanCalculator = () => {
  const [result, setResult] = useState<LoanResultView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedValues, setLastSubmittedValues] = useState<LoanFormValues>(DEFAULT_VALUES);
  const currency = 'THB';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(storageKeys.loanDraft);
    if (!raw) return;

    try {
      const parsed = loanFormSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        console.warn('Stored values failed validation', parsed.error);
        storage.remove(storageKeys.loanDraft);
        return;
      }

      const values = parsed.data;
      setLastSubmittedValues(values);
      // Don't auto-calculate results on mount - wait for user to click calculate button
    } catch (err) {
      console.warn('Stored values are invalid', err);
      storage.remove(storageKeys.loanDraft);
    }
  }, [currency]);

  useEffect(() => {
    setResult((prev) => (prev ? { ...prev, currency } : prev));
  }, [currency]);

  const handleCalculate = useCallback((values: LoanFormValues) => {
    try {
      const summary = calculateSummary(values);
      setResult(mapSummaryToView(summary, currency));
      setLastSubmittedValues(values);
      storage.set(storageKeys.loanDraft, values);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  }, [currency]);

  const handleReset = useCallback(() => {
    storage.remove(storageKeys.loanDraft);
    setLastSubmittedValues(DEFAULT_VALUES);
    setResult(null);
    setError(null);
  }, []);

  const hasResult = useMemo(() => Boolean(result), [result]);

  const clearError = useCallback(() => setError(null), []);

  return {
    result,
    error,
    defaultValues: lastSubmittedValues,
    hasResult,
    calculate: handleCalculate,
    reset: handleReset,
    clearError,
  };
};