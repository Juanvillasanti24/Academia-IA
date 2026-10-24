import React from 'react';
import {
  GraduationCap,
  Wifi,
  WifiOff,
  Cpu,
  FolderOpen,
  Settings,
  Download,
  Moon,
  Sun,
  ShieldCheck,
  HardDrive,
  FlaskConical,
} from 'lucide-react';
import { ModeType } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface NavbarProps {
  currentMode: ModeType;
  onModeChange: (mode: ModeType) => void;
  isOnline: boolean;
  aiAvailable: boolean;
  onOpenProjects: () => void;
  onOpenSettings: () => void;
  onOpenModelManager: () => void;
  onOpenTests: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  projectName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onModeChange,
  isOnline,
  aiAvailable,
  onOpenProjects,
  onOpenSettings,
  onOpenModelManager,
  onOpenTests,
  darkMode,
  onToggleDarkMode,
  projectName,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                Academia IA
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px] sm:max-w-xs font-medium">
              {projectName || 'Trabajo Académico'}
            </p>
          </div>
        </div>

        {/* Center: Mode Selector */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onModeChange('online')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentMode === 'online'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Online</span>
          </button>

          <button
            onClick={() => onModeChange('offline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentMode === 'offline'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline</span>
          </button>

          <button
            onClick={() => onModeChange('hybrid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentMode === 'hybrid'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Híbrido</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Status Badge */}
          <button
            onClick={onOpenModelManager}
            title="Ver estado de conexión, modelo local y almacenamiento"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Conectado</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="hidden sm:inline">Sin red</span>
              </span>
            )}
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Test suite button */}
          <button
            onClick={onOpenTests}
            title="Pruebas automatizadas del sistema"
            className="p-2 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <FlaskConical className="w-4 h-4" />
          </button>

          {/* Projects Button */}
          <button
            onClick={onOpenProjects}
            title="Mis Trabajos y Proyectos Guardados"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Proyectos</span>
          </button>

          {/* Settings / APA Config */}
          <button
            onClick={onOpenSettings}
            title="Configuración APA 7 y parámetros académicos"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="hidden sm:flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar en iOS</span>
            </button>
          )}
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Instalar Academia IA en iPhone / iPad
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              1. Pulsa el botón <strong>Compartir</strong> (ícono con flecha hacia arriba) en la barra de Safari.<br />
              2. Desplázate hacia abajo y selecciona <strong>«Agregar a Inicio»</strong>.<br />
              3. ¡Listo! Podrás abrir Academia IA sin conexión desde tu pantalla de inicio.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-sm font-semibold text-white transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
