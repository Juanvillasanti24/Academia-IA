import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Wifi,
  WifiOff,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { checkServerHealth } from '../utils/aiCoordinator';
import { getStorageStats } from '../utils/storage';
import { StorageStats } from '../types';

interface ModelManagerModalProps {
  isOnline: boolean;
  onClose: () => void;
}

export const ModelManagerModal: React.FC<ModelManagerModalProps> = ({
  isOnline,
  onClose,
}) => {
  const [checking, setChecking] = useState(false);
  const [serverHealth, setServerHealth] = useState<{
    online: boolean;
    aiAvailable: boolean;
    model: string;
  } | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  const loadStatus = async () => {
    setChecking(true);
    try {
      const health = await checkServerHealth();
      setServerHealth(health);
      const stats = await getStorageStats();
      setStorageStats(stats);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Estado del Sistema y Motores de IA
              </h2>
              <p className="text-xs text-slate-500">
                Transparencia técnica de procesamiento online, offline e híbrido.
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
          {/* Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Internet Status */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-amber-500" />
                  )}
                  Conexión a Internet
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {isOnline ? 'En línea' : 'Sin conexión'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isOnline
                  ? 'Conexión activa. Los servicios de procesamiento avanzado en la nube están accesibles.'
                  : 'Modo sin conexión activo. El sistema opera mediante el motor heurístico y almacenamiento local.'}
              </p>
            </div>

            {/* 2. Remote AI Backend Status */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  Servicio IA en la Nube
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    serverHealth?.aiAvailable
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {serverHealth?.aiAvailable ? 'Disponible' : 'No disponible'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Modelo: <strong>{serverHealth?.model || 'gemini-3.8-flash'}</strong>
                <br />
                Conexión segura vía backend sin exposición de claves en el cliente.
              </p>
            </div>

            {/* 3. Local Offline Engine */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Motor Local Offline
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Activo 100%
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Recuperador léxico BM25, detector de consignas y sintetizador extractivo ejecutándose en tu navegador.
              </p>
            </div>

            {/* 4. Local Storage / IndexedDB */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-indigo-500" />
                  Almacenamiento Local
                </span>
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  {storageStats?.usageFormatted || '0 MB'} ({storageStats?.percentageUsed || 0}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {storageStats?.projectCount || 0} proyectos guardados en IndexedDB. Límite del dispositivo:{' '}
                {storageStats?.quotaFormatted || 'N/A'}.
              </p>
            </div>
          </div>

          {/* Privacy Notice Card */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="block text-slate-900 dark:text-white mb-1">
                Garantía de Privacidad y Procesamiento Documental
              </strong>
              Los documentos importados se analizan y segmentan en tu propio dispositivo. En modo
              híbrido y online, solo los fragmentos relevantes vinculados a cada pregunta se transmiten
              al modelo para sintetizar la redacción académica. Ningún archivo se comparte con terceros ni
              se almacenan copias no autorizadas.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={loadStatus}
            disabled={checking}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>Actualizar diagnóstico</span>
          </button>

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
