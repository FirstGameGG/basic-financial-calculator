import { Stack } from '@mui/material';

import { FixedDepositCalculator } from '../../../features/deposits/components/FixedDepositCalculator';
import { FixedDepositInfo } from '../../../features/deposits/components/FixedDepositInfo';

export const FixedDepositPage = () => (
  <Stack spacing={{ xs: 3, sm: 4 }}>
    <FixedDepositCalculator />
    <FixedDepositInfo />
  </Stack>
);

export default FixedDepositPage;
