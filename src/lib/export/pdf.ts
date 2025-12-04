// PDF Export
import { jsPDF } from 'jspdf';

interface PdfOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape' | 'auto';
  includeTitle?: boolean;
  includeDate?: boolean;
  includePageNumbers?: boolean;
  scale?: number;
}

export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string,
  options: PdfOptions = {},
  markdown?: string
): Promise<void> {
  const { 
    orientation = 'auto', 
    scale = 2,
  } = options;
  
  // Clonar e preparar SVG
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  
  const bbox = svgElement.getBBox();
  const width = svgElement.clientWidth || bbox.width + 40;
  const height = svgElement.clientHeight || bbox.height + 40;
  
  clonedSvg.setAttribute('width', String(width));
  clonedSvg.setAttribute('height', String(height));
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // Fundo branco
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', 'white');
  clonedSvg.insertBefore(rect, clonedSvg.firstChild);
  
  // Inline styles
  const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleElement.textContent = `
    text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  `;
  clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);
  
  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Determinar orientação
      const pdfOrientation = orientation === 'auto' 
        ? (canvas.width > canvas.height ? 'landscape' : 'portrait')
        : orientation;
      
      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      pdf.save(finalFilename);
      
      URL.revokeObjectURL(url);
      resolve();
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    
    img.src = url;
  });
}
