import { AcademicQuestion, EducationLevel, ResponseLength, WritingStyle } from '../types';
import { tokenizeSpanish, ScoredChunk } from './retrievalEngine';

/**
 * Robust local pattern detector for academic questions, consignas, and exercises
 */
export function detectQuestionsLocally(text: string): Omit<AcademicQuestion, 'id'>[] {
  if (!text || text.trim().length === 0) return [];

  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions: Omit<AcademicQuestion, 'id'>[] = [];
  let currentNumber = 1;

  // Regex patterns
  const numberedPattern = /^((?:pregunta|ejercicio|actividad|consigna|ítem|caso)?\s*(\d+(?:\.\d+)*|[a-z]\))\s*[:.-]?)\s*(.*)/i;
  const commandVerbs = /^(defina|explique|describa|enumere|compare|diferencie|clasifique|analice|justifique|desarrolle|resuma|complete|relacione|identifique|resuelva|argumente|mencione|señale|determine|indique|elabore|redacte|establezca)\b/i;
  const questionMarkPattern = /^[¿?].+[?]$/i;

  let currentBlock: { number: string; prompt: string; subQuestions: string[] } | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const matchNumbered = line.match(numberedPattern);

    const isQuestionMark = questionMarkPattern.test(line) || line.includes('?');
    const isCommand = commandVerbs.test(line);

    if (matchNumbered) {
      if (currentBlock) {
        questions.push(buildQuestionItem(currentBlock));
      }
      const rawNum = matchNumbered[1].replace(/[:.-]$/, '').trim();
      const rest = matchNumbered[3].trim();
      currentBlock = {
        number: rawNum || String(currentNumber++),
        prompt: rest || line,
        subQuestions: [],
      };
    } else if (isCommand || isQuestionMark) {
      // New standalone question
      if (currentBlock) {
        questions.push(buildQuestionItem(currentBlock));
      }
      currentBlock = {
        number: String(currentNumber++),
        prompt: line,
        subQuestions: [],
      };
    } else if (currentBlock) {
      // Check if line is subquestion like a) or b)
      if (/^[a-h]\)\s+/i.test(line) || /^[-*•]\s+/.test(line)) {
        currentBlock.subQuestions.push(line);
      } else {
        // Continuation of current prompt
        currentBlock.prompt += ' ' + line;
      }
    }
  }

  if (currentBlock) {
    questions.push(buildQuestionItem(currentBlock));
  }

  // Fallback: if no structured questions detected, split by question marks or line groups
  if (questions.length === 0) {
    const segments = text.split(/(?<=[?.])\s+(?=[A-Z¿])/);
    for (let idx = 0; idx < segments.length; idx++) {
      const seg = segments[idx].trim();
      if (seg.length > 15 && (seg.includes('?') || commandVerbs.test(seg))) {
        questions.push({
          number: String(idx + 1),
          prompt: seg,
          answer: '',
          status: 'pending',
          citations: [],
          warnings: [],
          modeUsed: 'offline',
        });
      }
    }
  }

  return questions;
}

function buildQuestionItem(block: { number: string; prompt: string; subQuestions: string[] }): Omit<AcademicQuestion, 'id'> {
  const fullPrompt = block.subQuestions.length > 0
    ? `${block.prompt}\n${block.subQuestions.map((s) => `  ${s}`).join('\n')}`
    : block.prompt;

  return {
    number: block.number,
    prompt: fullPrompt,
    subQuestions: block.subQuestions,
    answer: '',
    status: 'pending',
    citations: [],
    warnings: [],
    modeUsed: 'offline',
  };
}

/**
 * Local offline answer synthesis engine
 * Strictly respects material-only constraint without hallucinations
 */
export function generateAnswerLocally(
  question: string,
  topChunks: ScoredChunk[],
  options: {
    strictMode: boolean;
    educationLevel: EducationLevel;
    responseLength: ResponseLength;
    writingStyle: WritingStyle;
    complementWithGeneral?: boolean;
  }
): {
  answer: string;
  status: 'sufficient' | 'partial' | 'insufficient';
  citations: any[];
  missingInfoNotice?: string;
  warnings: string[];
} {
  const queryTokens = tokenizeSpanish(question);
  const warnings: string[] = [];

  // If no chunks or score too low, strict compliance requirement
  if (!topChunks || topChunks.length === 0 || topChunks[0].score < 0.2) {
    return {
      answer: 'No se encontró información suficiente en el material proporcionado para responder esta pregunta con seguridad.',
      status: 'insufficient',
      citations: [],
      missingInfoNotice: 'El material de estudio no contiene menciones de los términos clave de la pregunta.',
      warnings: ['Información ausente en la fuente documental.'],
    };
  }

  // Best chunk
  const bestChunk = topChunks[0];
  const matchedTokens = bestChunk.matchedKeywords || [];

  // Extract relevant sentences from the top chunks
  const relevantSentences: string[] = [];
  const citations: any[] = [];

  for (const chunk of topChunks.slice(0, 3)) {
    if (chunk.score < 0.15) continue;

    const sentences = chunk.text.split(/(?<=[.!?])\s+/);
    for (const sent of sentences) {
      const cleanSent = sent.trim();
      if (cleanSent.length < 25) continue;

      const sentTokens = tokenizeSpanish(cleanSent);
      const overlap = sentTokens.filter((t) => queryTokens.includes(t));

      if (overlap.length >= 2 || (queryTokens.length <= 2 && overlap.length >= 1)) {
        if (!relevantSentences.includes(cleanSent)) {
          relevantSentences.push(cleanSent);
        }
      }
    }

    if (chunk.score > 0.4 && citations.length < 3) {
      citations.push({
        fragmentIndex: chunk.chunkIndex,
        docTitle: chunk.docTitle,
        page: chunk.page,
        section: chunk.section,
        quoteExcerpt: chunk.text.slice(0, 160) + '...',
        confidence: Math.min(95, Math.round(chunk.score * 100)),
      });
    }
  }

  // If no sentences matched specifically
  if (relevantSentences.length === 0) {
    if (bestChunk.score > 0.3) {
      // Partial fallback from best chunk
      const firstLines = bestChunk.text.slice(0, 300).trim();
      return {
        answer: `De acuerdo con el documento "${bestChunk.docTitle}" (${bestChunk.page}, apartado "${bestChunk.section}"):\n\n${firstLines}`,
        status: 'partial',
        citations: [
          {
            fragmentIndex: bestChunk.chunkIndex,
            docTitle: bestChunk.docTitle,
            page: bestChunk.page,
            section: bestChunk.section,
            quoteExcerpt: firstLines.slice(0, 140) + '...',
            confidence: 60,
          },
        ],
        missingInfoNotice: 'Se identificó el apartado temático, pero no se hallaron definiciones exhaustivas de todos los términos.',
        warnings: ['Respuesta parcial basada en el fragmento más afín.'],
      };
    }

    return {
      answer: 'No se encontró información suficiente en el material proporcionado para responder esta pregunta con seguridad.',
      status: 'insufficient',
      citations: [],
      missingInfoNotice: 'No se encontraron oraciones vinculadas directamente con la consulta en los fragmentos del texto.',
      warnings: ['Sin coincidencia suficiente.'],
    };
  }

  // Synthesize answer based on level & length
  let synthesized = '';
  const prefix = getEducationPrefix(options.educationLevel, bestChunk);
  const coreBody = relevantSentences.slice(0, options.responseLength === 'Muy breve' ? 1 : options.responseLength === 'Breve' ? 2 : 4).join(' ');

  synthesized = `${prefix} ${coreBody}`;

  if (options.complementWithGeneral && options.strictMode === false) {
    synthesized += '\n\n[Explicación complementaria]: Se sugiere contrastar estos conceptos con las aplicaciones prácticas correspondientes al contexto de la materia.';
  }

  const isPartial = matchedTokens.length < Math.max(1, Math.floor(queryTokens.length * 0.5));

  return {
    answer: synthesized,
    status: isPartial ? 'partial' : 'sufficient',
    citations,
    missingInfoNotice: isPartial ? 'El material responde parcialmente a los términos de la pregunta.' : undefined,
    warnings,
  };
}

function getEducationPrefix(level: EducationLevel, chunk: ScoredChunk): string {
  switch (level) {
    case 'Escuela':
      return `Con base en la lectura de "${chunk.docTitle}" (${chunk.page}):`;
    case 'Colegio':
      return `De acuerdo con lo expuesto en el material "${chunk.docTitle}" (${chunk.page}, sección ${chunk.section}):`;
    case 'Formación técnica':
      return `Según la documentación técnica de referencia ("${chunk.docTitle}", ${chunk.page}):`;
    case 'Universidad o facultad':
    default:
      return `A partir del análisis fundamentado en "${chunk.docTitle}" (${chunk.page}, apartado «${chunk.section}»), se establece que:`;
  }
}
