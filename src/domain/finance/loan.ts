import Decimal from 'decimal.js';

export type LoanInput = {
  principal: Decimal.Value;
  annualRatePercent: Decimal.Value;
  years: number;
  paymentsPerYear: number;
};

export type LoanAmortizationEntry = {
  period: number;
  payment: Decimal;
  interest: Decimal;
  principal: Decimal;
  balance: Decimal;
};

export type LoanSummary = {
  paymentPerPeriod: Decimal;
  totalInterest: Decimal;
  totalCost: Decimal;
  schedule: LoanAmortizationEntry[];
};

const validateInput = (input: LoanInput) => {
  if (new Decimal(input.principal).lte(0)) {
    throw new Error('Principal must be greater than zero');
  }

  if (input.years <= 0) {
    throw new Error('Years must be greater than zero');
  }

  if (!Number.isFinite(input.years)) {
    throw new Error('Years must be a finite number');
  }

  if (input.paymentsPerYear <= 0) {
    throw new Error('Payments per year must be greater than zero');
  }

  if (!Number.isInteger(input.paymentsPerYear)) {
    throw new Error('Payments per year must be an integer');
  }
};

export const calculateRatePerPeriod = (input: LoanInput): Decimal => {
  validateInput(input);
  return new Decimal(input.annualRatePercent).div(100).div(input.paymentsPerYear);
};

export const calculateNumberOfPayments = (input: LoanInput): Decimal => {
  validateInput(input);
  return new Decimal(input.years).times(input.paymentsPerYear);
};

export const calculatePaymentPerPeriod = (input: LoanInput): Decimal => {
  validateInput(input);
  const principal = new Decimal(input.principal);
  const ratePerPeriod = calculateRatePerPeriod(input);
  const totalPayments = calculateNumberOfPayments(input);

  if (ratePerPeriod.isZero()) {
    return principal.div(totalPayments);
  }

  const numerator = principal.times(ratePerPeriod);
  const denominator = new Decimal(1).minus(
    new Decimal(1).plus(ratePerPeriod).pow(totalPayments.neg())
  );

  return numerator.div(denominator);
};

export const buildAmortizationSchedule = (input: LoanInput): LoanAmortizationEntry[] => {
  validateInput(input);
  const principal = new Decimal(input.principal);
  const ratePerPeriod = calculateRatePerPeriod(input);
  const payment = calculatePaymentPerPeriod(input);
  const totalPayments = calculateNumberOfPayments(input).toNumber();

  const schedule: LoanAmortizationEntry[] = [];
  let balance = principal;

  for (let period = 1; period <= totalPayments; period += 1) {
    const interestPayment = ratePerPeriod.isZero() ? new Decimal(0) : balance.times(ratePerPeriod);
    let principalPayment = payment.minus(interestPayment);

    if (principalPayment.greaterThan(balance)) {
      principalPayment = balance;
    }

    balance = balance.minus(principalPayment);

    schedule.push({
      period,
      payment,
      interest: interestPayment,
      principal: principalPayment,
      balance: Decimal.max(balance, 0),
    });
  }

  return schedule;
};

export const calculateLoanSummary = (input: LoanInput): LoanSummary => {
  const schedule = buildAmortizationSchedule(input);
  const paymentPerPeriod = calculatePaymentPerPeriod(input);

  const totalInterest = schedule.reduce((acc, entry) => acc.plus(entry.interest), new Decimal(0));
  const totalCost = paymentPerPeriod.times(schedule.length);

  return {
    paymentPerPeriod,
    totalInterest,
    totalCost,
    schedule,
  };
};
