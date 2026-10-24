import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DocumentImportSection } from './components/DocumentImportSection';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { QuestionDetectionPreview } from './components/QuestionDetectionPreview';
import { AcademicEditor } from './components/AcademicEditor';
import { ConfigPanel } from './components/ConfigPanel';
import { ProjectsModal } from './components/ProjectsModal';
import { ModelManagerModal } from './components/ModelManagerModal';
import { TestRunnerModal } from './components/TestRunnerModal';

import {
  Project,
  ProcessedDocument,
  AcademicQuestion,
  ModeType,
  DocumentCategory,
} from './types';
import {
  getAllProjects,
  saveProject,
  createNewProject,
  defaultAPAConfig,
} from './utils/storage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { checkServerHealth, detectQuestions, solveSingleQuestion } from './utils/aiCoordinator';
import { exportToDocx, downloadFile } from './utils/exportDocx';
import { exportToPdf } from './utils/exportPdf';
import {
  Sparkles,
  RefreshCw,
  BookOpen,
  FileText,
  Sliders,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();
  const [aiAvailable, setAiAvailable] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Current project state
  const [project, setProject] = useState<Project>(() => createNewProject('Mi Primer Trabajo Académico'));
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<ProcessedDocument | null>(null);

  // Processing state
  const [isDetectingQuestions, setIsDetectingQuestions] = useState(false);
  const [isSolvingAll, setIsSolvingAll] = useState(false);
  const [solveProgress, setSolveProgress] = useState({ current: 0, total: 0 });
  const [exporting, setExporting] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load: load most recent project or create new
  useEffect(() => {
    async function init() {
      const health = await checkServerHealth();
      setAiAvailable(health.aiAvailable);

      const list = await getAllProjects();
      if (list.length > 0) {
        setProject(list[0]);
      } else {
        const initial = createNewProject('Resolución Académica de Tarea');
        await saveProject(initial);
        setProject(initial);
      }
    }
    init();
  }, []);

  // Debounced auto-save to IndexedDB
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (project && project.id) {
        setIsSaving(true);
        try {
          await saveProject(project);
        } catch (e) {
          console.error('Auto-save error:', e);
        } finally {
          setIsSaving(false);
        }
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [project]);

  const showToast = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Handler: Document processed
  const handleDocumentProcessed = async (doc: ProcessedDocument) => {
    if (doc.category === 'study_material') {
      setProject((prev) => ({
        ...prev,
        studyMaterial: doc,
        updatedAt: new Date().toISOString(),
      }));
      showToast(`Material de estudio "${doc.name}" importado (${doc.pageCount} págs).`);
    } else {
      // Assignment task imported -> trigger question detection
      setProject((prev) => ({
        ...prev,
        assignmentTask: doc,
        updatedAt: new Date().toISOString(),
      }));
      showToast(`Tarea académica "${doc.name}" importada. Analizando consignas...`);

      // Detect questions
      setIsDetectingQuestions(true);
      try {
        const detected = await detectQuestions(doc, project.mode);
        setProject((prev) => ({
          ...prev,
          questions: detected,
        }));
        showToast(`Se identificaron ${detected.length} preguntas en la tarea.`);
      } catch (e: any) {
        console.error('Error detectando preguntas:', e);
        showToast('Error al detectar preguntas: ' + e.message);
      } finally {
        setIsDetectingQuestions(false);
      }
    }
  };

  const handleRemoveDocument = (category: DocumentCategory) => {
    if (category === 'study_material') {
      setProject((prev) => ({ ...prev, studyMaterial: null }));
    } else {
      setProject((prev) => ({ ...prev, assignmentTask: null, questions: [] }));
    }
  };

  // Solve all questions
  const handleSolveAll = async () => {
    if (!project.studyMaterial) {
      alert('Por favor importa primero el Material de Estudio (fuente teórica).');
      return;
    }
    if (project.questions.length === 0) {
      alert('No hay preguntas identificadas para responder.');
      return;
    }

    setIsSolvingAll(true);
    setSolveProgress({ current: 0, total: project.questions.length });

    const updatedQuestions = [...project.questions];

    for (let i = 0; i < updatedQuestions.length; i++) {
      setSolveProgress({ current: i + 1, total: updatedQuestions.length });
      const solvedQ = await solveSingleQuestion(project, updatedQuestions[i]);
      updatedQuestions[i] = solvedQ;

      // Update state progressively so student sees answers flowing in real-time
      setProject((prev) => ({
        ...prev,
        questions: [...updatedQuestions],
      }));
    }

    setIsSolvingAll(false);
    showToast(`¡Resolución completada! Se respondieron ${project.questions.length} preguntas con fidelidad documental.`);
  };

  // Solve a single question
  const handleRegenerateSingle = async (question: AcademicQuestion) => {
    const solved = await solveSingleQuestion(project, question);
    setProject((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === question.id ? solved : q)),
    }));
    showToast(`Pregunta ${question.number} regenerada exitosamente.`);
  };

  // Update a single question
  const handleUpdateQuestion = (updated: AcademicQuestion) => {
    setProject((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === updated.id ? updated : q)),
    }));
  };

  // Reorder questions
  const handleReorderQuestions = (newQuestions: AcademicQuestion[]) => {
    setProject((prev) => ({
      ...prev,
      questions: newQuestions,
    }));
  };

  // Export to Word DOCX
  const handleExportWord = async () => {
    setExporting(true);
    try {
      const blob = await exportToDocx(project);
      const safeTitle = (project.apaConfig.studentInfo.title || project.name)
        .replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '')
        .trim();
      downloadFile(blob, `${safeTitle || 'Trabajo_Academico'}_APA7.docx`);
      showToast('Documento Word (.docx) descargado en formato APA 7.');
    } catch (err: any) {
      console.error('Error al exportar DOCX:', err);
      alert('Error al exportar DOCX: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Export to PDF
  const handleExportPdf = () => {
    setExporting(true);
    try {
      const blob = exportToPdf(project);
      const safeTitle = (project.apaConfig.studentInfo.title || project.name)
        .replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '')
        .trim();
      downloadFile(blob, `${safeTitle || 'Trabajo_Academico'}_APA7.pdf`);
      showToast('Documento PDF descargado en formato APA 7.');
    } catch (err: any) {
      console.error('Error al exportar PDF:', err);
      alert('Error al exportar PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const hasAnswers = project.questions.some((q) => q.answer.trim().length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <Navbar
        currentMode={project.mode}
        onModeChange={(mode) => setProject((prev) => ({ ...prev, mode }))}
        isOnline={isOnline}
        aiAvailable={aiAvailable}
        onOpenProjects={() => setShowProjectsModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenModelManager={() => setShowModelManager(true)}
        onOpenTests={() => setShowTestRunner(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        projectName={project.name}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Offline Banner if offline */}
        {!isOnline && (
          <div className="p-3.5 rounded-2xl bg-amber-500 text-white text-xs font-semibold shadow-md flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span>Modo Sin Conexión Activo: Las lecturas, OCR, recuperación y guardado se ejecutan 100% de forma local.</span>
            </div>
            <button
              onClick={() => setShowModelManager(true)}
              className="underline text-[11px] hover:opacity-90 font-bold shrink-0"
            >
              Ver detalles
            </button>
          </div>
        )}

        {/* Hero Title & Status summary */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Fidelidad Documental Rigurosa • Normas APA 7.ª Edición</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Plataforma Académica Inteligente
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-2xl">
              Importa tus lecturas y la tarea por separado. Genera respuestas fundamentadas exclusivamente en la fuente teórica, sin alucinaciones, edita en vivo y exporta directamente a Word o PDF.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 pt-4 text-xs font-medium text-blue-100">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-md">
              <BookOpen className="w-4 h-4 text-blue-200" />
              {project.studyMaterial ? 'Material cargado' : 'Sin material de estudio'}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-md">
              <FileText className="w-4 h-4 text-blue-200" />
              {project.questions.length > 0 ? `${project.questions.length} preguntas` : 'Sin tarea cargada'}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-md">
              <Sliders className="w-4 h-4 text-blue-200" />
              {project.educationLevel}
            </span>
            {isSaving && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/30 text-emerald-200 text-[11px]">
                <CheckCircle className="w-3 h-3" />
                Guardando en IndexedDB...
              </span>
            )}
          </div>
        </div>

        {/* Module 2 & 3 & 4: Dual Document Import Section */}
        <DocumentImportSection
          studyMaterial={project.studyMaterial}
          assignmentTask={project.assignmentTask}
          onDocumentProcessed={handleDocumentProcessed}
          onRemoveDocument={handleRemoveDocument}
          onViewDocument={(doc) => setViewingDoc(doc)}
        />

        {/* Question Detection Progress */}
        {isDetectingQuestions && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Analizando documento de tarea y detectando consignas...
            </p>
          </div>
        )}

        {/* Module 7: Question Detection Preview (if questions detected but not yet answered) */}
        {project.questions.length > 0 && !hasAnswers && !isDetectingQuestions && (
          <QuestionDetectionPreview
            questions={project.questions}
            onUpdateQuestions={(qs) => setProject((prev) => ({ ...prev, questions: qs }))}
            onConfirmAndSolve={handleSolveAll}
            isSolving={isSolvingAll}
            mode={project.mode}
          />
        )}

        {/* Solving Progress Bar */}
        {isSolvingAll && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 shadow-md space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>
                  Resolviendo con IA: Pregunta {solveProgress.current} de {solveProgress.total}...
                </span>
              </span>
              <span>{Math.round((solveProgress.current / solveProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(solveProgress.current / solveProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Recuperando fragmentos del material, aplicando normas de fidelidad estricta y formato APA 7.
            </p>
          </div>
        )}

        {/* Module 10: Academic Editor & Exporter (when answers exist) */}
        {hasAnswers && (
          <AcademicEditor
            project={project}
            onUpdateQuestion={handleUpdateQuestion}
            onReorderQuestions={handleReorderQuestions}
            onRegenerateSingle={handleRegenerateSingle}
            onRegenerateAll={handleSolveAll}
            onExportWord={handleExportWord}
            onExportPdf={handleExportPdf}
            isExporting={exporting}
            isRegenerating={isSolvingAll}
          />
        )}
      </main>

      {/* Floating Status Toast */}
      {statusNotification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 transition-all">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Modals */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onSaveEditedDocument={(updated) => {
            if (updated.category === 'study_material') {
              setProject((prev) => ({ ...prev, studyMaterial: updated }));
            } else {
              setProject((prev) => ({ ...prev, assignmentTask: updated }));
            }
            setViewingDoc(null);
            showToast('Correcciones del texto guardadas.');
          }}
        />
      )}

      {showSettingsModal && (
        <ConfigPanel
          project={project}
          onUpdateProject={(patch) => setProject((prev) => ({ ...prev, ...patch }))}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showProjectsModal && (
        <ProjectsModal
          currentProjectId={project.id}
          onSelectProject={(selected) => setProject(selected)}
          onClose={() => setShowProjectsModal(false)}
        />
      )}

      {showModelManager && (
        <ModelManagerModal
          isOnline={isOnline}
          onClose={() => setShowModelManager(false)}
        />
      )}

      {showTestRunner && (
        <TestRunnerModal onClose={() => setShowTestRunner(false)} />
      )}
    </div>
  );
}
