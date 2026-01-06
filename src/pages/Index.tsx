import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardExecutivo } from '@/components/dashboard/DashboardExecutivo';
import { InteractivePageWrapper } from '@/components/wrappers';

const Index = () => {
  return (
    <MainLayout>
      <DashboardExecutivo />
    </MainLayout>
  );
};

export default Index;
