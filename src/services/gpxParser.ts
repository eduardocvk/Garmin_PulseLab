/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GarminActivity, TelemetryPoint, ActivityLap } from '../types/garmin';

// Haversine formula to compute distance in meters between two lat/lng pairs
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parseGPXString(gpxText: string, fileName: string = 'Entrenamiento Garmin'): GarminActivity {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, 'application/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('El archivo no tiene un formato GPX XML válido: ' + parserError.textContent);
  }

  const trkpts = xmlDoc.querySelectorAll('trkpt');
  if (trkpts.length === 0) {
    throw new Error('El archivo GPX no contiene puntos de track (<trkpt>).');
  }

  const telemetry: TelemetryPoint[] = [];
  let totalDistance = 0;
  let totalGain = 0;
  let totalLoss = 0;
  let prevEle: number | null = null;
  let prevLat: number | null = null;
  let prevLng: number | null = null;
  let prevTime: number | null = null;
  let startTimeMs: number | null = null;

  let hrSum = 0;
  let hrCount = 0;
  let maxHR = 0;
  let cadSum = 0;
  let cadCount = 0;
  let maxCad = 0;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lng = parseFloat(pt.getAttribute('lon') || '0');
    
    // Elevación
    const eleNode = pt.querySelector('ele');
    const elevation = eleNode ? parseFloat(eleNode.textContent || '0') : 0;

    // Tiempo
    const timeNode = pt.querySelector('time');
    const timeMs = timeNode ? new Date(timeNode.textContent || '').getTime() : 0;
    if (i === 0 && timeMs) {
      startTimeMs = timeMs;
    }

    // Distancia acumulada
    let distIncrement = 0;
    let timeDeltaSec = 1;
    if (prevLat !== null && prevLng !== null) {
      distIncrement = haversineDistance(prevLat, prevLng, lat, lng);
      totalDistance += distIncrement;
    }

    if (prevEle !== null) {
      const diff = elevation - prevEle;
      if (diff > 0.5) totalGain += diff;
      else if (diff < -0.5) totalLoss += Math.abs(diff);
    }

    if (prevTime !== null && timeMs) {
      timeDeltaSec = Math.max(0.5, (timeMs - prevTime) / 1000);
    }

    // Ritmo instantáneo (sec/km)
    let paceSecKm = 300; // 5:00 default
    if (distIncrement > 0 && timeDeltaSec > 0) {
      const speedMps = distIncrement / timeDeltaSec;
      if (speedMps > 0.2) {
        paceSecKm = Math.min(900, Math.max(120, 1000 / speedMps));
      }
    }

    // Extensiones Garmin: hr, cad
    let hr = 150;
    const hrNode = pt.querySelector('hr') || pt.querySelector('gpxtpx\\:hr, hr');
    if (hrNode && hrNode.textContent) {
      hr = parseInt(hrNode.textContent, 10);
      hrSum += hr;
      hrCount++;
      if (hr > maxHR) maxHR = hr;
    }

    let cad = 175;
    const cadNode = pt.querySelector('cad') || pt.querySelector('gpxtpx\\:cad, cad');
    if (cadNode && cadNode.textContent) {
      cad = parseInt(cadNode.textContent, 10);
      // Algunos dispositivos guardan cadencia de una pierna (85-95), doblar a 170-190
      if (cad < 120 && cad > 60) cad = cad * 2;
      cadSum += cad;
      cadCount++;
      if (cad > maxCad) maxCad = cad;
    }

    const timeOffsetSec = startTimeMs && timeMs ? Math.round((timeMs - startTimeMs) / 1000) : i;

    telemetry.push({
      index: i,
      timeOffsetSec,
      distanceMeters: Math.round(totalDistance),
      lat,
      lng,
      elevation: Math.round(elevation),
      heartRate: hr,
      paceSecKm: Math.round(paceSecKm),
      cadence: cad,
      powerWatts: Math.round(250 + (350 - paceSecKm) * 0.7)
    });

    prevLat = lat;
    prevLng = lng;
    prevEle = elevation;
    prevTime = timeMs;
  }

  // Generar splits/vueltas por km
  const laps: ActivityLap[] = [];
  const totalKm = Math.max(1, Math.floor(totalDistance / 1000));
  let lastIndex = 0;

  for (let k = 1; k <= totalKm; k++) {
    const targetDist = k * 1000;
    const nextIndex = telemetry.findIndex((p, idx) => idx >= lastIndex && p.distanceMeters >= targetDist);
    const endIndex = nextIndex !== -1 ? nextIndex : telemetry.length - 1;

    const startPt = telemetry[lastIndex];
    const endPt = telemetry[endIndex];
    const lapDuration = Math.max(1, endPt.timeOffsetSec - startPt.timeOffsetSec);
    const lapDist = Math.max(1, endPt.distanceMeters - startPt.distanceMeters);
    const lapPace = Math.round((lapDuration / lapDist) * 1000);

    const lapPts = telemetry.slice(lastIndex, endIndex + 1);
    const lapAvgHR = lapPts.length ? Math.round(lapPts.reduce((a, b) => a + b.heartRate, 0) / lapPts.length) : 155;
    const lapMaxHR = lapPts.length ? Math.max(...lapPts.map(p => p.heartRate)) : 165;
    const lapGain = Math.max(0, endPt.elevation - startPt.elevation);

    laps.push({
      lapNumber: k,
      distanceMeters: Math.round(lapDist),
      durationSeconds: lapDuration,
      avgPaceSecKm: lapPace,
      avgHeartRate: lapAvgHR,
      maxHeartRate: lapMaxHR,
      elevationGain: lapGain,
      elevationLoss: 0,
      avgCadence: 178
    });

    lastIndex = endIndex;
  }

  const durationSeconds = telemetry[telemetry.length - 1].timeOffsetSec || (trkpts.length * 2);
  const avgPace = totalDistance > 0 ? (durationSeconds / totalDistance) * 1000 : 300;
  const bestPace = Math.min(...telemetry.map(t => t.paceSecKm).filter(p => p > 150)) || Math.round(avgPace * 0.85);

  const avgHeartRate = hrCount > 0 ? Math.round(hrSum / hrCount) : 152;
  const avgCadence = cadCount > 0 ? Math.round(cadSum / cadCount) : 178;

  // Fecha del track
  const timeNode = xmlDoc.querySelector('time');
  const dateStr = timeNode && timeNode.textContent ? timeNode.textContent.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const timeStr = timeNode && timeNode.textContent ? timeNode.textContent.slice(11, 16) : '08:00';

  const nameNode = xmlDoc.querySelector('trk > name, gpx > name');
  const activityTitle = (nameNode && nameNode.textContent) ? nameNode.textContent : fileName.replace(/\.[^/.]+$/, '');

  return {
    id: 'gpx-' + Date.now(),
    title: activityTitle,
    sportType: totalGain > 300 ? 'trail_running' : 'running',
    date: dateStr,
    startTime: timeStr,
    distanceMeters: Math.round(totalDistance),
    durationSeconds,
    movingSeconds: Math.round(durationSeconds * 0.98),
    elevationGainMeters: Math.round(totalGain),
    elevationLossMeters: Math.round(totalLoss),
    avgPaceSecKm: Math.round(avgPace),
    bestPaceSecKm: Math.round(bestPace),
    avgHeartRate,
    maxHeartRate: maxHR || avgHeartRate + 18,
    avgCadence,
    maxCadence: maxCad || avgCadence + 12,
    calories: Math.round((totalDistance / 1000) * 65),
    trainingEffectAerobic: Math.min(5.0, Number((2.0 + (totalDistance / 8000)).toFixed(1))),
    trainingEffectAnaerobic: 1.2,
    trimpScore: Math.round((durationSeconds / 60) * (avgHeartRate / 100)),
    vo2MaxEstimate: 54,
    laps,
    telemetry,
    notes: 'Actividad importada desde archivo GPX.'
  };
}
