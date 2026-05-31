// PÁGINA: REFORMA TRIBUTÁRIA
// Módulo contábil para empresas Lucro Real

import { DashboardReformaTributaria } from '@/components/reforma-tributaria/DashboardReformaTributaria';
import { MainLayout } from '@/components/layout/MainLayout';
import { useParams } from 'react-router-dom';

export default function ReformaTributaria() {
  const { tab } = useParams();
  
  return (
    <MainLayout>
      <div className="container mx-auto p-0 md:p-6">
        <DashboardReformaTributaria initialTab={tab} />
      </div>
    </MainLayout>
  );
}
