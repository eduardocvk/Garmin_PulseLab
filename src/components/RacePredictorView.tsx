/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  GarminActivity, 
  generateRacePredictions, 
  formatDuration, 
  formatPace, 
  formatDistance 
} from '../types/garmin';
import { 
  Target, 
  Timer, 
  TrendingDown, 
  Sparkles, 
  Sliders, 
  Check, 
  Award, 
  ChevronRight,
  Printer,
  Copy
} from 'lucide-react';

interface RacePredictorViewProps {
  activities: GarminActivity[];
  userVo2Max?: number;
}

export const RacePredictorView: React.FC<RacePredictorViewProps> = ({
  activities,
  userVo2Max = 54
}) => {
  // Actividad seleccionada como referencia de rendimiento
  const [selectedRefActivityId, setSelectedRefActivityId] = useState<string>(
    activities.find(a => a.sportType === 'running' && a.distanceMeters >= 10000)?.id || activities[0]?.id || ''
  );

  const [customDistanceKm, setCustomDistanceKm] = useState<number>(10);
  const [customMinutes, setCustomMinutes] = useState<number>(43);
  const [customSeconds, setCustomSeconds] = useState<number>(30);
  const [useCustomInput, setUseCustomInput] = useState<boolean>(false);

  // Estrategia de ritmo para la carrera elegida
  const [targetRaceDistanceKm, setTargetRaceDistanceKm] = useState<number>(42.195);
  const [pacingStrategy, setPacingStrategy] = useState<'negative' | 'even' | 'conservative'>('negative');
  const [copiedBand, setCopiedBand] = useState<boolean>(false);

  // Datos de referencia calculados
  const refData = useMemo(() => {
    if (useCustomInput) {
      const totalSec = customMinutes * 60 + customSeconds;
      return {
        distanceMeters: customDistanceKm * 1000,
        timeSeconds: totalSec,
        paceSecKm: totalSec / customDistanceKm,
        label: `Marca Personal: ${customDistanceKm}K en ${customMinutes}:${customSeconds < 10 ? '0' : ''}${customSeconds}`
      };
    }
    const act = activities.find(a => a.id === selectedRefActivityId) || activities[0];
    return {
      distanceMeters: act?.distanceMeters || 10000,
      timeSeconds: act?.durationSeconds || 2700,
      paceSecKm: act?.avgPaceSecKm || 270,
      label: act ? `${act.title} (${formatDistance(act.distanceMeters)} en ${formatDuration(act.durationSeconds)})` : '10K en 45:00'
    };
  }, [useCustomInput, customDistanceKm, customMinutes, customSeconds, activities, selectedRefActivityId]);

  // Predicciones basadas en la fórmula de Riegel calibrada
  const predictions = useMemo(() => {
    return generateRacePredictions(refData.distanceMeters, refData.timeSeconds, userVo2Max);
  }, [refData, userVo2Max]);

  // Predicción seleccionada para generar la tabla de pasos
  const activePrediction = predictions.find(p => Math.abs(p.distanceKm - targetRaceDistanceKm) < 0.5) || predictions[3];

  // Generador de la estrategia km a km
  const pacingPlan = useMemo(() => {
    const totalKm = Math.ceil(activePrediction.distanceKm);
    const basePace = activePrediction.predictedPaceSecKm;
    const plan = [];
    let cumulativeSeconds = 0;

    for (let k = 1; k <= totalKm; k++) {
      const progress = k / totalKm;
      let paceModifier = 0; // segundos de diferencia respecto al ritmo base

      if (pacingStrategy === 'negative') {
        // Primera mitad +1.5% más lenta, segunda mitad -2% más rápida
        paceModifier = progress < 0.5 ? 4 : -5;
      } else if (pacingStrategy === 'conservative') {
        // Primeros 4 km muy conservadores (+8s), resto ritmo crucero
        paceModifier = k <= 4 ? 8 : -2;
      } else {
        // Even split: ritmo uniforme
        paceModifier = 0;
      }

      const kmDist = (k === totalKm && activePrediction.distanceKm % 1 !== 0) 
        ? (activePrediction.distanceKm - Math.floor(activePrediction.distanceKm)) 
        : 1.0;

      const kmPace = Math.round(basePace + paceModifier);
      const kmDuration = Math.round(kmPace * kmDist);
      cumulativeSeconds += kmDuration;

      // Sugerencias de hidratación y nutrición en carrera
      let note = '';
      if (activePrediction.distanceKm >= 21) {
        if (k === 5) note = 'Agua / Sales';
        if (k === 10) note = 'Gel energético #1';
        if (k === 15) note = 'Agua / Sales';
        if (k === 20) note = 'Gel energético #2';
        if (k === 25) note = 'Agua / Sales';
        if (k === 30) note = 'Gel energético #3 + Cafeína';
        if (k === 35) note = 'Último avituallamiento';
        if (k === totalKm) note = 'Sprint final';
      }

      plan.push({
        km: k,
        isPartial: kmDist < 1.0,
        kmDist,
        paceSecKm: kmPace,
        kmDuration,
        cumulativeSeconds,
        note
      });
    }

    return plan;
  }, [activePrediction, pacingStrategy]);

  const handleCopyBand = () => {
    const text = pacingPlan.map(p => `Km ${p.km}: ${formatPace(p.paceSecKm)} -> ${formatDuration(p.cumulativeSeconds)} ${p.note ? `(${p.note})` : ''}`).join('\n');
    navigator.clipboard.writeText(`Plan de Carrera ${activePrediction.raceName} (Objetivo: ${formatDuration(activePrediction.predictedSeconds)}):\n` + text);
    setCopiedBand(true);
    setTimeout(() => setCopiedBand(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header y Selección de Base de Calibración */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                Predictor de Marcas & Estrategia de Ritmo (Pacing)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fórmula científica de Pete Riegel calibrada con tu VO2 Max Garmin ({userVo2Max} ml/kg/min)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setUseCustomInput(false)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                !useCustomInput ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Usar Actividad Garmin
            </button>
            <button
              onClick={() => setUseCustomInput(true)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                useCustomInput ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Entrada Manual
            </button>
          </div>
        </div>

        {/* Controles de Calibración */}
        <div className="mt-4 pt-1">
          {!useCustomInput ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 shrink-0">
                Carrera de referencia para el cálculo:
              </label>
              <select
                value={selectedRefActivityId}
                onChange={(e) => setSelectedRefActivityId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-md py-1.5 px-3 text-xs font-mono font-medium text-slate-900 cursor-pointer flex-1"
              >
                {activities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.date} · {a.title} ({formatDistance(a.distanceMeters)} @ {formatPace(a.avgPaceSecKm)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-sans">Distancia Test:</span>
                <input
                  type="number"
                  value={customDistanceKm}
                  onChange={(e) => setCustomDistanceKm(Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold"
                />
                <span className="text-slate-500">km</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-sans">Tiempo:</span>
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(0, Number(e.target.value)))}
                  className="w-14 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold"
                />
                <span className="text-slate-500">min</span>
                <input
                  type="number"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-14 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold"
                />
                <span className="text-slate-500">seg</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Predicciones por Distancia Oficial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {predictions.map(pred => {
          const isSelected = Math.abs(pred.distanceKm - targetRaceDistanceKm) < 0.5;

          return (
            <div
              key={pred.raceName}
              onClick={() => setTargetRaceDistanceKm(pred.distanceKm)}
              className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {pred.raceName}
                  </span>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {formatDuration(pred.predictedSeconds)}
                  </div>
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans text-slate-400">Ritmo Objetivo:</span>
                  <span className="font-bold text-blue-600">{formatPace(pred.predictedPaceSecKm)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span className="font-sans text-slate-400">Rango Seguro:</span>
                  <span>{formatDuration(pred.aggressiveSeconds)} - {formatDuration(pred.conservativeSeconds)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Planificador de Estrategia de Ritmo (Pacing Band) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Estrategia Kilómetro a Kilómetro para {activePrediction.raceName}
              </h2>
              <span className="text-xs font-mono font-bold text-blue-600">
                Objetivo: {formatDuration(activePrediction.predictedSeconds)} (@ {formatPace(activePrediction.predictedPaceSecKm)})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personaliza el reparto del esfuerzo para evitar el muro y maximizar la economía de carrera.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de estrategia */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-medium">
              <button
                onClick={() => setPacingStrategy('negative')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  pacingStrategy === 'negative' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Split Negativo (-2%)
              </button>
              <button
                onClick={() => setPacingStrategy('even')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  pacingStrategy === 'even' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Ritmo Constante
              </button>
              <button
                onClick={() => setPacingStrategy('conservative')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                  pacingStrategy === 'conservative' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Inicio Prudente
              </button>
            </div>

            <button
              onClick={handleCopyBand}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedBand ? '¡Copiado!' : 'Copiar Pulsera'}</span>
            </button>
          </div>
        </div>

        {/* Tabla de Pacing de Carrera */}
        <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Km</th>
                  <th className="py-2.5 px-3">Ritmo Tramo</th>
                  <th className="py-2.5 px-3">Tiempo Acumulado</th>
                  <th className="py-2.5 px-3">Zona Esfuerzo</th>
                  <th className="py-2.5 px-3">Estrategia / Avituallamiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pacingPlan.map(p => (
                  <tr key={p.km} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-slate-900 font-bold">
                      {p.isPartial ? `${activePrediction.distanceKm}K (Meta)` : `Km ${p.km}`}
                    </td>
                    <td className="py-2 px-3 text-blue-600 font-semibold">
                      {formatPace(p.paceSecKm)}
                    </td>
                    <td className="py-2 px-3 text-slate-900 font-bold">
                      {formatDuration(p.cumulativeSeconds)}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[11px] font-sans font-medium text-slate-600">
                        {p.km < activePrediction.distanceKm * 0.4 ? 'Z3 Aeróbico Alto' : 'Z4 Umbral Lactato'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {p.note ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          {p.note}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
