// PNG Export

export async function exportPng(
  svgElement: SVGSVGElement,
  filename: string,
  options: { scale?: number } | number = 2
): Promise<void> {
  const scale = typeof options === 'number' ? options : (options.scale ?? 2);
  
  // Clonar e preparar SVG
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Pegar dimensões
  const bbox = svgElement.getBBox();
  const width = svgElement.clientWidth || bbox.width + 40;
  const height = svgElement.clientHeight || bbox.height + 40;
  
  clonedSvg.setAttribute('width', String(width));
  clonedSvg.setAttribute('height', String(height));
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // Adicionar fundo branco
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', 'white');
  clonedSvg.insertBefore(rect, clonedSvg.firstChild);
  
  // Inline styles para garantir renderização correta
  const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleElement.textContent = `
    text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .markmap-node-text { fill: currentColor; }
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
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
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
    
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG as image'));
    };
    
    img.src = url;
  });
}
