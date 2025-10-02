import Decimal from 'decimal.js';

type TimelineEventType = 'deposit' | 'withdraw';

export type SavingsTimelineEvent = {
  date: string;
  type: TimelineEventType;
  amount: number;
};

export type WithholdingTaxConfig = {
  enabled: boolean;
  rate: number;
};

export type SavingsCalculatorInput = {
  principalStart: number;
  annualRatePct: number;
  startDate: string;
  endDate: string;
  events?: SavingsTimelineEvent[];
  apply20kRule?: boolean;
  overrideKeepCompounding?: boolean;
  withholdingTax?: WithholdingTaxConfig;
  timezone?: 'Asia/Bangkok';
};

export type SavingsPayout = {
  date: string;
  grossInterest: number;
  tax: number;
  netInterest: number;
  balanceAfterPayout: number;
  // Clarity-first outputs
  cumulativeYtdGross: number;
  remainingToThreshold: number;
  thresholdCrossed: boolean;
  taxStatus: 'none' | 'threshold-crossed' | 'above-threshold';
  interestMethod: 'compound' | 'simple';
  // Advanced details (optional display)
  taxableAmountThisPayout?: number;
  taxWithheldThisPayout?: number;
  runningYtdTax?: number;
};

export type SavingsYearSummary = {
  year: number;
  mode: 'CompoundAtPayout' | 'SimpleDueTo20k';
  grossInterest: number;
  tax: number;
  netInterest: number;
  closingBalance: number;
};

export type SavingsStep = {
  fromDate: string;
  toDate: string;
  days: number;
  principal: number;
  grossInterest: number;
};

export type SavingsCalculatorResult = {
  endingBalance: number;
  totalContributions: number;
  grossInterestTotal: number;
  withholdingTaxTotal: number;
  netInterestTotal: number;
  payouts: SavingsPayout[];
  yearSummaries: SavingsYearSummary[];
  steps: SavingsStep[];
};

const DEFAULT_TIME_ZONE = 'Asia/Bangkok';
const DAYS_IN_YEAR = new Decimal(365);
const TWENTY_K_THRESHOLD = new Decimal(20_000);

const formatDate = (date: Date) => {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseDate = (value: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }

  const [yearString, monthString, dayString] = value.split('-');
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;
  const day = Number(dayString);

  const date = new Date(Date.UTC(year, monthIndex, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const compareDates = (a: Date, b: Date) => {
  const diff = a.getTime() - b.getTime();
  if (diff === 0) return 0;
  return diff > 0 ? 1 : -1;
};

const isSameDay = (a: Date, b: Date) => compareDates(a, b) === 0;

const startOfYear = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

const endOfYear = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), 11, 31));

const isPayoutDate = (date: Date) => {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return (month === 6 && day === 30) || (month === 12 && day === 31);
};

const getUtcMonthDay = (date: Date) => ({
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
});

const isSemiannualAccrualDay = (date: Date) => {
  const { month, day } = getUtcMonthDay(date);
  if (month < 6) return true;
  if (month === 6) return day <= 30;
  if (month < 12) return true;
  if (month === 12) return day <= 30;
  return false;
};

const roundMoney = (value: Decimal) => value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

type ProcessedEvent = {
  date: Date;
  type: TimelineEventType;
  amount: Decimal;
};

type YearMode = 'CompoundAtPayout' | 'SimpleDueTo20k';

type YearContext = {
  mode: YearMode;
  gross: Decimal;
  tax: Decimal;
  netPendingCredit: Decimal;
  cumulativeGrossInterest: Decimal; // Track cumulative interest for the year
};

// No longer need to estimate year interest in advance - we'll determine mode dynamically at each payout

const buildSteps = (
  steps: SavingsStep[],
  periodStart: Date,
  periodEnd: Date,
  principal: Decimal,
  grossInterest: Decimal,
) => {
  if (periodStart.getTime() > periodEnd.getTime()) {
    return;
  }

  const millisPerDay = 24 * 60 * 60 * 1000;
  const days = Math.round((periodEnd.getTime() - periodStart.getTime()) / millisPerDay) + 1;

  steps.push({
    fromDate: formatDate(periodStart),
    toDate: formatDate(periodEnd),
    days: Math.max(days, 1),
    principal: roundMoney(principal).toNumber(),
    grossInterest: roundMoney(grossInterest).toNumber(),
  });
};

export const computeSavingsDailyActual365 = (input: SavingsCalculatorInput): SavingsCalculatorResult => {
  const {
    principalStart,
    annualRatePct,
    startDate: startDateInput,
    endDate: endDateInput,
    events: rawEvents = [],
    apply20kRule = true,
    overrideKeepCompounding = false,
    withholdingTax = { enabled: false, rate: 0 },
    timezone = DEFAULT_TIME_ZONE,
  } = input;

  if (timezone !== DEFAULT_TIME_ZONE) {
    throw new Error('Only Asia/Bangkok timezone is supported');
  }

  const principal = new Decimal(principalStart);
  if (principal.isNegative()) {
    throw new Error('Starting principal cannot be negative');
  }

  const ratePercent = new Decimal(annualRatePct);
  if (ratePercent.isNegative()) {
    throw new Error('Annual rate cannot be negative');
  }

  const startDate = parseDate(startDateInput);
  const endDate = parseDate(endDateInput);

  if (startDate.getTime() > endDate.getTime()) {
    throw new Error('End date must be on or after start date');
  }

  const processedEvents: ProcessedEvent[] = rawEvents
    .map((event) => {
      const amount = new Decimal(event.amount);
      if (!Number.isFinite(event.amount)) {
        throw new Error('Event amount must be a finite number');
      }
      if (amount.lte(0)) {
        throw new Error('Event amount must be positive');
      }
      const date = parseDate(event.date);
      if (compareDates(date, startDate) < 0 || compareDates(date, endDate) > 0) {
        throw new Error('Event date must be within the calculation range');
      }
      if (event.type !== 'deposit' && event.type !== 'withdraw') {
        throw new Error('Event type must be deposit or withdraw');
      }
      return { date, type: event.type, amount } satisfies ProcessedEvent;
    })
    .sort((a, b) => {
      const cmp = compareDates(a.date, b.date);
      if (cmp !== 0) return cmp;
      if (a.type === b.type) return 0;
      return a.type === 'deposit' ? -1 : 1;
    });

  for (let i = 1; i < processedEvents.length; i += 1) {
    const prev = processedEvents[i - 1];
    const current = processedEvents[i];
    if (compareDates(prev.date, current.date) === 0 && prev.type === 'withdraw' && current.type === 'deposit') {
      throw new Error('Deposits must be applied before withdrawals on the same day');
    }
  }

  const ratePerDay = ratePercent.div(100).div(DAYS_IN_YEAR);
  const taxRate = withholdingTax.enabled ? new Decimal(withholdingTax.rate) : new Decimal(0);

  if (withholdingTax.enabled && taxRate.lessThan(0)) {
    throw new Error('Withholding tax rate cannot be negative');
  }

  const payouts: SavingsPayout[] = [];
  const yearSummaries: SavingsYearSummary[] = [];
  const steps: SavingsStep[] = [];

  let balance = principal;
  let totalContributions = principal;
  let totalGrossInterest = new Decimal(0);
  let totalTax = new Decimal(0);

  let currentDate = new Date(startDate.getTime());
  let pendingInterest = new Decimal(0);
  let eventIndex = 0;

  let currentYear = currentDate.getUTCFullYear();
  let yearEnd = endOfYear(currentDate);
  if (yearEnd.getTime() > endDate.getTime()) {
    yearEnd = new Date(endDate.getTime());
  }

  let yearContext: YearContext = {
    mode: 'CompoundAtPayout', // Start with compound mode, will switch dynamically if threshold is crossed
    gross: new Decimal(0),
    tax: new Decimal(0),
    netPendingCredit: new Decimal(0),
    cumulativeGrossInterest: new Decimal(0),
  };

  let periodStart = new Date(currentDate.getTime());
  let periodInterest = new Decimal(0);
  let periodPrincipalSnapshot = balance;
  let lastProcessedDate = new Date(currentDate.getTime());

  const applyEvent = (event: ProcessedEvent) => {
    if (event.type === 'deposit') {
      balance = balance.plus(event.amount);
      totalContributions = totalContributions.plus(event.amount);
    } else {
      balance = balance.minus(event.amount);
      totalContributions = totalContributions.minus(event.amount);
      if (balance.isNegative()) {
        throw new Error('Withdrawal events cannot reduce balance below zero');
      }
    }
  };

  const finalizePayout = (creditDate: Date, accrualEndDate: Date) => {
    const grossRounded = roundMoney(pendingInterest);
    
    // Update cumulative gross interest for the year
    const previousCumulative = yearContext.cumulativeGrossInterest;
    const newCumulative = previousCumulative.plus(grossRounded);
    yearContext.cumulativeGrossInterest = newCumulative;
    
    let taxRounded = new Decimal(0);
    let netRounded = grossRounded;
    let taxableAmount = new Decimal(0);
    
    // Determine if we need to apply tax based on cumulative interest or explicit config
    let shouldCompound = true;
    let taxStatus: 'none' | 'threshold-crossed' | 'above-threshold' = 'none';
    let thresholdCrossed = false;
    
    if (!taxRate.isZero()) {
      // Explicit withholding tax enabled - always apply it
      taxableAmount = grossRounded;
      taxRounded = roundMoney(grossRounded.times(taxRate));
      netRounded = grossRounded.minus(taxRounded);
      // Compound unless overridden by 20k rule below
    }
    
    if (apply20kRule && !overrideKeepCompounding) {
      if (previousCumulative.lessThanOrEqualTo(TWENTY_K_THRESHOLD) && newCumulative.greaterThan(TWENTY_K_THRESHOLD)) {
        // Just crossed the threshold
        // Withhold so that total withheld equals 15% of the entire YTD gross interest
        // Formula: tax_this_payout = 0.15 * YTD_gross_after - YTD_tax_already_withheld
        thresholdCrossed = true;
        taxStatus = 'threshold-crossed';
        if (taxRate.isZero()) {
          const targetTotalTax = newCumulative.times(0.15);
          const taxThisPayout = targetTotalTax.minus(yearContext.tax);
          taxableAmount = newCumulative; // For display purposes, show entire YTD as taxable base
          taxRounded = roundMoney(taxThisPayout);
          netRounded = grossRounded.minus(taxRounded);
        }
        
        // Switch to simple interest mode for rest of year
        yearContext.mode = 'SimpleDueTo20k';
        shouldCompound = false;
      } else if (previousCumulative.greaterThan(TWENTY_K_THRESHOLD)) {
        // Already above threshold - apply 15% tax on full gross amount
        taxStatus = 'above-threshold';
        if (taxRate.isZero()) {
          taxableAmount = grossRounded;
          taxRounded = roundMoney(grossRounded.times(0.15));
          netRounded = grossRounded.minus(taxRounded);
        }
        yearContext.mode = 'SimpleDueTo20k';
        shouldCompound = false;
      } else {
        // Still below threshold - no additional tax beyond explicit config
        taxStatus = 'none';
        yearContext.mode = 'CompoundAtPayout';
        shouldCompound = true;
      }
    }

    if (periodStart.getTime() <= accrualEndDate.getTime()) {
      buildSteps(steps, periodStart, accrualEndDate, periodPrincipalSnapshot, periodInterest);
    }

    // Apply interest based on compounding decision
    if (shouldCompound) {
      balance = balance.plus(netRounded);
    } else {
      yearContext.netPendingCredit = yearContext.netPendingCredit.plus(netRounded);
    }

    totalTax = totalTax.plus(taxRounded);
    yearContext.tax = yearContext.tax.plus(taxRounded);
    yearContext.gross = yearContext.gross.plus(grossRounded);

    // Calculate remaining to threshold
    const remainingToThreshold = newCumulative.lessThan(TWENTY_K_THRESHOLD)
      ? TWENTY_K_THRESHOLD.minus(newCumulative)
      : new Decimal(0);

    payouts.push({
      date: formatDate(creditDate),
      grossInterest: grossRounded.toNumber(),
      tax: taxRounded.toNumber(),
      netInterest: netRounded.toNumber(),
      balanceAfterPayout: roundMoney(balance).toNumber(),
      cumulativeYtdGross: roundMoney(newCumulative).toNumber(),
      remainingToThreshold: roundMoney(remainingToThreshold).toNumber(),
      thresholdCrossed,
      taxStatus,
      interestMethod: shouldCompound ? 'compound' : 'simple',
      taxableAmountThisPayout: roundMoney(taxableAmount).toNumber(),
      taxWithheldThisPayout: taxRounded.toNumber(),
      runningYtdTax: roundMoney(yearContext.tax).toNumber(),
    });

    pendingInterest = new Decimal(0);
    periodInterest = new Decimal(0);
    periodStart = addDays(accrualEndDate, 1);
    periodPrincipalSnapshot = balance;
  };

  const finalizeYear = (date: Date) => {
    if (yearContext.mode === 'SimpleDueTo20k') {
      balance = balance.plus(yearContext.netPendingCredit);
      yearContext.netPendingCredit = new Decimal(0);
    }

    const grossRounded = roundMoney(yearContext.gross);
    const taxRounded = roundMoney(yearContext.tax);

    yearSummaries.push({
      year: currentYear,
      mode: yearContext.mode,
      grossInterest: grossRounded.toNumber(),
      tax: taxRounded.toNumber(),
      netInterest: roundMoney(grossRounded.minus(taxRounded)).toNumber(),
      closingBalance: roundMoney(balance).toNumber(),
    });

    currentYear += 1;

    if (currentYear <= endDate.getUTCFullYear()) {
      const yearStart = startOfYear(date);
      let yearRangeEnd = endOfYear(yearStart);
      if (yearRangeEnd.getTime() > endDate.getTime()) {
        yearRangeEnd = new Date(endDate.getTime());
      }

      yearContext = {
        mode: 'CompoundAtPayout', // Start each new year in compound mode
        gross: new Decimal(0),
        tax: new Decimal(0),
        netPendingCredit: new Decimal(0),
        cumulativeGrossInterest: new Decimal(0),
      };
      yearEnd = yearRangeEnd;
    }
  };

  while (currentDate.getTime() <= endDate.getTime()) {
    while (eventIndex < processedEvents.length && isSameDay(processedEvents[eventIndex].date, currentDate)) {
      buildSteps(steps, periodStart, addDays(currentDate, -1), periodPrincipalSnapshot, periodInterest);
      periodStart = new Date(currentDate.getTime());
      periodInterest = new Decimal(0);

      applyEvent(processedEvents[eventIndex]);
      periodPrincipalSnapshot = balance;
      eventIndex += 1;
    }

    const isPayoutToday =
      isPayoutDate(currentDate) &&
      compareDates(currentDate, startDate) >= 0 &&
      compareDates(currentDate, endDate) <= 0;

    if (isPayoutToday && (pendingInterest.greaterThan(0) || periodStart.getTime() < currentDate.getTime())) {
      const accrualEndDate = addDays(currentDate, -1);
      finalizePayout(currentDate, accrualEndDate);
    }

    const shouldAccrueInterest =
      !ratePerDay.isZero() &&
      isSemiannualAccrualDay(currentDate) &&
      compareDates(currentDate, endDate) <= 0;

    const interestForDay = shouldAccrueInterest ? balance.times(ratePerDay) : new Decimal(0);
    pendingInterest = pendingInterest.plus(interestForDay);
    totalGrossInterest = totalGrossInterest.plus(interestForDay);
    periodInterest = periodInterest.plus(interestForDay);

    const isLastDayOfYear = isSameDay(currentDate, endOfYear(currentDate));
    if (isLastDayOfYear || isSameDay(currentDate, endDate)) {
      finalizeYear(currentDate);
    }

    lastProcessedDate = new Date(currentDate.getTime());
    currentDate = addDays(currentDate, 1);
  }

  if (periodInterest.greaterThan(0)) {
    buildSteps(steps, periodStart, lastProcessedDate, periodPrincipalSnapshot, periodInterest);
  }

  const remainingGross = roundMoney(totalGrossInterest);
  const taxRounded = roundMoney(totalTax);
  const netTotalRounded = roundMoney(remainingGross.minus(taxRounded));

  return {
    endingBalance: roundMoney(balance).toNumber(),
    totalContributions: roundMoney(totalContributions).toNumber(),
    grossInterestTotal: remainingGross.toNumber(),
    withholdingTaxTotal: taxRounded.toNumber(),
    netInterestTotal: netTotalRounded.toNumber(),
    payouts,
    yearSummaries,
    steps,
  };
};
