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
    <header className="sticky top-0 z-30 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z" fill="#FFD700"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gold">Mind Map</h1>
              <p className="text-xs text-gray-400">Transforme documentos em mapas mentais</p>
            </div>
          </div>

          {/* Arquivo atual */}
          {file && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-sm text-gray-300">{file.name}</span>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {mindMapData && (
              <>
                <Button variant="gold" size="sm" onClick={reset}>
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
