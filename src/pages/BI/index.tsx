import { BIProvider } from './context';
import { BIHeader } from './components/Header';
import { BIFilters } from './components/Filters';
import { BIMetrics } from './components/Metrics';
import { BICharts } from './components/Charts';

export default function BI() {
  return (
    <BIProvider>
      <div className="space-y-6 p-6">
        <BIHeader />
        <BIFilters />
        <BIMetrics />
        <BICharts />
      </div>
    </BIProvider>
  );
}
