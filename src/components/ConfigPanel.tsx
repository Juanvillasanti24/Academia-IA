import React from 'react';
import {
  Sliders,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  FileCheck,
  AlignLeft,
  X,
} from 'lucide-react';
import {
  Project,
  EducationLevel,
  ResponseLength,
  WritingStyle,
  APAConfig,
} from '../types';

interface ConfigPanelProps {
  project: Project;
  onUpdateProject: (updated: Partial<Project>) => void;
  onClose: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  project,
  onUpdateProject,
  onClose,
}) => {
  const { apaConfig } = project;

  const updateAPA = (patch: Partial<APAConfig>) => {
    onUpdateProject({
      apaConfig: {
        ...apaConfig,
        ...patch,
      },
    });
  };

  const updateStudentInfo = (patch: Partial<APAConfig['studentInfo']>) => {
    onUpdateProject({
      apaConfig: {
        ...apaConfig,
        studentInfo: {
          ...apaConfig.studentInfo,
          ...patch,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Configuración Académica y Normas APA 7.ª Edición
              </h2>
              <p className="text-xs text-slate-500">
                Ajusta el rigor de las respuestas y la presentación tipográfica de Word y PDF.
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

        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Section 1: Reglas de Fidelidad */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Responder únicamente con el material proporcionado
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={project.strictMode}
                      onChange={(e) => onUpdateProject({ strictMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Cuando está activo, el sistema prohíbe inventar información, autores, fechas o citas que no aparezcan en el material importado. Si no hay suficiente información, emitirá el aviso de seguridad requerido.
                </p>

                <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Complementar con conocimientos generales (Opcional)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Solo activa explicaciones adicionales distinguiéndolas claramente de las fuentes.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={project.complementWithGeneral}
                      onChange={(e) => onUpdateProject({ complementWithGeneral: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Parámetros del Trabajo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nivel Educativo
              </label>
              <select
                value={project.educationLevel}
                onChange={(e) => onUpdateProject({ educationLevel: e.target.value as EducationLevel })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Escuela">Escuela (Básico)</option>
                <option value="Colegio">Colegio (Secundaria)</option>
                <option value="Formación técnica">Formación técnica / Superior</option>
                <option value="Universidad o facultad">Universidad o facultad (Avanzado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Extensión de Respuestas
              </label>
              <select
                value={project.responseLength}
                onChange={(e) => onUpdateProject({ responseLength: e.target.value as ResponseLength })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Muy breve">Muy breve (1 párrafo puntual)</option>
                <option value="Breve">Breve (2 párrafos directos)</option>
                <option value="Media">Media (Estándar académico)</option>
                <option value="Desarrollada">Desarrollada (Exhaustiva)</option>
                <option value="Extensa">Extensa (Ensayo / Monográfico)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Estilo de Redacción
              </label>
              <select
                value={project.writingStyle}
                onChange={(e) => onUpdateProject({ writingStyle: e.target.value as WritingStyle })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Lenguaje académico">Lenguaje académico formal</option>
                <option value="Lenguaje sencillo">Lenguaje sencillo y didáctico</option>
                <option value="Lenguaje técnico">Lenguaje técnico especializado</option>
                <option value="Respuesta directa">Respuesta directa sin preámbulos</option>
                <option value="Explicación paso a paso">Explicación paso a paso</option>
              </select>
            </div>
          </div>

          {/* Section 3: Normas APA 7 Tipografía */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-blue-600" />
              Formato Tipográfico Oficial APA 7.ª Edición
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tipografía admitida
                </label>
                <select
                  value={apaConfig.font}
                  onChange={(e) => updateAPA({ font: e.target.value as any })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="Times New Roman">Times New Roman (Con serifa)</option>
                  <option value="Arial">Arial (Sin serifa)</option>
                  <option value="Calibri">Calibri (Sin serifa)</option>
                  <option value="Georgia">Georgia (Con serifa)</option>
                  <option value="Lucida Sans Unicode">Lucida Sans Unicode</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tamaño de Fuente
                </label>
                <select
                  value={apaConfig.fontSize}
                  onChange={(e) => updateAPA({ fontSize: Number(e.target.value) as any })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value={10}>10 puntos</option>
                  <option value={11}>11 puntos</option>
                  <option value={12}>12 puntos (Recomendado tradicional)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <strong className="block text-slate-700 dark:text-slate-300">Márgenes:</strong>
                2,54 cm (1 pulgada) en todos los lados
              </div>
              <div>
                <strong className="block text-slate-700 dark:text-slate-300">Interlineado:</strong>
                Doble (2.0) sin espaciado extra
              </div>
              <div>
                <strong className="block text-slate-700 dark:text-slate-300">Sangría:</strong>
                1,27 cm (0,5 pulg) primera línea
              </div>
            </div>
          </div>

          {/* Section 4: Portada de Estudiante APA 7 */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Portada del Estudiante (APA 7)
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={apaConfig.includeCover}
                  onChange={(e) => updateAPA({ includeCover: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {apaConfig.includeCover && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Título del Trabajo
                  </label>
                  <input
                    type="text"
                    value={apaConfig.studentInfo.title}
                    onChange={(e) => updateStudentInfo({ title: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nombre del Estudiante
                  </label>
                  <input
                    type="text"
                    value={apaConfig.studentInfo.studentName}
                    onChange={(e) => updateStudentInfo({ studentName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Institución Educativa
                  </label>
                  <input
                    type="text"
                    value={apaConfig.studentInfo.institution}
                    onChange={(e) => updateStudentInfo({ institution: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Facultad o Departamento
                  </label>
                  <input
                    type="text"
                    value={apaConfig.studentInfo.faculty}
                    onChange={(e) => updateStudentInfo({ faculty: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Asignatura / Curso
                  </label>
                  <input
                    type="text"
                    value={apaConfig.studentInfo.course}
                    onChange={(e) => updateStudentInfo({ course: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Docente / Profesor
                  </label>
                  <input
                    type="text"
                    value={apaConfig.studentInfo.instructor}
                    onChange={(e) => updateStudentInfo({ instructor: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
          >
            Aplicar y Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  );
};
