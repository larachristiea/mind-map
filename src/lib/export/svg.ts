// SVG Export

export async function exportSvg(
  svgElement: SVGSVGElement,
  filename: string
): Promise<void> {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  link.click();
  
  URL.revokeObjectURL(url);
}
