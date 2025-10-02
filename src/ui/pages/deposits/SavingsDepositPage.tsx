import { Stack } from '@mui/material';

import { SavingsDepositCalculator } from '../../../features/deposits/components/SavingsDepositCalculator';
import { SavingsDepositInfo } from '../../../features/deposits/components/SavingsDepositInfo';

export const SavingsDepositPage = () => (
  <Stack spacing={{ xs: 3, sm: 4 }}>
    <SavingsDepositCalculator />
    <SavingsDepositInfo />
  </Stack>
);

export default SavingsDepositPage;
