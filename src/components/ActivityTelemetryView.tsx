/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  GarminActivity, 
  TelemetryPoint,
  formatDistance, 
  formatDuration, 
  formatPace, 
  getHRZone 
} from '../types/garmin';
import { 
  MapPin, 
  Activity, 
  TrendingUp, 
  Clock, 
  Flame, 
  Heart, 
  ChevronDown, 
  Sliders,
  Layers,
  ArrowUpDown,
  Compass
} from 'lucide-react';

interface ActivityTelemetryViewProps {
  activities: GarminActivity[];
  selectedActivityId: string;
  onSelectActivity: (id: string) => void;
}

export const ActivityTelemetryView: React.FC<ActivityTelemetryViewProps> = ({
  activities,
  selectedActivityId,
  onSelectActivity
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [mapColorMetric, setMapColorMetric] = useState<'pace' | 'hr' | 'elevation'>('pace');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredActivities = useMemo(() => {
    if (filterType === 'all') return activities;
    return activities.filter(a => a.sportType === filterType);
  }, [activities, filterType]);

  const activity = activities.find(a => a.id === selectedActivityId) || activities[0];

  const telemetry = activity?.telemetry || [];
  const laps = activity?.laps || [];

  // Bounding box para proyección SVG del mapa GPS
  const mapBounds = useMemo(() => {
    if (!telemetry.length) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    telemetry.forEach(p => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });
    // Añadir margen
    const latSpan = Math.max(0.005, maxLat - minLat);
    const lngSpan = Math.max(0.005, maxLng - minLng);
    return {
      minLat: minLat - latSpan * 0.08,
      maxLat: maxLat + latSpan * 0.08,
      minLng: minLng - lngSpan * 0.08,
      maxLng: maxLng + lngSpan * 0.08,
    };
  }, [telemetry]);

  const mapSvgWidth = 600;
  const mapSvgHeight = 380;

  const projectToMap = (lat: number, lng: number) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * mapSvgWidth;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * mapSvgHeight;
    return { x, y };
  };

  // Coordenadas del punto con cursor activo
  const activePoint = hoveredPointIndex !== null && telemetry[hoveredPointIndex] ? telemetry[hoveredPointIndex] : null;
  const activeMapCoords = activePoint ? projectToMap(activePoint.lat, activePoint.lng) : null;

  // Dimensiones para la gráfica de telemetría multi-fila
  const chartW = 900;
  const chartH = 120; // Altura individual de cada fila métrica
  const pLeft = 55;
  const pRight = 25;
  const pTop = 15;
  const pBottom = 20;
  const innerW = chartW - pLeft - pRight;
  const innerH = chartH - pTop - pBottom;

  const maxDist = activity?.distanceMeters || 1;
  const getX = (distMeters: number) => pLeft + (distMeters / maxDist) * innerW;

  // Rangos métricos
  const eleMin = Math.min(...telemetry.map(t => t.elevation)) - 10;
  const eleMax = Math.max(...telemetry.map(t => t.elevation)) + 15;
  const hrMin = 110;
  const hrMax = Math.max(195, ...telemetry.map(t => t.heartRate));
  const paceMin = 180; // 3:00/km (arriba)
  const paceMax = 420; // 7:00/km (abajo)

  const getYEle = (ele: number) => pTop + innerH - ((ele - eleMin) / (eleMax - eleMin)) * innerH;
  const getYHR = (hr: number) => pTop + innerH - ((hr - hrMin) / (hrMax - hrMin)) * innerH;
  // En ritmo: menos segundos = más rápido = más arriba en el gráfico
  const getYPace = (pace: number) => pTop + ((pace - paceMin) / (paceMax - paceMin)) * innerH;

  const elePath = telemetry.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.distanceMeters)} ${getYEle(d.elevation)}`).join(' ');
  const eleArea = elePath + ` L ${getX(telemetry[telemetry.length - 1]?.distanceMeters || 0)} ${chartH - pBottom} L ${getX(0)} ${chartH - pBottom} Z`;

  const hrPath = telemetry.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.distanceMeters)} ${getYHR(d.heartRate)}`).join(' ');
  const pacePath = telemetry.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.distanceMeters)} ${getYPace(Math.max(paceMin, Math.min(paceMax, d.paceSecKm)))}`).join(' ');

  // Manejador del cursor en la gráfica
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * chartW;
    const boundedX = Math.max(pLeft, Math.min(chartW - pRight, clickX));
    const distRatio = (boundedX - pLeft) / innerW;
    const targetDist = distRatio * maxDist;

    let closestIdx = 0;
    let minDiff = Infinity;
    telemetry.forEach((pt, idx) => {
      const diff = Math.abs(pt.distanceMeters - targetDist);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredPointIndex(closestIdx);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Actividad y Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Sesión:
          </label>
          <div className="relative min-w-[280px]">
            <select
              value={selectedActivityId}
              onChange={(e) => onSelectActivity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 pl-3 pr-8 text-sm font-semibold text-slate-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {filteredActivities.map(a => (
                <option key={a.id} value={a.id}>
                  {a.date} · {a.title} ({formatDistance(a.distanceMeters)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros de Tipo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'running', label: 'Asfalto / Maratón' },
            { id: 'intervals', label: 'Series & Pista' },
            { id: 'trail_running', label: 'Trail / Desnivel' },
            { id: 'recovery_run', label: 'Regenerativo' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === f.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header Resumen de la Actividad Seleccionada */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{activity.date} · {activity.startTime}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-medium text-blue-600">{activity.shoeName || 'Garmin Running'}</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 mt-1">
              {activity.title}
            </h2>
            {activity.notes && (
              <p className="text-xs text-slate-500 mt-1">{activity.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Distancia</div>
              <div className="text-xl font-bold font-mono text-slate-900">{formatDistance(activity.distanceMeters)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Tiempo Total</div>
              <div className="text-xl font-bold font-mono text-slate-900">{formatDuration(activity.durationSeconds)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Ritmo Medio</div>
              <div className="text-xl font-bold font-mono text-blue-600">{formatPace(activity.avgPaceSecKm)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">FC Media</div>
              <div className="text-xl font-bold font-mono text-red-600">{activity.avgHeartRate} <span className="text-xs text-slate-400 font-sans">bpm</span></div>
            </div>
          </div>
        </div>

        {/* Sección 2 Columnas: Mapa GPS y Visor de Telemetría */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Mapa de Ruta GPS (SVG de Alta Precisión) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Compass className="w-4 h-4 text-slate-500" />
                <span>Traza GPS de la Carrera</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 mr-1">Color:</span>
                <button
                  onClick={() => setMapColorMetric('pace')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${mapColorMetric === 'pace' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Ritmo
                </button>
                <button
                  onClick={() => setMapColorMetric('hr')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${mapColorMetric === 'hr' ? 'bg-red-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Pulso
                </button>
                <button
                  onClick={() => setMapColorMetric('elevation')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${mapColorMetric === 'elevation' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Altimetría
                </button>
              </div>
            </div>

            {/* Canvas SVG de la Ruta */}
            <div className="relative bg-white border border-slate-200 rounded-md overflow-hidden aspect-4/3 flex items-center justify-center">
              <svg
                viewBox={`0 0 ${mapSvgWidth} ${mapSvgHeight}`}
                className="w-full h-full"
              >
                {/* Cuadrícula sutil de fondo geográfico */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F1F5F9" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width={mapSvgWidth} height={mapSvgHeight} fill="url(#grid)" />

                {/* Sombra de la ruta */}
                <path
                  d={telemetry.map((pt, idx) => {
                    const { x, y } = projectToMap(pt.lat, pt.lng);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Trazado principal coloreado por segmentos */}
                {telemetry.map((pt, idx) => {
                  if (idx === 0) return null;
                  const prevPt = telemetry[idx - 1];
                  const p1 = projectToMap(prevPt.lat, prevPt.lng);
                  const p2 = projectToMap(pt.lat, pt.lng);

                  let strokeColor = '#2563EB'; // default ritmo
                  if (mapColorMetric === 'pace') {
                    strokeColor = pt.paceSecKm < 240 ? '#7C3AED' : pt.paceSecKm < 270 ? '#2563EB' : '#059669';
                  } else if (mapColorMetric === 'hr') {
                    const zone = getHRZone(pt.heartRate);
                    strokeColor = zone.color;
                  } else {
                    strokeColor = pt.elevation > (eleMin + (eleMax - eleMin) * 0.6) ? '#DC2626' : '#059669';
                  }

                  return (
                    <line
                      key={idx}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={strokeColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Marcadores de Kilómetros en el mapa */}
                {laps.slice(0, 15).map(lap => {
                  const pt = telemetry.find(p => p.distanceMeters >= lap.lapNumber * 1000);
                  if (!pt) return null;
                  const { x, y } = projectToMap(pt.lat, pt.lng);
                  return (
                    <g key={lap.lapNumber} className="cursor-pointer">
                      <circle cx={x} cy={y} r="7" fill="#0F172A" />
                      <text
                        x={x}
                        y={y + 3}
                        fill="#FFFFFF"
                        fontSize="8"
                        fontFamily="JetBrains Mono"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {lap.lapNumber}
                      </text>
                    </g>
                  );
                })}

                {/* Punto de Inicio (Verde) y Meta (Negro) */}
                {telemetry.length > 0 && (() => {
                  const startCoords = projectToMap(telemetry[0].lat, telemetry[0].lng);
                  const endCoords = projectToMap(telemetry[telemetry.length - 1].lat, telemetry[telemetry.length - 1].lng);
                  return (
                    <>
                      <circle cx={startCoords.x} cy={startCoords.y} r="6" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                      <circle cx={endCoords.x} cy={endCoords.y} r="6" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
                    </>
                  );
                })()}

                {/* Marcador del cursor sincronizado */}
                {activeMapCoords && (
                  <g>
                    <circle cx={activeMapCoords.x} cy={activeMapCoords.y} r="10" fill="#2563EB" fillOpacity="0.25" />
                    <circle cx={activeMapCoords.x} cy={activeMapCoords.y} r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                  </g>
                )}
              </svg>

              {/* Tarjeta flotante con telemetría en tiempo real */}
              {activePoint && (
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs border border-slate-200 rounded p-2 text-xs font-mono shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400">Km: </span>
                    <strong className="text-slate-900 font-bold">{(activePoint.distanceMeters / 1000).toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Ritmo: </span>
                    <strong className="text-blue-600 font-bold">{formatPace(activePoint.paceSecKm)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Pulso: </span>
                    <strong className="text-red-600 font-bold">{activePoint.heartRate} bpm</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Alt: </span>
                    <strong className="text-emerald-700 font-bold">{activePoint.elevation} m</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Métricas del terreno */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
              <div className="bg-white border border-slate-200 rounded p-2">
                <span className="text-slate-400 block font-sans">Desnivel +</span>
                <span className="font-mono font-bold text-slate-800">+{activity.elevationGainMeters} m</span>
              </div>
              <div className="bg-white border border-slate-200 rounded p-2">
                <span className="text-slate-400 block font-sans">Desnivel -</span>
                <span className="font-mono font-bold text-slate-800">-{activity.elevationLossMeters} m</span>
              </div>
              <div className="bg-white border border-slate-200 rounded p-2">
                <span className="text-slate-400 block font-sans">Cadencia Med.</span>
                <span className="font-mono font-bold text-slate-800">{activity.avgCadence} spm</span>
              </div>
            </div>
          </div>

          {/* Gráficas Multifila Sincronizadas (Altimetría, Ritmo, Pulso) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-800">Telemetría Sincronizada por Distancia</span>
              <span className="font-mono">Desplaza el ratón sobre los gráficos para ubicar el punto en el mapa</span>
            </div>

            <div 
              className="bg-white border border-slate-200 rounded-lg p-3 relative cursor-crosshair select-none"
              onMouseLeave={() => setHoveredPointIndex(null)}
            >
              {/* Gráfica 1: Altimetría */}
              <div className="mb-2">
                <div className="flex justify-between items-center text-xs font-mono px-2 text-slate-500 mb-1">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-emerald-600 inline-block" />
                    Altimetría (m)
                  </span>
                  <span>Min: {eleMin + 10}m · Max: {eleMax - 15}m</span>
                </div>
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full h-24 overflow-visible"
                  onMouseMove={handleChartMouseMove}
                >
                  <path d={eleArea} fill="#10B981" fillOpacity="0.12" />
                  <path d={elePath} fill="none" stroke="#059669" strokeWidth="2" />
                  
                  {/* Línea vertical sincronizada */}
                  {activePoint && (
                    <line
                      x1={getX(activePoint.distanceMeters)}
                      y1={pTop}
                      x2={getX(activePoint.distanceMeters)}
                      y2={chartH - pBottom}
                      stroke="#0F172A"
                      strokeWidth="1.5"
                    />
                  )}
                </svg>
              </div>

              {/* Gráfica 2: Ritmo de Carrera */}
              <div className="mb-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-mono px-2 text-slate-500 mb-1">
                  <span className="font-bold text-blue-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-blue-600 inline-block" />
                    Ritmo (min/km)
                  </span>
                  <span>Promedio: {formatPace(activity.avgPaceSecKm)}</span>
                </div>
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full h-24 overflow-visible"
                  onMouseMove={handleChartMouseMove}
                >
                  {/* Línea de ritmo promedio */}
                  <line
                    x1={pLeft}
                    y1={getYPace(activity.avgPaceSecKm)}
                    x2={chartW - pRight}
                    y2={getYPace(activity.avgPaceSecKm)}
                    stroke="#94A3B8"
                    strokeDasharray="4 3"
                    strokeWidth="1"
                  />
                  <path d={pacePath} fill="none" stroke="#2563EB" strokeWidth="2" />

                  {activePoint && (
                    <line
                      x1={getX(activePoint.distanceMeters)}
                      y1={pTop}
                      x2={getX(activePoint.distanceMeters)}
                      y2={chartH - pBottom}
                      stroke="#0F172A"
                      strokeWidth="1.5"
                    />
                  )}
                </svg>
              </div>

              {/* Gráfica 3: Frecuencia Cardíaca */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-mono px-2 text-slate-500 mb-1">
                  <span className="font-bold text-red-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-red-600 inline-block" />
                    Frecuencia Cardíaca (bpm)
                  </span>
                  <span>Med: {activity.avgHeartRate} bpm · Máx: {activity.maxHeartRate} bpm</span>
                </div>
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full h-24 overflow-visible"
                  onMouseMove={handleChartMouseMove}
                >
                  {/* Banda Z4/Z5 */}
                  <line
                    x1={pLeft}
                    y1={getYHR(170)}
                    x2={chartW - pRight}
                    y2={getYHR(170)}
                    stroke="#FCA5A5"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <path d={hrPath} fill="none" stroke="#DC2626" strokeWidth="2" />

                  {activePoint && (
                    <line
                      x1={getX(activePoint.distanceMeters)}
                      y1={pTop}
                      x2={getX(activePoint.distanceMeters)}
                      y2={chartH - pBottom}
                      stroke="#0F172A"
                      strokeWidth="1.5"
                    />
                  )}
                </svg>
              </div>

              {/* Eje X de Kilómetros */}
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2 px-6">
                <span>0.0 km</span>
                <span>{(maxDist * 0.25 / 1000).toFixed(1)} km</span>
                <span>{(maxDist * 0.5 / 1000).toFixed(1)} km</span>
                <span>{(maxDist * 0.75 / 1000).toFixed(1)} km</span>
                <span>{(maxDist / 1000).toFixed(1)} km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Detallada de Splits / Vueltas por Kilómetro */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Desglose de Splits por Kilómetro ({laps.length} vueltas)
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Tiempo en movimiento · Precisión Garmin
            </span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Km #</th>
                    <th className="py-2.5 px-3">Tiempo</th>
                    <th className="py-2.5 px-3">Ritmo Split</th>
                    <th className="py-2.5 px-3">FC Media</th>
                    <th className="py-2.5 px-3">FC Máx</th>
                    <th className="py-2.5 px-3">Cadencia</th>
                    <th className="py-2.5 px-3">Desnivel</th>
                    <th className="py-2.5 px-3">Zona Dominante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {laps.map(lap => {
                    const zone = getHRZone(lap.avgHeartRate);
                    const isKmHovered = activePoint && Math.floor(activePoint.distanceMeters / 1000) + 1 === lap.lapNumber;

                    return (
                      <tr 
                        key={lap.lapNumber}
                        className={`transition-colors ${isKmHovered ? 'bg-blue-50 font-bold' : 'hover:bg-slate-50'}`}
                      >
                        <td className="py-2 px-3 text-slate-900 font-bold">
                          Km {lap.lapNumber}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {formatDuration(lap.durationSeconds)}
                        </td>
                        <td className="py-2 px-3 text-blue-600 font-semibold">
                          {formatPace(lap.avgPaceSecKm)}
                        </td>
                        <td className="py-2 px-3 text-slate-900">
                          {lap.avgHeartRate} bpm
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {lap.maxHeartRate} bpm
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {lap.avgCadence} spm
                        </td>
                        <td className="py-2 px-3 text-emerald-700">
                          +{lap.elevationGain}m
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-sans font-medium ${zone.bgSubtle} ${zone.textColor}`}>
                            {zone.name}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
