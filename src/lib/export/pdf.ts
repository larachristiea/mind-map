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
  _markdown?: string
): Promise<void> {
  const { 
    orientation = 'auto', 
    scale = 2,
  } = options;
  
  return new Promise((resolve, reject) => {
    try {
      // Pegar dimensões do SVG
      const bbox = svgElement.getBBox();
      const svgWidth = svgElement.clientWidth || svgElement.viewBox?.baseVal?.width || bbox.width + 100;
      const svgHeight = svgElement.clientHeight || svgElement.viewBox?.baseVal?.height || bbox.height + 100;
      
      // Criar canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas não suportado'));
        return;
      }
      
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      
      // Fundo branco
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clonar SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', String(svgWidth));
      clonedSvg.setAttribute('height', String(svgHeight));
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      
      // Serializar SVG
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      const img = new Image();
      
      img.onload = () => {
        try {
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          
          // Orientação
          const pdfOrientation = orientation === 'auto' 
            ? (canvas.width > canvas.height ? 'landscape' : 'portrait')
            : orientation;
          
          // Criar PDF com tamanho A4 ajustado
          const pdf = new jsPDF({
            orientation: pdfOrientation,
            unit: 'mm',
            format: 'a4',
          });
          
          // Calcular dimensões para caber na página
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 10;
          
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - (margin * 2);
          
          const imgRatio = canvas.width / canvas.height;
          const pageRatio = availableWidth / availableHeight;
          
          let finalWidth, finalHeight;
          
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
          console.error('Erro ao gerar PDF:', err);
          reject(err);
        }
      };
      
      img.onerror = (err) => {
        console.error('Erro ao carregar imagem:', err);
        reject(new Error('Falha ao carregar SVG como imagem'));
      };
      
      img.src = dataUrl;
      
    } catch (err) {
      console.error('Erro na exportação PDF:', err);
      reject(err);
    }
  });
}
