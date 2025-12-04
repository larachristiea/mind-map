// ============================================
// EXPORTADOR PNG - CAPTURA COMPLETA
// ============================================

import html2canvas from 'html2canvas';
import { downloadFile } from '@/lib/utils';

interface PngExportOptions {
  scale?: number;
  backgroundColor?: string;
  quality?: number;
}

/**
 * Exporta SVG como PNG - captura todo o conteúdo
 */
export async function exportPng(
  svgElement: SVGSVGElement,
  filename: string = 'mindmap.png',
  options: PngExportOptions = {}
): Promise<void> {
  const { scale = 2, backgroundColor = '#ffffff', quality = 1 } = options;
  
  // Criar container temporário
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.backgroundColor = backgroundColor;
  
  // Clonar SVG
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Pegar dimensões do conteúdo real
  const bbox = svgElement.getBBox();
  
  // Adicionar padding
  const padding = 50;
  const contentWidth = bbox.width + padding * 2;
  const contentHeight = bbox.height + padding * 2;
  
  // Ajustar viewBox para mostrar todo o conteúdo
  svgClone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${contentWidth} ${contentHeight}`);
  svgClone.setAttribute('width', `${contentWidth}`);
  svgClone.setAttribute('height', `${contentHeight}`);
  svgClone.style.width = `${contentWidth}px`;
  svgClone.style.height = `${contentHeight}px`;
  svgClone.style.backgroundColor = backgroundColor;
  
  tempDiv.style.width = `${contentWidth}px`;
  tempDiv.style.height = `${contentHeight}px`;
  tempDiv.appendChild(svgClone);
  document.body.appendChild(tempDiv);
  
  try {
    // Capturar canvas
    const canvas = await html2canvas(tempDiv, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    // Converter para blob e download
    canvas.toBlob(
      (blob) => {
        if (blob) {
          downloadFile(blob, filename, 'image/png');
        }
      },
      'image/png',
      quality
    );
  } finally {
    document.body.removeChild(tempDiv);
  }
}

/**
 * Retorna PNG como Blob
 */
export async function getPngBlob(
  svgElement: SVGSVGElement,
  options: PngExportOptions = {}
): Promise<Blob | null> {
  const { scale = 2, backgroundColor = '#ffffff', quality = 1 } = options;
  
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.backgroundColor = backgroundColor;
  
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  const bbox = svgElement.getBBox();
  
  const padding = 50;
  const contentWidth = bbox.width + padding * 2;
  const contentHeight = bbox.height + padding * 2;
  
  svgClone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${contentWidth} ${contentHeight}`);
  svgClone.setAttribute('width', `${contentWidth}`);
  svgClone.setAttribute('height', `${contentHeight}`);
  
  tempDiv.appendChild(svgClone);
  document.body.appendChild(tempDiv);
  
  try {
    const canvas = await html2canvas(tempDiv, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', quality);
    });
  } finally {
    document.body.removeChild(tempDiv);
  }
}
