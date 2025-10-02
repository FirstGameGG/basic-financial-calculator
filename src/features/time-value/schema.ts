import { z } from 'zod';

const numericField = (message: string) => z.number(message).finite(message);

export const futureValueFormSchema = z.object({
  presentValue: numericField('Enter the present value').min(0, 'Present value cannot be negative'),
  annualRatePercent: numericField('Enter the annual rate'),
  totalPeriods: numericField('Enter the number of periods')
    .int('Total periods must be an integer')
    .positive('Total periods must be greater than zero')
    .max(1000, 'Total periods must be 1000 or fewer'),
  compoundingFrequency: z.enum(['monthly', 'quarterly', 'annually']),
  recurringContribution: numericField('Enter the contribution amount').min(0, 'Contribution cannot be negative'),
  contributionTiming: z.enum(['end', 'begin']),
});

export type FutureValueFormValues = z.infer<typeof futureValueFormSchema>;

export const futureValueDefaultValues: FutureValueFormValues = {
  presentValue: 10000,
  annualRatePercent: 6,
  totalPeriods: 120,
  compoundingFrequency: 'monthly',
  recurringContribution: 200,
  contributionTiming: 'end',
};

const cashFlowSchema = z.object({
  amount: numericField('Enter a cash flow'),
});

export const netPresentValueFormSchema = z.object({
  initialInvestment: numericField('Enter the initial investment').min(0, 'Initial investment cannot be negative'),
  discountRatePercent: numericField('Enter the discount rate'),
  periodsPerYear: numericField('Enter periods per year')
    .int('Periods per year must be an integer')
    .positive('Periods per year must be greater than zero')
    .max(52, 'Periods per year must be 52 or fewer'),
  cashFlows: z.array(cashFlowSchema).min(1, 'Add at least one cash flow'),
});

export type NetPresentValueFormValues = z.infer<typeof netPresentValueFormSchema>;

export const netPresentValueDefaultValues: NetPresentValueFormValues = {
  initialInvestment: 10000,
  discountRatePercent: 8,
  periodsPerYear: 1,
  cashFlows: [{ amount: 3500 }, { amount: 4000 }, { amount: 4500 }, { amount: 4500 }],
};
