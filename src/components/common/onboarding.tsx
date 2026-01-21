import { useState, ReactNode } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Building, 
  User, 
  CreditCard, 
  Settings,
  Upload,
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Building;
  content: ReactNode;
  isOptional?: boolean;
}

interface OnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Finance Hub!',
      description: 'Vamos configurar sua conta em poucos passos',
      icon: Building,
      content: <WelcomeStep />,
    },
    {
      id: 'company',
      title: 'Dados da Empresa',
      description: 'Informe os dados básicos da sua empresa',
      icon: Building,
      content: <CompanyStep />,
    },
    {
      id: 'profile',
      title: 'Seu Perfil',
      description: 'Configure suas informações pessoais',
      icon: User,
      content: <ProfileStep />,
    },
    {
      id: 'categories',
      title: 'Categorias',
      description: 'Escolha as categorias financeiras',
      icon: Settings,
      content: <CategoriesStep />,
    },
    {
      id: 'import',
      title: 'Importar Dados',
      description: 'Importe dados existentes (opcional)',
      icon: Upload,
      content: <ImportStep />,
      isOptional: true,
    },
    {
      id: 'payment',
      title: 'Forma de Pagamento',
      description: 'Configure suas opções de pagamento (opcional)',
      icon: CreditCard,
      content: <PaymentStep />,
      isOptional: true,
    },
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStepData.id]));
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkipStep = () => {
    if (currentStepData.isOptional) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkipAll = () => {
    onSkip?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
          {onSkip && (
            <button
              onClick={handleSkipAll}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <h1 className="text-2xl font-bold">{currentStepData.title}</h1>
          <p className="text-primary-100 mt-1">{currentStepData.description}</p>
          
          {/* Progress */}
          <div className="mt-6 flex items-center gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex-1 h-2 rounded-full transition-colors',
                  index < currentStep
                    ? 'bg-white'
                    : index === currentStep
                    ? 'bg-white/70'
                    : 'bg-white/30'
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-primary-100">
            Passo {currentStep + 1} de {steps.length}
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => index < currentStep && setCurrentStep(index)}
              disabled={index > currentStep}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                index === currentStep
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : completedSteps.has(step.id)
                  ? 'text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <span
                className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs',
                  index === currentStep
                    ? 'bg-primary-600 text-white'
                    : completedSteps.has(step.id)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
              >
                {completedSteps.has(step.id) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={isFirstStep}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex items-center gap-3">
            {currentStepData.isOptional && (
              <Button variant="ghost" onClick={handleSkipStep}>
                Pular
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? 'Concluir' : 'Próximo'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep() {
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 mx-auto mb-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
        <Building className="w-12 h-12 text-primary-600 dark:text-primary-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Pronto para começar?
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        Em alguns minutos você terá seu sistema de gestão financeira configurado 
        e pronto para usar. Vamos lá!
      </p>
      <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
        {[
          { icon: '📊', label: 'Dashboard completo' },
          { icon: '💰', label: 'Controle financeiro' },
          { icon: '📈', label: 'Relatórios detalhados' },
        ].map((feature) => (
          <div key={feature.label} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-2xl">{feature.icon}</span>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{feature.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanyStep() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome da Empresa *
        </label>
        <input
          type="text"
          placeholder="Ex: Minha Empresa LTDA"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          CNPJ
        </label>
        <input
          type="text"
          placeholder="00.000.000/0001-00"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Setor de Atuação
        </label>
        <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <option value="">Selecione...</option>
          <option value="comercio">Comércio</option>
          <option value="servicos">Serviços</option>
          <option value="industria">Indústria</option>
          <option value="tecnologia">Tecnologia</option>
          <option value="outros">Outros</option>
        </select>
      </div>
    </div>
  );
}

function ProfileStep() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-gray-400" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome *
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sobrenome *
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cargo
        </label>
        <input
          type="text"
          placeholder="Ex: Gerente Financeiro"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}

function CategoriesStep() {
  const defaultCategories = [
    { id: 'vendas', name: 'Vendas', type: 'receita', checked: true },
    { id: 'servicos', name: 'Serviços', type: 'receita', checked: true },
    { id: 'outros_receitas', name: 'Outras Receitas', type: 'receita', checked: true },
    { id: 'fornecedores', name: 'Fornecedores', type: 'despesa', checked: true },
    { id: 'folha', name: 'Folha de Pagamento', type: 'despesa', checked: true },
    { id: 'aluguel', name: 'Aluguel', type: 'despesa', checked: true },
    { id: 'impostos', name: 'Impostos', type: 'despesa', checked: true },
    { id: 'marketing', name: 'Marketing', type: 'despesa', checked: false },
    { id: 'ti', name: 'TI e Sistemas', type: 'despesa', checked: false },
    { id: 'outros_despesas', name: 'Outras Despesas', type: 'despesa', checked: true },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Selecione as categorias que deseja usar. Você pode modificar depois.
      </p>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-green-600 dark:text-green-400 mb-3">
            Receitas
          </h3>
          <div className="space-y-2">
            {defaultCategories
              .filter((c) => c.type === 'receita')
              .map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <input
                    type="checkbox"
                    defaultChecked={category.checked}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                </label>
              ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-red-600 dark:text-red-400 mb-3">
            Despesas
          </h3>
          <div className="space-y-2">
            {defaultCategories
              .filter((c) => c.type === 'despesa')
              .map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <input
                    type="checkbox"
                    defaultChecked={category.checked}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                </label>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportStep() {
  return (
    <div className="max-w-lg mx-auto text-center py-8">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 hover:border-primary-500 transition-colors cursor-pointer">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-900 dark:text-white font-medium mb-2">
          Arraste um arquivo aqui ou clique para selecionar
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Suportamos arquivos CSV, Excel (.xlsx) e JSON
        </p>
      </div>
      
      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        Este passo é opcional. Você pode importar seus dados a qualquer momento.
      </p>
    </div>
  );
}

function PaymentStep() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <p className="text-sm text-primary-700 dark:text-primary-300">
          💡 Você está no período de teste gratuito de 14 dias. 
          Não é necessário adicionar um método de pagamento agora.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número do Cartão
          </label>
          <input
            type="text"
            placeholder="0000 0000 0000 0000"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Validade
            </label>
            <input
              type="text"
              placeholder="MM/AA"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CVV
            </label>
            <input
              type="text"
              placeholder="123"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
