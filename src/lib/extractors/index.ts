// ============================================
// INDEX DE EXTRACTORS
// ============================================

export { extractFromPdf, pdfToMarkdown } from './pdf';
export { extractFromPptx, pptxToMarkdown } from './pptx';
export { extractFromTxt, extractFromMd, txtToMarkdown } from './txt';
export { extractFromDocx, docxToMarkdown } from './docx';
export { extractWithOcr, ocrToMarkdown, terminateOcrWorker } from './ocr';
