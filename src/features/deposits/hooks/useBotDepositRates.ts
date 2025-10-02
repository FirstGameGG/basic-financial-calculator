import { useEffect, useState } from 'react';

import {
  getLatestBotDepositRates,
  type BotDepositRateDataset,
} from '../../../services/bot/depositRates';

export type BotRatesState = {
  data: BotDepositRateDataset | null;
  isLoading: boolean;
  error: Error | null;
};

export const useBotDepositRates = () => {
  const [state, setState] = useState<BotRatesState>({ data: null, isLoading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const dataset = await getLatestBotDepositRates();
        if (!cancelled) {
          setState({ data: dataset, isLoading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: null, isLoading: false, error: error instanceof Error ? error : new Error('Unknown error') });
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
