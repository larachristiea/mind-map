// SVG Export - PRESERVA ESTILOS
export async function exportSvg(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {
  try {
    // Clonar TUDO
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

    // Copiar estilos computados
    const allElements = clonedSvg.querySelectorAll('*');
    const originalElements = svgElement.querySelectorAll('*');

    allElements.forEach((el, idx) => {
      const originalEl = originalElements[idx];
      if (originalEl) {
        const computed = window.getComputedStyle(originalEl);
        // Aplicar estilos importantes
        (el as HTMLElement).style.fill = computed.fill;
        (el as HTMLElement).style.stroke = computed.stroke;
        (el as HTMLElement).style.strokeWidth = computed.strokeWidth;
        (el as HTMLElement).style.fontFamily = computed.fontFamily;
        (el as HTMLElement).style.fontSize = computed.fontSize;
      }
    });

    // Garantir namespace
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Adicionar fundo branco como PRIMEIRO elemento
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', 'white');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

    // Serializar
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
