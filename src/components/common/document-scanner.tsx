import { useState, useCallback, useRef } from 'react';
import { Camera, Upload, FileText, Loader2, Check, X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface ScanResult {
  id: string;
  imageUrl: string;
  extractedData?: ExtractedData;
  confidence: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  createdAt: string;
}

interface ExtractedData {
  type: 'receipt' | 'invoice' | 'note' | 'unknown';
  vendor?: string;
  date?: string;
  total?: number;
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    total: number;
  }>;
  paymentMethod?: string;
  taxNumber?: string; // CNPJ/CPF
  rawText?: string;
}

// OCR simulation (in production, use a real OCR service like Google Vision, AWS Textract)
async function simulateOCR(imageFile: File): Promise<ExtractedData> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Return mock data for demo
  const mockData: ExtractedData = {
    type: 'receipt',
    vendor: 'Supermercado XYZ',
    date: new Date().toISOString().split('T')[0],
    total: Math.floor(Math.random() * 500) + 50,
    items: [
      { description: 'Arroz 5kg', quantity: 1, unitPrice: 25.9, total: 25.9 },
      { description: 'Feijão 1kg', quantity: 2, unitPrice: 8.5, total: 17.0 },
      { description: 'Óleo de soja', quantity: 1, unitPrice: 12.9, total: 12.9 },
      { description: 'Açúcar 1kg', quantity: 1, unitPrice: 5.5, total: 5.5 },
    ],
    paymentMethod: 'Cartão de crédito',
    taxNumber: '12.345.678/0001-90',
  };

  mockData.total = mockData.items.reduce((sum, item) => sum + item.total, 0);

  return mockData;
}

// Document Scanner Hook
interface UseDocumentScannerOptions {
  onScanComplete?: (result: ScanResult) => void;
  onError?: (error: Error) => void;
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[];
}

export function useDocumentScanner(options: UseDocumentScannerOptions = {}) {
  const {
    onScanComplete,
    onError,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  } = options;

  const [scans, setScans] = useState<ScanResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);

  // Process file
  const processFile = useCallback(
    async (file: File): Promise<ScanResult> => {
      // Validate file
      if (!acceptedFormats.includes(file.type)) {
        throw new Error('Formato de arquivo não suportado');
      }

      if (file.size > maxFileSize) {
        throw new Error(`Arquivo muito grande. Máximo: ${maxFileSize / 1024 / 1024}MB`);
      }

      // Create scan result
      const scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const imageUrl = URL.createObjectURL(file);

      const scan: ScanResult = {
        id: scanId,
        imageUrl,
        confidence: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setScans((prev) => [scan, ...prev]);
      setCurrentScan(scan);
      setIsProcessing(true);

      try {
        // Update status to processing
        scan.status = 'processing';
        setScans((prev) => prev.map((s) => (s.id === scanId ? scan : s)));

        // Perform OCR
        const extractedData = await simulateOCR(file);

        // Update with results
        const completedScan: ScanResult = {
          ...scan,
          extractedData,
          confidence: 0.85 + Math.random() * 0.14, // 85-99%
          status: 'completed',
        };

        setScans((prev) => prev.map((s) => (s.id === scanId ? completedScan : s)));
        setCurrentScan(completedScan);
        onScanComplete?.(completedScan);

        return completedScan;
      } catch (error) {
        const errorScan: ScanResult = {
          ...scan,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        };

        setScans((prev) => prev.map((s) => (s.id === scanId ? errorScan : s)));
        setCurrentScan(errorScan);
        onError?.(error instanceof Error ? error : new Error('Erro desconhecido'));

        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [acceptedFormats, maxFileSize, onScanComplete, onError]
  );

  // Scan from file input
  const scanFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await processFile(file);
      }
    },
    [processFile]
  );

  // Clear scan
  const clearScan = useCallback((scanId: string) => {
    setScans((prev) => {
      const scan = prev.find((s) => s.id === scanId);
      if (scan?.imageUrl) {
        URL.revokeObjectURL(scan.imageUrl);
      }
      return prev.filter((s) => s.id !== scanId);
    });
  }, []);

  // Clear all scans
  const clearAllScans = useCallback(() => {
    scans.forEach((scan) => {
      if (scan.imageUrl) {
        URL.revokeObjectURL(scan.imageUrl);
      }
    });
    setScans([]);
    setCurrentScan(null);
  }, [scans]);

  return {
    scans,
    currentScan,
    isProcessing,
    scanFile,
    processFile,
    clearScan,
    clearAllScans,
  };
}

// Document Scanner Component
interface DocumentScannerProps {
  onScanComplete?: (result: ScanResult) => void;
  onConfirm?: (data: ExtractedData) => void;
  className?: string;
}

export function DocumentScanner({
  onScanComplete,
  onConfirm,
  className,
}: DocumentScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { scans, currentScan, isProcessing, scanFile, clearScan } = useDocumentScanner({
    onScanComplete,
  });

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleConfirm = () => {
    if (currentScan?.extractedData) {
      onConfirm?.(currentScan.extractedData);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload area */}
      {!currentScan && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={scanFile}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-primary-600" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Digitalizar documento
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Clique para tirar foto ou selecionar arquivo
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Upload className="w-4 h-4" />
                JPG, PNG, PDF
              </span>
              <span>Máx. 10MB</span>
            </div>
          </div>
        </div>
      )}

      {/* Preview and results */}
      {currentScan && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Image preview */}
          <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <img
              src={currentScan.imageUrl}
              alt="Documento digitalizado"
              className="w-full h-full object-contain transition-transform"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />

            {/* Processing overlay */}
            {currentScan.status === 'processing' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                  <p>Processando documento...</p>
                </div>
              </div>
            )}

            {/* Image controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 text-white hover:bg-white/20 rounded"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white text-sm px-2">{(zoom * 100).toFixed(0)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-white/20 rounded"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-white/30" />
              <button
                onClick={handleRotate}
                className="p-2 text-white hover:bg-white/20 rounded"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={() => clearScan(currentScan.id)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Extracted data */}
          {currentScan.status === 'completed' && currentScan.extractedData && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Documento processado
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Confiança: {(currentScan.confidence * 100).toFixed(0)}%
                </span>
              </div>

              {/* Data display */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {currentScan.extractedData.vendor && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Estabelecimento</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {currentScan.extractedData.vendor}
                    </p>
                  </div>
                )}
                {currentScan.extractedData.date && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Data</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(currentScan.extractedData.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                {currentScan.extractedData.total && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Total</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(currentScan.extractedData.total)}
                    </p>
                  </div>
                )}
                {currentScan.extractedData.paymentMethod && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Pagamento</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {currentScan.extractedData.paymentMethod}
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              {currentScan.extractedData.items && currentScan.extractedData.items.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Itens ({currentScan.extractedData.items.length})
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {currentScan.extractedData.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.description}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => clearScan(currentScan.id)}
                  className="flex-1 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Digitalizar outro
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Usar dados
                </button>
              </div>
            </div>
          )}

          {/* Error state */}
          {currentScan.status === 'error' && (
            <div className="p-4 text-center">
              <p className="text-red-500 mb-2">{currentScan.error}</p>
              <button
                onClick={() => clearScan(currentScan.id)}
                className="text-primary-600 hover:text-primary-700"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent scans */}
      {scans.length > 1 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Digitalizações recentes
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {scans.slice(1).map((scan) => (
              <button
                key={scan.id}
                onClick={() => {}}
                className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors"
              >
                <img
                  src={scan.imageUrl}
                  alt="Documento"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { ScanResult, ExtractedData };
export default DocumentScanner;
