// PDF Export - Alta resolução, orientação automática
import { jsPDF } from 'jspdf';

interface PdfOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape' | 'auto';
  scale?: number;
}

export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string,
  options: PdfOptions = {},
  _markdown?: string
): Promise<void> {
  const { scale = 4 } = options; // Alta resolução
  
  // Pegar dimensões reais do SVG
  const svgRect = svgElement.getBoundingClientRect();
  const bbox = svgElement.getBBox();
  
  const svgWidth = Math.max(svgRect.width, bbox.width + 50, 800);
  const svgHeight = Math.max(svgRect.height, bbox.height + 50, 600);
  
  // Orientação baseada no conteúdo
  const isLandscape = svgWidth > svgHeight;
  
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas não suportado'));
        return;
      }
      
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clonar SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', String(svgWidth));
      clonedSvg.setAttribute('height', String(svgHeight));
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      const img = new Image();
      
      img.onload = () => {
        try {
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          
          // PDF com orientação automática
          const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4',
          });
          
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 5;
          
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - (margin * 2);
          
          // Manter proporção e preencher a página
          const imgRatio = canvas.width / canvas.height;
          const pageRatio = availableWidth / availableHeight;
          
          let finalWidth: number;
          let finalHeight: number;
          
          if (imgRatio > pageRatio) {
            finalWidth = availableWidth;
            finalHeight = availableWidth / imgRatio;
          } else {
            finalHeight = availableHeight;
            finalWidth = availableHeight * imgRatio;
          }
          
          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;
          
          pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
          
          const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
          pdf.save(finalFilename);
          
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => reject(new Error('Falha ao processar SVG'));
      img.src = dataUrl;
      
    } catch (err) {
      reject(err);
    }
  });
}
