import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '../../../../app/providers';
import type { BotDepositRateDataset, BotDepositRateRecord } from '../../../../services/bot/depositRates';
import { formatCurrency } from '../../../../utils/format';
import { FixedDepositCalculator } from '../FixedDepositCalculator';

vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: () => <div data-testid="line-chart" />,
}));

vi.mock('../../../../services/bot/depositRates', () => {
  const dataset: BotDepositRateDataset = {
    timestamp: '2025-01-02 09:00:00',
    period: '2025-01-02',
    records: [
      {
        period: '2025-01-02',
        bankType: { en: 'Commercial Banks registered in Thailand', th: 'ธนาคารพาณิชย์จดทะเบียนในประเทศ' },
        bank: { en: 'Sample Bank', th: 'ตัวอย่างธนาคาร' },
        savings: { min: 0.5, max: 0.7, average: 0.6 },
        fixed: {
          '3M': { min: 1, max: 1.2, average: 1.1 },
          '6M': { min: 1.2, max: 1.3, average: 1.25 },
          '12M': { min: 1.4, max: 1.6, average: 1.5 },
          '24M': { min: 1.8, max: 1.9, average: 1.85 },
        },
      },
    ],
  };

  return {
    getLatestBotDepositRates: vi.fn().mockResolvedValue(dataset),
    getLatestBotDate: vi.fn().mockResolvedValue({ period: dataset.period, timestamp: dataset.timestamp }),
    groupRatesByBankType: vi.fn((records: BotDepositRateRecord[]) =>
      records.map((record) => ({ bankType: record.bankType, banks: [record] })),
    ),
  };
});

describe('FixedDepositCalculator', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('computes simple interest for a single annual term', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <FixedDepositCalculator />
      </AppProviders>,
    );

    const rateSource = await screen.findByRole('combobox', { name: /Rate source/i });
    await user.click(rateSource);
    const listbox = within(await screen.findByRole('listbox'));
    const customOption = await listbox.findByRole('option', {
      name: /Custom rate/i,
    });
    await user.click(customOption);

    const principalField = screen.getByLabelText(/Initial principal/i);
    fireEvent.change(principalField, { target: { value: '200000' } });

    const customRateField = screen.getByRole('spinbutton', { name: /Annual rate/i });
    fireEvent.change(customRateField, { target: { value: '1.8' } });

    const startDateField = screen.getByLabelText(/Start date/i);
    fireEvent.change(startDateField, { target: { value: '2024-01-01' } });

    const termMonthsField = screen.getByRole('spinbutton', { name: /Term length/i });
    fireEvent.change(termMonthsField, { target: { value: '12' } });

    const termCountField = screen.getByRole('spinbutton', { name: /Number of rollovers/i });
    fireEvent.change(termCountField, { target: { value: '1' } });

    const calculateButton = screen.getByRole('button', { name: /Calculate/i });
    await user.click(calculateButton);

    const grossInterest = 200_000 * 0.018 * (365 / 366);
    const endingBalance = 200_000 + grossInterest;
    const normalize = (value: string) => value.replace(/\s/g, '');

    const grossInterestLabel = await screen.findByText(/Gross interest/i);
    const grossInterestValue = within(grossInterestLabel.parentElement as HTMLElement).getByRole(
      'heading',
      { level: 5 },
    );
    expect(normalize(grossInterestValue.textContent ?? '')).toBe(
      normalize(formatCurrency(grossInterest, 'THB')),
    );

    const endingBalanceLabel = screen.getByText(/Ending balance/i);
    const endingBalanceValue = within(endingBalanceLabel.parentElement as HTMLElement).getByRole(
      'heading',
      { level: 5 },
    );
    expect(normalize(endingBalanceValue.textContent ?? '')).toBe(
      normalize(formatCurrency(endingBalance, 'THB')),
    );
    expect(screen.getByText(/Early withdrawal penalties/)).toBeInTheDocument();
  });
});
