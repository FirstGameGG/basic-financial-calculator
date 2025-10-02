import { z } from 'zod';

export const loanFormSchema = z.object({
  principal: z.number().positive('Principal must be greater than zero'),
  annualRatePercent: z
    .number()
    .min(0, 'Rate cannot be negative')
    .max(100, 'Rate must be 100% or lower'),
  years: z
    .number()
    .int('Years must be an integer')
    .positive('Years must be greater than zero')
    .max(60, 'Years must be 60 or fewer'),
  paymentsPerYear: z
    .number()
    .int('Payments must be an integer')
    .min(1, 'At least one payment per year')
    .max(52, 'Payments per year must be 52 or fewer'),
});

export type LoanFormValues = z.infer<typeof loanFormSchema>;
