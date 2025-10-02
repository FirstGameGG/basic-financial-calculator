import { HashRouter } from 'react-router-dom';

import { AppRouter } from './router';
import { AppLayout } from '../ui/components/AppLayout';

export const App = () => (
  <HashRouter>
    <AppLayout>
      <AppRouter />
    </AppLayout>
  </HashRouter>
);

export default App;
