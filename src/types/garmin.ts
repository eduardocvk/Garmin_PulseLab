/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SportType = 'running' | 'trail_running' | 'intervals' | 'recovery_run' | 'tempo';

export interface TelemetryPoint {
  index: number;
  timeOffsetSec: number;
  distanceMeters: number;
  lat: number;
  lng: number;
  elevation: number;       // meters
  heartRate: number;       // bpm
  paceSecKm: number;       // seconds per km
  cadence: number;         // steps per minute (spm)
  powerWatts?: number;     // estimated running power
}

export interface ActivityLap {
  lapNumber: number;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecKm: number;
  avgHeartRate: number;
  maxHeartRate: number;
  elevationGain: number;
  elevationLoss: number;
  avgCadence: number;
}

export interface GarminActivity {
  id: string;
  title: string;
  sportType: SportType;
  date: string;            // YYYY-MM-DD
  startTime: string;       // HH:MM
  distanceMeters: number;
  durationSeconds: number;
  movingSeconds: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  avgPaceSecKm: number;
  bestPaceSecKm: number;
  avgHeartRate: number;
  maxHeartRate: number;
  avgCadence: number;
  maxCadence: number;
  calories: number;
  trainingEffectAerobic: number;    // 0.0 - 5.0
  trainingEffectAnaerobic: number;  // 0.0 - 5.0
  trimpScore: number;               // Training Impulse score
  vo2MaxEstimate?: number;
  temperatureCelsius?: number;
  shoeName?: string;
  laps: ActivityLap[];
  telemetry: TelemetryPoint[];
  notes?: string;
}

export interface HealthMetricDay {
  date: string;
  vo2Max: number;
  restingHeartRate: number;
  hrvStatus: {
    valueMs: number;
    status: 'balanced' | 'unbalanced' | 'low';
    baselineMin: number;
    baselineMax: number;
  };
  sleepScore: number;               // 0 - 100
  sleepHours: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  lightSleepMinutes: number;
  stressAvg: number;                // 0 - 100
  bodyBatteryHigh: number;
  bodyBatteryLow: number;
}

export interface TrainingLoadPoint {
  date: string;
  dailyTrimp: number;
  ctl: number;   // Chronic Training Load (Fitness - 42 days exponential moving average)
  atl: number;   // Acute Training Load (Fatigue - 7 days exponential moving average)
  tsb: number;   // Training Stress Balance (Form = CTL - ATL)
}

export interface RacePrediction {
  raceName: string;
  distanceKm: number;
  distanceMeters: number;
  predictedSeconds: number;
  predictedPaceSecKm: number;
  conservativeSeconds: number;
  aggressiveSeconds: number;
  vo2Target: number;
}

export interface GarminApiConfig {
  isConnected: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  lastSyncTime?: string;
  userGarminName?: string;
  syncFrequency: 'realtime' | 'daily' | 'manual';
  webhookEnabled: boolean;
}

// ================= Formateadores y cálculos ================= //

export function formatPace(secPerKm: number): string {
  if (!secPerKm || !isFinite(secPerKm) || secPerKm <= 0) return '--:--/km';
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}/km`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds) || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatDistance(meters: number): string {
  if (!meters) return '0.00 km';
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

export function getHRZone(bpm: number, maxHR: number = 190): {
  zone: number;
  name: string;
  rangeText: string;
  color: string;
  textColor: string;
  bgSubtle: string;
} {
  const pct = (bpm / maxHR) * 100;
  if (pct < 60) {
    return {
      zone: 1,
      name: 'Z1 Recuperación',
      rangeText: `< ${Math.round(maxHR * 0.6)} bpm`,
      color: '#64748B',
      textColor: 'text-slate-600',
      bgSubtle: 'bg-slate-100'
    };
  } else if (pct < 70) {
    return {
      zone: 2,
      name: 'Z2 Aeróbico Base',
      rangeText: `${Math.round(maxHR * 0.6)} - ${Math.round(maxHR * 0.7)} bpm`,
      color: '#2563EB',
      textColor: 'text-blue-600',
      bgSubtle: 'bg-blue-50'
    };
  } else if (pct < 80) {
    return {
      zone: 3,
      name: 'Z3 Tempo / Ritmo',
      rangeText: `${Math.round(maxHR * 0.7)} - ${Math.round(maxHR * 0.8)} bpm`,
      color: '#059669',
      textColor: 'text-emerald-600',
      bgSubtle: 'bg-emerald-50'
    };
  } else if (pct < 90) {
    return {
      zone: 4,
      name: 'Z4 Umbral Anaeróbico',
      rangeText: `${Math.round(maxHR * 0.8)} - ${Math.round(maxHR * 0.9)} bpm`,
      color: '#EA580C',
      textColor: 'text-orange-600',
      bgSubtle: 'bg-orange-50'
    };
  } else {
    return {
      zone: 5,
      name: 'Z5 Potencia Máxima / VO2',
      rangeText: `> ${Math.round(maxHR * 0.9)} bpm`,
      color: '#DC2626',
      textColor: 'text-red-600',
      bgSubtle: 'bg-red-50'
    };
  }
}

/**
 * Fórmula de Pete Riegel para predicción de tiempos de carrera:
 * T2 = T1 * (D2 / D1)^1.06
 */
export function calculateRiegelPrediction(
  baseDistanceMeters: number,
  baseTimeSeconds: number,
  targetDistanceMeters: number
): number {
  if (baseDistanceMeters <= 0 || baseTimeSeconds <= 0) return 0;
  const exponent = 1.06;
  const ratio = targetDistanceMeters / baseDistanceMeters;
  return baseTimeSeconds * Math.pow(ratio, exponent);
}

export function generateRacePredictions(
  referenceDistanceMeters: number = 10000,
  referenceTimeSeconds: number = 2700, // 45:00 for 10K
  vo2Max: number = 53
): RacePrediction[] {
  const races = [
    { name: '5K', km: 5.0, meters: 5000, vo2: 54 },
    { name: '10K', km: 10.0, meters: 10000, vo2: 53 },
    { name: 'Medio Maratón (21.1K)', km: 21.097, meters: 21097, vo2: 52 },
    { name: 'Maratón Completo (42.2K)', km: 42.195, meters: 42195, vo2: 50 },
  ];

  return races.map(r => {
    const rawPredicted = calculateRiegelPrediction(
      referenceDistanceMeters,
      referenceTimeSeconds,
      r.meters
    );
    // Ajuste sutil por VO2 Max si difiere
    const vo2Factor = 1 - (vo2Max - 50) * 0.005;
    const predicted = Math.round(rawPredicted * Math.max(0.9, Math.min(1.1, vo2Factor)));
    const pace = predicted / r.km;

    return {
      raceName: r.name,
      distanceKm: r.km,
      distanceMeters: r.meters,
      predictedSeconds: predicted,
      predictedPaceSecKm: pace,
      conservativeSeconds: Math.round(predicted * 1.03),
      aggressiveSeconds: Math.round(predicted * 0.98),
      vo2Target: r.vo2
    };
  });
}
