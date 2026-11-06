/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, Plus, RefreshCw, KeyRound, Check } from 'lucide-react';

export type ActiveTab = 'overview' | 'activities' | 'predictor' | 'health' | 'api_settings';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenImport: () => void;
  onOpenApiModal: () => void;
  isGarminConnected: boolean;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onOpenImport,
  onOpenApiModal,
  isGarminConnected,
  onSyncNow,
  isSyncing
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider">
              GP
            </div>
            <button
              onClick={() => onTabChange('overview')}
              className="text-left group cursor-pointer"
            >
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                Garmin PulseLab
              </span>
            </button>
          </div>

          {/* Zone 2: 5 clean single-line navigation tabs */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => onTabChange('overview')}
              className={`px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Dashboard General
            </button>

            <button
              onClick={() => onTabChange('activities')}
              className={`px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Telemetría & GPS
            </button>

            <button
              onClick={() => onTabChange('predictor')}
              className={`px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'predictor'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Preparador de Carreras
            </button>

            <button
              onClick={() => onTabChange('health')}
              className={`px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'health'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Salud, VO2 & VFC
            </button>

            <button
              onClick={() => onTabChange('api_settings')}
              className={`px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'api_settings'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Garmin Connect API</span>
              {isGarminConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="API Conectada" />
              )}
            </button>
          </nav>

          {/* Zone 3: Primary action button + quick action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              title="Sincronizar con Garmin Connect"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={onOpenImport}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cargar FIT / GPX</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
