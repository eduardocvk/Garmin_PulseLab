/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GarminActivity, HealthMetricDay, TrainingLoadPoint, GarminApiConfig } from '../types/garmin';

// Generador de puntos de telemetría continuos y realistas
function generateRunningTelemetry(
  distanceKm: number,
  basePaceSec: number,
  baseHR: number,
  baseEle: number,
  startLat: number = 40.4168,
  startLng: number = -3.7038,
  eleVariation: number = 40
) {
  const pointsCount = 100;
  const points = [];
  const distancePerPoint = (distanceKm * 1000) / pointsCount;
  let currentEle = baseEle;
  let currentHR = baseHR - 15; // Inicia más bajo en calentamiento

  for (let i = 0; i < pointsCount; i++) {
    const progress = i / pointsCount;
    // Elevación suave ondulada
    currentEle = baseEle + Math.sin(progress * Math.PI * 3) * eleVariation + Math.cos(progress * 8) * 8;
    
    // Ritmo con pequeñas variaciones
    const paceNoise = (Math.sin(i * 0.7) * 12) + (Math.cos(i * 1.3) * 8);
    const pace = Math.max(200, Math.round(basePaceSec + paceNoise + (progress > 0.8 ? -10 : 0))); // Apretón final
    
    // FC sube con el esfuerzo y la elevación
    const eleDiff = currentEle - baseEle;
    const targetHR = baseHR + (progress * 12) + (eleDiff * 0.4) + (paceNoise < 0 ? 5 : -3);
    currentHR = Math.round(currentHR * 0.85 + targetHR * 0.15);

    // Coordenadas simuladas en ruta circular
    const angle = progress * Math.PI * 2 * 1.2;
    const radius = 0.025 + Math.sin(progress * 4) * 0.008;
    const lat = startLat + Math.sin(angle) * radius;
    const lng = startLng + Math.cos(angle) * (radius * 1.3);

    const cadence = 176 + Math.round(Math.sin(i * 0.5) * 4);
    const power = Math.round(260 + (380 - pace) * 0.8 + Math.max(0, eleDiff) * 1.5);

    points.push({
      index: i,
      timeOffsetSec: Math.round(i * (distancePerPoint / (1000 / pace))),
      distanceMeters: Math.round(i * distancePerPoint),
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      elevation: Math.round(currentEle),
      heartRate: currentHR,
      paceSecKm: pace,
      cadence,
      powerWatts: power
    });
  }

  return points;
}

// Generador de laps por kilómetro
function generateLaps(totalMeters: number, avgPace: number, avgHR: number) {
  const totalKm = Math.floor(totalMeters / 1000);
  const laps = [];

  for (let k = 1; k <= totalKm; k++) {
    const progress = k / totalKm;
    const paceMod = (Math.sin(k * 1.5) * 8) + (progress > 0.7 ? -6 : 3);
    const lapPace = Math.round(avgPace + paceMod);
    const lapHR = Math.round(avgHR - 10 + (progress * 14));
    
    laps.push({
      lapNumber: k,
      distanceMeters: 1000,
      durationSeconds: lapPace,
      avgPaceSecKm: lapPace,
      avgHeartRate: lapHR,
      maxHeartRate: lapHR + 6,
      elevationGain: Math.max(0, Math.round(Math.sin(k * 0.8) * 18)),
      elevationLoss: Math.max(0, Math.round(Math.cos(k * 0.8) * 16)),
      avgCadence: 178 + (k % 3)
    });
  }

  return laps;
}

export const initialActivities: GarminActivity[] = [
  {
    id: 'act-001',
    title: 'Tirada Larga Maratón - Progresivo Final',
    sportType: 'running',
    date: '2026-11-04',
    startTime: '08:15',
    distanceMeters: 28420,
    durationSeconds: 7724, // 2h 08m 44s
    movingSeconds: 7650,
    elevationGainMeters: 185,
    elevationLossMeters: 182,
    avgPaceSecKm: 271, // 4:31/km
    bestPaceSecKm: 242, // 4:02/km
    avgHeartRate: 154,
    maxHeartRate: 173,
    avgCadence: 178,
    maxCadence: 186,
    calories: 1890,
    trainingEffectAerobic: 4.8,
    trainingEffectAnaerobic: 1.2,
    trimpScore: 215,
    vo2MaxEstimate: 54,
    temperatureCelsius: 12,
    shoeName: 'Nike Vaporfly 3',
    notes: 'Bloque clave para el maratón. Sensaciones excelentes en los últimos 6 km a ritmo objetivo de 4:15/km.',
    telemetry: generateRunningTelemetry(28.42, 271, 154, 640, 40.4168, -3.7038, 45),
    laps: generateLaps(28420, 271, 154)
  },
  {
    id: 'act-002',
    title: 'Series 8x1000m en Pista (Recup. 90s)',
    sportType: 'intervals',
    date: '2026-11-02',
    startTime: '18:40',
    distanceMeters: 13200,
    durationSeconds: 3410, // 56m 50s
    movingSeconds: 3120,
    elevationGainMeters: 22,
    elevationLossMeters: 20,
    avgPaceSecKm: 258, // 4:18/km (incluye calentamiento y descansos)
    bestPaceSecKm: 212, // 3:32/km en las repeticiones
    avgHeartRate: 164,
    maxHeartRate: 184,
    avgCadence: 184,
    maxCadence: 196,
    calories: 890,
    trainingEffectAerobic: 3.9,
    trainingEffectAnaerobic: 3.4,
    trimpScore: 165,
    vo2MaxEstimate: 54,
    temperatureCelsius: 15,
    shoeName: 'Saucony Endorphin Speed 4',
    notes: 'Repeticiones clavadas entre 3:34 y 3:38/km. Muy buena respuesta cardiovascular.',
    telemetry: generateRunningTelemetry(13.2, 258, 164, 620, 40.4420, -3.6910, 10),
    laps: generateLaps(13200, 258, 164)
  },
  {
    id: 'act-003',
    title: 'Media Maratón Oficial de Madrid (PB)',
    sportType: 'running',
    date: '2026-10-25',
    startTime: '09:00',
    distanceMeters: 21097,
    durationSeconds: 5495, // 1h 31m 35s
    movingSeconds: 5495,
    elevationGainMeters: 142,
    elevationLossMeters: 140,
    avgPaceSecKm: 260, // 4:20/km
    bestPaceSecKm: 236, // 3:56/km
    avgHeartRate: 172,
    maxHeartRate: 186,
    avgCadence: 182,
    maxCadence: 191,
    calories: 1480,
    trainingEffectAerobic: 5.0,
    trainingEffectAnaerobic: 2.1,
    trimpScore: 230,
    vo2MaxEstimate: 54,
    temperatureCelsius: 14,
    shoeName: 'Nike Vaporfly 3',
    notes: 'Nueva marca personal en 21K. Segunda mitad en split negativo (45:15 vs 46:20).',
    telemetry: generateRunningTelemetry(21.1, 260, 172, 650, 40.4200, -3.6900, 35),
    laps: generateLaps(21097, 260, 172)
  },
  {
    id: 'act-004',
    title: 'Trail Running Desnivel - Monte de El Pardo',
    sportType: 'trail_running',
    date: '2026-10-21',
    startTime: '09:30',
    distanceMeters: 17800,
    durationSeconds: 6840, // 1h 54m 00s
    movingSeconds: 6710,
    elevationGainMeters: 465,
    elevationLossMeters: 460,
    avgPaceSecKm: 384, // 6:24/km
    bestPaceSecKm: 285, // 4:45/km
    avgHeartRate: 156,
    maxHeartRate: 179,
    avgCadence: 168,
    maxCadence: 180,
    calories: 1610,
    trainingEffectAerobic: 4.3,
    trainingEffectAnaerobic: 1.8,
    trimpScore: 190,
    vo2MaxEstimate: 53,
    temperatureCelsius: 11,
    shoeName: 'Hoka Speedgoat 5',
    notes: 'Excelente trabajo de fuerza excéntrica en cuádriceps y tobillos.',
    telemetry: generateRunningTelemetry(17.8, 384, 156, 720, 40.5200, -3.7800, 140),
    laps: generateLaps(17800, 384, 156)
  },
  {
    id: 'act-005',
    title: 'Rodaje Regenerativo en Zona 2',
    sportType: 'recovery_run',
    date: '2026-10-18',
    startTime: '07:45',
    distanceMeters: 9200,
    durationSeconds: 2950, // 49m 10s
    movingSeconds: 2950,
    elevationGainMeters: 45,
    elevationLossMeters: 45,
    avgPaceSecKm: 320, // 5:20/km
    bestPaceSecKm: 295,
    avgHeartRate: 133,
    maxHeartRate: 142,
    avgCadence: 174,
    maxCadence: 178,
    calories: 580,
    trainingEffectAerobic: 2.2,
    trainingEffectAnaerobic: 0.1,
    trimpScore: 55,
    vo2MaxEstimate: 53,
    temperatureCelsius: 9,
    shoeName: 'Asics Nimbus 26',
    notes: 'Puro flujo en Z2. Frecuencia cardíaca controlada en todo momento por debajo de 140 bpm.',
    telemetry: generateRunningTelemetry(9.2, 320, 133, 630, 40.4150, -3.6800, 18),
    laps: generateLaps(9200, 320, 133)
  },
  {
    id: 'act-006',
    title: 'Tempo Run 12K - Ritmo Umbral Lactato',
    sportType: 'tempo',
    date: '2026-10-14',
    startTime: '19:10',
    distanceMeters: 14500,
    durationSeconds: 3755, // 1h 02m 35s
    movingSeconds: 3710,
    elevationGainMeters: 68,
    elevationLossMeters: 65,
    avgPaceSecKm: 259, // 4:19/km
    bestPaceSecKm: 244,
    avgHeartRate: 168,
    maxHeartRate: 178,
    avgCadence: 181,
    maxCadence: 188,
    calories: 1040,
    trainingEffectAerobic: 4.4,
    trainingEffectAnaerobic: 2.0,
    trimpScore: 175,
    vo2MaxEstimate: 53,
    temperatureCelsius: 16,
    shoeName: 'Saucony Endorphin Speed 4',
    notes: '12 km continuos a 4:12/km tras 2.5 km de calentamiento. Ritmo muy sólido y estable.',
    telemetry: generateRunningTelemetry(14.5, 259, 168, 645, 40.4300, -3.7100, 25),
    laps: generateLaps(14500, 259, 168)
  }
];

export const initialHealthMetrics: HealthMetricDay[] = [
  {
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
  },
  {
    date: '2026-11-04',
    vo2Max: 54,
    restingHeartRate: 46,
    hrvStatus: { valueMs: 64, status: 'balanced', baselineMin: 58, baselineMax: 74 },
    sleepScore: 82,
    sleepHours: 7.6,
    deepSleepMinutes: 95,
    remSleepMinutes: 110,
    lightSleepMinutes: 251,
    stressAvg: 28,
    bodyBatteryHigh: 88,
    bodyBatteryLow: 21
  },
  {
    date: '2026-11-03',
    vo2Max: 54,
    restingHeartRate: 47,
    hrvStatus: { valueMs: 61, status: 'balanced', baselineMin: 58, baselineMax: 74 },
    sleepScore: 78,
    sleepHours: 7.1,
    deepSleepMinutes: 80,
    remSleepMinutes: 98,
    lightSleepMinutes: 248,
    stressAvg: 34,
    bodyBatteryHigh: 84,
    bodyBatteryLow: 18
  },
  {
    date: '2026-11-02',
    vo2Max: 54,
    restingHeartRate: 45,
    hrvStatus: { valueMs: 67, status: 'balanced', baselineMin: 58, baselineMax: 74 },
    sleepScore: 86,
    sleepHours: 7.9,
    deepSleepMinutes: 104,
    remSleepMinutes: 118,
    lightSleepMinutes: 252,
    stressAvg: 25,
    bodyBatteryHigh: 92,
    bodyBatteryLow: 26
  },
  {
    date: '2026-11-01',
    vo2Max: 53,
    restingHeartRate: 46,
    hrvStatus: { valueMs: 66, status: 'balanced', baselineMin: 58, baselineMax: 74 },
    sleepScore: 84,
    sleepHours: 7.8,
    deepSleepMinutes: 98,
    remSleepMinutes: 114,
    lightSleepMinutes: 256,
    stressAvg: 27,
    bodyBatteryHigh: 90,
    bodyBatteryLow: 29
  },
  {
    date: '2026-10-31',
    vo2Max: 53,
    restingHeartRate: 48,
    hrvStatus: { valueMs: 59, status: 'balanced', baselineMin: 58, baselineMax: 74 },
    sleepScore: 75,
    sleepHours: 6.9,
    deepSleepMinutes: 75,
    remSleepMinutes: 92,
    lightSleepMinutes: 247,
    stressAvg: 38,
    bodyBatteryHigh: 79,
    bodyBatteryLow: 15
  },
  {
    date: '2026-10-30',
    vo2Max: 53,
    restingHeartRate: 46,
    hrvStatus: { valueMs: 65, status: 'balanced', baselineMin: 58, baselineMax: 74 },
    sleepScore: 83,
    sleepHours: 7.7,
    deepSleepMinutes: 92,
    remSleepMinutes: 115,
    lightSleepMinutes: 255,
    stressAvg: 26,
    bodyBatteryHigh: 91,
    bodyBatteryLow: 30
  }
];

export const initialTrainingLoad: TrainingLoadPoint[] = [
  { date: '2026-10-07', dailyTrimp: 140, ctl: 58.2, atl: 62.4, tsb: -4.2 },
  { date: '2026-10-10', dailyTrimp: 180, ctl: 60.1, atl: 67.5, tsb: -7.4 },
  { date: '2026-10-14', dailyTrimp: 175, ctl: 62.8, atl: 70.1, tsb: -7.3 },
  { date: '2026-10-18', dailyTrimp: 55,  ctl: 63.4, atl: 64.2, tsb: -0.8 },
  { date: '2026-10-21', dailyTrimp: 190, ctl: 65.2, atl: 72.8, tsb: -7.6 },
  { date: '2026-10-25', dailyTrimp: 230, ctl: 68.4, atl: 81.0, tsb: -12.6 },
  { date: '2026-10-28', dailyTrimp: 40,  ctl: 67.5, atl: 68.3, tsb: -0.8 },
  { date: '2026-11-01', dailyTrimp: 0,   ctl: 66.8, atl: 59.2, tsb: +7.6 },
  { date: '2026-11-02', dailyTrimp: 165, ctl: 68.2, atl: 69.4, tsb: -1.2 },
  { date: '2026-11-04', dailyTrimp: 215, ctl: 71.5, atl: 78.6, tsb: -7.1 },
  { date: '2026-11-05', dailyTrimp: 0,   ctl: 71.0, atl: 71.2, tsb: -0.2 }
];

export const initialGarminConfig: GarminApiConfig = {
  isConnected: true,
  clientId: 'garmin_client_prod_8923a1',
  clientSecret: '••••••••••••••••••••••••••••••••',
  redirectUri: 'https://ais-dev-h2mwg7dnsvezr4opb4s6f6-502424755260.europe-west2.run.app/oauth/garmin/callback',
  accessToken: 'oauth2_token_grm_live_948f2c87',
  refreshToken: 'refresh_token_grm_live_839a',
  tokenExpiresAt: '2026-11-20T12:00:00Z',
  lastSyncTime: '2026-11-05 09:30 UTC',
  userGarminName: 'Eduardo CV (Forerunner 965)',
  syncFrequency: 'realtime',
  webhookEnabled: true
};
