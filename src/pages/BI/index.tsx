import { BIProvider } from './context';
import { BIHeader } from './components/Header';
import { BIFilters } from './components/Filters';
import { BIMetricsCards } from './components/MetricsCards';
import { BIChartsSection } from './components/ChartsSection';
import { BIDataTable } from './components/DataTable';

export default function BI() {
  return (
    <BIProvider>
      <div className="space-y-6 p-6">
        <BIHeader />
        <BIFilters />
        <BIMetricsCards />
        <BIChartsSection />
        <BIDataTable />
      </div>
    </BIProvider>
  );
}
