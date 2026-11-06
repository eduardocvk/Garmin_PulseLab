# Garmin PulseLab: Plataforma de Análisis y Telemetría de Carreras y Entrenamientos

Plataforma analítica avanzada para corredores y atletas que sincroniza datos de Garmin Connect mediante OAuth 2.0 y procesa archivos de entrenamiento (.FIT, .GPX, .ZIP) para ofrecer análisis biomecánico, zonas de frecuencia cardíaca, modelos de carga y fatiga, predicción de marcas y telemetría de rutas GPS.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario en Fase 1:**
> - **Integración de Datos:** Conexión completa mediante Garmin Connect API y flujo OAuth 2.0, complementada con motor de importación directa de archivos `.FIT`, `.GPX` y `.ZIP` de Garmin y un conjunto de datos reales preinstalado para exploración inmediata sin fricción.
> - **Alcance Analítico Completo ("Todas las áreas"):** Se integran los cuatro módulos analíticos:
>   1. Rendimiento deportivo: Zonas cardíacas Z1–Z5, ritmo por kilómetro, cadencia, oscilación y ratio de carga aguda/crónica (ACWR / Fitness vs Fatiga).
>   2. Preparación de carreras: Predicciones de tiempo para 5K, 10K, Medio Maratón y Maratón completo basadas en VO2 Max y fórmulas de Riegel, con planificador de ritmo negativo.
>   3. Salud y recuperación: VO2 Max estimado, variabilidad de frecuencia cardíaca (VFC / HRV), puntuación de sueño y estado de recuperación.
>   4. GPS y elevación: Visor de rutas con gradiente de color según ritmo o desnivel, perfil altimétrico interactivo y segmentación por vueltas (laps).
> - **Estilo Visual:** Minimalista claro, limpio y analítico, con tipografía técnica (`Plus Jakarta Sans` + `JetBrains Mono` con cifras tabulares `tabular-nums`), bordes sutiles y acentos técnicos de alto contraste.

---

### 1. Overview & Core Concept

- **Qué hace:** Procesa la información integral de entrenamientos y carreras generada por relojes y sensores Garmin. Permite tanto la autenticación directa con Garmin Connect API / OAuth como la carga instantánea de archivos de actividad o exportaciones masivas, calculando métricas avanzadas que Garmin Connect no desglosa en una sola vista.
- **Audiencia objetivo:** Corredores de asfalto, trail runners, triatletas y entrenadores que buscan una herramienta analítica rigurosa, clara y sin distracciones publicitarias ni elementos superfluos.
- **Valor diferencial:** Unificación en un solo lienzo de telemetría de carrera: sincronización simultánea de mapa de ruta, perfil de elevación, ritmo y pulso al pasar el cursor sobre cualquier punto del recorrido; modelo de condición física vs. fatiga (Banister Impulse-Response) y simulador de carreras con estrategia de paso.

---

### 2. User Experience & Visual Design

#### Flujos de Usuario Principales
1. **Panel Central de Rendimiento (Dashboard):**
   - Resumen del bloque de entrenamiento actual: kilometraje semanal/mensual, tiempo activo, desnivel acumulado y estado de entrenamiento (Productivo, Mantenimiento, Sobrecarga o Recuperación).
   - Gráfico de Carga Aguda vs. Crónica (Fitness, Fatigue & Form - modelo Banister).
2. **Explorador y Telemetría de Actividad Individual:**
   - Selector de carrera o sesión de series/rodaje.
   - Gráfica multifila sincronizada: Ritmo (`min/km`), Frecuencia Cardíaca (`bpm`), Cadencia (`spm`), y Elevación (`m`).
   - Mapa interactivo de la ruta GPS con trazado coloreado por zonas (ritmo, FC o desnivel) y marcador interactivo sincronizado con el cursor de la gráfica.
   - Tabla de Splits/Vueltas con tiempos por km, desnivel positivo/negativo y zona predominante.
3. **Módulo de Preparación de Carreras & Predicciones:**
   - Calculadora predictiva para 5K, 10K, 21K (Medio Maratón) y 42K (Maratón).
   - Generador de estrategia de carrera: Ritmo constante vs. Split negativo (-2% en segunda mitad) vs. Ajuste por desnivel.
4. **Módulo de Salud, VO2 Max & Recuperación:**
   - Evolución temporal de VO2 Max, Frecuencia Cardíaca en Reposo (RHR), calidad de sueño y balance de VFC (HRV status).
5. **Centro de Conexión Garmin & Gestión de Archivos:**
   - Panel modal para configurar credenciales de la API de Garmin (Client ID, Client Secret, OAuth 2.0 Authorization Endpoint y Token Refresh).
   - Zona drag-and-drop para arrastrar archivos `.FIT` o `.GPX` descargados de Garmin Connect con procesador en el navegador.
   - Botón de cambio rápido para cargar datos demo de competiciones y entrenamientos de ejemplo.

#### Identidad Visual & Estilo Técnico Minimalista
- **Dirección estética:** Analítica técnica inspirada en instrumental deportivo suizo y software de ingeniería biomecánica. Cero elementos de "relleno" o tarjetas flotantes con sombras pesadas.
- **Paleta de Colores (Fondos claros de alta legibilidad):**
  - Lienzo base: Blanco puro (`#FFFFFF`) y fondo neutral frío suave (`#F8FAFC`).
  - Superficies y contenedores: Blanco con bordes ultrafinos (`border border-slate-200/90`).
  - Tipografía primaria: Carbón profundo (`#0F172A`) y gris técnico (`#475569`, `#64748B`).
  - Acentos de telemetría:
    - Ritmo: Azul cobalto técnico (`#2563EB`).
    - Frecuencia Cardíaca: Carmesí pulso (`#E11D48`).
    - Cadencia / Potencia: Violeta analítico (`#7C3AED`).
    - Elevación / Desnivel: Esmeralda topográfico (`#059669`).
    - Zonas de FC: Gradiente Z1 (Gris) -> Z2 (Azul) -> Z3 (Verde) -> Z4 (Naranja) -> Z5 (Rojo).
- **Tipografía:**
  - Títulos y navegación: `Plus Jakarta Sans` con peso limpio (500–600).
  - Cifras, tiempos y métricas: `JetBrains Mono` con `tabular-nums` para que los números nunca vibren al actualizarse.
- **Micro-interacciones y Feedback:**
  - Tooltips de alta precisión en gráficos con línea de tiempo cruzada (crosshair).
  - Filtros segmentados instantáneos sin recarga de página.
  - Indicadores de estado de sincronización limpios y textos explicativos claros.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Estrategia de Ingestión Híbrida (API Garmin Connect + Parser Local de FIT/GPX):**
  - *Elección:* Proveer el formulario y proxy de conexión OAuth 2.0 oficial para Garmin Connect API, además de un motor cliente de lectura de archivos `.FIT` y `.GPX` y un set de datos de prueba preconfigurado.
  - *Motivo:* El programa de desarrolladores de Garmin exige aprobación empresarial formal para producción webhooks; al incluir tanto la interfaz de configuración OAuth como el analizador local de archivos y dataset de entrenamiento completo, la aplicación es 100% funcional de inmediato y está lista para el token de producción del usuario.
- **Decisión 2: Gráficos de Telemetría Nativos SVG / Canvas Optimizados:**
  - *Elección:* Implementar componentes de gráficos SVG interactivos con cursor sincronizado para ritmo, altimetría y frecuencia cardíaca en lugar de librerías externas pesadas propensas a incompatibilidades.
  - *Motivo:* Garantiza máxima velocidad de renderizado, sincronización perfecta a 60fps entre el mapa GPS y las curvas métricas, y control total del diseño técnico minimalista.
- **Decisión 3: Algoritmos Deportivos Reales (Banister TRIMP, Riegel Race Times, Zonas Karvonen):**
  - *Elección:* Implementar modelos matemáticos contrastados de fisiología deportiva:
    - Predicciones: Fórmula de Pete Riegel corregida por fatiga ($T_2 = T_1 \times (D_2 / D_1)^{1.06}$).
    - Modelo Fitness/Fatiga: Carga de entrenamiento aguda (ATL de 7 días) vs. Carga crónica (CTL de 42 días) para calcular la Forma (TSB = CTL - ATL).
    - Zonas de pulso: Cálculo por porcentaje de reserva cardíaca (Fórmula Karvonen) o frecuencia máxima.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GARMIN PULSELAB CLIENT                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Bar: Wordmark · Selector de Rango · Estado Conexión · Importar FIT/API │
├────────────────────────────────┬────────────────────────────────────────────┤
│           VISTAS               │           COMPONENTES ANALÍTICOS           │
│  ┌──────────────────────────┐  │  ┌──────────────────────────────────────┐  │
│  │ 1. Resumen & Estado Fís. │  │  │ Resumen KPI (Volumen, Ritmo, VO2Max) │  │
│  │ 2. Sesiones & Carreras   │  │  │ Modelo Banister (CTL / ATL / TSB)    │  │
│  │ 3. Telemetría GPS & Altim│  │  │ Visor de Ruta GPS & Perfil Altimetr. │  │
│  │ 4. Zonas Cardíacas & VFC │  │  │ Gráfica Multifila Sincronizada       │  │
│  │ 5. Predicciones & Ritmos │  │  │ Tabla de Splits por Kilómetro        │  │
│  │ 6. Ajustes Garmin API    │  │  │ Calculadora de Pacing de Carrera     │  │
│  └──────────────────────────┘  │  └──────────────────────────────────────┘  │
├────────────────────────────────┴────────────────────────────────────────────┤
│                         MOTOR DE DATOS Y ESTADO                             │
│  • GarminStore: Sesiones, métricas diarias, perfiles GPS, configuración     │
│  • ParserEngine: Lectura de archivos GPX (XML nativo) y decodificador FIT   │
│  • MetricsEngine: Cálculo de TRIMP, zonas Z1-Z5, cadencia y predicciones    │
│  • GarminApiService: Manejo de OAuth 2.0 y almacenamiento de credenciales   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Modelo de Datos Principal
- `GarminActivity`: ID, título, fecha, tipo de deporte (`running`, `trail_running`, `interval_training`), distancia en metros, duración en segundos, ritmo medio, velocidad máxima, FC media/máx, cadencia, calorías, ascenso/descenso acumulado, puntos de telemetría (`timestamp`, `lat`, `lng`, `elevation`, `heartRate`, `cadence`, `pace`), splits por km.
- `GarminHealthSnapshot`: Fecha, VO2 Max, FC reposo, horas de sueño profundo/ligero/REM, puntuación de estrés, balance de VFC (ms).
- `GarminApiConfig`: Client ID, Client Secret, Access Token, Refresh Token, Estado de sincronización, fecha de último webhook.

---

### Plan de Verificación y Entrega

1. **Compilación y Linteo:** Ejecución de `compile_applet` y `lint_applet` para garantizar cero advertencias y cero errores de TypeScript.
2. **Pruebas de Flujo Interactivo:**
   - Conmutación fluida entre pestañas (Resumen, Telemetría GPS, Preparador de Carreras, Métricas de Salud, Ajustes Garmin API).
   - Movimiento interactivo del ratón sobre la gráfica de perfil para verificar que el marcador GPS en el mapa se mueva en perfecta sincronía.
   - Carga y procesamiento de archivos `.GPX` / `.FIT` de prueba y verificación inmediata de gráficos generados.
   - Simulación de cálculo de predicción de tiempos de carrera ajustando el VO2 Max o una marca de referencia.
