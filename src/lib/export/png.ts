// PNG Export - PRESERVA ESTILOS
export async function exportPng(
  svgElement: SVGSVGElement,
  filename: string,
  options: { scale?: number } | number = 3
): Promise<void> {
  const scale = typeof options === 'number' ? options : (options.scale ?? 3);

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

      // Converter para data URL
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas não suportado'));
          return;
        }

        canvas.width = width * scale;
        canvas.height = height * scale;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Falha ao criar imagem'));
            return;
          }

          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/png', 1.0);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Falha ao carregar imagem'));
      };

      img.src = url;

    } catch (err) {
      reject(err);
    }
  });
}
