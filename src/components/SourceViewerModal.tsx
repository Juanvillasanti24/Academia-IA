import React from 'react';
import { X, BookOpen, Quote, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { AcademicQuestion } from '../types';

interface SourceViewerModalProps {
  question: AcademicQuestion;
  onClose: () => void;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({
  question,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Fuentes del Material — Pregunta {question.number}
              </h2>
              <p className="text-xs text-slate-500">
                Evidencia documental extraída del texto original
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Enunciado de la consigna:
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {question.prompt}
            </p>
          </div>

          {/* Citations List */}
          {question.citations && question.citations.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Fragmentos Utilizados como Fundamento ({question.citations.length}):
              </h4>

              {question.citations.map((cite, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {cite.docTitle || 'Material de estudio'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 font-mono text-[11px] border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                        {cite.page || 'Sin pág.'}
                      </span>
                      {cite.section && (
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[11px] border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300">
                          {cite.section}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed flex items-start gap-2">
                    <Quote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>«{cite.quoteExcerpt}»</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
              No se registraron citas específicas para esta respuesta (posible respuesta basada en síntesis general o información insuficiente en el documento).
            </div>
          )}

          {/* Warning notice if present */}
          {question.missingInfoNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Aviso de cobertura:</strong> {question.missingInfoNotice}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
