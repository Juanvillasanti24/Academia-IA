import React, { useRef, useState } from 'react';
import {
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
  ScanText,
  FileCheck,
} from 'lucide-react';
import { ProcessedDocument, DocumentCategory } from '../types';
import { processUploadedFile } from '../utils/documentParser';

interface DocumentImportSectionProps {
  studyMaterial: ProcessedDocument | null;
  assignmentTask: ProcessedDocument | null;
  onDocumentProcessed: (doc: ProcessedDocument) => void;
  onRemoveDocument: (category: DocumentCategory) => void;
  onViewDocument: (doc: ProcessedDocument) => void;
}

export const DocumentImportSection: React.FC<DocumentImportSectionProps> = ({
  studyMaterial,
  assignmentTask,
  onDocumentProcessed,
  onRemoveDocument,
  onViewDocument,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Study Material Card */}
      <DocumentCard
        category="study_material"
        title="1. Material de Estudio (Fuente Teórica)"
        description="Contiene las lecturas, manuales, capítulos o apuntes con la información que fundamentará las respuestas."
        icon={<BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        document={studyMaterial}
        onDocumentProcessed={onDocumentProcessed}
        onRemoveDocument={() => onRemoveDocument('study_material')}
        onViewDocument={onViewDocument}
        badgeColor="blue"
      />

      {/* 2. Assignment / Task Card */}
      <DocumentCard
        category="assignment_task"
        title="2. Tarea Académica (Cuestionario o Consignas)"
        description="Contiene las preguntas, ejercicios, guías o instrucciones que deben resolverse."
        icon={<FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        document={assignmentTask}
        onDocumentProcessed={onDocumentProcessed}
        onRemoveDocument={() => onRemoveDocument('assignment_task')}
        onViewDocument={onViewDocument}
        badgeColor="indigo"
      />
    </div>
  );
};

interface DocumentCardProps {
  category: DocumentCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
  document: ProcessedDocument | null;
  onDocumentProcessed: (doc: ProcessedDocument) => void;
  onRemoveDocument: () => void;
  onViewDocument: (doc: ProcessedDocument) => void;
  badgeColor: 'blue' | 'indigo';
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  category,
  title,
  description,
  icon,
  document,
  onDocumentProcessed,
  onRemoveDocument,
  onViewDocument,
  badgeColor,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setProgress(5);
    setStatusMessage('Iniciando lectura del documento...');
    setErrorMessage(null);

    try {
      const processed = await processUploadedFile(file, {
        category,
        onProgress: (p, msg) => {
          setProgress(p);
          setStatusMessage(msg);
        },
        enableOCR: true,
      });

      onDocumentProcessed(processed);
    } catch (err: any) {
      console.error('Error al procesar archivo:', err);
      setErrorMessage(err.message || 'Error al leer el archivo.');
    } finally {
      setLoading(false);
      setProgress(0);
      setStatusMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const ocrPagesCount = document?.pages.filter((p) => p.ocrApplied).length || 0;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col justify-between shadow-sm ${
        isDragging
          ? 'border-blue-500 ring-4 ring-blue-500/10'
          : document
          ? 'border-slate-200 dark:border-slate-800'
          : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                DOCX, PDF o imagen escaneada
              </p>
            </div>
          </div>

          {document && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Listo
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Loading Progress */}
        {loading && (
          <div className="my-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <div className="flex justify-between items-center text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                {statusMessage}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div className="my-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong>Error de lectura:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Loaded Document Info */}
        {document && !loading && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">{document.name}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                {document.format} • {(document.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                {document.pageCount} {document.pageCount === 1 ? 'página' : 'páginas'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                {document.wordCount.toLocaleString()} palabras
              </span>
              {document.headings.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  {document.headings.length} apartados
                </span>
              )}
              {ocrPagesCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <ScanText className="w-3 h-3" />
                  OCR ({ocrPagesCount} {ocrPagesCount === 1 ? 'página' : 'páginas'})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.jpg,.jpeg,.png,.webp,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {!document ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Seleccionar o arrastrar archivo</span>
          </button>
        ) : (
          <div className="w-full flex items-center gap-2">
            <button
              onClick={() => onViewDocument(document)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Ver texto extraído</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Reemplazar por otro archivo"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onRemoveDocument}
              title="Eliminar documento"
              className="p-2 rounded-xl text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
