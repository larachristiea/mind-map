// SVG Export - SIMPLIFICADO E FUNCIONAL
export async function exportSvg(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {
  try {
    // Clonar SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Pegar dimensões do conteúdo
    const gElement = clonedSvg.querySelector('g');
    if (!gElement) throw new Error('Conteúdo não encontrado');

    const bbox = gElement.getBBox();
    const padding = 40;

    // Configurar viewBox e dimensões
    clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
    clonedSvg.setAttribute('width', String(bbox.width + padding * 2));
    clonedSvg.setAttribute('height', String(bbox.height + padding * 2));
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Fundo branco
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', String(bbox.x - padding));
    bgRect.setAttribute('y', String(bbox.y - padding));
    bgRect.setAttribute('width', String(bbox.width + padding * 2));
    bgRect.setAttribute('height', String(bbox.height + padding * 2));
    bgRect.setAttribute('fill', 'white');
    clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

    // Serializar e download
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro exportar SVG:', err);
    throw err;
  }
}
