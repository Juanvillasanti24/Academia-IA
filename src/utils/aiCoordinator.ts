import { AcademicQuestion, ProcessedDocument, Project } from '../types';
import { chunkDocument, retrieveRelevantChunks } from './retrievalEngine';
import { detectQuestionsLocally, generateAnswerLocally } from './offlineEngine';

export interface AnswerGenerationProgress {
  currentQuestion: number;
  totalQuestions: number;
  questionPrompt: string;
  mode: 'online' | 'offline' | 'hybrid';
  status: 'processing' | 'done' | 'error';
}

/**
 * Checks server health and online AI readiness
 */
export async function checkServerHealth(): Promise<{ online: boolean; aiAvailable: boolean; model: string }> {
  try {
    const res = await fetch('/api/health', { method: 'GET' });
    if (!res.ok) throw new Error('Servidor respondió con código ' + res.status);
    const data = await res.json();
    return {
      online: true,
      aiAvailable: !!data.aiAvailable,
      model: data.model || 'gemini-3.8-flash',
    };
  } catch {
    return {
      online: false,
      aiAvailable: false,
      model: 'Ninguno (Modo sin conexión)',
    };
  }
}

/**
 * Detects questions from the assignment task according to selected mode
 */
export async function detectQuestions(
  taskDoc: ProcessedDocument,
  mode: 'online' | 'offline' | 'hybrid'
): Promise<AcademicQuestion[]> {
  const localQuestions = detectQuestionsLocally(taskDoc.text);

  // If offline mode is requested or browser is offline
  if (mode === 'offline' || !navigator.onLine) {
    return localQuestions.map((q, idx) => ({
      ...q,
      id: 'q_' + Date.now() + '_' + idx,
      modeUsed: 'offline',
    }));
  }

  // Try online detection via Gemini backend
  try {
    const res = await fetch('/api/gemini/detect-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: taskDoc.text }),
    });

    if (!res.ok) {
      throw new Error(`Error del servidor (${res.status})`);
    }

    const data = await res.json();
    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions.map((q: any, idx: number) => ({
        id: 'q_' + Date.now() + '_' + idx,
        number: q.number || String(idx + 1),
        prompt: q.prompt,
        instructionType: q.instructionType,
        subQuestions: q.subQuestions || [],
        answer: '',
        status: 'pending' as const,
        citations: [],
        warnings: [],
        modeUsed: 'online' as const,
      }));
    }
  } catch (err) {
    console.warn('Fallo en detección online, usando motor local:', err);
  }

  // Fallback to local
  return localQuestions.map((q, idx) => ({
    ...q,
    id: 'q_' + Date.now() + '_' + idx,
    modeUsed: 'offline',
  }));
}

/**
 * Solves a single academic question respecting strict material constraints
 */
export async function solveSingleQuestion(
  project: Project,
  question: AcademicQuestion
): Promise<AcademicQuestion> {
  const studyDoc = project.studyMaterial;
  if (!studyDoc) {
    return {
      ...question,
      answer: 'No se puede responder porque no se ha importado el Material de Estudio.',
      status: 'error',
      warnings: ['Material de estudio faltante.'],
    };
  }

  // 1. Chunk document locally
  const allChunks = chunkDocument(studyDoc);
  // 2. Retrieve top relevant chunks for this specific question
  const topChunks = retrieveRelevantChunks(question.prompt, allChunks, 4);

  const effectiveMode = project.mode;

  // If strictly offline or offline browser
  if (effectiveMode === 'offline' || !navigator.onLine) {
    const localResult = generateAnswerLocally(question.prompt, topChunks, {
      strictMode: project.strictMode,
      educationLevel: project.educationLevel,
      responseLength: project.responseLength,
      writingStyle: project.writingStyle,
      complementWithGeneral: project.complementWithGeneral,
    });

    return {
      ...question,
      answer: localResult.answer,
      status: localResult.status,
      citations: localResult.citations,
      missingInfoNotice: localResult.missingInfoNotice,
      warnings: localResult.warnings,
      modeUsed: 'offline',
    };
  }

  // If online or hybrid: call Gemini with localized chunks
  try {
    const res = await fetch('/api/gemini/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question.prompt,
        questionNumber: question.number,
        relevantChunks: topChunks.map((c) => ({
          text: c.text,
          page: c.page,
          section: c.section,
          docTitle: c.docTitle,
        })),
        strictMode: project.strictMode,
        educationLevel: project.educationLevel,
        responseLength: project.responseLength,
        writingStyle: project.writingStyle,
        complementWithGeneral: project.complementWithGeneral,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Error HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      ...question,
      answer: data.answer,
      status: data.status || 'sufficient',
      citations: (data.citations || []).map((c: any) => ({
        ...c,
        docTitle: studyDoc.name,
      })),
      missingInfoNotice: data.missingInfoNotice,
      complementaryNote: data.complementaryNote,
      warnings: [],
      modeUsed: effectiveMode === 'hybrid' ? 'hybrid' : 'online',
    };
  } catch (error: any) {
    console.warn(`Error en respuesta online para pregunta ${question.number}, usando motor local:`, error);

    // Fallback to offline engine
    const localResult = generateAnswerLocally(question.prompt, topChunks, {
      strictMode: project.strictMode,
      educationLevel: project.educationLevel,
      responseLength: project.responseLength,
      writingStyle: project.writingStyle,
      complementWithGeneral: project.complementWithGeneral,
    });

    return {
      ...question,
      answer: localResult.answer,
      status: localResult.status,
      citations: localResult.citations,
      missingInfoNotice: localResult.missingInfoNotice,
      warnings: [`Procesado con motor local debido a: ${error.message || 'error de conexión'}`],
      modeUsed: 'offline',
    };
  }
}
