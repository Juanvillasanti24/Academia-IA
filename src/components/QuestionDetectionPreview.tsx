import React, { useState } from 'react';
import {
  ListChecks,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Edit2,
  Check,
} from 'lucide-react';
import { AcademicQuestion } from '../types';

interface QuestionDetectionPreviewProps {
  questions: AcademicQuestion[];
  onUpdateQuestions: (questions: AcademicQuestion[]) => void;
  onConfirmAndSolve: () => void;
  isSolving: boolean;
  mode: 'online' | 'offline' | 'hybrid';
}

export const QuestionDetectionPreview: React.FC<QuestionDetectionPreviewProps> = ({
  questions,
  onUpdateQuestions,
  onConfirmAndSolve,
  isSolving,
  mode,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleRemove = (id: string) => {
    onUpdateQuestions(questions.filter((q) => q.id !== id));
  };

  const handleStartEdit = (q: AcademicQuestion) => {
    setEditingId(q.id);
    setEditPrompt(q.prompt);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateQuestions(
      questions.map((q) => (q.id === id ? { ...q, prompt: editPrompt } : q))
    );
    setEditingId(null);
  };

  const handleAddQuestion = () => {
    if (!newPrompt.trim()) return;
    const newQ: AcademicQuestion = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      number: String(questions.length + 1),
      prompt: newPrompt.trim(),
      answer: '',
      status: 'pending',
      citations: [],
      warnings: [],
      modeUsed: mode,
    };
    onUpdateQuestions([...questions, newQ]);
    setNewPrompt('');
    setShowAddForm(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              Preguntas y Consignas Detectadas ({questions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Revisa, ajusta la redacción o agrega preguntas adicionales antes de generar las respuestas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar pregunta</span>
          </button>

          <button
            onClick={onConfirmAndSolve}
            disabled={isSolving || questions.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSolving ? 'Generando respuestas...' : `Generar Respuestas (${questions.length})`}
            </span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Add new question form */}
      {showAddForm && (
        <div className="my-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Nueva consigna o pregunta:
          </h4>
          <textarea
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Escribe la pregunta o consigna académica..."
            rows={2}
            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddQuestion}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
            >
              Guardar en la lista
            </button>
          </div>
        </div>
      )}

      {/* List of questions */}
      <div className="mt-4 space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {questions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No se han detectado preguntas en el documento. Puedes agregar una manualmente.
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                  {q.number || idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  {editingId === q.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        rows={2}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveEdit(q.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Listo
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug break-words">
                        {q.prompt}
                      </p>
                      {q.subQuestions && q.subQuestions.length > 0 && (
                        <div className="mt-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700 space-y-0.5">
                          {q.subQuestions.map((sq, i) => (
                            <p key={i} className="text-xs text-slate-500 font-mono">
                              {sq}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleStartEdit(q)}
                  title="Editar pregunta"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRemove(q.id)}
                  title="Eliminar pregunta"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
