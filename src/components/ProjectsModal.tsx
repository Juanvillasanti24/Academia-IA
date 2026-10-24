import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Download,
  Upload,
  Search,
  HardDrive,
  X,
  Check,
  Calendar,
} from 'lucide-react';
import { Project, StorageStats } from '../types';
import {
  getAllProjects,
  saveProject,
  deleteProject,
  duplicateProject,
  exportBackup,
  importBackup,
  getStorageStats,
  createNewProject,
} from '../utils/storage';
import { downloadFile } from '../utils/exportDocx';

interface ProjectsModalProps {
  currentProjectId: string;
  onSelectProject: (project: Project) => void;
  onClose: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  currentProjectId,
  onSelectProject,
  onClose,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const list = await getAllProjects();
    setProjects(list);
    const stats = await getStorageStats();
    setStorageStats(stats);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = async () => {
    const proj = createNewProject('Nuevo Trabajo Académico');
    await saveProject(proj);
    await loadData();
    onSelectProject(proj);
    onClose();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el proyecto "${name}"?`)) {
      await deleteProject(id);
      await loadData();
    }
  };

  const handleDuplicate = async (id: string) => {
    await duplicateProject(id);
    await loadData();
  };

  const handleStartRename = (proj: Project) => {
    setEditingId(proj.id);
    setNewName(proj.name);
  };

  const handleSaveRename = async (proj: Project) => {
    if (!newName.trim()) return;
    await saveProject({ ...proj, name: newName.trim() });
    setEditingId(null);
    await loadData();
  };

  const handleExportBackup = async () => {
    const jsonStr = await exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    downloadFile(blob, `Academia_IA_CopiaSeguridad_${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const count = await importBackup(text);
      alert(`Se importaron exitosamente ${count} proyectos.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al importar.');
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Proyectos y Trabajos Académicos
              </h2>
              <p className="text-xs text-slate-500">
                Almacenamiento persistente local en tu dispositivo (IndexedDB)
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

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar proyecto por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo trabajo</span>
            </button>

            <button
              onClick={handleExportBackup}
              title="Descargar copia de seguridad en JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copia de seguridad</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImportBackup(e.target.files[0]);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Restaurar proyectos desde copia de seguridad JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar</span>
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No hay proyectos disponibles. Pulsa «Nuevo trabajo» para crear uno.
            </div>
          ) : (
            filtered.map((proj) => {
              const isCurrent = proj.id === currentProjectId;
              const isRenaming = editingId === proj.id;

              return (
                <div
                  key={proj.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <button
                          onClick={() => handleSaveRename(proj)}
                          className="p-1 rounded bg-blue-600 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {proj.name}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            Abierto
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(proj.updatedAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>{proj.questions?.length || 0} preguntas</span>
                      <span>•</span>
                      <span>{proj.educationLevel || 'Universidad'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onSelectProject(proj);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition mr-1"
                      >
                        Abrir
                      </button>
                    )}

                    <button
                      onClick={() => handleStartRename(proj)}
                      title="Renombrar"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(proj.id)}
                      title="Duplicar"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(proj.id, proj.name)}
                      title="Eliminar"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Storage Stats */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span>
              Espacio utilizado: <strong>{storageStats?.usageFormatted || '0 MB'}</strong> de{' '}
              {storageStats?.quotaFormatted || '500 MB'} ({storageStats?.percentageUsed || 0}%)
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
