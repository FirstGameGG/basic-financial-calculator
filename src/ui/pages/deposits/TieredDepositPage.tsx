import { Stack } from '@mui/material';

import { TieredDepositCalculator } from '../../../features/deposits/components/TieredDepositCalculator';
import { TieredDepositInfo } from '../../../features/deposits/components/TieredDepositInfo';

export const TieredDepositPage = () => (
  <Stack spacing={{ xs: 3, sm: 4 }}>
    <TieredDepositCalculator />
    <TieredDepositInfo />
  </Stack>
);

export default TieredDepositPage;