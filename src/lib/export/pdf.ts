// PDF Export
import { jsPDF } from 'jspdf';

interface PdfOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape' | 'auto';
  includeTitle?: boolean;
  includeDate?: boolean;
  includePageNumbers?: boolean;
  scale?: number;
}

export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string,
  options: PdfOptions = {},
  markdown?: string
): Promise<void> {
  const { 
    title = 'Mind Map',
    orientation = 'landscape', 
    scale = 2,
    includeTitle = false,
    includeDate = false,
    includePageNumbers = false,
  } = options;
  
  // Detectar separadores para multi-página
  const sections = markdown ? markdown.split(/^-{3,}$|^_{3,}$/m).filter(s => s.trim()) : [markdown || ''];
  const isMultiPage = sections.length > 1 && markdown;
  
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Determinar orientação
      const pdfOrientation = orientation === 'auto' 
        ? (canvas.width > canvas.height ? 'landscape' : 'portrait')
        : orientation;
      
      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      // Header com título
      if (includeTitle && title) {
        pdf.setFontSize(16);
        pdf.text(title, 20, 30);
      }
      
      // Data
      if (includeDate) {
        pdf.setFontSize(10);
        pdf.text(new Date().toLocaleDateString('pt-BR'), canvas.width - 100, 30);
      }
      
      const yOffset = (includeTitle || includeDate) ? 50 : 0;
      pdf.addImage(imgData, 'PNG', 0, yOffset, canvas.width, canvas.height - yOffset);
      
      // Número da página
      if (includePageNumbers) {
        pdf.setFontSize(10);
        pdf.text('1', canvas.width / 2, canvas.height - 20);
      }
      
      pdf.save(filename);
      
      URL.revokeObjectURL(url);
      resolve();
    };
    
    img.onerror = reject;
    img.src = url;
  });
}
