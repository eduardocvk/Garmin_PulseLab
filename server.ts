/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Parser para cuerpos JSON
  app.use(express.json());

  // Habilitar CORS para permitir peticiones desde GitHub Pages (eduardocvk.github.io)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // =========================================================================
  // ENDPOINT PROXY PARA GARMIN CONNECT PERSONAL API (Sin restricciones CORS)
  // =========================================================================
  app.post('/api/garmin/sync', async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Falta la Clave API personal de Garmin Connect.'
        });
      }

      const cleanKey = apiKey.trim();

      // 1. Intercambiar la Clave API Personal por un Token de Acceso Bearer
      const tokenUrl = 'https://personal.connectapi.garmin.com/personalapitoken-service/personal-api/personal-api-key/token';
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${cleanKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GarminPulseLab/1.0'
        }
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        return res.status(tokenResponse.status).json({
          success: false,
          error: `Garmin rechazó la clave (HTTP ${tokenResponse.status}). Verifica que la clave esté activa en Garmin Connect.`,
          details: errorText
        });
      }

      const tokenData = await tokenResponse.json() as any;
      const accessToken = tokenData.accessToken || tokenData.token;

      if (!accessToken) {
        return res.status(502).json({
          success: false,
          error: 'Garmin no devolvió un token de acceso válido.'
        });
      }

      // 2. Descargar las actividades más recientes
      const activitiesUrl = 'https://personal.connectapi.garmin.com/activitylist-service/activities/search/activities?limit=25';
      const actResponse = await fetch(activitiesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GarminPulseLab/1.0'
        }
      });

      if (!actResponse.ok) {
        const actErr = await actResponse.text();
        return res.status(actResponse.status).json({
          success: false,
          error: `Error al obtener actividades de Garmin (HTTP ${actResponse.status})`,
          details: actErr
        });
      }

      const rawActivities = await actResponse.json();

      return res.json({
        success: true,
        activities: rawActivities,
        count: Array.isArray(rawActivities) ? rawActivities.length : 0
      });
    } catch (err: any) {
      console.error('Error en proxy Garmin API:', err);
      return res.status(500).json({
        success: false,
        error: 'Error interno en el servidor proxy: ' + (err.message || 'Desconocido')
      });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Garmin PulseLab Proxy Server' });
  });

  // =========================================================================
  // INTEGRACIÓN CON VITE (DEV vs PROD)
  // =========================================================================
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Servir archivos estáticos generados por Vite en dist/
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Servidor Garmin PulseLab escuchando en puerto ${PORT}`);
  });
}

startServer();
