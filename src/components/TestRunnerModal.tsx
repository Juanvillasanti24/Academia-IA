import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { runFullTestSuite, TestResult } from '../utils/testSuite';

interface TestRunnerModalProps {
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTestName, setCurrentTestName] = useState<string>('');

  const executeTests = async () => {
    setIsRunning(true);
    setResults([]);
    try {
      await runFullTestSuite((res) => {
        setCurrentTestName(res.name);
        setResults((prev) => [...prev, res]);
      });
    } finally {
      setIsRunning(false);
      setCurrentTestName('');
    }
  };

  const passedCount = results.filter((r) => r.status === 'passed').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Módulo de Pruebas Automatizadas y Reales (Módulo 20)
              </h2>
              <p className="text-xs text-slate-500">
                Verificación técnica de fidelidad documental, extracción, OCR, exportación y modos.
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

        {/* Action Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={executeTests}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Ejecutando pruebas...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Ejecutar Batería de Pruebas</span>
                </>
              )}
            </button>

            {isRunning && (
              <span className="text-slate-500 italic truncate max-w-xs">
                {currentTestName}
              </span>
            )}
          </div>

          {results.length > 0 && !isRunning && (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {passedCount} superadas
              </span>
              {failedCount > 0 && (
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  {failedCount} fallidas
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {results.length === 0 && !isRunning && (
            <div className="p-12 text-center text-slate-400 text-xs">
              Presiona «Ejecutar Batería de Pruebas» para validar el motor en vivo.
            </div>
          )}

          {results.map((res) => (
            <div
              key={res.id}
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                res.status === 'passed'
                  ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                  : 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                {res.status === 'passed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {res.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {res.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {res.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 shrink-0">
                <Clock className="w-3 h-3" />
                <span>{res.durationMs} ms</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
