/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TopBar, ActiveTab } from './components/TopBar';
import { DashboardOverview } from './components/DashboardOverview';
import { ActivityTelemetryView } from './components/ActivityTelemetryView';
import { RacePredictorView } from './components/RacePredictorView';
import { HealthRecoveryView } from './components/HealthRecoveryView';
import { GarminApiSettingsView } from './components/GarminApiSettingsView';
import { FileImportModal } from './components/FileImportModal';
import { 
  initialActivities, 
  initialHealthMetrics, 
  initialTrainingLoad, 
  initialGarminConfig 
} from './data/mockGarminData';
import { GarminActivity, GarminApiConfig } from './types/garmin';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [activities, setActivities] = useState<GarminActivity[]>(initialActivities);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(initialActivities[0].id);
  const [healthMetrics, setHealthMetrics] = useState(initialHealthMetrics);
  const [trainingLoad, setTrainingLoad] = useState(initialTrainingLoad);
  const [garminConfig, setGarminConfig] = useState<GarminApiConfig>(initialGarminConfig);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleSelectActivity = (activityId: string) => {
    setSelectedActivityId(activityId);
    setActiveTab('activities');
  };

  const handleActivityImported = (newActivity: GarminActivity) => {
    setActivities(prev => [newActivity, ...prev]);
    setSelectedActivityId(newActivity.id);
    setActiveTab('activities');
    showToast(`Actividad "${newActivity.title}" importada y analizada correctamente.`);
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      setGarminConfig(prev => ({
        ...prev,
        lastSyncTime: nowStr
      }));
      showToast('Sincronización con Garmin Connect completada. 6 actividades al día.');
    }, 1200);
  };

  // Simula el push de webhook cuando el usuario termina una carrera en el reloj
  const handleSimulateWebhook = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newActivity: GarminActivity = {
      id: 'webhook-act-' + Date.now(),
      title: 'Carrera Matutina Forerunner 965 (Webhook Live)',
      sportType: 'running',
      date: today,
      startTime: '07:30',
      distanceMeters: 10240,
      durationSeconds: 2715, // 45m 15s
      movingSeconds: 2700,
      elevationGainMeters: 64,
      elevationLossMeters: 62,
      avgPaceSecKm: 265, // 4:25/km
      bestPaceSecKm: 238,
      avgHeartRate: 158,
      maxHeartRate: 174,
      avgCadence: 180,
      maxCadence: 188,
      calories: 690,
      trainingEffectAerobic: 3.8,
      trainingEffectAnaerobic: 1.1,
      trimpScore: 110,
      vo2MaxEstimate: 54,
      temperatureCelsius: 13,
      shoeName: 'Nike Vaporfly 3',
      notes: 'Actividad recibida en tiempo real desde el webhook push de Garmin Connect.',
      telemetry: activities[0].telemetry.slice(0, 50).map((p, i) => ({
        ...p,
        distanceMeters: Math.round(i * (10240 / 50)),
        paceSecKm: 265 + (i % 5 - 2) * 4
      })),
      laps: [
        { lapNumber: 1, distanceMeters: 1000, durationSeconds: 270, avgPaceSecKm: 270, avgHeartRate: 145, maxHeartRate: 152, elevationGain: 5, elevationLoss: 2, avgCadence: 178 },
        { lapNumber: 2, distanceMeters: 1000, durationSeconds: 266, avgPaceSecKm: 266, avgHeartRate: 152, maxHeartRate: 158, elevationGain: 8, elevationLoss: 4, avgCadence: 180 },
        { lapNumber: 3, distanceMeters: 1000, durationSeconds: 262, avgPaceSecKm: 262, avgHeartRate: 159, maxHeartRate: 164, elevationGain: 6, elevationLoss: 6, avgCadence: 181 },
        { lapNumber: 4, distanceMeters: 1000, durationSeconds: 260, avgPaceSecKm: 260, avgHeartRate: 162, maxHeartRate: 168, elevationGain: 12, elevationLoss: 2, avgCadence: 182 },
        { lapNumber: 5, distanceMeters: 1000, durationSeconds: 258, avgPaceSecKm: 258, avgHeartRate: 165, maxHeartRate: 171, elevationGain: 4, elevationLoss: 8, avgCadence: 184 },
      ]
    };

    setActivities(prev => [newActivity, ...prev]);
    setSelectedActivityId(newActivity.id);
    setActiveTab('activities');
    showToast('¡Webhook push recibido de Garmin! Nueva carrera procesada automáticamente.');
  };

  const handleUpdateConfig = (newConfig: Partial<GarminApiConfig>) => {
    setGarminConfig(prev => ({ ...prev, ...newConfig }));
    showToast('Configuración de Garmin Connect actualizada.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar conforme a Top Bar Contract */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenApiModal={() => setActiveTab('api_settings')}
        isGarminConnected={garminConfig.isConnected}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
      />

      {/* Notificación Toast flotante */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Contenido principal según pestaña activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            activities={activities}
            trainingLoad={trainingLoad}
            healthMetrics={healthMetrics}
            onSelectActivity={handleSelectActivity}
            onGoToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'activities' && (
          <ActivityTelemetryView
            activities={activities}
            selectedActivityId={selectedActivityId}
            onSelectActivity={setSelectedActivityId}
          />
        )}

        {activeTab === 'predictor' && (
          <RacePredictorView
            activities={activities}
            userVo2Max={healthMetrics[0]?.vo2Max || 54}
          />
        )}

        {activeTab === 'health' && (
          <HealthRecoveryView
            healthMetrics={healthMetrics}
          />
        )}

        {activeTab === 'api_settings' && (
          <GarminApiSettingsView
            config={garminConfig}
            onUpdateConfig={handleUpdateConfig}
            onSimulateWebhook={handleSimulateWebhook}
            onSyncActivities={handleSyncNow}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Modal de Importación de Archivos FIT / GPX */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onActivityImported={handleActivityImported}
      />

      {/* Footer minimalista y técnico */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Garmin PulseLab</span>
            <span>·</span>
            <span>Motor de Telemetría Atlética v2.4</span>
            <span>·</span>
            <span className="font-mono">OAuth 2.0 PKCE Ready</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Firstbeat Analytics™ Metrics</span>
            <span>·</span>
            <span>Pete Riegel Modeling</span>
            <span>·</span>
            <span>Banister TRIMP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
