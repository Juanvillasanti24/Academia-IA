import React, { useState } from 'react';
import {
  FileDown,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCcw,
  Sparkles,
  Search,
  FileText,
  BookOpen,
} from 'lucide-react';
import { AcademicQuestion, Project } from '../types';
import { SourceViewerModal } from './SourceViewerModal';

interface AcademicEditorProps {
  project: Project;
  onUpdateQuestion: (updated: AcademicQuestion) => void;
  onReorderQuestions: (questions: AcademicQuestion[]) => void;
  onRegenerateSingle: (question: AcademicQuestion) => Promise<void>;
  onRegenerateAll: () => Promise<void>;
  onExportWord: () => void;
  onExportPdf: () => void;
  isExporting: boolean;
  isRegenerating: boolean;
}

export const AcademicEditor: React.FC<AcademicEditorProps> = ({
  project,
  onUpdateQuestion,
  onReorderQuestions,
  onRegenerateSingle,
  onRegenerateAll,
  onExportWord,
  onExportPdf,
  isExporting,
  isRegenerating,
}) => {
  const [activeSourceModalQ, setActiveSourceModalQ] = useState<AcademicQuestion | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [singleRegenId, setSingleRegenId] = useState<string | null>(null);
  const [confirmRegenAll, setConfirmRegenAll] = useState(false);

  const questions = project.questions;

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesFilter =
      filterStatus === 'all'
        ? true
        : filterStatus === 'edited'
        ? q.isEdited
        : q.status === filterStatus;

    const matchesSearch =
      searchTerm.trim().length === 0
        ? true
        : q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalAnswered = questions.filter((q) => q.answer.trim().length > 0).length;
  const sufficientCount = questions.filter((q) => q.status === 'sufficient').length;
  const partialCount = questions.filter((q) => q.status === 'partial').length;
  const insufficientCount = questions.filter((q) => q.status === 'insufficient').length;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const newArr = [...questions];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    onReorderQuestions(newArr);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Deseas eliminar esta pregunta del trabajo?')) {
      onReorderQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const handleTextChange = (q: AcademicQuestion, newAnswer: string) => {
    onUpdateQuestion({
      ...q,
      answer: newAnswer,
      isEdited: true,
    });
  };

  const handleRegenerateSingleClick = async (q: AcademicQuestion) => {
    setSingleRegenId(q.id);
    try {
      await onRegenerateSingle(q);
    } finally {
      setSingleRegenId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Editor Académico (APA 7.ª Edición)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Revisa, ajusta tus respuestas, consulta las citas y descarga el informe oficial en Word o PDF.
            </p>
          </div>

          {/* Export and Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setConfirmRegenAll(true)}
              disabled={isRegenerating || questions.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerar todo</span>
            </button>

            <button
              onClick={onExportWord}
              disabled={isExporting || questions.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar Word (.docx)</span>
            </button>

            <button
              onClick={onExportPdf}
              disabled={isExporting || questions.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Stats and Filter tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Todas ({questions.length})
            </button>

            <button
              onClick={() => setFilterStatus('sufficient')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filterStatus === 'sufficient'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completas ({sufficientCount})
            </button>

            <button
              onClick={() => setFilterStatus('partial')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filterStatus === 'partial'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Parciales ({partialCount})
            </button>

            <button
              onClick={() => setFilterStatus('insufficient')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filterStatus === 'insufficient'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Insuficientes ({insufficientCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en respuestas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Confirmation modal for Regenerate All */}
      {confirmRegenAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              ¿Regenerar todas las respuestas?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Esta acción volverá a consultar el material de estudio para todas las {questions.length} preguntas. Si has realizado correcciones manuales, serán reemplazadas por nuevas respuestas sintetizadas.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmRegenAll(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setConfirmRegenAll(false);
                  await onRegenerateAll();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Sí, regenerar todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
            <p className="text-sm font-medium text-slate-500">
              No se encontraron preguntas con el filtro seleccionado.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const originalIndex = questions.findIndex((item) => item.id === q.id);
            const isRegeneratingThis = singleRegenId === q.id;

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Question Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="shrink-0 w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-sm flex items-center justify-center">
                      {q.number || originalIndex + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {q.prompt}
                      </h3>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Status Badge */}
                        {q.status === 'sufficient' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                            <CheckCircle2 className="w-3 h-3" />
                            Fundamentada
                          </span>
                        )}

                        {q.status === 'partial' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                            <AlertTriangle className="w-3 h-3" />
                            Información Parcial
                          </span>
                        )}

                        {q.status === 'insufficient' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/50">
                            <XCircle className="w-3 h-3" />
                            No fundamentada en material
                          </span>
                        )}

                        {q.isEdited && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                            <Edit3 className="w-3 h-3" />
                            Editada manualmente
                          </span>
                        )}

                        {/* Mode badge */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {q.modeUsed === 'online'
                            ? 'Gemini 3.8 Flash'
                            : q.modeUsed === 'offline'
                            ? 'Motor Local Offline'
                            : 'Híbrido'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Move & Delete controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(originalIndex, 'up')}
                      disabled={originalIndex === 0}
                      title="Mover arriba"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(originalIndex, 'down')}
                      disabled={originalIndex === questions.length - 1}
                      title="Mover abajo"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      title="Eliminar pregunta"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Insufficient Warning Alert */}
                {q.missingInfoNotice && (
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Nota de fidelidad estricta:</strong> {q.missingInfoNotice}
                    </div>
                  </div>
                )}

                {/* Answer Textarea */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Respuesta del estudiante (conforme APA 7):
                    </span>
                    <span>{q.answer.split(/\s+/).filter(Boolean).length} palabras</span>
                  </div>

                  <textarea
                    value={q.answer}
                    onChange={(e) => handleTextChange(q, e.target.value)}
                    rows={6}
                    placeholder="Escribe o genera la respuesta académica..."
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-sans text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  />
                </div>

                {/* Question Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {/* View Source Button */}
                    <button
                      onClick={() => setActiveSourceModalQ(q)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ver fuente ({q.citations?.length || 0} fragmentos)</span>
                    </button>
                  </div>

                  {/* Regenerate Single Question */}
                  <button
                    onClick={() => handleRegenerateSingleClick(q)}
                    disabled={isRegeneratingThis}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingThis ? 'animate-spin text-blue-600' : ''}`} />
                    <span>Regenerar esta respuesta</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Source Viewer Modal */}
      {activeSourceModalQ && (
        <SourceViewerModal
          question={activeSourceModalQ}
          onClose={() => setActiveSourceModalQ(null)}
        />
      )}
    </div>
  );
};
