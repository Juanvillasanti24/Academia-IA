import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '30mb' }));

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    online: true,
    aiAvailable: !!ai,
    model: 'gemini-3.8-flash',
    platform: 'Academia IA Server',
  });
});

// Detect questions and assignment tasks
app.post('/api/gemini/detect-questions', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.status(503).json({ error: 'El servicio de IA en línea no está disponible (falta clave de API).' });
      return;
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'El texto de la tarea no puede estar vacío.' });
      return;
    }

    const prompt = `Analiza el siguiente texto extraído de una tarea académica, cuestionario, examen o guía de estudio.
Tu objetivo es identificar con absoluta precisión TODAS las preguntas, consignas, ejercicios e instrucciones que el estudiante debe resolver.

REGLAS CRÍTICAS:
1. Conserva el orden original del documento.
2. Conserva la numeración original (ej. "1.", "1.1", "a)", "Actividad 3") si existe. Si no tiene, asigna el correlativo.
3. Reconoce verbos de instrucción académica: ¿Qué es?, Defina, Cite, Explique, Describa, Enumere, Compare, Diferencie, Clasifique, Analice, Justifique, Desarrolle, Resuma, Complete, Relacione, Identifique, Resuelva, Argumente, etc.
4. Detecta subpreguntas o incisos asociados a una consigna principal.
5. NO inventes preguntas que no aparezcan en el texto.
6. NO confundas títulos generales de secciones con preguntas, a menos que sean consignas.

TEXTO DE LA TAREA:
"""
${text.slice(0, 50000)}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.STRING, description: 'Número o identificador original, ej. "1", "2.a", "Consigna 3"' },
                  prompt: { type: Type.STRING, description: 'Enunciado completo de la pregunta o instrucción' },
                  instructionType: { type: Type.STRING, description: 'Tipo de instrucción: conceptual, análisis, enumeración, comparación, ejercicio, etc.' },
                  subQuestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Sub-incisos si existen (ej. a, b, c)'
                  }
                },
                required: ['number', 'prompt'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const outputText = response.text || '{}';
    const parsed = JSON.parse(outputText);
    res.json({ questions: parsed.questions || [] });
  } catch (error: any) {
    console.error('Error in detect-questions:', error);
    res.status(500).json({ error: error.message || 'Error al procesar la detección de preguntas.' });
  }
});

// Answer a specific question or batch with strict material grounding
app.post('/api/gemini/answer', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.status(503).json({ error: 'El servicio de IA en línea no está disponible (falta clave de API).' });
      return;
    }

    const {
      question,
      questionNumber,
      relevantChunks, // Array of { text, page, section, docTitle }
      strictMode = true,
      educationLevel = 'Universidad o facultad',
      responseLength = 'Desarrollada',
      writingStyle = 'Lenguaje académico',
      complementWithGeneral = false,
    } = req.body;

    if (!question) {
      res.status(400).json({ error: 'La pregunta es obligatoria.' });
      return;
    }

    const chunksText = (relevantChunks || [])
      .map((c: any, i: number) => `[FRAGMENTO ${i + 1} | Doc: ${c.docTitle || 'Material'} | Pág: ${c.page || 'N/A'} | Sección: ${c.section || 'General'}]\n${c.text}`)
      .join('\n\n---\n\n');

    const prompt = `Eres el motor de resolución académica de "Academia IA", especializado en responder tareas estudiantiles con máxima fidelidad documental y rigor metodológico.

PARÁMETROS DEL TRABAJO:
- Nivel educativo del estudiante: ${educationLevel}
- Extensión esperada: ${responseLength}
- Estilo de redacción: ${writingStyle}
- Modo estrictamente exclusivo de material: ${strictMode ? 'ACTIVADO' : 'DESACTIVADO'}
- Complementar con conocimientos generales: ${complementWithGeneral ? 'PERMITIDO (distinguir claramente)' : 'ESTRICTAMENTE PROHIBIDO'}

REGLAS DE FIDELIDAD (MÁXIMA PRIORIDAD):
1. ${
      strictMode
        ? `Debes responder ÚNICAMENTE basándote en los fragmentos del material de estudio proporcionado abajo.
- NO inventes información, autores, fechas, definiciones, citas textuales ni páginas.
- Si en los fragmentos proporcionados NO existe información para responder con certeza, responde EXACTAMENTE:
  "No se encontró información suficiente en el material proporcionado para responder esta pregunta con seguridad."
- Si la información es parcial, responde la parte fundamentada e indica explícitamente qué información falta en el material.`
        : `Responde fundamentándote prioritariamente en el material, y si complementas conceptos generales, sepáralos bajo un subtítulo claro "Explicación complementaria".`
    }
2. Adapta el léxico y profundidad al nivel "${educationLevel}".
3. Respeta la extensión solicitada ("${responseLength}") sin divagar.
4. Cita los fragmentos reales utilizados indicando número de página o sección cuando aparezca en los metadatos del fragmento.
5. NO inventes números de página ni datos bibliográficos.

PREGUNTA A RESOLVER (N.° ${questionNumber || '1'}):
"""
${question}
"""

MATERIAL DE ESTUDIO DISPONIBLE (FRAGMENTOS RECUPERADOS):
"""
${chunksText || '(No se encontraron fragmentos de texto en el material para esta consulta)'}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING, description: 'Respuesta académica redactada' },
            status: {
              type: Type.STRING,
              enum: ['sufficient', 'partial', 'insufficient'],
              description: 'Nivel de suficiencia de la información encontrada en el material'
            },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fragmentIndex: { type: Type.INTEGER },
                  page: { type: Type.STRING },
                  section: { type: Type.STRING },
                  quoteExcerpt: { type: Type.STRING, description: 'Cita textual breve o concepto extraído directamente' },
                },
              },
            },
            missingInfoNotice: { type: Type.STRING, description: 'Explicación de qué faltó si fue parcial o insuficiente' },
            complementaryNote: { type: Type.STRING, description: 'Nota de conocimientos generales si se activó ese modo' },
          },
          required: ['answer', 'status'],
        },
      },
    });

    const outputText = response.text || '{}';
    const parsed = JSON.parse(outputText);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in answer generator:', error);
    res.status(500).json({ error: error.message || 'Error al generar la respuesta.' });
  }
});

// Analyze material: extract topics and key definitions
app.post('/api/gemini/analyze-material', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.status(503).json({ error: 'El servicio de IA en línea no está disponible (falta clave de API).' });
      return;
    }

    const { text, title } = req.body;
    if (!text || text.length < 10) {
      res.status(400).json({ error: 'Texto insuficiente para análisis.' });
      return;
    }

    const prompt = `Analiza este material académico ("${title || 'Material de Estudio'}").
Extrae un resumen ejecutivo (máx 3 párrafos), los 5 a 10 conceptos o temas principales tratados, y una lista de definiciones clave encontradas en el texto.

TEXTO:
"""
${text.slice(0, 45000)}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyDefinitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ['term', 'definition'],
              },
            },
          },
          required: ['summary', 'topics', 'keyDefinitions'],
        },
      },
    });

    const outputText = response.text || '{}';
    res.json(JSON.parse(outputText));
  } catch (error: any) {
    console.error('Error in analyze-material:', error);
    res.status(500).json({ error: error.message || 'Error al analizar el material.' });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`[Academia IA Server] Running on http://localhost:${port} (${isDev ? 'Development' : 'Production'})`);
  });
}

startServer();
