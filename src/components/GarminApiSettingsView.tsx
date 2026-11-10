/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GarminApiConfig, GarminActivity } from '../types/garmin';
import { syncGarminPersonalApi } from '../services/garminApiService';
import { 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Zap, 
  Server, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  UploadCloud,
  Check,
  AlertTriangle
} from 'lucide-react';

interface GarminApiSettingsViewProps {
  config: GarminApiConfig;
  onUpdateConfig: (newConfig: Partial<GarminApiConfig>) => void;
  onSimulateWebhook: () => void;
  onActivitiesSynced: (newActivities: GarminActivity[]) => void;
  onOpenImportModal: () => void;
  isSyncing: boolean;
}

export const GarminApiSettingsView: React.FC<GarminApiSettingsViewProps> = ({
  config,
  onUpdateConfig,
  onSimulateWebhook,
  onActivitiesSynced,
  onOpenImportModal,
  isSyncing: externalIsSyncing
}) => {
  const [activeMode, setActiveMode] = useState<'personal_key' | 'oauth_developer'>('personal_key');
  const [personalApiKey, setPersonalApiKey] = useState(config.personalApiKey || config.clientSecret || '');
  const [showKey, setShowKey] = useState(false);
  const [useProxy, setUseProxy] = useState(true);

  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const isSyncing = externalIsSyncing || isSyncingLocal;

  const handleSyncWithPersonalKey = async () => {
    if (!personalApiKey.trim()) {
      setSyncFeedback({
        type: 'error',
        message: 'Por favor introduce primero tu Clave API personal generada en Garmin Connect.'
      });
      return;
    }

    setIsSyncingLocal(true);
    setSyncFeedback({
      type: 'info',
      message: 'Conectando con los servidores oficiales de Garmin Connect...'
    });

    try {
      const result = await syncGarminPersonalApi(personalApiKey.trim(), useProxy);
      if (result.success) {
        onUpdateConfig({
          personalApiKey: personalApiKey.trim(),
          isConnected: true,
          userGarminName: 'Usuario Garmin Connect (Clave Personal)',
          lastSyncTime: 'Hoy a las ' + new Date().toLocaleTimeString().slice(0, 5)
        });
        if (result.activities.length > 0) {
          onActivitiesSynced(result.activities);
        }
        setSyncFeedback({
          type: 'success',
          message: result.message
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message: result.message
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: 'Error inesperado: ' + (err.message || 'No se pudo completar la sincronización.')
      });
    } finally {
      setIsSyncingLocal(false);
    }
  };

  const handleSavePersonalKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalApiKey.trim()) return;

    onUpdateConfig({
      personalApiKey: personalApiKey.trim(),
      connectionType: 'personal_key',
      isConnected: true,
      userGarminName: 'Usuario Garmin Connect (Clave Personal)',
      lastSyncTime: 'Guardado a las ' + new Date().toLocaleTimeString().slice(0, 5)
    });
    // Disparar sincronización inmediata
    handleSyncWithPersonalKey();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Conexión con Garmin Connect
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Conecta directamente tu cuenta oficial de Garmin para sincronizar tus carreras, ritmo, pulsaciones y datos biométricos.
        </p>
      </div>

      {/* Selector de Modo */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveMode('personal_key')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeMode === 'personal_key'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Clave API Personal (De tu captura de pantalla de Garmin Connect)</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
            Directo
          </span>
        </button>

        <button
          onClick={() => setActiveMode('oauth_developer')}
          className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeMode === 'oauth_developer'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Garmin Developer Program (Client ID / Secret B2B)</span>
        </button>
      </div>

      {activeMode === 'personal_key' && (
        <div className="space-y-6">
          {/* Tarjeta de Instrucción Clara */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Pega aquí tu Clave API Personal de Garmin Connect
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              En tu captura de Garmin vimos que ya tienes la clave creada el 10 de Noviembre. Pégala a continuación para sincronizar tus entrenamientos reales:
            </p>

            <form onSubmit={handleSavePersonalKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Clave API Personal
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={personalApiKey}
                    onChange={(e) => setPersonalApiKey(e.target.value)}
                    placeholder="Pega aquí la clave (ej. grm_pat_...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 pl-3 pr-24 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      title={showKey ? 'Ocultar' : 'Mostrar'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botón de Sincronización y Acciones */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="proxyToggle"
                    checked={useProxy}
                    onChange={(e) => setUseProxy(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="proxyToggle" className="text-xs text-slate-600 cursor-pointer">
                    Habilitar proxy CORS seguro (recomendado para saltar bloqueos del navegador)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncWithPersonalKey}
                    disabled={isSyncing || !personalApiKey.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando con Garmin...' : 'Sincronizar Datos Ahora'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Mensajes de Feedback de la Sincronización */}
            {syncFeedback && (
              <div className={`mt-4 p-3.5 rounded-lg text-xs flex items-start gap-2.5 border ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : syncFeedback.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {syncFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : syncFeedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                ) : (
                  <RefreshCw className="w-4 h-4 shrink-0 text-blue-600 animate-spin mt-0.5" />
                )}
                <div className="flex-1">
                  <span className="font-medium block leading-relaxed">{syncFeedback.message}</span>
                  {syncFeedback.type === 'error' && (
                    <div className="mt-2 pt-2 border-t border-red-200/60 flex items-center gap-2">
                      <span className="font-semibold text-red-900">¿Garmin bloquea la conexión web?</span>
                      <button
                        type="button"
                        onClick={onOpenImportModal}
                        className="text-xs font-bold underline hover:text-red-950 cursor-pointer"
                      >
                        Arrastra tu archivo FIT/GPX de Garmin Connect en 1 clic
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta de Importación Directa 100% libre de CORS */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Método Alternativo Directo (Sin Restricciones)
                </h4>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Si la API de Garmin presenta bloqueos por CORS desde tu navegador, puedes descargar cualquier carrera desde <strong>connect.garmin.com</strong> (⚙️ &gt; Exportar original o GPX) y soltarla aquí. La plataforma procesará el mapa GPS, altimetría y parciales en 1 segundo.
              </p>
            </div>

            <button
              onClick={onOpenImportModal}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              Cargar Archivo FIT / GPX
            </button>
          </div>
        </div>
      )}

      {activeMode === 'oauth_developer' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 text-xs text-slate-600 space-y-4">
          <p>
            El modo OAuth con Client ID y Client Secret está pensado para aplicaciones con registro en el <strong>Garmin Connect Developer Program B2B</strong>.
          </p>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Redirect URI</label>
            <input
              type="text"
              readOnly
              value={config.redirectUri}
              className="w-full bg-slate-100 border border-slate-200 rounded p-2 font-mono text-slate-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};
