// ============================================
// MIND MAP - Exporters
// Funções de exportação para diferentes formatos
// ============================================

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Faz download de um Blob como arquivo
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prepara SVG para exportação
 */
function prepareSvgForExport(svgElement: SVGSVGElement): SVGSVGElement {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Obtém dimensões
  const bbox = svgElement.getBBox();
  const padding = 40;
  
  clone.setAttribute('width', String(bbox.width + padding * 2));
  clone.setAttribute('height', String(bbox.height + padding * 2));
  clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
  
  // Adiciona estilos inline
  const styles = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styles.textContent = `
    .markmap-node-circle { fill: #fff; stroke-width: 1.5; }
    .markmap-node-text { fill: #333; font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 14px; }
    .markmap-link { fill: none; stroke-width: 2; }
    text { font-family: Inter, system-ui, -apple-system, sans-serif; }
  `;
  clone.insertBefore(styles, clone.firstChild);
  
  // Adiciona fundo branco
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', String(bbox.x - padding));
  rect.setAttribute('y', String(bbox.y - padding));
  rect.setAttribute('width', String(bbox.width + padding * 2));
  rect.setAttribute('height', String(bbox.height + padding * 2));
  rect.setAttribute('fill', 'white');
  clone.insertBefore(rect, clone.firstChild);
  
  return clone;
}

/**
 * Exporta SVG
 */
export async function exportToSvg(svgElement: SVGSVGElement, fileName: string): Promise<void> {
  const clone = prepareSvgForExport(svgElement);
  
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  
  const svgBlob = new Blob(
    ['<?xml version="1.0" encoding="UTF-8"?>\n' + svgString],
    { type: 'image/svg+xml;charset=utf-8' }
  );
  
  downloadBlob(svgBlob, `${fileName}.svg`);
}

/**
 * Exporta PNG
 */
export async function exportToPng(svgElement: SVGSVGElement, fileName: string, scale: number = 2): Promise<void> {
  const clone = prepareSvgForExport(svgElement);
  
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  
  // Cria imagem do SVG
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Cria canvas com escala para alta resolução
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${fileName}.png`);
          resolve();
        } else {
          reject(new Error('Falha ao criar PNG'));
        }
      }, 'image/png', 1.0);
      
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao carregar SVG'));
    };
    
    img.src = url;
  });
}

/**
 * Exporta PDF paginado
 */
export async function exportToPdf(
  svgElement: SVGSVGElement, 
  fileName: string,
  options: {
    pageSize?: 'a4' | 'a3' | 'letter';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
  } = {}
): Promise<void> {
  const { 
    pageSize = 'a4', 
    orientation = 'landscape',
    margin = 20 
  } = options;

  const clone = prepareSvgForExport(svgElement);
  
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  
  // Cria imagem do SVG em alta resolução
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const scale = 3; // Alta resolução
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      
      // Cria PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: pageSize,
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);
      
      // Calcula escala para caber na página
      const imgAspect = img.width / img.height;
      const pageAspect = contentWidth / contentHeight;
      
      let finalWidth: number;
      let finalHeight: number;
      
      if (imgAspect > pageAspect) {
        // Imagem mais larga - ajusta pela largura
        finalWidth = contentWidth;
        finalHeight = contentWidth / imgAspect;
      } else {
        // Imagem mais alta - ajusta pela altura
        finalHeight = contentHeight;
        finalWidth = contentHeight * imgAspect;
      }
      
      // Centraliza na página
      const x = margin + (contentWidth - finalWidth) / 2;
      const y = margin + (contentHeight - finalHeight) / 2;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      
      // Adiciona título no rodapé
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      pdf.text(fileName, margin, pageHeight - 10);
      pdf.text(`Gerado por Mind Map`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      
      pdf.save(`${fileName}.pdf`);
      URL.revokeObjectURL(url);
      resolve();
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao carregar SVG'));
    };
    
    img.src = url;
  });
}

/**
 * Exporta Markdown
 */
export function downloadMarkdown(markdown: string, fileName: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `${fileName}.md`);
}

const exporters = {
  exportToSvg,
  exportToPng,
  exportToPdf,
  downloadMarkdown,
};

export default exporters;
