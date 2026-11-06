/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GarminActivity, 
  TrainingLoadPoint, 
  HealthMetricDay,
  formatDistance, 
  formatDuration, 
  formatPace, 
  getHRZone 
} from '../types/garmin';
import { 
  TrendingUp, 
  Flame, 
  Clock, 
  Mountain, 
  Heart, 
  ChevronRight, 
  Zap, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface DashboardOverviewProps {
  activities: GarminActivity[];
  trainingLoad: TrainingLoadPoint[];
  healthMetrics: HealthMetricDay[];
  onSelectActivity: (activityId: string) => void;
  onGoToTab: (tab: 'activities' | 'predictor' | 'health') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  activities,
  trainingLoad,
  healthMetrics,
  onSelectActivity,
  onGoToTab
}) => {
  const [hoveredLoadIndex, setHoveredLoadIndex] = useState<number | null>(null);

  // Totales de los últimos 7 días
  const totalMeters = activities.reduce((acc, a) => acc + a.distanceMeters, 0);
  const totalDuration = activities.reduce((acc, a) => acc + a.durationSeconds, 0);
  const totalGain = activities.reduce((acc, a) => acc + a.elevationGainMeters, 0);
  const avgPace = totalMeters > 0 ? (totalDuration / totalMeters) * 1000 : 0;
  
  const latestLoad = trainingLoad[trainingLoad.length - 1] || { ctl: 68, atl: 71, tsb: -3 };
  const latestHealth = healthMetrics[0] || { vo2Max: 54, restingHeartRate: 45, sleepScore: 89 };

  // Cálculo de ratio de carga aguda vs crónica (ACWR)
  const acwr = Number((latestLoad.atl / Math.max(1, latestLoad.ctl)).toFixed(2));
  let acwrStatus = { label: 'Zona Óptima de Carga', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (acwr > 1.3) {
    acwrStatus = { label: 'Riesgo Alto de Sobrecarga', color: 'text-red-700 bg-red-50 border-red-200' };
  } else if (acwr < 0.8) {
    acwrStatus = { label: 'Baja Intensidad / Tapering', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  }

  // Dimensiones del gráfico Banister SVG
  const chartW = 740;
  const chartH = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const maxVal = Math.max(...trainingLoad.map(d => Math.max(d.ctl, d.atl, Math.abs(d.tsb)))) + 10;
  const minVal = -20;
  const valRange = maxVal - minVal;

  const getX = (index: number) => padding.left + (index / (trainingLoad.length - 1)) * innerW;
  const getY = (val: number) => padding.top + innerH - ((val - minVal) / valRange) * innerH;

  const ctlPath = trainingLoad.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.ctl)}`).join(' ');
  const atlPath = trainingLoad.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.atl)}`).join(' ');
  const zeroY = getY(0);

  // Polígono TSB
  const tsbArea = trainingLoad.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.tsb)}`).join(' ')
    + ` L ${getX(trainingLoad.length - 1)} ${zeroY} L ${getX(0)} ${zeroY} Z`;

  const hoveredPoint = hoveredLoadIndex !== null ? trainingLoad[hoveredLoadIndex] : null;

  return (
    <div className="space-y-8">
      {/* Resumen Principal de Métricas Clave */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Resumen de Rendimiento & Estado Físico
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Datos sincronizados de Garmin Connect · Última sesión completada hace 1 día
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Bloque de Entrenamiento 2026.Q4
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Volumen */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              <span>Distancia Total</span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900">
              {formatDistance(totalMeters)}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              <span>{activities.length} sesiones analizadas</span>
            </div>
          </div>

          {/* Tiempo y Ritmo */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              <span>Ritmo Promedio</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-blue-600">
              {formatPace(avgPace)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Tiempo acumulado: <span className="font-mono text-slate-700">{formatDuration(totalDuration)}</span>
            </div>
          </div>

          {/* Estado de Carga (CTL / ATL / TSB) */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              <span>Carga / Ratio ACWR</span>
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {acwr}
              </span>
              <span className="text-xs font-medium text-slate-500 font-mono">
                TSB {latestLoad.tsb > 0 ? `+${latestLoad.tsb}` : latestLoad.tsb}
              </span>
            </div>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${acwrStatus.color}`}>
                {acwrStatus.label}
              </span>
            </div>
          </div>

          {/* VO2 Max & RHR */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              <span>VO2 Max Estimado</span>
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {latestHealth.vo2Max}
              </span>
              <span className="text-xs font-medium text-slate-500">ml/kg/min</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              FC Reposo: <span className="font-mono font-medium text-slate-700">{latestHealth.restingHeartRate} bpm</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modelo Banister: Condición Física (CTL) vs Fatiga (ATL) vs Forma (TSB) */}
      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Modelo de Rendimiento Banister (Fitness vs. Fatiga)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Seguimiento de la Condición Física acumulada (CTL, 42 días), la Fatiga aguda (ATL, 7 días) y el Equilibrio de Estrés (TSB = Forma).
            </p>
          </div>

          {/* Leyenda técnica */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-600 inline-block rounded" />
              <span className="text-slate-700">CTL Fitness ({latestLoad.ctl})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-orange-500 inline-block rounded" />
              <span className="text-slate-700">ATL Fatiga ({latestLoad.atl})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500/30 border border-emerald-500/60 inline-block rounded-xs" />
              <span className="text-slate-700">TSB Forma ({latestLoad.tsb})</span>
            </div>
          </div>
        </div>

        {/* Gráfico SVG interactivo */}
        <div className="mt-4 relative overflow-hidden">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full h-56 select-none"
            onMouseLeave={() => setHoveredLoadIndex(null)}
          >
            {/* Líneas de cuadrícula horizontal */}
            {[0, 25, 50, 75].map(val => (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={getY(val)}
                  x2={chartW - padding.right}
                  y2={getY(val)}
                  stroke="#E2E8F0"
                  strokeDasharray={val === 0 ? "none" : "3 3"}
                  strokeWidth={val === 0 ? "1.5" : "1"}
                />
                <text
                  x={padding.left - 8}
                  y={getY(val) + 4}
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            ))}

            {/* Área sombreada TSB (Forma) */}
            <path
              d={tsbArea}
              fill="#10B981"
              fillOpacity="0.15"
            />
            <path
              d={trainingLoad.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.tsb)}`).join(' ')}
              fill="none"
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />

            {/* Curva CTL (Fitness) */}
            <path
              d={ctlPath}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Curva ATL (Fatiga) */}
            <path
              d={atlPath}
              fill="none"
              stroke="#F97316"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Puntos y barras hover invisibles */}
            {trainingLoad.map((d, i) => (
              <g key={d.date}>
                <rect
                  x={getX(i) - innerW / (trainingLoad.length * 2)}
                  y={padding.top}
                  width={innerW / trainingLoad.length}
                  height={innerH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredLoadIndex(i)}
                />
                {hoveredLoadIndex === i && (
                  <>
                    <line
                      x1={getX(i)}
                      y1={padding.top}
                      x2={getX(i)}
                      y2={padding.top + innerH}
                      stroke="#64748B"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle cx={getX(i)} cy={getY(d.ctl)} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx={getX(i)} cy={getY(d.atl)} r="4" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx={getX(i)} cy={getY(d.tsb)} r="4" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
                  </>
                )}
                <text
                  x={getX(i)}
                  y={chartH - 8}
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  {d.date.slice(5)}
                </text>
              </g>
            ))}
          </svg>

          {/* Tooltip con valores tabulares */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs rounded px-3 py-1.5 text-xs font-mono flex items-center gap-4">
              <span className="font-semibold text-slate-800">{hoveredPoint.date}</span>
              <span className="text-blue-600">CTL: {hoveredPoint.ctl}</span>
              <span className="text-orange-600">ATL: {hoveredPoint.atl}</span>
              <span className={hoveredPoint.tsb >= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                TSB: {hoveredPoint.tsb > 0 ? `+${hoveredPoint.tsb}` : hoveredPoint.tsb}
              </span>
              <span className="text-slate-500">TRIMP: {hoveredPoint.dailyTrimp}</span>
            </div>
          )}
        </div>
      </section>

      {/* Grid: Distribución de Zonas de FC + Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución Z1-Z5 */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Zonas de Frecuencia Cardíaca</h3>
            <span className="text-xs text-slate-500 font-mono">FC Máx: 190 bpm</span>
          </div>

          <div className="space-y-3">
            {[
              { zone: 1, name: 'Z1 Recuperación', range: '< 114 bpm', pct: 12, color: 'bg-slate-400' },
              { zone: 2, name: 'Z2 Aeróbico Base', range: '114 - 133 bpm', pct: 54, color: 'bg-blue-600' },
              { zone: 3, name: 'Z3 Tempo / Ritmo', range: '133 - 152 bpm', pct: 18, color: 'bg-emerald-600' },
              { zone: 4, name: 'Z4 Umbral Lactato', range: '152 - 171 bpm', pct: 11, color: 'bg-orange-500' },
              { zone: 5, name: 'Z5 Potencia Máxima', range: '> 171 bpm', pct: 5, color: 'bg-red-600' },
            ].map(z => (
              <div key={z.zone} className="text-xs">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-slate-700">{z.name}</span>
                  <span className="font-mono text-slate-500">{z.pct}% · {z.range}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${z.color} rounded-full transition-all duration-300`}
                    style={{ width: `${z.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <p>
              El <strong className="text-slate-700 font-mono">66%</strong> del volumen se mantiene en zonas aeróbicas (Z1+Z2), siguiendo la regla de distribución polarizada 80/20.
            </p>
          </div>
        </section>

        {/* Lista de Carreras y Sesiones Recientes */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Entrenamientos Recientes de Garmin</h3>
              <p className="text-xs text-slate-500 mt-0.5">Selecciona una sesión para abrir la telemetría detallada y el mapa GPS</p>
            </div>
            <button
              onClick={() => onGoToTab('activities')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Ver todas ({activities.length})
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activities.slice(0, 4).map(act => {
              const hrZone = getHRZone(act.avgHeartRate);
              return (
                <div
                  key={act.id}
                  onClick={() => onSelectActivity(act.id)}
                  className="py-3 px-2 -mx-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{act.date}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {act.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{act.shoeName || 'Garmin Watch'}</span>
                      <span aria-hidden="true">·</span>
                      <span>TE Aeróbico: <strong className="font-mono text-slate-700">{act.trainingEffectAerobic}</strong></span>
                      {act.elevationGainMeters > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">+{act.elevationGainMeters}m</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        {formatDistance(act.distanceMeters)}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {formatPace(act.avgPaceSecKm)}
                      </div>
                    </div>

                    <div className="hidden sm:block text-right">
                      <div className="text-sm font-bold font-mono text-slate-900">
                        {formatDuration(act.durationSeconds)}
                      </div>
                      <div className={`text-xs font-mono font-medium ${hrZone.textColor}`}>
                        {act.avgHeartRate} bpm
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
