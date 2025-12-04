// PDF Export - SIMPLIFICADO E FUNCIONAL
import { jsPDF } from 'jspdf';

export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Clonar SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

      // Pegar dimensões
      const gElement = clonedSvg.querySelector('g');
      if (!gElement) {
        reject(new Error('Conteúdo não encontrado'));
        return;
      }

      const bbox = gElement.getBBox();
      const padding = 40;
      const width = bbox.width + padding * 2;
      const height = bbox.height + padding * 2;

      // Configurar SVG
      clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);
      clonedSvg.setAttribute('width', String(width));
      clonedSvg.setAttribute('height', String(height));
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Fundo branco
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', String(bbox.x - padding));
      bgRect.setAttribute('y', String(bbox.y - padding));
      bgRect.setAttribute('width', String(width));
      bgRect.setAttribute('height', String(height));
      bgRect.setAttribute('fill', 'white');
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

      // Converter para imagem de alta qualidade
      const scale = 4;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas não suportado'));
        return;
      }

      canvas.width = width * scale;
      canvas.height = height * scale;

      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

      const img = new Image();
      img.onload = () => {
        try {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imgData = canvas.toDataURL('image/jpeg', 0.95);

          // Criar PDF
          const isLandscape = width > height;
          const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4',
          });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 10;

          const availableWidth = pageWidth - margin * 2;
          const availableHeight = pageHeight - margin * 2;

          const imgRatio = width / height;
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

          pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);

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
