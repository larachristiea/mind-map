// ============================================
// COMPONENTE MINDMAP PREVIEW - CORRIGIDO v2
// ============================================

'use client';

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { cn } from '@/lib/utils';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useMindMapStore } from '@/store/mindmapStore';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';

const transformer = new Transformer();

interface MindmapPreviewProps {
  className?: string;
  showControls?: boolean;
  onEnterPresentation?: () => void;
}

export interface MindmapPreviewRef {
  getSvgElement: () => SVGSVGElement | null;
  getContainerElement: () => HTMLDivElement | null;
}

export const MindmapPreview = forwardRef<MindmapPreviewRef, MindmapPreviewProps>(
  function MindmapPreview({ className, showControls = true, onEnterPresentation }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const markmapRef = useRef<Markmap | null>(null);
    
    const { isFullscreen, toggle: toggleFullscreen, isEnabled: fullscreenEnabled } = useFullscreen(containerRef);
    const { markdown } = useMindMapStore();
    const [zoom, setZoom] = useState(1);
    
    // Expor métodos para o pai
    useImperativeHandle(ref, () => ({
      getSvgElement: () => svgRef.current,
      getContainerElement: () => containerRef.current,
    }), []);
    
    // Inicializar e atualizar Markmap
    useEffect(() => {
      if (!svgRef.current || !markdown) return;
      
      // Limpar SVG
      svgRef.current.innerHTML = '';
      
      const options = {
        autoFit: true,
        duration: 300,
        maxWidth: 300,
        colorFreezeLevel: 2,
        initialExpandLevel: -1,
        zoom: true,
        pan: true,
        color: (node: any) => {
          const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
          const depth = node.state?.depth || 0;
          return colors[depth % colors.length];
        },
      };
      
      try {
        markmapRef.current = Markmap.create(svgRef.current, options);
        
        const { root } = transformer.transform(markdown);
        markmapRef.current.setData(root);
        
        setTimeout(() => {
          markmapRef.current?.fit();
          setZoom(1);
        }, 100);
      } catch (err) {
        console.error('Erro ao criar markmap:', err);
      }
      
      return () => {
        markmapRef.current = null;
      };
    }, [markdown]);
    
    // Handlers de zoom
    const handleZoomIn = useCallback(() => {
      const newZoom = Math.min(zoom + 0.25, 3);
      setZoom(newZoom);
      markmapRef.current?.rescale(newZoom);
    }, [zoom]);
    
    const handleZoomOut = useCallback(() => {
      const newZoom = Math.max(zoom - 0.25, 0.25);
      setZoom(newZoom);
      markmapRef.current?.rescale(newZoom);
    }, [zoom]);
    
    const handleFit = useCallback(() => {
      setZoom(1);
      markmapRef.current?.fit();
    }, []);
    
    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleFit();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleZoomIn, handleZoomOut, handleFit]);
    
    return (
      <div
        ref={containerRef}
        className={cn(
          'relative bg-white rounded-xl overflow-hidden h-full',
          isFullscreen && 'fixed inset-0 z-50 rounded-none',
          className
        )}
      >
        {/* Controles */}
        {showControls && markdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'absolute top-4 right-4 z-10 flex items-center gap-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200',
              isFullscreen && 'top-6 right-6'
            )}
          >
            <Tooltip content="Diminuir zoom (-)">
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <span className="text-xs text-gray-600 font-medium min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <Tooltip content="Aumentar zoom (+)">
              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <div className="w-px h-6 bg-gray-200" />
            
            <Tooltip content="Ajustar à tela (0)">
              <Button variant="ghost" size="sm" onClick={handleFit}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            {fullscreenEnabled && (
              <Tooltip content={isFullscreen ? 'Sair da tela cheia (Esc)' : 'Tela cheia'}>
                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              </Tooltip>
            )}
            
            {onEnterPresentation && !isFullscreen && (
              <>
                <div className="w-px h-6 bg-gray-200" />
                <Tooltip content="Modo apresentação">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={onEnterPresentation}
                  >
                    Apresentar
                  </Button>
                </Tooltip>
              </>
            )}
          </motion.div>
        )}
        
        {/* Área do Mind Map */}
        <div className={cn(
          'w-full h-full',
          isFullscreen && 'min-h-screen'
        )}>
          {!markdown ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <p className="text-sm">O mind map aparecerá aqui</p>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full"
            />
          )}
        </div>
        
        {/* Instruções de atalho */}
        {isFullscreen && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 text-white text-xs rounded-lg">
            Pressione <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Esc</kbd> para sair
          </div>
        )}
      </div>
    );
  }
);
