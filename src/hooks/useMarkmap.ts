// ============================================
// HOOK PARA RENDERIZAR MARKMAP
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import type { IMarkmapOptions } from 'markmap-view';
import { useMindMapStore } from '@/store/mindmapStore';

const transformer = new Transformer();

interface UseMarkmapOptions {
  autoFit?: boolean;
  duration?: number;
  maxWidth?: number;
  colorFreezeLevel?: number;
  initialExpandLevel?: number;
}

export function useMarkmap(options: UseMarkmapOptions = {}) {
  const {
    autoFit = true,
    duration = 300,
    maxWidth = 300,
    colorFreezeLevel = 2,
    initialExpandLevel = -1,
  } = options;
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const { markdown } = useMindMapStore();
  
  // Inicializar o Markmap
  const initMarkmap = useCallback(() => {
    if (!svgRef.current) return;
    
    // Limpar instância anterior
    if (markmapRef.current) {
      svgRef.current.innerHTML = '';
    }
    
    const markmapOptions: Partial<IMarkmapOptions> = {
      autoFit,
      duration,
      maxWidth,
      colorFreezeLevel,
      initialExpandLevel,
      color: (node) => {
        // Cores por nível
        const colors = [
          '#2563eb', // Azul
          '#059669', // Verde
          '#d97706', // Laranja
          '#7c3aed', // Roxo
          '#dc2626', // Vermelho
          '#0891b2', // Ciano
        ];
        return colors[(node.state?.depth ?? 0) % colors.length] || colors[0];
      },
    };
    
    // Criar instância
    markmapRef.current = Markmap.create(svgRef.current, markmapOptions);
    setIsReady(true);
  }, [autoFit, duration, maxWidth, colorFreezeLevel, initialExpandLevel]);
  
  // Atualizar dados quando markdown mudar
  useEffect(() => {
    if (!markmapRef.current || !markdown) return;
    
    try {
      const { root } = transformer.transform(markdown);
      markmapRef.current.setData(root);
      
      // Fit to view após render
      if (autoFit) {
        setTimeout(() => {
          markmapRef.current?.fit();
        }, duration + 50);
      }
    } catch (err) {
      console.error('Erro ao transformar markdown:', err);
    }
  }, [markdown, autoFit, duration]);
  
  // Inicializar na montagem
  useEffect(() => {
    initMarkmap();
    
    return () => {
      if (markmapRef.current) {
        // Cleanup
        markmapRef.current = null;
      }
    };
  }, [initMarkmap]);
  
  // Funções de controle
  const fit = useCallback(() => {
    markmapRef.current?.fit();
  }, []);
  
  const rescale = useCallback((scale: number) => {
    markmapRef.current?.rescale(scale);
  }, []);
  
  const setData = useCallback((md: string) => {
    if (!markmapRef.current) return;
    const { root } = transformer.transform(md);
    markmapRef.current.setData(root);
  }, []);
  
  // Obter SVG element para exportação
  const getSvgElement = useCallback((): SVGSVGElement | null => {
    return svgRef.current;
  }, []);
  
  return {
    svgRef,
    isReady,
    fit,
    rescale,
    setData,
    getSvgElement,
  };
}
