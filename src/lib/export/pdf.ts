// ============================================
// EXPORTADOR PDF - MULTI-PÁGINA COM SEPARADOR
// ============================================

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

interface PdfExportOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape' | 'auto';
  includeTitle?: boolean;
  includeDate?: boolean;
  includePageNumbers?: boolean;
  margin?: number;
  scale?: number;
}

const transformer = new Transformer();

/**
 * Divide markdown por separadores (---, ----, ___)
 */
function splitMarkdownBySeparator(markdown: string): string[] {
  // Regex para encontrar separadores: --- ou ---- ou ___ (3+ caracteres)
  const separatorRegex = /^(-{3,}|_{3,})$/gm;
  
  const sections = markdown.split(separatorRegex).filter(section => {
    const trimmed = section.trim();
    // Filtrar separadores e seções vazias
    return trimmed && !trimmed.match(/^(-{3,}|_{3,})$/);
  });
  
  return sections.length > 0 ? sections : [markdown];
}

/**
 * Renderiza markdown em SVG temporário
 */
async function renderMarkdownToCanvas(
  markdown: string,
  scale: number
): Promise<HTMLCanvasElement> {
  // Criar container temporário
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '20px';
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.width = '1200px';
  svg.style.height = '800px';
  container.appendChild(svg);
  document.body.appendChild(container);
  
  try {
    // Criar markmap
    const mm = Markmap.create(svg, {
      autoFit: true,
      duration: 0,
      maxWidth: 250,
      colorFreezeLevel: 2,
      initialExpandLevel: -1,
      color: (node: any) => {
        const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
        return colors[(node.state?.depth || 0) % colors.length];
      },
    });
    
    // Transformar e renderizar
    const { root } = transformer.transform(markdown);
    mm.setData(root);
    
    // Aguardar renderização
    await new Promise(resolve => setTimeout(resolve, 300));
    mm.fit();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Pegar dimensões reais
    const bbox = svg.getBBox();
    const padding = 40;
    const contentWidth = bbox.width + padding * 2;
    const contentHeight = bbox.height + padding * 2;
    
    // Ajustar SVG
    svg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${contentWidth} ${contentHeight}`);
    svg.setAttribute('width', `${contentWidth}`);
    svg.setAttribute('height', `${contentHeight}`);
    svg.style.width = `${contentWidth}px`;
    svg.style.height = `${contentHeight}px`;
    container.style.width = `${contentWidth}px`;
    container.style.height = `${contentHeight}px`;
    
    // Capturar como canvas
    const canvas = await html2canvas(container, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    return canvas;
    
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Exporta SVG como PDF - suporta múltiplas páginas com separador ---
 */
export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string = 'mindmap.pdf',
  options: PdfExportOptions = {},
  markdown?: string
): Promise<void> {
  const {
    title = 'Mind Map',
    orientation = 'auto',
    includeTitle = true,
    includeDate = true,
    includePageNumbers = true,
    margin = 10,
    scale = 3,
  } = options;
  
  // Limpar título
  const cleanTitle = (title || 'Mind Map')
    .replace(/[^\w\s\-:áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/gi, '')
    .trim() || 'Mind Map';
  
  // Se não tem markdown ou não tem separador, exporta normal (1 página)
  if (!markdown || !markdown.match(/^(-{3,}|_{3,})$/m)) {
    await exportSinglePage(svgElement, filename, { ...options, title: cleanTitle });
    return;
  }
  
  // Dividir por separadores
  const sections = splitMarkdownBySeparator(markdown);
  
  if (sections.length <= 1) {
    await exportSinglePage(svgElement, filename, { ...options, title: cleanTitle });
    return;
  }
  
  // Criar PDF multi-página
  let pdf: jsPDF | null = null;
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;
    
    // Renderizar seção
    const canvas = await renderMarkdownToCanvas(section, scale);
    
    // Detectar orientação da seção
    const imgAspect = canvas.width / canvas.height;
    const sectionOrientation: 'portrait' | 'landscape' = 
      orientation === 'auto' 
        ? (imgAspect > 1.2 ? 'landscape' : 'portrait')
        : orientation;
    
    // Criar PDF na primeira iteração
    if (!pdf) {
      pdf = new jsPDF({
        orientation: sectionOrientation,
        unit: 'mm',
        format: 'a4',
      });
    } else {
      pdf.addPage('a4', sectionOrientation);
    }
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    let yOffset = margin;
    
    // Título (só na primeira página)
    if (i === 0 && includeTitle) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(cleanTitle, margin, yOffset + 4);
      yOffset += 8;
    }
    
    // Data (só na primeira página)
    if (i === 0 && includeDate) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text(new Date().toLocaleDateString('pt-BR'), margin, yOffset);
      pdf.setTextColor(0, 0, 0);
      yOffset += 6;
    }
    
    // Área disponível
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - yOffset - margin - (includePageNumbers ? 8 : 0);
    
    // Calcular dimensões
    const pageAspect = availableWidth / availableHeight;
    let imgWidth: number;
    let imgHeight: number;
    
    if (imgAspect > pageAspect) {
      imgWidth = availableWidth;
      imgHeight = availableWidth / imgAspect;
    } else {
      imgHeight = availableHeight;
      imgWidth = availableHeight * imgAspect;
    }
    
    // Centralizar
    const xOffset = margin + (availableWidth - imgWidth) / 2;
    const yImgOffset = yOffset + (availableHeight - imgHeight) / 2;
    
    // Adicionar imagem
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', xOffset, yImgOffset, imgWidth, imgHeight);
    
    // Número da página
    if (includePageNumbers) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `${i + 1} / ${sections.length}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
      pdf.setTextColor(0, 0, 0);
    }
  }
  
  // Salvar
  if (pdf) {
    pdf.save(filename);
  }
}

/**
 * Exporta página única (sem separadores)
 */
async function exportSinglePage(
  svgElement: SVGSVGElement,
  filename: string,
  options: PdfExportOptions
): Promise<void> {
  const {
    title = 'Mind Map',
    orientation = 'auto',
    includeTitle = true,
    includeDate = true,
    margin = 10,
    scale = 3,
  } = options;
  
  // Pegar dimensões
  const bbox = svgElement.getBBox();
  const padding = 30;
  const contentWidth = bbox.width + padding * 2;
  const contentHeight = bbox.height + padding * 2;
  
  // Detectar orientação
  let finalOrientation: 'portrait' | 'landscape';
  if (orientation === 'auto') {
    finalOrientation = (contentWidth / contentHeight) > 1.2 ? 'landscape' : 'portrait';
  } else {
    finalOrientation = orientation;
  }
  
  // Criar container temporário
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.backgroundColor = '#ffffff';
  
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${contentWidth} ${contentHeight}`);
  svgClone.setAttribute('width', `${contentWidth}`);
  svgClone.setAttribute('height', `${contentHeight}`);
  svgClone.style.width = `${contentWidth}px`;
  svgClone.style.height = `${contentHeight}px`;
  
  tempDiv.style.width = `${contentWidth}px`;
  tempDiv.style.height = `${contentHeight}px`;
  tempDiv.appendChild(svgClone);
  document.body.appendChild(tempDiv);
  
  try {
    const canvas = await html2canvas(tempDiv, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    const pdf = new jsPDF({
      orientation: finalOrientation,
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    let yOffset = margin;
    
    if (includeTitle && title) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, yOffset + 4);
      yOffset += 8;
    }
    
    if (includeDate) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text(new Date().toLocaleDateString('pt-BR'), margin, yOffset);
      pdf.setTextColor(0, 0, 0);
      yOffset += 6;
    }
    
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - yOffset - margin;
    const imgAspect = canvas.width / canvas.height;
    const pageAspect = availableWidth / availableHeight;
    
    let imgWidth: number;
    let imgHeight: number;
    
    if (imgAspect > pageAspect) {
      imgWidth = availableWidth;
      imgHeight = availableWidth / imgAspect;
    } else {
      imgHeight = availableHeight;
      imgWidth = availableHeight * imgAspect;
    }
    
    const xOffset = margin + (availableWidth - imgWidth) / 2;
    const yImgOffset = yOffset + (availableHeight - imgHeight) / 2;
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', xOffset, yImgOffset, imgWidth, imgHeight);
    
    pdf.save(filename);
    
  } finally {
    document.body.removeChild(tempDiv);
  }
}

/**
 * Retorna PDF como Blob
 */
export async function getPdfBlob(
  svgElement: SVGSVGElement,
  options: PdfExportOptions = {}
): Promise<Blob> {
  // Versão simplificada - usa exportSinglePage logic
  const {
    title = 'Mind Map',
    orientation = 'auto',
    includeTitle = true,
    includeDate = true,
    margin = 10,
    scale = 3,
  } = options;
  
  const bbox = svgElement.getBBox();
  const padding = 30;
  const contentWidth = bbox.width + padding * 2;
  const contentHeight = bbox.height + padding * 2;
  
  let finalOrientation: 'portrait' | 'landscape';
  if (orientation === 'auto') {
    finalOrientation = (contentWidth / contentHeight) > 1.2 ? 'landscape' : 'portrait';
  } else {
    finalOrientation = orientation;
  }
  
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.backgroundColor = '#ffffff';
  
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${contentWidth} ${contentHeight}`);
  svgClone.setAttribute('width', `${contentWidth}`);
  svgClone.setAttribute('height', `${contentHeight}`);
  
  tempDiv.appendChild(svgClone);
  document.body.appendChild(tempDiv);
  
  try {
    const canvas = await html2canvas(tempDiv, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    const pdf = new jsPDF({ orientation: finalOrientation, unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    let yOffset = margin;
    
    const cleanTitle = (title || 'Mind Map')
      .replace(/[^\w\s\-:áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/gi, '')
      .trim() || 'Mind Map';
    
    if (includeTitle) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(cleanTitle, margin, yOffset + 4);
      yOffset += 8;
    }
    
    if (includeDate) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text(new Date().toLocaleDateString('pt-BR'), margin, yOffset);
      pdf.setTextColor(0, 0, 0);
      yOffset += 6;
    }
    
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - yOffset - margin;
    const imgAspect = canvas.width / canvas.height;
    const pageAspect = availableWidth / availableHeight;
    
    let imgWidth: number;
    let imgHeight: number;
    
    if (imgAspect > pageAspect) {
      imgWidth = availableWidth;
      imgHeight = availableWidth / imgAspect;
    } else {
      imgHeight = availableHeight;
      imgWidth = availableHeight * imgAspect;
    }
    
    const xOffset = margin + (availableWidth - imgWidth) / 2;
    const yImgOffset = yOffset + (availableHeight - imgHeight) / 2;
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', xOffset, yImgOffset, imgWidth, imgHeight);
    
    return pdf.output('blob');
    
  } finally {
    document.body.removeChild(tempDiv);
  }
}
