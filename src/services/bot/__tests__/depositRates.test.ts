import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('BOT deposit rate parsing', () => {
  it('parses min/max/average values from the BOT response', async () => {
    const mockResponse = {
      result: {
        timestamp: '2025-01-02 09:00:00',
        data: {
          data_detail: [
            {
              period: '2025-01-02',
              bank_type_name_eng: 'Commercial Banks registered in Thailand',
              bank_type_name_th: 'ธนาคารพาณิชย์จดทะเบียนในประเทศ',
              bank_name_eng: 'Sample Bank',
              bank_name_th: 'ตัวอย่างธนาคาร',
              saving_min: '0.5000',
              saving_max: '0.7000',
              fix_3_mths_min: '1.0000',
              fix_3_mths_max: '1.2000',
              fix_6_mths_min: '1.1500',
              fix_6_mths_max: '1.2500',
              fix_12_mths_min: '1.4000',
              fix_12_mths_max: '1.6000',
              fix_24_mths_min: '1.8000',
              fix_24_mths_max: '1.9000',
            },
          ],
        },
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    vi.stubGlobal('fetch', fetchMock);

    const {
      getBotDepositRatesForDate,
    } = await import('../depositRates');

    const dataset = await getBotDepositRatesForDate('2025-01-02');
    expect(dataset).not.toBeNull();
    expect(dataset?.records).toHaveLength(1);

    const record = dataset?.records[0];
    expect(record?.savings.min).toBeCloseTo(0.5);
    expect(record?.savings.max).toBeCloseTo(0.7);
    expect(record?.savings.average).toBeCloseTo(0.6);

    expect(record?.fixed['3M'].average).toBeCloseTo(1.1);
    expect(record?.fixed['24M'].min).toBeCloseTo(1.8);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://bot-deposit-rate.iamfirst251726.workers.dev/api/deposit_rate?start_period=2025-01-02&end_period=2025-01-02',
    );
  });
});
