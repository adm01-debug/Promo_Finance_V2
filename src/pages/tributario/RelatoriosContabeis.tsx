import { RelatoriosContabeisTributarios } from '@/components/reforma-tributaria/RelatoriosContabeisTributarios';
import { MainLayout } from '@/components/layout/MainLayout';

export default function RelatoriosContabeisPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <RelatoriosContabeisTributarios />
      </div>
    </MainLayout>
  );
}
