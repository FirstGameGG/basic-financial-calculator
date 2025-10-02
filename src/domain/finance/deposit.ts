import Decimal from 'decimal.js';

const BANGKOK_TIME_ZONE = 'Asia/Bangkok';
const TAX_RATE = new Decimal(0.15);
const DAYS_IN_YEAR = new Decimal(365);

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BANGKOK_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatDate = (date: Date) => dateFormatter.format(date);

const parseDate = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }

  return new Date(`${date}T00:00:00+07:00`);
};

const getDateParts = (date: Date) => {
  const parts = dateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '0');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '0');

  return { year, month, day };
};

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const addDays = (date: Date, days: number) => {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const addMonths = (date: Date, months: number) => {
  const { year, month, day } = getDateParts(date);
  const newMonthIndex = month - 1 + months;
  const newYear = year + Math.floor(newMonthIndex / 12);
  const adjustedMonth = ((newMonthIndex % 12) + 12) % 12;
  const daysInTarget = daysInMonth(newYear, adjustedMonth + 1);
  const newDay = Math.min(day, daysInTarget);
  return parseDate(`${newYear.toString().padStart(4, '0')}-${(adjustedMonth + 1)
    .toString()
    .padStart(2, '0')}-${newDay.toString().padStart(2, '0')}`);
};

const isSameDate = (a: Date, b: Date) => formatDate(a) === formatDate(b);

const isEndOfMonth = (date: Date) => {
  const { year, month, day } = getDateParts(date);
  return day === daysInMonth(year, month);
};

const isFirstDayOfMonth = (date: Date) => getDateParts(date).day === 1;

const endOfMonth = (date: Date) => {
  const { year, month } = getDateParts(date);
  const lastDay = daysInMonth(year, month);
  return parseDate(`${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${lastDay
    .toString()
    .padStart(2, '0')}`);
};

const countDaysInclusive = (start: Date, end: Date) =>
  Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const formatYear = (year: number) => year.toString().padStart(4, '0');

const calculateActualDayInterest = (
  principal: Decimal,
  annualRate: Decimal,
  start: Date,
  end: Date,
  termIndex: number,
) => {
  let interest = new Decimal(0);
  const accrualStart = termIndex === 1 ? addDays(start, 1) : new Date(start.getTime());

  if (accrualStart.getTime() > end.getTime()) {
    return interest;
  }

  let cursor = accrualStart;

  while (cursor.getTime() <= end.getTime()) {
    const { year } = getDateParts(cursor);
    const endOfYear = parseDate(`${formatYear(year)}-12-31`);
    const segmentEnd = endOfYear.getTime() < end.getTime() ? endOfYear : end;
    const days = new Decimal(countDaysInclusive(cursor, segmentEnd));
    const daysInYear = new Decimal(isLeapYear(year) ? 366 : 365);

    interest = interest.plus(principal.times(annualRate).times(days).div(daysInYear));
    cursor = addDays(segmentEnd, 1);
  }

  return interest;
};

export type SavingsAccrualMode = 'daily' | 'monthlyApprox';

export type SavingsContributionFrequency = 'none' | 'monthly';

export type SavingsContribution = {
  amount: Decimal.Value;
  frequency: SavingsContributionFrequency;
  dayOfMonth?: number;
};

export type SavingsDepositInput = {
  principal: Decimal.Value;
  annualRatePercent: Decimal.Value;
  startDate: string;
  endDate: string;
  accrualMode?: SavingsAccrualMode;
  compoundOnCredit?: boolean;
  withholdingTax?: boolean;
  contribution?: SavingsContribution;
};

export type SavingsScheduleEntry = {
  date: string;
  balance: Decimal;
  totalValue: Decimal;
  totalContributions: Decimal;
  grossInterestAccrued: Decimal;
  netInterestAccrued: Decimal;
  taxWithheld: Decimal;
  interestCredited: Decimal;
  contributionAdded: Decimal;
};

export type SavingsDepositResult = {
  totalContributions: Decimal;
  grossInterest: Decimal;
  taxAmount: Decimal;
  netInterest: Decimal;
  endingBalance: Decimal;
  schedule: SavingsScheduleEntry[];
  accrualMode: SavingsAccrualMode;
};

const validateSavingsInput = (input: SavingsDepositInput) => {
  const principal = new Decimal(input.principal || 0);
  if (principal.isNegative()) {
    throw new Error('Principal cannot be negative');
  }

  const contributionAmount = new Decimal(input.contribution?.amount ?? 0);
  if (contributionAmount.isNegative()) {
    throw new Error('Contribution cannot be negative');
  }

  const rate = new Decimal(input.annualRatePercent || 0);
  if (rate.isNegative()) {
    throw new Error('Annual rate cannot be negative');
  }

  const start = parseDate(input.startDate);
  const end = parseDate(input.endDate);
  if (start.getTime() > end.getTime()) {
    throw new Error('End date must be on or after start date');
  }

  if (input.accrualMode && !['daily', 'monthlyApprox'].includes(input.accrualMode)) {
    throw new Error('Unsupported accrual mode');
  }

  if (input.contribution?.frequency && !['none', 'monthly'].includes(input.contribution.frequency)) {
    throw new Error('Unsupported contribution frequency');
  }
};

const applySavingsCredit = (
  params: {
    balance: Decimal;
    pendingInterest: Decimal;
    netInterest: Decimal;
    taxAmount: Decimal;
  },
  options: {
    compoundOnCredit: boolean;
    withholdingTax: boolean;
  },
) => {
  const { balance, pendingInterest, netInterest, taxAmount } = params;
  const { compoundOnCredit, withholdingTax } = options;

  if (pendingInterest.isZero()) {
    return {
      balance,
      netInterest,
      taxAmount,
      creditNetInterest: new Decimal(0),
      creditTax: new Decimal(0),
    };
  }

  const tax = withholdingTax ? pendingInterest.times(TAX_RATE) : new Decimal(0);
  const net = pendingInterest.minus(tax);

  const updatedBalance = compoundOnCredit ? balance.plus(net) : balance;

  return {
    balance: updatedBalance,
    netInterest: netInterest.plus(net),
    taxAmount: taxAmount.plus(tax),
    creditNetInterest: net,
    creditTax: tax,
  };
};

const shouldContributeOnDate = (
  contribution: SavingsContribution | undefined,
  date: Date,
): boolean => {
  if (!contribution || contribution.frequency !== 'monthly') {
    return false;
  }

  const targetDay = contribution.dayOfMonth ?? 1;
  const { year, month, day } = getDateParts(date);
  const actualContributionDay = Math.min(Math.max(targetDay, 1), daysInMonth(year, month));
  return day === actualContributionDay;
};

const calculateSavingsDaily = (input: SavingsDepositInput): SavingsDepositResult => {
  const principal = new Decimal(input.principal || 0);
  const compoundOnCredit = input.compoundOnCredit !== false;
  const withholdingTax = Boolean(input.withholdingTax);
  const ratePerDay = new Decimal(input.annualRatePercent || 0).div(100).div(DAYS_IN_YEAR);
  const contributionAmount = new Decimal(input.contribution?.amount ?? 0);

  const start = parseDate(input.startDate);
  const end = parseDate(input.endDate);

  let currentDate = start;
  let balance = principal;
  let totalContributions = principal;
  let grossInterest = new Decimal(0);
  let netInterest = new Decimal(0);
  let taxAmount = new Decimal(0);
  let pendingInterest = new Decimal(0);

  const schedule: SavingsScheduleEntry[] = [
    {
      date: formatDate(start),
      balance,
      totalValue: compoundOnCredit ? balance : balance,
      totalContributions,
      grossInterestAccrued: new Decimal(0),
      netInterestAccrued: new Decimal(0),
      taxWithheld: new Decimal(0),
      interestCredited: new Decimal(0),
      contributionAdded: new Decimal(0),
    },
  ];

  while (currentDate.getTime() <= end.getTime()) {
    const interestForDay = ratePerDay.isZero() ? new Decimal(0) : balance.times(ratePerDay);
    pendingInterest = pendingInterest.plus(interestForDay);
    grossInterest = grossInterest.plus(interestForDay);

    let contributionAdded = new Decimal(0);
    if (!contributionAmount.isZero() && shouldContributeOnDate(input.contribution, currentDate)) {
      balance = balance.plus(contributionAmount);
      totalContributions = totalContributions.plus(contributionAmount);
      contributionAdded = contributionAmount;
    }

    const isCreditDate = isEndOfMonth(currentDate) || isSameDate(currentDate, end);
    if (isCreditDate) {
      const creditResult = applySavingsCredit(
        { balance, pendingInterest, netInterest, taxAmount },
        { compoundOnCredit, withholdingTax },
      );

      balance = creditResult.balance;
      netInterest = creditResult.netInterest;
      taxAmount = creditResult.taxAmount;

      const totalValue = compoundOnCredit ? balance : balance.plus(netInterest);

      schedule.push({
        date: formatDate(currentDate),
        balance,
        totalValue,
        totalContributions,
        grossInterestAccrued: grossInterest,
        netInterestAccrued: netInterest,
        taxWithheld: taxAmount,
        interestCredited: creditResult.creditNetInterest,
        contributionAdded,
      });

      pendingInterest = new Decimal(0);
    }

    currentDate = addDays(currentDate, 1);
  }

  const endingBalance = compoundOnCredit ? balance : balance.plus(netInterest);

  return {
    totalContributions,
    grossInterest,
    taxAmount,
    netInterest,
    endingBalance,
    schedule,
    accrualMode: 'daily',
  };
};

const findContributionInPeriod = (
  contribution: SavingsContribution | undefined,
  periodStart: Date,
  periodEnd: Date,
): Date | null => {
  if (!contribution || contribution.frequency !== 'monthly') {
    return null;
  }

  const { year, month } = getDateParts(periodEnd);
  const lastDay = daysInMonth(year, month);
  const targetDay = Math.min(Math.max(contribution.dayOfMonth ?? 1, 1), lastDay);
  const contributionDate = parseDate(
    `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${targetDay
      .toString()
      .padStart(2, '0')}`,
  );

  if (contributionDate.getTime() < periodStart.getTime() || contributionDate.getTime() > periodEnd.getTime()) {
    return null;
  }

  return contributionDate;
};

const calculateSavingsMonthlyApprox = (input: SavingsDepositInput): SavingsDepositResult => {
  const principal = new Decimal(input.principal || 0);
  const compoundOnCredit = input.compoundOnCredit !== false;
  const withholdingTax = Boolean(input.withholdingTax);
  const annualRate = new Decimal(input.annualRatePercent || 0).div(100);
  const contributionAmount = new Decimal(input.contribution?.amount ?? 0);

  const start = parseDate(input.startDate);
  const end = parseDate(input.endDate);

  let periodStart = start;
  let balance = principal;
  let totalContributions = principal;
  let grossInterest = new Decimal(0);
  let netInterest = new Decimal(0);
  let taxAmount = new Decimal(0);

  const schedule: SavingsScheduleEntry[] = [
    {
      date: formatDate(start),
      balance,
      totalValue: compoundOnCredit ? balance : balance,
      totalContributions,
      grossInterestAccrued: new Decimal(0),
      netInterestAccrued: new Decimal(0),
      taxWithheld: new Decimal(0),
      interestCredited: new Decimal(0),
      contributionAdded: new Decimal(0),
    },
  ];

  while (periodStart.getTime() <= end.getTime()) {
    let periodEnd = endOfMonth(periodStart);
    if (periodEnd.getTime() > end.getTime()) {
      periodEnd = end;
    }

    const daysInPeriod = countDaysInclusive(periodStart, periodEnd);
    let interestForPeriod: Decimal;
    const coversFullMonth = isFirstDayOfMonth(periodStart) && isEndOfMonth(periodEnd);

    if (annualRate.isZero()) {
      interestForPeriod = new Decimal(0);
    } else if (coversFullMonth) {
      interestForPeriod = balance.times(annualRate).div(12);
    } else {
      interestForPeriod = balance.times(annualRate).div(DAYS_IN_YEAR).times(daysInPeriod);
    }

    grossInterest = grossInterest.plus(interestForPeriod);

    const taxForPeriod = withholdingTax ? interestForPeriod.times(TAX_RATE) : new Decimal(0);
    const netForPeriod = interestForPeriod.minus(taxForPeriod);

    if (compoundOnCredit) {
      balance = balance.plus(netForPeriod);
    }

    netInterest = netInterest.plus(netForPeriod);
    taxAmount = taxAmount.plus(taxForPeriod);

    let contributionAdded = new Decimal(0);
    const contributionDate = findContributionInPeriod(input.contribution, periodStart, periodEnd);
    if (!contributionAmount.isZero() && contributionDate) {
      balance = balance.plus(contributionAmount);
      totalContributions = totalContributions.plus(contributionAmount);
      contributionAdded = contributionAmount;
    }

    const totalValue = compoundOnCredit ? balance : balance.plus(netInterest);

    schedule.push({
      date: formatDate(periodEnd),
      balance,
      totalValue,
      totalContributions,
      grossInterestAccrued: grossInterest,
      netInterestAccrued: netInterest,
      taxWithheld: taxAmount,
      interestCredited: netForPeriod,
      contributionAdded,
    });

    periodStart = addDays(periodEnd, 1);
  }

  const endingBalance = compoundOnCredit ? balance : balance.plus(netInterest);

  return {
    totalContributions,
    grossInterest,
    taxAmount,
    netInterest,
    endingBalance,
    schedule,
    accrualMode: 'monthlyApprox',
  };
};

export const calculateSavingsDeposit = (input: SavingsDepositInput): SavingsDepositResult => {
  validateSavingsInput(input);

  const mode: SavingsAccrualMode = input.accrualMode ?? 'daily';

  return mode === 'daily' ? calculateSavingsDaily(input) : calculateSavingsMonthlyApprox(input);
};

export type FixedDepositInput = {
  principal: Decimal.Value;
  annualRatePercent: Decimal.Value;
  termMonths: number;
  startDate: string;
  termCount: number;
  compoundOnRollover?: boolean;
  withholdingTax?: boolean;
};

export type FixedDepositScheduleEntry = {
  termIndex: number;
  startDate: string;
  endDate: string;
  principal: Decimal;
  grossInterest: Decimal;
  netInterest: Decimal;
  taxAmount: Decimal;
  endingBalance: Decimal;
};

export type FixedDepositResult = {
  totalContributions: Decimal;
  grossInterest: Decimal;
  taxAmount: Decimal;
  netInterest: Decimal;
  endingBalance: Decimal;
  schedule: FixedDepositScheduleEntry[];
};

const validateFixedDepositInput = (input: FixedDepositInput) => {
  const principal = new Decimal(input.principal || 0);
  if (principal.isNegative()) {
    throw new Error('Principal cannot be negative');
  }

  const rate = new Decimal(input.annualRatePercent || 0);
  if (rate.isNegative()) {
    throw new Error('Annual rate cannot be negative');
  }

  if (input.termMonths <= 0 || !Number.isInteger(input.termMonths)) {
    throw new Error('Term length must be a positive integer number of months');
  }

  if (input.termCount <= 0 || !Number.isInteger(input.termCount)) {
    throw new Error('Term count must be a positive integer');
  }

  parseDate(input.startDate);
};

export const calculateFixedDeposit = (input: FixedDepositInput): FixedDepositResult => {
  validateFixedDepositInput(input);

  const principal = new Decimal(input.principal || 0);
  const rate = new Decimal(input.annualRatePercent || 0).div(100);
  const termMonths = input.termMonths;
  const termCount = input.termCount;
  const compoundOnRollover = input.compoundOnRollover !== false;
  const withholdingTax = Boolean(input.withholdingTax);

  const schedule: FixedDepositScheduleEntry[] = [];

  let currentPrincipal = principal;
  let totalGrossInterest = new Decimal(0);
  let totalTax = new Decimal(0);
  let totalNetInterest = new Decimal(0);
  let termStart = parseDate(input.startDate);

  for (let termIndex = 1; termIndex <= termCount; termIndex += 1) {
    const termEnd = addDays(addMonths(termStart, termMonths), -1);
    const rawInterest = calculateActualDayInterest(currentPrincipal, rate, termStart, termEnd, termIndex);
    const grossInterest = rawInterest.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const tax = withholdingTax
      ? grossInterest.times(TAX_RATE).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : new Decimal(0);
    const netInterest = grossInterest.minus(tax).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    totalGrossInterest = totalGrossInterest.plus(grossInterest);
    totalTax = totalTax.plus(tax);
    totalNetInterest = totalNetInterest.plus(netInterest);

    const endingPrincipal = compoundOnRollover ? currentPrincipal.plus(netInterest) : currentPrincipal;
    const endingBalance = compoundOnRollover ? endingPrincipal : currentPrincipal.plus(totalNetInterest);

    schedule.push({
      termIndex,
      startDate: formatDate(termStart),
      endDate: formatDate(termEnd),
      principal: currentPrincipal,
      grossInterest,
      netInterest,
      taxAmount: tax,
      endingBalance,
    });

    if (compoundOnRollover) {
      currentPrincipal = endingPrincipal;
    }

    termStart = addDays(termEnd, 1);
  }

  const endingBalance = compoundOnRollover
    ? currentPrincipal
    : principal.plus(totalNetInterest);

  return {
    totalContributions: principal,
    grossInterest: totalGrossInterest,
    taxAmount: totalTax,
    netInterest: totalNetInterest,
    endingBalance,
    schedule,
  };
};

export type Tier = {
  minBalance: Decimal.Value;
  maxBalance: Decimal.Value;
  rate: Decimal.Value;
};

export type TieredDepositInput = {
  principal: Decimal.Value;
  startDate: string;
  endDate: string;
  tiers: Tier[];
  withholdingTax?: boolean;
};

export type TieredDepositResult = {
  totalContributions: number;
  grossInterest: number;
  taxAmount: number;
  netInterest: number;
  endingBalance: number;
  tierBreakdown: {
    tierIndex: number;
    minBalance: number;
    maxBalance: number;
    rate: number;
    balanceInTier: number;
    grossInterest: number;
  }[];
};

const validateTieredDepositInput = (input: TieredDepositInput) => {
  const principal = new Decimal(input.principal || 0);
  if (principal.isNegative()) {
    throw new Error('Principal cannot be negative');
  }

  const start = parseDate(input.startDate);
  const end = parseDate(input.endDate);
  if (start.getTime() > end.getTime()) {
    throw new Error('End date must be on or after start date');
  }

  if (input.tiers.length === 0) {
    throw new Error('At least one tier must be defined');
  }

  // Validate tiers
  input.tiers.forEach((tier, index) => {
    const minBalance = new Decimal(tier.minBalance);
    const maxBalance = new Decimal(tier.maxBalance);
    const rate = new Decimal(tier.rate);

    if (minBalance.isNegative() || maxBalance.isNegative()) {
      throw new Error(`Tier ${index + 1}: Balance ranges cannot be negative`);
    }

    if (minBalance.greaterThanOrEqualTo(maxBalance)) {
      throw new Error(`Tier ${index + 1}: Minimum balance must be less than maximum balance`);
    }

    if (rate.isNegative()) {
      throw new Error(`Tier ${index + 1}: Rate cannot be negative`);
    }
  });
};

export const calculateTieredDeposit = (input: TieredDepositInput): TieredDepositResult => {
  validateTieredDepositInput(input);

  const principal = new Decimal(input.principal || 0);
  const withholdingTax = Boolean(input.withholdingTax);
  const start = parseDate(input.startDate);
  const end = parseDate(input.endDate);
  const accrualDays = Math.max(countDaysInclusive(start, end) - 1, 0);
  const dayCount = new Decimal(accrualDays);

  let totalGrossInterest = new Decimal(0);
  const tierBreakdown: TieredDepositResult['tierBreakdown'] = [];

  // Sort tiers by minBalance to ensure proper calculation
  const sortedTiers = [...input.tiers].sort((a, b) =>
    new Decimal(a.minBalance).comparedTo(new Decimal(b.minBalance))
  );

  // Calculate interest for each tier
  sortedTiers.forEach((tier, index) => {
    const minBalance = new Decimal(tier.minBalance);
    const maxBalance = new Decimal(tier.maxBalance);
    const rate = new Decimal(tier.rate).div(100); // Convert percentage to decimal

    // Determine how much of the principal falls into this tier
    let balanceInTier: Decimal;
    if (principal.lessThanOrEqualTo(minBalance)) {
      balanceInTier = new Decimal(0);
    } else if (principal.lessThanOrEqualTo(maxBalance)) {
      balanceInTier = principal.minus(minBalance);
    } else {
      balanceInTier = maxBalance.minus(minBalance);
    }

    // Calculate interest for this tier portion
    const grossInterestForTier = dayCount.isZero()
      ? new Decimal(0)
      : balanceInTier.times(rate).times(dayCount).div(DAYS_IN_YEAR);
    totalGrossInterest = totalGrossInterest.plus(grossInterestForTier);

    tierBreakdown.push({
      tierIndex: index,
      minBalance: minBalance.toNumber(),
      maxBalance: maxBalance.toNumber(),
      rate: new Decimal(tier.rate).toNumber(),
      balanceInTier: balanceInTier.toNumber(),
      grossInterest: grossInterestForTier.toNumber(),
    });
  });

  // Apply withholding tax
  const taxAmount = withholdingTax
    ? totalGrossInterest.times(TAX_RATE).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : new Decimal(0);
  const netInterest = totalGrossInterest.minus(taxAmount);
  const endingBalance = principal.plus(netInterest);

  return {
    totalContributions: principal.toNumber(),
    grossInterest: totalGrossInterest.toNumber(),
    taxAmount: taxAmount.toNumber(),
    netInterest: netInterest.toNumber(),
    endingBalance: endingBalance.toNumber(),
    tierBreakdown,
  };
};
