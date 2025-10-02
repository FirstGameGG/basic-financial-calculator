import { Suspense, lazy } from 'react';
import { Navigate, useRoutes, useLocation } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '../ui/components/PageTransition';

const HomePage = lazy(() => import('../ui/pages/HomePage'));
const LoanCalculatorPage = lazy(() => import('../ui/pages/LoanCalculatorPage'));
const TimeValuePage = lazy(() => import('../ui/pages/time-value/TimeValuePage'));
const FutureValuePage = lazy(() => import('../ui/pages/time-value/FutureValuePage'));
const NetPresentValuePage = lazy(() => import('../ui/pages/time-value/NetPresentValuePage'));
const DepositsPage = lazy(() => import('../ui/pages/deposits/DepositsPage'));
const SavingsDepositPage = lazy(() => import('../ui/pages/deposits/SavingsDepositPage'));
const FixedDepositPage = lazy(() => import('../ui/pages/deposits/FixedDepositPage'));
const TieredDepositPage = lazy(() => import('../ui/pages/deposits/TieredDepositPage'));
const AboutPage = lazy(() => import('../ui/pages/AboutPage'));
const NotFoundPage = lazy(() => import('../ui/pages/NotFoundPage'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <PageTransition>
        <HomePage />
      </PageTransition>
    ),
  },
  {
    path: '/calculators/loan',
    element: (
      <PageTransition>
        <LoanCalculatorPage />
      </PageTransition>
    ),
  },
  {
    path: '/calculators/time-value/*',
    element: <TimeValuePage />,
    children: [
      { index: true, element: <Navigate to="future-value" replace /> },
      { path: 'future-value', element: <FutureValuePage /> },
      { path: 'net-present-value', element: <NetPresentValuePage /> },
    ],
  },
  {
    path: '/calculators/deposits/*',
    element: <DepositsPage />,
    children: [
      { index: true, element: <Navigate to="savings" replace /> },
      { path: 'savings', element: <SavingsDepositPage /> },
      { path: 'fixed', element: <FixedDepositPage /> },
      { path: 'tiered', element: <TieredDepositPage /> },
    ],
  },
  {
    path: '/about',
    element: (
      <PageTransition>
        <AboutPage />
      </PageTransition>
    ),
  },
  {
    path: '*',
    element: (
      <PageTransition>
        <NotFoundPage />
      </PageTransition>
    ),
  },
];

const AppRoutes = () => {
  const element = useRoutes(routes);
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Box key={location.pathname}>{element}</Box>
    </AnimatePresence>
  );
};

const PageLoader = () => (
  <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
    <CircularProgress />
  </Box>
);

export const AppRouter = () => (
  <Suspense fallback={<PageLoader />}>
    <AppRoutes />
  </Suspense>
);
