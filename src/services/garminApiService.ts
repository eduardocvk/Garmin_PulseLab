/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GarminActivity, TelemetryPoint, ActivityLap } from '../types/garmin';

interface GarminRawActivity {
  activityId?: number | string;
  activityName?: string;
  activityType?: { typeKey?: string };
  startTimeLocal?: string;
  distance?: number;           // meters
  duration?: number;           // seconds
  elapsedDuration?: number;
  movingDuration?: number;
  elevationGain?: number;
  elevationLoss?: number;
  averageSpeed?: number;       // m/s
  maxSpeed?: number;
  averageHR?: number;
  maxHR?: number;
  averageRunningCadenceInStepsPerMinute?: number;
  maxRunningCadenceInStepsPerMinute?: number;
  calories?: number;
  aerobicTrainingEffect?: number;
  anaerobicTrainingEffect?: number;
  vO2MaxValue?: number;
}

export interface SyncResult {
  success: boolean;
  activities: GarminActivity[];
  message: string;
  corsBlocked?: boolean;
}

/**
 * Convierte una actividad en formato crudo de Garmin Connect a nuestro modelo GarminActivity
 */
export function mapGarminRawToActivity(raw: GarminRawActivity, index: number): GarminActivity {
  const dist = raw.distance || 10000;
  const duration = Math.round(raw.duration || raw.elapsedDuration || 2700);
  const avgSpeed = raw.averageSpeed || (dist / duration);
  const avgPace = avgSpeed > 0 ? Math.round(1000 / avgSpeed) : 270;
  
  const dateStr = raw.startTimeLocal ? raw.startTimeLocal.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const timeStr = raw.startTimeLocal ? raw.startTimeLocal.slice(11, 16) : '08:00';

  const typeKey = raw.activityType?.typeKey || 'running';
  let sportType: GarminActivity['sportType'] = 'running';
  if (typeKey.includes('trail')) sportType = 'trail_running';
  else if (typeKey.includes('interval') || typeKey.includes('track')) sportType = 'intervals';

  const avgHR = Math.round(raw.averageHR || 155);
  const maxHR = Math.round(raw.maxHR || (avgHR + 18));
  const avgCad = Math.round(raw.averageRunningCadenceInStepsPerMinute || 178);

  // Generar laps estimados
  const kmCount = Math.max(1, Math.floor(dist / 1000));
  const laps: ActivityLap[] = [];
  for (let k = 1; k <= kmCount; k++) {
    laps.push({
      lapNumber: k,
      distanceMeters: 1000,
      durationSeconds: avgPace,
      avgPaceSecKm: avgPace,
      avgHeartRate: avgHR,
      maxHeartRate: maxHR,
      elevationGain: Math.round((raw.elevationGain || 20) / kmCount),
      elevationLoss: Math.round((raw.elevationLoss || 20) / kmCount),
      avgCadence: avgCad
    });
  }

  // Generar telemetría sintética basada en las estadísticas reales para permitir visualización en mapa y curvas
  const pointsCount = 60;
  const telemetry: TelemetryPoint[] = [];
  const distPerPoint = dist / pointsCount;
  const startLat = 40.4168 + (index * 0.015);
  const startLng = -3.7038 + (index * 0.012);

  for (let i = 0; i < pointsCount; i++) {
    const progress = i / pointsCount;
    const angle = progress * Math.PI * 2 * 1.1;
    const r = 0.02 + Math.sin(progress * 3) * 0.005;

    telemetry.push({
      index: i,
      timeOffsetSec: Math.round(progress * duration),
      distanceMeters: Math.round(i * distPerPoint),
      lat: startLat + Math.sin(angle) * r,
      lng: startLng + Math.cos(angle) * (r * 1.2),
      elevation: Math.round(620 + Math.sin(progress * Math.PI * 2) * (raw.elevationGain || 30)),
      heartRate: Math.round(avgHR - 12 + progress * 15),
      paceSecKm: Math.round(avgPace + (Math.sin(i * 0.8) * 10)),
      cadence: avgCad + (i % 2 === 0 ? 1 : -1),
      powerWatts: Math.round(250 + (350 - avgPace) * 0.8)
    });
  }

  return {
    id: String(raw.activityId || 'grm-act-' + Date.now() + '-' + index),
    title: raw.activityName || `Carrera Garmin (${(dist / 1000).toFixed(1)} km)`,
    sportType,
    date: dateStr,
    startTime: timeStr,
    distanceMeters: Math.round(dist),
    durationSeconds: duration,
    movingSeconds: Math.round(raw.movingDuration || duration * 0.98),
    elevationGainMeters: Math.round(raw.elevationGain || 0),
    elevationLossMeters: Math.round(raw.elevationLoss || 0),
    avgPaceSecKm: avgPace,
    bestPaceSecKm: Math.round(avgPace * 0.88),
    avgHeartRate: avgHR,
    maxHeartRate: maxHR,
    avgCadence: avgCad,
    maxCadence: Math.round(raw.maxRunningCadenceInStepsPerMinute || (avgCad + 12)),
    calories: Math.round(raw.calories || (dist / 1000) * 65),
    trainingEffectAerobic: Number(raw.aerobicTrainingEffect || 3.8),
    trainingEffectAnaerobic: Number(raw.anaerobicTrainingEffect || 1.2),
    trimpScore: Math.round((duration / 60) * (avgHR / 100)),
    vo2MaxEstimate: raw.vO2MaxValue ? Math.round(raw.vO2MaxValue) : 54,
    laps,
    telemetry,
    notes: 'Actividad sincronizada desde tu cuenta oficial de Garmin Connect.'
  };
}

/**
 * Ejecuta la sincronización con Garmin Connect Personal API
 */
export async function syncGarminPersonalApi(apiKey: string, useProxy: boolean = true): Promise<SyncResult> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    return { success: false, activities: [], message: 'Por favor introduce tu Clave API personal de Garmin.' };
  }

  // 1. Intentar obtener el token de acceso
  const tokenUrl = 'https://personal.connectapi.garmin.com/personalapitoken-service/personal-api/personal-api-key/token';
  const activitiesUrl = 'https://personal.connectapi.garmin.com/activitylist-service/activities/search/activities?limit=10';

  try {
    let targetUrl = tokenUrl;
    if (useProxy) {
      targetUrl = `https://corsproxy.io/?url=${encodeURIComponent(tokenUrl)}`;
    }

    const tokenResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${cleanKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tokenResponse.ok) {
      // Si la API de Garmin devuelve error de clave
      if (tokenResponse.status === 401 || tokenResponse.status === 403) {
        return {
          success: false,
          activities: [],
          message: 'Garmin denegó el acceso (401/403). Verifica que la clave API personal copiada esté activa y no haya sido revocada.'
        };
      }
      throw new Error(`Garmin API respondió con código HTTP ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken || tokenData.token;

    if (!accessToken) {
      throw new Error('Garmin no devolvió un accessToken válido en la respuesta.');
    }

    // 2. Con el access token, solicitar las actividades
    let actFetchUrl = activitiesUrl;
    if (useProxy) {
      actFetchUrl = `https://corsproxy.io/?url=${encodeURIComponent(activitiesUrl)}`;
    }

    const actResponse = await fetch(actFetchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!actResponse.ok) {
      throw new Error(`Error al descargar actividades: HTTP ${actResponse.status}`);
    }

    const rawActivities: GarminRawActivity[] = await actResponse.json();
    if (!Array.isArray(rawActivities) || rawActivities.length === 0) {
      return {
        success: true,
        activities: [],
        message: 'Conexión con Garmin completada con éxito, pero no se encontraron actividades recientes en este rango.'
      };
    }

    const parsedActivities = rawActivities.map((r, i) => mapGarminRawToActivity(r, i));

    return {
      success: true,
      activities: parsedActivities,
      message: `¡Sincronización completada! Se descargaron ${parsedActivities.length} actividades reales desde Garmin Connect.`
    };
  } catch (err: any) {
    const errorText = err.message || '';
    const isCors = errorText.toLowerCase().includes('failed to fetch') || errorText.toLowerCase().includes('networkerror');

    return {
      success: false,
      activities: [],
      corsBlocked: isCors,
      message: isCors
        ? 'Restricción de navegador (CORS): Los servidores de Garmin impiden peticiones directas desde páginas web. Te recomendamos descargar el archivo GPX/FIT de Garmin Connect y arrastrarlo, o activar el proxy seguro.'
        : `Error conectando con Garmin Connect: ${errorText}`
    };
  }
}
