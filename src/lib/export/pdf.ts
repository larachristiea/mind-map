// PDF Export - PRESERVA ESTILOS
import { jsPDF } from 'jspdf';

export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Clonar SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

      // Pegar dimensões do SVG original
      const bbox = svgElement.getBoundingClientRect();
      const width = bbox.width;
      const height = bbox.height;

      // Copiar estilos computados
      const allElements = clonedSvg.querySelectorAll('*');
      const originalElements = svgElement.querySelectorAll('*');

      allElements.forEach((el, idx) => {
        const originalEl = originalElements[idx];
        if (originalEl) {
          const computed = window.getComputedStyle(originalEl);
          (el as HTMLElement).style.fill = computed.fill;
          (el as HTMLElement).style.stroke = computed.stroke;
          (el as HTMLElement).style.strokeWidth = computed.strokeWidth;
          (el as HTMLElement).style.fontFamily = computed.fontFamily;
          (el as HTMLElement).style.fontSize = computed.fontSize;
          (el as HTMLElement).style.fontWeight = computed.fontWeight;
        }
      });

      // Configurar dimensões
      clonedSvg.setAttribute('width', String(width));
      clonedSvg.setAttribute('height', String(height));
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Fundo branco
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', String(width));
      bgRect.setAttribute('height', String(height));
      bgRect.setAttribute('fill', 'white');
      bgRect.setAttribute('x', '0');
      bgRect.setAttribute('y', '0');
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

      // Converter para imagem
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
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        try {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, width, height);

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

          URL.revokeObjectURL(url);
          resolve();
        } catch (err) {
          console.error('Erro ao gerar PDF:', err);
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Falha ao processar'));
      };

      img.src = url;

    } catch (err) {
      reject(err);
    }
  });
}
