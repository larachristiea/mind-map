// PNG Export - SIMPLIFICADO E FUNCIONAL
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

      // Converter para data URL
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

      // Criar imagem
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
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Falha ao criar imagem'));
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/png', 1.0);
      };

      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = dataUrl;

    } catch (err) {
      reject(err);
    }
  });
}
