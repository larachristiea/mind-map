// ============================================
// Mind Map - ExportPanel Component
// Painel de exportação com opções
// ============================================

'use client';

import { useState, useCallback } from 'react';
import { useMindMapStore } from '@/store/mindmapStore';
import { Button } from '@/components/ui/Button';
import { 
  Download, 
  Image, 
  FileText, 
  FileCode,
  Presentation,
  Check,
  ChevronDown
} from 'lucide-react';
import { exportToSvg, exportToPng, exportToPdf, downloadMarkdown } from '@/lib/exporters';
import toast from 'react-hot-toast';

type ExportFormat = 'svg' | 'png' | 'pdf' | 'md';

interface ExportOption {
  format: ExportFormat;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { 
    format: 'svg', 
    label: 'SVG', 
    icon: Image, 
    description: 'Vetorial, escalável' 
  },
  { 
    format: 'png', 
    label: 'PNG', 
    icon: Image, 
    description: 'Imagem de alta qualidade' 
  },
  { 
    format: 'pdf', 
    label: 'PDF', 
    icon: FileText, 
    description: 'Documento paginado' 
  },
  { 
    format: 'md', 
    label: 'Markdown', 
    icon: FileCode, 
    description: 'Arquivo editável' 
  },
];

export function ExportPanel() {
  const { markdown, mindMapData } = useMindMapStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!mindMapData) return;

    setIsExporting(true);
    setShowDropdown(false);

    try {
      const fileName = mindMapData.title || 'mindmap';
      const svgElement = globalThis.document.querySelector('.markmap svg') as SVGSVGElement;

      if (!svgElement && format !== 'md') {
        throw new Error('Mind map não encontrado');
      }

      switch (format) {
        case 'svg':
          await exportToSvg(svgElement, fileName);
          toast.success('SVG exportado com sucesso!');
          break;
        case 'png':
          await exportToPng(svgElement, fileName);
          toast.success('PNG exportado com sucesso!');
          break;
        case 'pdf':
          await exportToPdf(svgElement, fileName);
          toast.success('PDF exportado com sucesso!');
          break;
        case 'md':
          downloadMarkdown(markdown, fileName);
          toast.success('Markdown exportado com sucesso!');
          break;
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  }, [document, markdown]);

  return (
    <div className="flex items-center justify-between p-4 bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[rgb(var(--primary))]/10 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-[rgb(var(--primary))]" />
        </div>
        <div>
          <h3 className="font-medium text-[rgb(var(--foreground))]">
            {document?.title || 'Mapa Mental'}
          </h3>
          <p className="text-xs text-[rgb(var(--muted-foreground))]">
            {document?.originalFileName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Presentation button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPresentationMode(true)}
        >
          <Presentation className="w-4 h-4 mr-2" />
          Apresentar
        </Button>

        {/* Export dropdown */}
        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar
                <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>

          {showDropdown && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-[rgb(var(--card))] rounded-lg border border-[rgb(var(--border))] shadow-xl z-50 overflow-hidden animate-fade-in">
                <div className="p-1">
                  {EXPORT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.format}
                        onClick={() => handleExport(option.format)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[rgb(var(--secondary))] transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-[rgb(var(--secondary))] rounded-md flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-[rgb(var(--foreground))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[rgb(var(--foreground))]">
                            {option.label}
                          </p>
                          <p className="text-xs text-[rgb(var(--muted-foreground))]">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExportPanel;
