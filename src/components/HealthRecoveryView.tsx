/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HealthMetricDay } from '../types/garmin';
import { 
  Heart, 
  Moon, 
  BatteryCharging, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Brain,
  Info
} from 'lucide-react';

interface HealthRecoveryViewProps {
  healthMetrics: HealthMetricDay[];
}

export const HealthRecoveryView: React.FC<HealthRecoveryViewProps> = ({
  healthMetrics
}) => {
  const latest = healthMetrics[0] || {
    date: '2026-11-05',
    vo2Max: 54,
    restingHeartRate: 45,
    hrvStatus: { valueMs: 69, status: 'balanced', baselineMin: 58, baselineMax: 74 },
    sleepScore: 89,
    sleepHours: 8.2,
    deepSleepMinutes: 110,
    remSleepMinutes: 125,
    lightSleepMinutes: 257,
    stressAvg: 22,
    bodyBatteryHigh: 96,
    bodyBatteryLow: 34
  };

  // Dimensiones para micrográficos SVG
  const chartW = 480;
  const chartH = 140;
  const padding = { top: 15, right: 20, bottom: 25, left: 35 };
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;

  const reversed = [...healthMetrics].reverse();
  const getX = (idx: number) => padding.left + (idx / (reversed.length - 1)) * innerW;

  // Gráfico FC Reposo
  const rhrMin = 40;
  const rhrMax = 55;
  const getYRhr = (val: number) => padding.top + innerH - ((val - rhrMin) / (rhrMax - rhrMin)) * innerH;
  const rhrPath = reversed.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYRhr(d.restingHeartRate)}`).join(' ');

  // Gráfico HRV Status
  const hrvMin = 50;
  const hrvMax = 80;
  const getYHrv = (val: number) => padding.top + innerH - ((val - hrvMin) / (hrvMax - hrvMin)) * innerH;
  const hrvPath = reversed.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYHrv(d.hrvStatus.valueMs)}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900">
          Métricas Biométricas, VO2 Max & Recuperación Garmin
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Sensores ópticos Elevate™ y análisis Firstbeat Analytics para evaluar la adaptación neuromuscular y el estrés fisiológico.
        </p>
      </div>

      {/* 4 Tarjetas de Estado Fisiológico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* VO2 Max */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>VO2 Max Carrera</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900">{latest.vo2Max}</span>
            <span className="text-xs text-slate-500 font-sans">ml/kg/min</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Nivel Superior (Percentil 95%)</span>
          </div>
        </div>

        {/* Variabilidad Cardíaca (HRV / VFC) */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Estado de VFC (HRV)</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900">{latest.hrvStatus.valueMs}</span>
            <span className="text-xs text-slate-500 font-sans">ms (noche)</span>
          </div>
          <div className="mt-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 inline-block">
            Equilibrado ({latest.hrvStatus.baselineMin}-{latest.hrvStatus.baselineMax} ms base)
          </div>
        </div>

        {/* FC Reposo */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>FC en Reposo</span>
            <Heart className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900">{latest.restingHeartRate}</span>
            <span className="text-xs text-slate-500 font-sans">bpm</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Tendencia estable (-2 bpm últimos 30 días)
          </div>
        </div>

        {/* Puntuación de Sueño & Body Battery */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Puntuación de Sueño</span>
            <Moon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900">{latest.sleepScore}</span>
            <span className="text-xs text-slate-500 font-sans">/100 · {latest.sleepHours}h</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between font-mono">
            <span>Body Battery:</span>
            <strong className="text-slate-800 font-bold">{latest.bodyBatteryHigh}/100</strong>
          </div>
        </div>
      </div>

      {/* Grid: Gráfico de VFC Nocturna + Desglose de Sueño */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Tendencia VFC (HRV) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Historial de Variabilidad de la FC (VFC / HRV)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Media nocturna rMSSD en milisegundos</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {latest.hrvStatus.valueMs} ms hoy
            </span>
          </div>

          <div className="overflow-hidden">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36">
              {/* Banda de rango de referencia base */}
              <rect
                x={padding.left}
                y={getYHrv(latest.hrvStatus.baselineMax)}
                width={innerW}
                height={getYHrv(latest.hrvStatus.baselineMin) - getYHrv(latest.hrvStatus.baselineMax)}
                fill="#E0F2FE"
                fillOpacity="0.6"
              />
              <line
                x1={padding.left}
                y1={getYHrv(latest.hrvStatus.baselineMax)}
                x2={chartW - padding.right}
                y2={getYHrv(latest.hrvStatus.baselineMax)}
                stroke="#BAE6FD"
                strokeDasharray="2 2"
              />
              <line
                x1={padding.left}
                y1={getYHrv(latest.hrvStatus.baselineMin)}
                x2={chartW - padding.right}
                y2={getYHrv(latest.hrvStatus.baselineMin)}
                stroke="#BAE6FD"
                strokeDasharray="2 2"
              />

              {/* Curva VFC */}
              <path d={hrvPath} fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />

              {reversed.map((d, i) => (
                <g key={d.date}>
                  <circle
                    cx={getX(i)}
                    cy={getYHrv(d.hrvStatus.valueMs)}
                    r="4"
                    fill="#0284C7"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x={getX(i)}
                    y={chartH - 6}
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
          </div>

          <div className="mt-3 text-xs text-slate-500 bg-slate-50 rounded p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Tu balance de VFC se mantiene en el rango base óptimo (<strong className="font-mono text-slate-700">58–74 ms</strong>). Esto indica una recuperación positiva del sistema nervioso autónomo tras la tirada larga del fin de semana.
            </p>
          </div>
        </div>

        {/* Desglose de Fases de Sueño & Recuperación */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Arquitectura de Sueño & Regeneración
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Última noche registrada en Garmin Connect</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900">
              {latest.sleepHours} horas
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {/* Barra visual de fases */}
            <div className="h-6 w-full rounded-md overflow-hidden flex text-[10px] font-mono text-white font-bold leading-6 text-center">
              <div 
                style={{ width: `${(latest.deepSleepMinutes / (latest.sleepHours * 60)) * 100}%` }}
                className="bg-indigo-700" 
                title="Sueño Profundo"
              >
                Profundo
              </div>
              <div 
                style={{ width: `${(latest.remSleepMinutes / (latest.sleepHours * 60)) * 100}%` }}
                className="bg-blue-500" 
                title="Sueño REM"
              >
                REM
              </div>
              <div 
                style={{ width: `${(latest.lightSleepMinutes / (latest.sleepHours * 60)) * 100}%` }}
                className="bg-slate-400" 
                title="Sueño Ligero"
              >
                Ligero
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
              <div className="p-2 border border-slate-100 rounded bg-slate-50">
                <span className="text-slate-400 block font-sans text-[11px]">Sueño Profundo</span>
                <span className="font-bold text-indigo-900">{latest.deepSleepMinutes} min (22%)</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-sans">Óptimo para tejido muscular</span>
              </div>
              <div className="p-2 border border-slate-100 rounded bg-slate-50">
                <span className="text-slate-400 block font-sans text-[11px]">Sueño REM</span>
                <span className="font-bold text-blue-900">{latest.remSleepMinutes} min (25%)</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-sans">Recuperación mental</span>
              </div>
              <div className="p-2 border border-slate-100 rounded bg-slate-50">
                <span className="text-slate-400 block font-sans text-[11px]">Sueño Ligero</span>
                <span className="font-bold text-slate-900">{latest.lightSleepMinutes} min (53%)</span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">Transición y descanso</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Nivel de Estrés Diario Promedio:</span>
            <span className="font-mono font-bold text-slate-800">{latest.stressAvg} / 100 (Bajo)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
