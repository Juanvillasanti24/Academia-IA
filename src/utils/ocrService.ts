import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  wordsCount: number;
  warnings: string[];
}

/**
 * Preprocesses an image or canvas element to increase OCR accuracy for academic scans:
 * - Grayscale conversion
 * - Contrast enhancement
 * - Adaptive thresholding
 */
export function preprocessCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Grayscale and contrast stretch
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminance
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;
    // Simple high contrast stretch
    gray = gray > 140 ? Math.min(255, gray * 1.1) : Math.max(0, gray * 0.9);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Executes OCR on an image file, blob, or canvas with progress reporting
 */
export async function runOCR(
  imageSource: File | Blob | HTMLCanvasElement | string,
  onProgress?: (progress: number, statusText: string) => void,
  lang: string = 'spa'
): Promise<OCRResult> {
  const warnings: string[] = [];

  try {
    if (onProgress) onProgress(10, 'Inicializando motor OCR local...');

    // Create worker with Spanish language
    const worker = await createWorker(lang, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const prog = Math.round((m.progress || 0) * 80) + 15;
          onProgress(Math.min(98, prog), `Reconociendo texto (${Math.round((m.progress || 0) * 100)}%)...`);
        }
      },
    });

    if (onProgress) onProgress(30, 'Procesando imagen con OCR...');

    let source = imageSource;
    if (imageSource instanceof HTMLCanvasElement) {
      source = preprocessCanvas(imageSource);
    }

    const { data } = await worker.recognize(source);
    await worker.terminate();

    const confidence = Math.round(data.confidence || 0);
    const cleanedText = data.text.trim();

    if (cleanedText.length === 0) {
      warnings.push('No se detectó ningún texto legible en la imagen.');
    } else if (confidence < 60) {
      warnings.push(`Nivel de certeza de lectura bajo (${confidence}%). Recomendamos revisar y corregir manualmente.`);
    }

    if (onProgress) onProgress(100, 'Reconocimiento completado');

    const wordsList = (data as any).words;
    return {
      text: cleanedText,
      confidence,
      wordsCount: wordsList ? wordsList.length : cleanedText.split(/\s+/).filter(Boolean).length,
      warnings,
    };
  } catch (error: any) {
    console.warn('Error en Tesseract OCR:', error);
    return {
      text: '',
      confidence: 0,
      wordsCount: 0,
      warnings: [`Fallo en el reconocimiento óptico de caracteres: ${error.message || 'Error desconocido'}`],
    };
  }
}
