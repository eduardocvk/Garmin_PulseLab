/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GarminApiConfig, GarminActivity } from '../types/garmin';
import { 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Radio, 
  Zap,
  Server,
  AlertCircle
} from 'lucide-react';

interface GarminApiSettingsViewProps {
  config: GarminApiConfig;
  onUpdateConfig: (newConfig: Partial<GarminApiConfig>) => void;
  onSimulateWebhook: () => void;
  onSyncActivities: () => void;
  isSyncing: boolean;
}

export const GarminApiSettingsView: React.FC<GarminApiSettingsViewProps> = ({
  config,
  onUpdateConfig,
  onSimulateWebhook,
  onSyncActivities,
  isSyncing
}) => {
  const [clientId, setClientId] = useState(config.clientId);
  const [clientSecret, setClientSecret] = useState(config.clientSecret);
  const [syncFreq, setSyncFreq] = useState(config.syncFrequency);
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      clientId,
      clientSecret,
      syncFrequency: syncFreq,
      isConnected: Boolean(clientId && clientSecret)
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyRedirect = () => {
    navigator.clipboard.writeText(config.redirectUri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900">
          Configuración de Garmin Connect Developer API & OAuth 2.0
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Conecta tus credenciales de Garmin Connect Developer Program para recibir actividades por Webhooks push y sincronización de telemetría.
        </p>
      </div>

      {/* Estado de la Conexión */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              config.isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {config.isConnected ? 'Garmin Connect API: Conectado' : 'Garmin Connect API: Desconectado'}
                </h3>
                {config.isConnected && (
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    OAuth 2.0 Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Usuario vinculado: <strong className="font-mono text-slate-700">{config.userGarminName || 'No autenticado'}</strong> · Última sincronización: <span className="font-mono">{config.lastSyncTime || 'Nunca'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSyncActivities}
              disabled={isSyncing}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
            </button>

            <button
              onClick={onSimulateWebhook}
              className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Simular que el reloj Garmin acaba de sincronizar una nueva carrera mediante Webhook"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Simular Webhook Garmin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulario de Credenciales API */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-bold text-slate-900 mb-1">
          Credenciales OAuth 2.0 de la Aplicación Garmin
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Obtén tu Consumer Key (Client ID) y Consumer Secret en el portal oficial de desarrolladores{' '}
          <a
            href="https://developer.garmin.com/gc-developer-program/overview/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
          >
            Garmin Developer Program <ExternalLink className="w-3 h-3" />
          </a>.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Client ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Garmin Client ID (Consumer Key)
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. garmin_client_prod_8923a1"
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Garmin Client Secret (Consumer Secret)
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Redirect URI */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              OAuth 2.0 Redirect URI (Añade esta URL en tu panel de Garmin)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={config.redirectUri}
                className="w-full bg-slate-100 border border-slate-200 rounded-md py-2 px-3 text-xs font-mono text-slate-600 select-all"
              />
              <button
                type="button"
                onClick={handleCopyRedirect}
                className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedRedirect ? 'Copiada' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Frecuencia de sincronización */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Modo de Sincronización
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'realtime', title: 'Webhooks en Tiempo Real', desc: 'Garmin envía actividades al guardar en el reloj' },
                { id: 'daily', title: 'Sincronización Diaria', desc: 'Descarga automática cada mañana a las 06:00' },
                { id: 'manual', title: 'Manual / Bajo Demanda', desc: 'Solo cuando pulsas el botón de sincronizar' },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setSyncFreq(opt.id as any)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    syncFreq === opt.id
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{opt.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Las credenciales se conservan de forma segura en tu sesión local.
            </span>
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Guardado correctamente
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Guía Técnica de Endpoints Garmin */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          Especificación de Endpoints Garmin Connect Integrados
        </h3>
        <div className="space-y-2 text-xs font-mono text-slate-600">
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400 font-sans w-32 shrink-0">Authorization:</span>
            <span className="text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              https://connect.garmin.com/oauthConfirm
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400 font-sans w-32 shrink-0">Token Exchange:</span>
            <span className="text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              https://connectapi.garmin.com/oauth-service/oauth/exchange/user/2.0
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400 font-sans w-32 shrink-0">Activity Push:</span>
            <span className="text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              /api/garmin/activity-webhook (Push Notification Listener)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
