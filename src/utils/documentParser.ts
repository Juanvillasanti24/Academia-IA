import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ProcessedDocument, DocumentCategory, DocumentPage } from '../types';
import { runOCR } from './ocrService';

// Configure pdfjs worker to match the exact installed pdfjs-dist version (works online and offline)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ParseOptions {
  category: DocumentCategory;
  onProgress?: (progress: number, message: string) => void;
  enableOCR?: boolean;
}

/**
 * Extracts content from Microsoft Word DOCX file using Mammoth
 */
export async function parseDocxFile(file: File, options: ParseOptions): Promise<ProcessedDocument> {
  const { onProgress } = options;
  if (onProgress) onProgress(15, 'Leyendo estructura del archivo DOCX...');

  const arrayBuffer = await file.arrayBuffer();
  
  if (onProgress) onProgress(45, 'Extrayendo texto, títulos, tablas y formato...');
  
  // Extract HTML to detect headings and tables
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });

  const rawText = rawTextResult.value.trim();
  const html = htmlResult.value;

  if (rawText.length === 0) {
    throw new Error('El documento DOCX está vacío o no contiene texto legible.');
  }

  // Parse headings from HTML
  const headings: string[] = [];
  const headingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
  if (headingMatches) {
    for (const match of headingMatches) {
      const clean = match.replace(/<[^>]+>/g, '').trim();
      if (clean && !headings.includes(clean)) {
        headings.push(clean);
      }
    }
  }

  // Estimate pages (~350 words per page standard academic document)
  const words = rawText.split(/\s+/).filter(Boolean);
  const wordsPerPage = 350;
  const estimatedPageCount = Math.max(1, Math.ceil(words.length / wordsPerPage));

  const pages: DocumentPage[] = [];
  for (let i = 0; i < estimatedPageCount; i++) {
    const start = i * wordsPerPage;
    const end = Math.min(words.length, (i + 1) * wordsPerPage);
    const pageText = words.slice(start, end).join(' ');
    pages.push({
      pageNum: i + 1,
      text: pageText,
      hasImages: html.includes('<img'),
    });
  }

  if (onProgress) onProgress(100, 'DOCX procesado correctamente.');

  return {
    id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    category: options.category,
    name: file.name,
    size: file.size,
    type: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    format: 'docx',
    text: rawText,
    pageCount: estimatedPageCount,
    wordCount: words.length,
    headings,
    pages,
    uploadedAt: new Date().toISOString(),
    status: 'ready',
  };
}

/**
 * Extracts content from PDF file using PDF.js with optional OCR for scanned pages
 */
export async function parsePdfFile(file: File, options: ParseOptions): Promise<ProcessedDocument> {
  const { onProgress, enableOCR = true } = options;
  if (onProgress) onProgress(10, 'Cargando documento PDF...');

  const arrayBuffer = await file.arrayBuffer();
  
  let loadingTask;
  try {
    loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    });
  } catch (e: any) {
    throw new Error('No se pudo inicializar el lector PDF: ' + e.message);
  }

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  if (numPages === 0) {
    throw new Error('El archivo PDF no contiene páginas.');
  }

  const pages: DocumentPage[] = [];
  const headings: string[] = [];
  let fullText = '';
  let ocrCount = 0;

  for (let i = 1; i <= numPages; i++) {
    const pct = Math.round(15 + (i / numPages) * 70);
    if (onProgress) onProgress(pct, `Extrayendo texto de página ${i} de ${numPages}...`);

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Concatenate text items preserving order
    let pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    let hasImages = false;
    let isScanned = false;
    let ocrApplied = false;
    let ocrConfidence: number | undefined;

    // Check if page has operator list images or very low text density (< 40 characters)
    if (pageText.length < 40 && enableOCR) {
      isScanned = true;
      hasImages = true;
      if (onProgress) onProgress(pct, `Página ${i} escaneada o con poco texto; aplicando OCR...`);

      try {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Render page to canvas for OCR
          // @ts-ignore
          await page.render({ canvasContext: ctx, viewport }).promise;
          const ocrResult = await runOCR(canvas);
          if (ocrResult.text.length > 0) {
            pageText = ocrResult.text;
            ocrApplied = true;
            ocrConfidence = ocrResult.confidence;
            ocrCount++;
          }
        }
      } catch (ocrErr) {
        console.warn(`No se pudo ejecutar OCR en página ${i}:`, ocrErr);
      }
    }

    // Heuristic detection of headings in page text: uppercase or short bold-like lines
    const lines = pageText.split(/(?<=[.!?])\s+|\n+/);
    for (const line of lines) {
      const clean = line.trim();
      if (
        clean.length > 3 &&
        clean.length < 80 &&
        (/^[A-Z0-9ÁÉÍÓÚÑ\s:.-]{4,}$/.test(clean) || /^(Capítulo|Unidad|Tema|Módulo|\d+(\.\d+)*)\s+/i.test(clean))
      ) {
        if (!headings.includes(clean)) {
          headings.push(clean);
        }
      }
    }

    pages.push({
      pageNum: i,
      text: pageText,
      hasImages,
      isScanned,
      ocrApplied,
      ocrConfidence,
    });

    fullText += `\n[PÁGINA ${i}]\n` + pageText;
  }

  const words = fullText.split(/\s+/).filter(Boolean);
  if (words.length === 0 && !ocrCount) {
    throw new Error('El PDF no contiene texto seleccionable ni imágenes legibles.');
  }

  if (onProgress) onProgress(100, `Lectura PDF completada (${numPages} págs, ${ocrCount} con OCR).`);

  return {
    id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    category: options.category,
    name: file.name,
    size: file.size,
    type: 'application/pdf',
    format: 'pdf',
    text: fullText.trim(),
    pageCount: numPages,
    wordCount: words.length,
    headings: headings.slice(0, 25),
    pages,
    uploadedAt: new Date().toISOString(),
    status: 'ready',
  };
}

/**
 * Universal file processor with format validation and limits
 */
export async function processUploadedFile(file: File, options: ParseOptions): Promise<ProcessedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const maxBytes = 40 * 1024 * 1024; // 40MB

  if (file.size > maxBytes) {
    throw new Error(`El archivo supera el tamaño máximo permitido (${Math.round(maxBytes / (1024 * 1024))} MB).`);
  }

  if (file.size === 0) {
    throw new Error('El archivo seleccionado está vacío (0 bytes).');
  }

  if (extension === 'docx') {
    return parseDocxFile(file, options);
  } else if (extension === 'pdf') {
    return parsePdfFile(file, options);
  } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(extension || '')) {
    // Pure image file -> OCR
    if (options.onProgress) options.onProgress(20, 'Analizando imagen mediante OCR...');
    const ocrResult = await runOCR(file, (p, msg) => {
      if (options.onProgress) options.onProgress(p, msg);
    });

    if (!ocrResult.text) {
      throw new Error('No se pudo extraer texto de la imagen mediante OCR.');
    }

    return {
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      category: options.category,
      name: file.name,
      size: file.size,
      type: file.type || 'image/jpeg',
      format: 'image',
      text: ocrResult.text,
      pageCount: 1,
      wordCount: ocrResult.wordsCount,
      headings: ['Imagen procesada por OCR'],
      pages: [
        {
          pageNum: 1,
          text: ocrResult.text,
          hasImages: true,
          isScanned: true,
          ocrApplied: true,
          ocrConfidence: ocrResult.confidence,
        },
      ],
      uploadedAt: new Date().toISOString(),
      status: 'ready',
    };
  } else if (['txt', 'md'].includes(extension || '')) {
    const text = await file.text();
    const words = text.split(/\s+/).filter(Boolean);
    return {
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      category: options.category,
      name: file.name,
      size: file.size,
      type: 'text/plain',
      format: 'text',
      text,
      pageCount: 1,
      wordCount: words.length,
      headings: [],
      pages: [{ pageNum: 1, text, hasImages: false }],
      uploadedAt: new Date().toISOString(),
      status: 'ready',
    };
  } else {
    throw new Error(`Formato .${extension} no admitido. Por favor selecciona un documento DOCX, PDF o imagen.`);
  }
}
