// PDF Export - Multi-página automático com alta resolução
import { jsPDF } from 'jspdf';

export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {

  return new Promise((resolve, reject) => {
    try {
      const gElement = svgElement.querySelector('g');
      if (!gElement) {
        reject(new Error('Conteúdo não encontrado'));
        return;
      }

      const contentBBox = gElement.getBBox();
      const padding = 60;
      const contentWidth = contentBBox.width + padding * 2;
      const contentHeight = contentBBox.height + padding * 2;

      // Alta resolução
      const scale = 5;
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

          // PNG para melhor qualidade
          const imgData = canvas.toDataURL('image/png', 1.0);

          // Criar PDF
          const isLandscape = contentWidth > contentHeight;
          const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true,
          });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 10;

          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;

          const imgRatio = contentWidth / contentHeight;
          const pageRatio = availableWidth / availableHeight;

          // Se a imagem cabe em uma página
          if (contentHeight / contentWidth < 3) {
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
          } else {
            // Dividir em múltiplas páginas
            const numPages = Math.ceil(contentHeight / (contentWidth * (pageHeight / pageWidth)));
            const sliceHeight = canvas.height / numPages;

            for (let i = 0; i < numPages; i++) {
              if (i > 0) pdf.addPage();

              // Criar canvas temporário para cada fatia
              const tempCanvas = document.createElement('canvas');
              const tempCtx = tempCanvas.getContext('2d');
              if (!tempCtx) continue;

              tempCanvas.width = canvas.width;
              tempCanvas.height = sliceHeight;

              // Fundo branco
              tempCtx.fillStyle = 'white';
              tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

              // Copiar fatia do canvas original
              tempCtx.drawImage(
                canvas,
                0, i * sliceHeight, canvas.width, sliceHeight,
                0, 0, tempCanvas.width, tempCanvas.height
              );

              const sliceData = tempCanvas.toDataURL('image/png', 1.0);

              // Ajustar para caber na página
              const sliceRatio = contentWidth / (contentHeight / numPages);
              let finalWidth: number;
              let finalHeight: number;

              if (sliceRatio > pageRatio) {
                finalWidth = availableWidth;
                finalHeight = availableWidth / sliceRatio;
              } else {
                finalHeight = availableHeight;
                finalWidth = availableHeight * sliceRatio;
              }

              const x = (pageWidth - finalWidth) / 2;
              const y = (pageHeight - finalHeight) / 2;

              pdf.addImage(sliceData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');
            }
          }

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
