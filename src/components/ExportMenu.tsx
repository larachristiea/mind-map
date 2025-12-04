// ============================================
// COMPONENTE EXPORT MENU - COM SUPORTE MULTI-PÁGINA
// ============================================

'use client';

import { useState } from 'react';
import { Download, FileImage, FileText, File, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';
import { exportSvg } from '@/lib/export/svg';
import { exportPng } from '@/lib/export/png';
import { exportPdf } from '@/lib/export/pdf';
import { useMindMapStore } from '@/store/mindmapStore';
import type { MindmapPreviewRef } from './MindmapPreview';
import toast from 'react-hot-toast';

interface ExportMenuProps {
  mindmapRef: React.RefObject<MindmapPreviewRef>;
}

export function ExportMenu({ mindmapRef }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const { mindMapData, file } = useMindMapStore();
  
  // Limpar nome do arquivo
  const rawName = file?.name.replace(/\.[^.]+$/, '') || mindMapData?.title || 'mindmap';
  const baseFilename = rawName.replace(/[^\w\s\-áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/gi, '').trim() || 'mindmap';
  
  const handleExportSvg = async () => {
    const svgElement = mindmapRef.current?.getSvgElement();
    if (!svgElement) {
      toast.error('Mind map não encontrado');
      return;
    }
    
    setExporting('svg');
    try {
      await exportSvg(svgElement, `${baseFilename}.svg`);
      toast.success('SVG exportado!');
    } catch (err) {
      toast.error('Erro ao exportar SVG');
      console.error(err);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };
  
  const handleExportPng = async () => {
    const svgElement = mindmapRef.current?.getSvgElement();
    if (!svgElement) {
      toast.error('Mind map não encontrado');
      return;
    }
    
    setExporting('png');
    try {
      await exportPng(svgElement, `${baseFilename}.png`, { scale: 3 });
      toast.success('PNG exportado!');
    } catch (err) {
      toast.error('Erro ao exportar PNG');
      console.error(err);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };
  
  const handleExportPdf = async () => {
    const svgElement = mindmapRef.current?.getSvgElement();
    if (!svgElement) {
      toast.error('Mind map não encontrado');
      return;
    }
    
    setExporting('pdf');
    try {
      await exportPdf(
        svgElement, 
        `${baseFilename}`
      );
      
      toast.success('PDF exportado!');
    } catch (err) {
      toast.error('Erro ao exportar PDF');
      console.error(err);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };
  
  const exportOptions = [
    {
      id: 'svg',
      label: 'SVG',
      description: 'Vetorial, editável',
      icon: FileText,
      action: handleExportSvg,
      color: 'text-blue-600',
    },
    {
      id: 'png',
      label: 'PNG',
      description: 'Imagem alta qualidade',
      icon: FileImage,
      action: handleExportPng,
      color: 'text-green-600',
    },
    {
      id: 'pdf',
      label: 'PDF',
      description: 'Alta resolução',
      icon: File,
      action: handleExportPdf,
      color: 'text-red-600',
    },
  ];
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={!mindMapData}
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
            >
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formato
                </p>
                
                {exportOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={option.action}
                    disabled={exporting !== null}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      'hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <div className={cn('p-2 rounded-lg bg-gray-100', option.color)}>
                      {exporting === option.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <option.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </button>
                ))}
                
                {/* Dica sobre separador */}
                <div className="mt-2 px-3 py-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Use <code className="bg-gray-100 px-1 rounded">---</code> no texto para criar páginas separadas no PDF
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
