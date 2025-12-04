// PDF Export - Multi-página com alta resolução
import { jsPDF } from 'jspdf';

interface PdfOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape' | 'auto';
  scale?: number;
}

export async function exportPdf(
  svgElement: SVGSVGElement,
  filename: string,
  options: PdfOptions = {},
  markdown?: string
): Promise<void> {
  const { scale = 3 } = options;
  
  // Detectar separadores para multi-página
  const hasSeparator = markdown?.match(/^(-{3,}|_{3,})$/m);
  
  // Pegar dimensões reais do SVG renderizado
  const svgRect = svgElement.getBoundingClientRect();
  const bbox = svgElement.getBBox();
  
  // Usar as maiores dimensões disponíveis
  const svgWidth = Math.max(svgRect.width, bbox.width + 50, 800);
  const svgHeight = Math.max(svgRect.height, bbox.height + 50, 600);
  
  // Determinar orientação baseado no conteúdo
  const isLandscape = svgWidth > svgHeight;
  const pdfOrientation = isLandscape ? 'landscape' : 'portrait';
  
  return new Promise((resolve, reject) => {
    try {
      // Criar canvas com alta resolução
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas não suportado'));
        return;
      }
      
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      
      // Fundo branco
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clonar e preparar SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', String(svgWidth));
      clonedSvg.setAttribute('height', String(svgHeight));
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      
      // Remover transformações que podem atrapalhar
      const gElements = clonedSvg.querySelectorAll('g[transform]');
      
      // Adicionar estilos inline
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = `
        * { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        text { font-size: 14px; }
      `;
      clonedSvg.insertBefore(style, clonedSvg.firstChild);
      
      // Serializar para base64
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      const img = new Image();
      
      img.onload = () => {
        try {
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
          
          const imgData = canvas.toDataURL('image/png', 1.0);
          
          // Criar PDF
          const pdf = new jsPDF({
            orientation: pdfOrientation,
            unit: 'mm',
            format: 'a4',
          });
          
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 5;
          
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - (margin * 2);
          
          // Calcular proporção mantendo aspect ratio
          const imgRatio = canvas.width / canvas.height;
          const pageRatio = availableWidth / availableHeight;
          
          let finalWidth: number;
          let finalHeight: number;
          
          if (imgRatio > pageRatio) {
            // Imagem mais larga - limitar pela largura
            finalWidth = availableWidth;
            finalHeight = availableWidth / imgRatio;
          } else {
            // Imagem mais alta - limitar pela altura
            finalHeight = availableHeight;
            finalWidth = availableHeight * imgRatio;
          }
          
          // Centralizar na página
          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;
          
          // Se tem separadores, criar múltiplas páginas
          if (hasSeparator && markdown) {
            const sections = markdown.split(/^-{3,}$|^_{3,}$/m).filter(s => s.trim());
            
            if (sections.length > 1) {
              // Primeira página com o mapa completo
              pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
              
              // Adicionar número da página
              pdf.setFontSize(10);
              pdf.setTextColor(150);
              pdf.text(`Página 1 de ${sections.length + 1}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
              
              // Páginas adicionais com seções do texto
              sections.forEach((section, index) => {
                pdf.addPage();
                
                // Título da seção
                const lines = section.trim().split('\n');
                const title = lines[0]?.replace(/^#+\s*/, '') || `Seção ${index + 1}`;
                
                pdf.setFontSize(16);
                pdf.setTextColor(0);
                pdf.text(title, margin, margin + 10);
                
                // Conteúdo
                pdf.setFontSize(11);
                const content = lines.slice(1).join('\n').trim();
                const splitText = pdf.splitTextToSize(content, availableWidth);
                pdf.text(splitText, margin, margin + 20);
                
                // Número da página
                pdf.setFontSize(10);
                pdf.setTextColor(150);
                pdf.text(`Página ${index + 2} de ${sections.length + 1}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
              });
            } else {
              pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            }
          } else {
            // Página única com o mapa
            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
          }
          
          const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
          pdf.save(finalFilename);
          
          resolve();
        } catch (err) {
          console.error('Erro ao gerar PDF:', err);
          reject(err);
        }
      };
      
      img.onerror = (err) => {
        console.error('Erro ao carregar imagem:', err);
        reject(new Error('Falha ao processar SVG'));
      };
      
      img.src = dataUrl;
      
    } catch (err) {
      console.error('Erro na exportação:', err);
      reject(err);
    }
  });
}
