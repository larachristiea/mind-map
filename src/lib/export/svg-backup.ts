// SVG Export

export async function exportSvg(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {
  // Clonar o SVG para não modificar o original
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Garantir que o SVG tenha dimensões
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
  
  const svgData = new XMLSerializer().serializeToString(clonedSvg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
