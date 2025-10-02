import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '../../../../app/providers';
import { formatCurrency } from '../../../../utils/format';
import { SavingsDepositCalculator } from '../SavingsDepositCalculator';

vi.mock('../../../../services/bot/depositRates', () => {
  const dataset = {
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
    groupRatesByBankType: vi.fn((records) =>
      records.map((record) => ({ bankType: record.bankType, banks: [record] })),
    ),
  };
});

describe('SavingsDepositCalculator', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('calculates savings growth with a custom rate and empty events', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <SavingsDepositCalculator />
      </AppProviders>,
    );

    // Switch to custom rate mode
    const rateSource = await screen.findByRole('combobox', { name: /Rate source/i });
    await user.click(rateSource);
    const listbox = within(await screen.findByRole('listbox'));
    const customOption = await listbox.findByRole('option', {
      name: /Custom rate/i,
    });
    await user.click(customOption);

    const principalField = screen.getByLabelText(/Initial principal/i);
    fireEvent.change(principalField, { target: { value: '100000' } });

    const customRateField = screen.getByRole('spinbutton', { name: /Annual rate/i });
    fireEvent.change(customRateField, { target: { value: '1.5' } });

    const startDateField = screen.getByLabelText(/Start date/i);
    fireEvent.change(startDateField, { target: { value: '2025-01-01' } });

    const endDateField = screen.getByLabelText(/End date/i);
    fireEvent.change(endDateField, { target: { value: '2025-01-31' } });

    const calculateButton = screen.getByRole('button', { name: /Calculate/i });
    await user.click(calculateButton);

    const expectedInterest = (100_000 * 0.015) / 365 * 31;
    const expectedNet = formatCurrency(expectedInterest, 'THB');
    const expectedEnding = formatCurrency(100_000, 'THB');

    const netInterestLabel = await screen.findByText(/Net interest/i);
    const netInterestValue = within(netInterestLabel.closest('div') as HTMLElement).getByRole('heading', {
      level: 5,
    });
    expect(netInterestValue.textContent?.replace(/\s/g, '')).toBe(expectedNet.replace(/\s/g, ''));

    const endingBalanceLabel = screen.getByText(/Ending balance/i);
    const endingBalanceValue = within(endingBalanceLabel.closest('div') as HTMLElement).getByRole('heading', {
      level: 5,
    });
    expect(endingBalanceValue.textContent?.replace(/\s/g, '')).toBe(expectedEnding.replace(/\s/g, ''));

    const totalContributionsLabel = screen.getByText(/Total contributions/i);
    const totalContributionsValue = within(totalContributionsLabel.closest('div') as HTMLElement).getByRole('heading', {
      level: 5,
    });
    expect(totalContributionsValue.textContent?.replace(/\s/g, '')).toBe(formatCurrency(100_000, 'THB').replace(/\s/g, ''));
  });
});
