// ============================================
// MIND MAP - SVG Exporter
// Exporta mind map como SVG vetorial
// ============================================

/**
 * Exporta o SVG do mind map
 */
export function exportSvg(svgElement: SVGElement, fileName: string): void {
  // Clona o SVG para não modificar o original
  const clone = svgElement.cloneNode(true) as SVGElement;
  
  // Adiciona estilos inline
  const styles = document.createElement('style');
  styles.textContent = `
    .markmap-node-circle { fill: #fff; stroke-width: 1.5; }
    .markmap-node-text { fill: #333; font-family: Inter, system-ui, sans-serif; }
    .markmap-link { fill: none; stroke-width: 2; }
  `;
  clone.insertBefore(styles, clone.firstChild);
  
  // Serializa
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  
  // Adiciona declaração XML
  const svgBlob = new Blob(
    ['<?xml version="1.0" encoding="UTF-8"?>\n' + svgString],
    { type: 'image/svg+xml;charset=utf-8' }
  );
  
  // Download
  downloadBlob(svgBlob, `${fileName}.svg`);
}
