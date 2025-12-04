// PDF Export - Captura real do mapa mental
import { jsPDF } from 'jspdf';

interface PdfOptions {
  scale?: number;
}

export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string,
  _options: PdfOptions = {},
  _markdown?: string
): Promise<void> {
  
  return new Promise((resolve, reject) => {
    try {
      // Pegar o grupo principal do markmap (contém todo o conteúdo)
      const gElement = svgElement.querySelector('g');
      if (!gElement) {
        reject(new Error('Conteúdo do mapa não encontrado'));
        return;
      }
      
      // Bounding box real do conteúdo
      const contentBBox = gElement.getBBox();
      
      // Adicionar margem
      const padding = 50;
      const contentWidth = contentBBox.width + padding * 2;
      const contentHeight = contentBBox.height + padding * 2;
      
      // Scale alto para qualidade
      const scale = 5;
      
      // Criar canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas não suportado'));
        return;
      }
      
      canvas.width = contentWidth * scale;
      canvas.height = contentHeight * scale;
      
      // Fundo branco
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clonar SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      
      // Ajustar viewBox para mostrar todo o conteúdo
      const viewBoxX = contentBBox.x - padding;
      const viewBoxY = contentBBox.y - padding;
      clonedSvg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${contentWidth} ${contentHeight}`);
      clonedSvg.setAttribute('width', String(contentWidth * scale));
      clonedSvg.setAttribute('height', String(contentHeight * scale));
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.style.backgroundColor = 'white';
      
      // Adicionar fundo branco como rect
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', String(viewBoxX));
      bgRect.setAttribute('y', String(viewBoxY));
      bgRect.setAttribute('width', String(contentWidth));
      bgRect.setAttribute('height', String(contentHeight));
      bgRect.setAttribute('fill', 'white');
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
      
      // Serializar
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      const img = new Image();
      
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          
          // Orientação baseada no conteúdo
          const isLandscape = contentWidth > contentHeight;
          
          // Criar PDF com tamanho proporcional ao conteúdo
          const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4',
          });
          
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 10;
          
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - (margin * 2);
          
          // Calcular tamanho final mantendo proporção
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
          
          // Centralizar
          const x = margin + (availableWidth - finalWidth) / 2;
          const y = margin + (availableHeight - finalHeight) / 2;
          
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
        reject(new Error('Falha ao processar'));
      };
      
      img.src = dataUrl;
      
    } catch (err) {
      console.error('Erro:', err);
      reject(err);
    }
  });
}
