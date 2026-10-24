import React, { useState } from 'react';
import { X, Search, FileText, ScanText, Check, Edit3 } from 'lucide-react';
import { ProcessedDocument } from '../types';

interface DocumentViewerModalProps {
  document: ProcessedDocument;
  onClose: () => void;
  onSaveEditedDocument: (updated: ProcessedDocument) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
  onSaveEditedDocument,
}) => {
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedPageText, setEditedPageText] = useState(
    document.pages.find((p) => p.pageNum === 1)?.text || document.text
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentPageObj = document.pages.find((p) => p.pageNum === selectedPage) || {
    pageNum: selectedPage,
    text: document.text,
    hasImages: false,
  };

  const handlePageChange = (pageNum: number) => {
    setSelectedPage(pageNum);
    const p = document.pages.find((pg) => pg.pageNum === pageNum);
    setEditedPageText(p?.text || '');
    setIsEditing(false);
  };

  const handleSavePage = () => {
    const updatedPages = document.pages.map((p) => {
      if (p.pageNum === selectedPage) {
        return { ...p, text: editedPageText, ocrApplied: p.ocrApplied };
      }
      return p;
    });

    const fullRebuiltText = updatedPages.map((p) => p.text).join('\n\n');
    const wordCount = fullRebuiltText.split(/\s+/).filter(Boolean).length;

    const updatedDoc: ProcessedDocument = {
      ...document,
      pages: updatedPages,
      text: fullRebuiltText,
      wordCount,
    };

    onSaveEditedDocument(updatedDoc);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                {document.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{document.pageCount} páginas</span>
                <span>•</span>
                <span>{document.wordCount.toLocaleString()} palabras</span>
                {currentPageObj.ocrApplied && (
                  <>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                      <ScanText className="w-3.5 h-3.5" />
                      OCR ({currentPageObj.ocrConfidence || 85}% certeza)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                <Check className="w-3.5 h-3.5" />
                Guardado
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Page Selector Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
            <span className="font-semibold text-slate-600 dark:text-slate-400 shrink-0">
              Páginas:
            </span>
            {document.pages.map((p) => (
              <button
                key={p.pageNum}
                onClick={() => handlePageChange(p.pageNum)}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                  selectedPage === p.pageNum
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                }`}
              >
                {p.pageNum}
                {p.ocrApplied && ' *'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar término..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {!isEditing ? (
              <button
                onClick={() => {
                  setEditedPageText(currentPageObj.text);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Corregir texto</span>
              </button>
            ) : (
              <button
                onClick={handleSavePage}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold text-white transition shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar cambios</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {isEditing ? (
            <div className="h-full flex flex-col">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                Edita las palabras, nombres propios o cifras reconocidas por OCR en la Página {selectedPage}:
              </p>
              <textarea
                value={editedPageText}
                onChange={(e) => setEditedPageText(e.target.value)}
                rows={16}
                className="w-full flex-1 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
              {currentPageObj.text}
            </div>
          )}

          {/* Section Headings detected */}
          {document.headings.length > 0 && !isEditing && (
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Apartados y títulos identificados en el documento:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {document.headings.map((h, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-200 transition"
          >
            Cerrar visor
          </button>
        </div>
      </div>
    </div>
  );
};
