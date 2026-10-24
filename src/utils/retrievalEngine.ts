import { ProcessedDocument, DocumentChunk } from '../types';

const SPANISH_STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'se', 'del', 'las', 'por', 'un', 'para', 'con',
  'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí',
  'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay',
  'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra',
  'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos',
  'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada',
  'muchos', 'cual', 'sea', 'poco', 'ella', 'mayor', 'mucha', 'incluso', 'cada', 'bien', 'sino',
  'tras', 'ser', 'es', 'son', 'era', 'fue', 'ha', 'han', 'tiene', 'tienen', 'hacer', 'puede',
  'pueden', 'así', 'cómo', 'cuál', 'cuáles', 'quién', 'quiénes', 'dónde', 'cuándo'
]);

export function tokenizeSpanish(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents for matching
    .replace(/[^a-z0-9áéíóúñ\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !SPANISH_STOPWORDS.has(w));
}

/**
 * Splits document into semantic chunks of ~300 words with metadata
 */
export function chunkDocument(doc: ProcessedDocument): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkCounter = 0;

  // If document has page-level breakdown, chunk per page
  if (doc.pages && doc.pages.length > 0) {
    for (const page of doc.pages) {
      if (!page.text || page.text.trim().length === 0) continue;

      const paragraphs = page.text.split(/\n\s*\n|\r\n\s*\r\n/);
      let currentChunkText = '';
      let currentSection = 'General';

      for (const para of paragraphs) {
        const cleanPara = para.trim();
        if (!cleanPara) continue;

        // Check if paragraph looks like a section heading
        if (cleanPara.length < 80 && /^[A-Z0-9ÁÉÍÓÚÑ\s:.-]{3,}$/.test(cleanPara)) {
          currentSection = cleanPara;
        }

        const combined = currentChunkText ? currentChunkText + '\n\n' + cleanPara : cleanPara;
        const wordCount = combined.split(/\s+/).length;

        if (wordCount >= 280) {
          chunkCounter++;
          chunks.push({
            chunkIndex: chunkCounter,
            docTitle: doc.name,
            page: page.pageNum ? `Página ${page.pageNum}` : 'Página sin número',
            section: currentSection,
            text: combined,
            keywords: tokenizeSpanish(combined),
          });
          currentChunkText = '';
        } else {
          currentChunkText = combined;
        }
      }

      if (currentChunkText.trim().length > 0) {
        chunkCounter++;
        chunks.push({
          chunkIndex: chunkCounter,
          docTitle: doc.name,
          page: page.pageNum ? `Página ${page.pageNum}` : 'Página sin número',
          section: currentSection,
          text: currentChunkText.trim(),
          keywords: tokenizeSpanish(currentChunkText),
        });
      }
    }
  } else {
    // Fallback: split raw text into blocks
    const words = doc.text.split(/\s+/);
    const chunkSize = 300;
    for (let i = 0; i < words.length; i += chunkSize) {
      chunkCounter++;
      const textBlock = words.slice(i, i + chunkSize).join(' ');
      chunks.push({
        chunkIndex: chunkCounter,
        docTitle: doc.name,
        page: `Aprox. Pág. ${Math.floor(i / 350) + 1}`,
        section: 'General',
        text: textBlock,
        keywords: tokenizeSpanish(textBlock),
      });
    }
  }

  return chunks;
}

export interface ScoredChunk extends DocumentChunk {
  score: number;
  matchedKeywords: string[];
}

/**
 * Retrieves the most relevant chunks for a question using BM25-inspired lexical matching
 */
export function retrieveRelevantChunks(
  question: string,
  chunks: DocumentChunk[],
  topK: number = 4
): ScoredChunk[] {
  if (!chunks || chunks.length === 0) return [];

  const queryTokens = tokenizeSpanish(question);
  if (queryTokens.length === 0) {
    return chunks.slice(0, topK).map((c) => ({ ...c, score: 0.1, matchedKeywords: [] }));
  }

  // Calculate term frequency and inverse document frequency
  const N = chunks.length;
  const docFreq: Record<string, number> = {};

  for (const token of queryTokens) {
    let count = 0;
    for (const chunk of chunks) {
      const keywords = chunk.keywords || tokenizeSpanish(chunk.text);
      if (keywords.includes(token)) count++;
    }
    docFreq[token] = count;
  }

  const scored: ScoredChunk[] = chunks.map((chunk) => {
    const chunkTokens = chunk.keywords || tokenizeSpanish(chunk.text);
    const chunkTokenCount = chunkTokens.length;
    let score = 0;
    const matched: string[] = [];

    for (const token of queryTokens) {
      const tf = chunkTokens.filter((t) => t === token).length;
      if (tf > 0) {
        matched.push(token);
        // BM25-like weighting
        const df = docFreq[token] || 1;
        const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
        const tfNorm = (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (chunkTokenCount / 250)));
        score += idf * tfNorm;
      }
    }

    return {
      ...chunk,
      score: parseFloat(score.toFixed(3)),
      matchedKeywords: matched,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}
