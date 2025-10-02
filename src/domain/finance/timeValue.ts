import Decimal from 'decimal.js';

export type ContributionTiming = 'end' | 'begin';
export type CompoundingFrequency = 'monthly' | 'quarterly' | 'annually';

const COMPOUNDING_FREQUENCIES: Record<CompoundingFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

export type FutureValueInput = {
  presentValue: Decimal.Value;
  annualRatePercent: Decimal.Value;
  totalPeriods: number;
  compoundingFrequency: CompoundingFrequency;
  recurringContribution?: Decimal.Value;
  contributionTiming?: ContributionTiming;
};

export type FutureValueScheduleEntry = {
  period: number;
  totalValue: Decimal;
  totalContributions: Decimal;
  interestEarned: Decimal;
};

export type FutureValueResult = {
  futureValue: Decimal;
  totalInvested: Decimal;
  totalGrowth: Decimal;
  totalPeriods: Decimal;
  periodicContribution: Decimal;
  ratePerPeriod: Decimal;
  schedule: FutureValueScheduleEntry[];
};

const validateFutureValueInput = (input: FutureValueInput) => {
  if (input.totalPeriods <= 0) {
    throw new Error('Total periods must be greater than zero');
  }

  if (!Number.isInteger(input.totalPeriods)) {
    throw new Error('Total periods must be an integer');
  }

  if (!(input.compoundingFrequency in COMPOUNDING_FREQUENCIES)) {
    throw new Error('Unsupported compounding frequency');
  }
};

const buildFutureValueSchedule = (
  params: Required<Pick<FutureValueInput, 'totalPeriods' | 'contributionTiming'>> & {
    presentValue: Decimal;
    ratePerPeriod: Decimal;
    periodicContribution: Decimal;
  }
): FutureValueScheduleEntry[] => {
  const schedule: FutureValueScheduleEntry[] = [];
  const { totalPeriods, contributionTiming, ratePerPeriod, periodicContribution } = params;
  let balance = params.presentValue;
  let invested = params.presentValue;

  schedule.push({
    period: 0,
    totalValue: balance,
    totalContributions: invested,
    interestEarned: new Decimal(0),
  });

  for (let period = 1; period <= totalPeriods; period += 1) {
    if (contributionTiming === 'begin' && !periodicContribution.isZero()) {
      balance = balance.plus(periodicContribution);
      invested = invested.plus(periodicContribution);
    }

    const interest = ratePerPeriod.isZero() ? new Decimal(0) : balance.times(ratePerPeriod);
    balance = balance.plus(interest);

    if (contributionTiming === 'end' && !periodicContribution.isZero()) {
      balance = balance.plus(periodicContribution);
      invested = invested.plus(periodicContribution);
    }

    schedule.push({
      period,
      totalValue: balance,
      totalContributions: invested,
      interestEarned: balance.minus(invested),
    });
  }

  return schedule;
};

export const calculateFutureValue = (input: FutureValueInput): FutureValueResult => {
  validateFutureValueInput(input);

  const presentValue = new Decimal(input.presentValue || 0);
  const periodsPerYear = COMPOUNDING_FREQUENCIES[input.compoundingFrequency];
  const ratePerPeriod = new Decimal(input.annualRatePercent || 0).div(100).div(periodsPerYear);
  const totalPeriodsDecimal = new Decimal(input.totalPeriods);
  const periodicContribution = new Decimal(input.recurringContribution || 0);
  const contributionTiming: ContributionTiming = input.contributionTiming ?? 'end';

  const growthFactor = ratePerPeriod.plus(1).pow(totalPeriodsDecimal);
  let futureValue = presentValue.times(growthFactor);

  if (!periodicContribution.isZero()) {
    if (ratePerPeriod.isZero()) {
      const annuityValue = periodicContribution.times(totalPeriodsDecimal);
      futureValue = futureValue.plus(annuityValue);
    } else {
      const annuityFactor = growthFactor.minus(1).div(ratePerPeriod);
      let annuityValue = periodicContribution.times(annuityFactor);

      if (contributionTiming === 'begin') {
        annuityValue = annuityValue.times(ratePerPeriod.plus(1));
      }

      futureValue = futureValue.plus(annuityValue);
    }
  }

  const schedule = buildFutureValueSchedule({
    presentValue,
    ratePerPeriod,
    periodicContribution,
    totalPeriods: input.totalPeriods,
    contributionTiming,
  });

  const totalInvested = schedule[schedule.length - 1]?.totalContributions ?? presentValue;
  const totalGrowth = futureValue.minus(totalInvested);

  return {
    futureValue,
    totalInvested,
    totalGrowth,
    totalPeriods: totalPeriodsDecimal,
    periodicContribution,
    ratePerPeriod,
    schedule,
  };
};

export type NetPresentValueInput = {
  initialInvestment: Decimal.Value;
  discountRatePercent: Decimal.Value;
  periodsPerYear: number;
  cashFlows: Decimal.Value[];
};

export type DiscountedCashFlow = {
  period: number;
  cashFlow: Decimal;
  presentValue: Decimal;
};

export type NetPresentValueResult = {
  npv: Decimal;
  ratePerPeriod: Decimal;
  discountedCashFlows: DiscountedCashFlow[];
  totalCashFlow: Decimal;
};

const validateNetPresentValueInput = (input: NetPresentValueInput) => {
  if (input.periodsPerYear <= 0) {
    throw new Error('Periods per year must be greater than zero');
  }

  if (!Number.isInteger(input.periodsPerYear)) {
    throw new Error('Periods per year must be an integer');
  }

  if (!input.cashFlows.length) {
    throw new Error('At least one cash flow is required');
  }
};

export const calculateNetPresentValue = (input: NetPresentValueInput): NetPresentValueResult => {
  validateNetPresentValueInput(input);

  const initialInvestment = new Decimal(input.initialInvestment || 0);
  const ratePerPeriod = new Decimal(input.discountRatePercent || 0)
    .div(100)
    .div(input.periodsPerYear);
  const onePlusRate = ratePerPeriod.plus(1);

  const discountedCashFlows: DiscountedCashFlow[] = [
    {
      period: 0,
      cashFlow: initialInvestment.neg(),
      presentValue: initialInvestment.neg(),
    },
  ];

  input.cashFlows.forEach((cashFlow, index) => {
    const cf = new Decimal(cashFlow);
    const period = index + 1;

    if (ratePerPeriod.isZero()) {
      discountedCashFlows.push({
        period,
        cashFlow: cf,
        presentValue: cf,
      });
      return;
    }

    const discountFactor = onePlusRate.pow(period);
    const presentValue = cf.div(discountFactor);

    discountedCashFlows.push({
      period,
      cashFlow: cf,
      presentValue,
    });
  });

  const npv = discountedCashFlows.reduce((acc, entry) => acc.plus(entry.presentValue), new Decimal(0));
  const totalCashFlow = discountedCashFlows.reduce((acc, entry) => acc.plus(entry.cashFlow), new Decimal(0));

  return {
    npv,
    ratePerPeriod,
    discountedCashFlows,
    totalCashFlow,
  };
};
