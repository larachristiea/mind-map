// ============================================
// COMPONENTE HEADER - CORRIGIDO
// ============================================

'use client';

import { RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { ExportMenu } from './ExportMenu';
import { useMindMapStore } from '@/store/mindmapStore';
import type { MindmapPreviewRef } from './MindmapPreview';

interface HeaderProps {
  svgRef: React.RefObject<SVGSVGElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  mindmapRef: React.RefObject<MindmapPreviewRef>;
}

export function Header({ mindmapRef }: HeaderProps) {
  const { mindMapData, reset, file } = useMindMapStore();
  
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Mind Map</h1>
              <p className="text-xs text-gray-500">Transforme documentos em mapas mentais</p>
            </div>
          </div>
          
          {/* Arquivo atual */}
          {file && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-sm text-gray-600">{file.name}</span>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {mindMapData && (
              <>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Novo
                </Button>
                
                <ExportMenu mindmapRef={mindmapRef} />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
