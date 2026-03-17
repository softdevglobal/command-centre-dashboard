import DashboardPage from './DashboardPage';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';

const Index = () => (
  <DashboardErrorBoundary>
    <DashboardPage />
  </DashboardErrorBoundary>
);

export default Index;
