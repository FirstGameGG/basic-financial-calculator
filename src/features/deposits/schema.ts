import { z } from 'zod';

export const rateSourceSchema = z.enum(['bot', 'custom']);
const datePattern = /\d{4}-\d{2}-\d{2}/;

const savingsEventSchema = z.object({
  date: z.string('validation.required').regex(datePattern, {
      message: 'validation.dateFormat',
  }),
  type: z.enum(['deposit', 'withdraw']),
  amount: z.number('validation.required').positive({ message: 'validation.positive' }),
});

export const savingsFormSchema = z
  .object({
    principal: z.number('validation.required').nonnegative({ message: 'validation.nonNegative' }),
    startDate: z.string('validation.required').regex(datePattern, {
      message: 'validation.dateFormat',
    }),
    endDate: z.string('validation.required').regex(datePattern, {
      message: 'validation.dateFormat',
    }),
    rateSource: rateSourceSchema,
    customAnnualRate: z.number().nonnegative({ message: 'validation.nonNegative' }).optional(),
    botSelection: z
      .object({
        bankKey: z.string(),
        rateType: z.enum(['min', 'average', 'max']),
      })
      .optional(),
    events: z.array(savingsEventSchema),
  })
  .superRefine((data, ctx) => {
    const start = new Date(`${data.startDate}T00:00:00+07:00`).getTime();
    const end = new Date(`${data.endDate}T00:00:00+07:00`).getTime();

    if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.endDateAfterStart',
        path: ['endDate'],
      });
    }

    if (data.rateSource === 'custom' && (data.customAnnualRate == null || Number.isNaN(data.customAnnualRate))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.required',
        path: ['customAnnualRate'],
      });
    }

    if (data.rateSource === 'bot' && !data.botSelection) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.required',
        path: ['botSelection'],
      });
    }

    let lastDateValue = -Infinity;
    let lastType: 'deposit' | 'withdraw' | null = null;

    data.events.forEach((event, index) => {
      const eventTime = new Date(`${event.date}T00:00:00+07:00`).getTime();
      if (!Number.isFinite(eventTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'validation.dateFormat',
          path: ['events', index, 'date'],
        });
        return;
      }

      if (eventTime < start || eventTime > end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'deposits.validation.eventOutOfRange',
          path: ['events', index, 'date'],
        });
      }

      if (eventTime < lastDateValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'deposits.validation.eventsChronological',
          path: ['events', index, 'date'],
        });
      }

      if (eventTime === lastDateValue && lastType === 'withdraw' && event.type === 'deposit') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'deposits.validation.depositBeforeWithdraw',
          path: ['events', index, 'type'],
        });
      }

      lastDateValue = eventTime;
      lastType = event.type;
    });
  });

export type SavingsFormValues = z.infer<typeof savingsFormSchema>;

export const fixedDepositFormSchema = z
  .object({
    principal: z.number('validation.required').nonnegative({ message: 'validation.nonNegative' }),
    startDate: z.string('validation.required').regex(/\d{4}-\d{2}-\d{2}/, {
      message: 'validation.dateFormat',
    }),
    rateSource: rateSourceSchema,
    customAnnualRate: z.number().nonnegative({ message: 'validation.nonNegative' }).optional(),
    botSelection: z
      .object({
        bankKey: z.string(),
        rateType: z.enum(['min', 'average', 'max']),
        term: z.enum(['3M', '6M', '12M', '24M']),
      })
      .optional(),
    termMonths: z.number().int({ message: 'validation.integer' }).positive({ message: 'validation.positive' }),
    termCount: z.number().int({ message: 'validation.integer' }).positive({ message: 'validation.positive' }),
    compoundOnRollover: z.boolean(),
    withholdingTax: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.rateSource === 'custom' && (data.customAnnualRate == null || Number.isNaN(data.customAnnualRate))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.required',
        path: ['customAnnualRate'],
      });
    }

    if (data.rateSource === 'bot' && !data.botSelection) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.required',
        path: ['botSelection'],
      });
    }
  });

export type FixedDepositFormValues = z.infer<typeof fixedDepositFormSchema>;

export const savingsDefaultValues: SavingsFormValues = {
  principal: 100_000,
  startDate: '',
  endDate: '',
  rateSource: 'bot',
  customAnnualRate: undefined,
  botSelection: undefined,
  events: [],
};

export const fixedDepositDefaultValues: FixedDepositFormValues = {
  principal: 100_000,
  startDate: '',
  rateSource: 'bot',
  customAnnualRate: undefined,
  botSelection: undefined,
  termMonths: 12,
  termCount: 1,
  compoundOnRollover: true,
  withholdingTax: false,
};

const tierSchema = z.object({
  minBalance: z.number('validation.required').nonnegative({ message: 'validation.nonNegative' }),
  maxBalance: z.number('validation.required').positive({ message: 'validation.positive' }),
  rate: z.number('validation.required').nonnegative({ message: 'validation.nonNegative' }),
});

export const tieredDepositFormSchema = z
  .object({
    principal: z.number('validation.required').nonnegative({ message: 'validation.nonNegative' }),
    startDate: z.string('validation.required').regex(datePattern, {
      message: 'validation.dateFormat',
    }),
    endDate: z.string('validation.required').regex(datePattern, {
      message: 'validation.dateFormat',
    }),
    tiers: z.array(tierSchema).min(1, { message: 'deposits.tiered.validation.atLeastOneTier' }),
    withholdingTax: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(`${data.startDate}T00:00:00+07:00`).getTime();
    const end = new Date(`${data.endDate}T00:00:00+07:00`).getTime();

    if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'validation.endDateAfterStart',
        path: ['endDate'],
      });
    }

    // Validate tier ranges
    for (let i = 0; i < data.tiers.length; i += 1) {
      const tier = data.tiers[i];
      if (tier.minBalance >= tier.maxBalance) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'deposits.tiered.validation.minLessThanMax',
          path: ['tiers', i, 'minBalance'],
        });
      }

      // Check for overlapping ranges
      for (let j = i + 1; j < data.tiers.length; j += 1) {
        const otherTier = data.tiers[j];
        if (
          (tier.minBalance < otherTier.maxBalance && tier.maxBalance > otherTier.minBalance) ||
          (otherTier.minBalance < tier.maxBalance && otherTier.maxBalance > tier.minBalance)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'deposits.tiered.validation.overlappingRanges',
            path: ['tiers', i, 'minBalance'],
          });
          break;
        }
      }
    }
  });

export type TieredDepositFormValues = z.infer<typeof tieredDepositFormSchema>;

export const tieredDepositDefaultValues: TieredDepositFormValues = {
  principal: 100_000,
  startDate: '',
  endDate: '',
  tiers: [
    { minBalance: 0, maxBalance: 50000, rate: 0.5 },
    { minBalance: 50000, maxBalance: 100000, rate: 1.0 },
    { minBalance: 100000, maxBalance: 500000, rate: 1.5 },
  ],
  withholdingTax: false,
};
