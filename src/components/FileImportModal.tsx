/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { parseGPXString } from '../services/gpxParser';
import { GarminActivity } from '../types/garmin';
import { 
  UploadCloud, 
  FileCode, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Download,
  Sparkles
} from 'lucide-react';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityImported: (activity: GarminActivity) => void;
}

// Ejemplo de GPX válido en texto para pruebas instantáneas
const sampleGPXData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="Garmin Connect" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <metadata>
    <time>2026-11-06T07:15:00Z</time>
  </metadata>
  <trk>
    <name>10K Ciudad Universitaria - Ritmo Fuerte</name>
    <type>running</type>
    <trkseg>
      <trkpt lat="40.4500" lon="-3.7250"><ele>660</ele><time>2026-11-06T07:15:00Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>142</gpxtpx:hr><gpxtpx:cad>176</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="40.4520" lon="-3.7270"><ele>665</ele><time>2026-11-06T07:19:15Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>158</gpxtpx:hr><gpxtpx:cad>180</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="40.4550" lon="-3.7290"><ele>672</ele><time>2026-11-06T07:23:30Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>165</gpxtpx:hr><gpxtpx:cad>182</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="40.4580" lon="-3.7280"><ele>680</ele><time>2026-11-06T07:27:42Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>171</gpxtpx:hr><gpxtpx:cad>184</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="40.4610" lon="-3.7260"><ele>675</ele><time>2026-11-06T07:31:50Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>169</gpxtpx:hr><gpxtpx:cad>182</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="40.4600" lon="-3.7230"><ele>668</ele><time>2026-11-06T07:36:00Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>168</gpxtpx:hr><gpxtpx:cad>180</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="40.4560" lon="-3.7220"><ele>662</ele><time>2026-11-06T07:40:10Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>172</gpxtpx:hr><gpxtpx:cad>184</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="40.4530" lon="-3.7230"><ele>658</ele><time>2026-11-06T07:44:20Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>174</gpxtpx:hr><gpxtpx:cad>186</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="40.4505" lon="-3.7245"><ele>660</ele><time>2026-11-06T07:48:30Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>178</gpxtpx:hr><gpxtpx:cad>188</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
      <trkpt lat="40.4500" lon="-3.7250"><ele>660</ele><time>2026-11-06T07:52:45Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>182</gpxtpx:hr><gpxtpx:cad>190</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
    </trkseg>
  </trk>
</gpx>`;

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  onActivityImported
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error('No se pudo leer el contenido como texto.');
        }

        if (fileName.endsWith('.gpx') || content.includes('<gpx')) {
          const activity = parseGPXString(content, file.name);
          setSuccessMsg(`¡Actividad "${activity.title}" procesada con éxito!`);
          setTimeout(() => {
            onActivityImported(activity);
            onClose();
          }, 800);
        } else {
          // Si es archivo JSON de exportación o texto
          throw new Error('Por favor selecciona un archivo GPX estándar de Garmin. También puedes cargar el GPX de prueba.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error procesando el archivo.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Error al leer el archivo desde el disco.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadSampleGPX = () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const activity = parseGPXString(sampleGPXData, '10K Ciudad Universitaria.gpx');
      setSuccessMsg(`¡Actividad de prueba "${activity.title}" cargada con éxito!`);
      setTimeout(() => {
        onActivityImported(activity);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Importar Entrenamiento Garmin (.GPX / .FIT)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {/* Zona Drag & Drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".gpx,.xml"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto text-blue-600">
              <FileCode className="w-6 h-6" />
            </div>
            <div className="mt-3 text-xs font-semibold text-slate-900">
              Haz clic para seleccionar o arrastra tu archivo GPX / FIT
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Compatible con exportaciones de Garmin Connect, Strava y relojes Forerunner / Fenix.
            </p>
          </div>

          {/* Mensajes de Estado */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Botón de Carga Rápida de Ejemplo */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">¿No tienes un archivo a mano?</span>
            <button
              type="button"
              onClick={handleLoadSampleGPX}
              disabled={isProcessing}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Cargar GPX de Ejemplo (10K)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
