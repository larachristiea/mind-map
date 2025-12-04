// ============================================
// EXPORTADOR SVG - CAPTURA COMPLETA
// ============================================

import { downloadFile } from '@/lib/utils';

/**
 * Exporta o SVG do mind map - captura todo o conteúdo
 */
export async function exportSvg(
  svgElement: SVGSVGElement,
  filename: string = 'mindmap.svg'
): Promise<void> {
  // Clonar o SVG para não modificar o original
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Pegar dimensões do conteúdo real
  const bbox = svgElement.getBBox();
  const padding = 50;
  const contentWidth = bbox.width + padding * 2;
  const contentHeight = bbox.height + padding * 2;
  
  // Configurar viewBox para mostrar todo o conteúdo
  clone.setAttribute(
    'viewBox',
    `${bbox.x - padding} ${bbox.y - padding} ${contentWidth} ${contentHeight}`
  );
  clone.setAttribute('width', `${contentWidth}`);
  clone.setAttribute('height', `${contentHeight}`);
  
  // Adicionar fundo branco
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', `${bbox.x - padding}`);
  bg.setAttribute('y', `${bbox.y - padding}`);
  bg.setAttribute('width', `${contentWidth}`);
  bg.setAttribute('height', `${contentHeight}`);
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);
  
  // Adicionar estilos inline
  const styles = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styles.textContent = `
    .markmap-node-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .markmap-link { fill: none; stroke-width: 1.5; }
  `;
  clone.insertBefore(styles, clone.firstChild);
  
  // Adicionar xmlns
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  
  // Serializar
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  
  // Download
  downloadFile(svgString, filename, 'image/svg+xml');
}

/**
 * Retorna SVG como string para uso interno
 */
export function getSvgString(svgElement: SVGSVGElement): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  
  const bbox = svgElement.getBBox();
  const padding = 50;
  
  clone.setAttribute(
    'viewBox',
    `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`
  );
  
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  
  const serializer = new XMLSerializer();
  return serializer.serializeToString(clone);
}
