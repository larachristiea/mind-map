// PDF Export - Multi-página com divisores ----
import { jsPDF } from 'jspdf';

export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {

  return new Promise((resolve, reject) => {
    try {
      // Pegar conteúdo real do mapa
      const gElement = svgElement.querySelector('g');
      if (!gElement) {
        reject(new Error('Conteúdo não encontrado'));
        return;
      }

      const contentBBox = gElement.getBBox();
      const padding = 50;
      const contentWidth = contentBBox.width + padding * 2;
      const contentHeight = contentBBox.height + padding * 2;

      // Aumentar resolução para melhor qualidade
      const maxDimension = 6000;
      let scale = 4;

      if (contentWidth * scale > maxDimension || contentHeight * scale > maxDimension) {
        scale = Math.min(maxDimension / contentWidth, maxDimension / contentHeight);
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas não suportado'));
        return;
      }
      
      canvas.width = Math.round(contentWidth * scale);
      canvas.height = Math.round(contentHeight * scale);
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clonar SVG com viewBox correto
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      const viewBoxX = contentBBox.x - padding;
      const viewBoxY = contentBBox.y - padding;
      clonedSvg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${contentWidth} ${contentHeight}`);
      clonedSvg.setAttribute('width', String(canvas.width));
      clonedSvg.setAttribute('height', String(canvas.height));
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Fundo branco
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', String(viewBoxX));
      bgRect.setAttribute('y', String(viewBoxY));
      bgRect.setAttribute('width', String(contentWidth));
      bgRect.setAttribute('height', String(contentHeight));
      bgRect.setAttribute('fill', 'white');
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      const img = new Image();
      
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Usar PNG para melhor qualidade
          const imgData = canvas.toDataURL('image/png', 1.0);

          const isLandscape = contentWidth > contentHeight;

          const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true,
          });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 15;

          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;

          const imgRatio = contentWidth / contentHeight;
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

          // Centralizar perfeitamente
          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;

          pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');

          const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
          pdf.save(finalFilename);
          
          resolve();
        } catch (err) {
          console.error('Erro ao gerar PDF:', err);
          reject(err);
        }
      };
      
      img.onerror = () => reject(new Error('Falha ao processar'));
      img.src = dataUrl;
      
    } catch (err) {
      reject(err);
    }
  });
}
