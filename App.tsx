
import React, { useState, useCallback } from 'react';
import { Camera, Image as ImageIcon, Sliders, Play, RotateCcw, AlertCircle, Download, Check } from 'lucide-react';
import Camera3D from './components/Camera3D';
import { CameraParams, ProcessingState } from './types';
import { AZIMUTH_STEPS, ELEVATION_STEPS, DISTANCE_STEPS } from './constants';
import { editCameraAngle } from './services/geminiService';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraParams>({ azimuth: 0, elevation: 0, distance: 1.0 });
  const [state, setState] = useState<ProcessingState>({ isLoading: false, error: null, resultUrl: null });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
        setState({ ...state, resultUrl: null, error: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image) {
      setState({ ...state, error: "Please upload an image first." });
      return;
    }

    setState({ ...state, isLoading: true, error: null });
    try {
      const result = await editCameraAngle(image, camera.azimuth, camera.elevation, camera.distance);
      setState({ isLoading: false, error: null, resultUrl: result });
    } catch (err: any) {
      setState({ isLoading: false, error: err.message || "Failed to process image.", resultUrl: null });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Camera className="w-10 h-10 text-blue-400" />
          Qwen 3D Camera Control
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          Identity-preserving 3D camera editing powered by Gemini 2.5 Flash Image
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Controls */}
        <div className="space-y-6">
          <section className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              1. Input Source
            </h2>
            <div className="relative group">
              {image ? (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border-2 border-emerald-500/50 shadow-emerald-500/10 shadow-xl">
                  <img src={image} alt="Input" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition shadow-lg"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition duration-300">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-12 h-12 text-gray-500 mb-3 group-hover:text-emerald-400 transition" />
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-gray-200">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG or WEBP (Max 4K)</p>
                  </div>
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
              )}
            </div>
          </section>

          <section className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              2. Camera Parameters
            </h2>
            
            <Camera3D 
              value={camera} 
              imageUrl={image} 
              onChange={(v) => setCamera(v)} 
            />

            <div className="mt-6 space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-400">Azimuth (Rotation)</label>
                  <span className="text-emerald-400 font-mono text-sm">{camera.azimuth}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="315" 
                  step="45" 
                  value={camera.azimuth}
                  onChange={(e) => setCamera({ ...camera, azimuth: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-2 text-[10px] text-gray-500 uppercase tracking-tighter">
                  <span>Front</span>
                  <span>Right</span>
                  <span>Back</span>
                  <span>Left</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">Elevation</label>
                  <select 
                    value={camera.elevation}
                    onChange={(e) => setCamera({ ...camera, elevation: parseInt(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {ELEVATION_STEPS.map(s => <option key={s} value={s}>{s}°</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 block mb-2">Distance</label>
                  <select 
                    value={camera.distance}
                    onChange={(e) => setCamera({ ...camera, distance: parseFloat(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {DISTANCE_STEPS.map(s => <option key={s} value={s}>{s}x</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={state.isLoading || !image}
              className={`w-full mt-8 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition shadow-xl ${
                state.isLoading || !image 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-[0.98]'
              }`}
            >
              {state.isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate View
                </>
              )}
            </button>
            {state.error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {state.error}
              </div>
            )}
          </section>
        </div>

        {/* Right Side: Result */}
        <div className="space-y-6">
          <section className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col min-h-full">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5 text-indigo-400" />
                3. Result
              </span>
              {state.resultUrl && (
                <a 
                  href={state.resultUrl} 
                  download="camera-edit.png"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition bg-blue-400/10 px-2 py-1 rounded"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              )}
            </h2>
            
            <div className="flex-grow flex items-center justify-center bg-gray-900 rounded-xl border border-gray-700 relative overflow-hidden min-h-[500px]">
              {state.resultUrl ? (
                <img src={state.resultUrl} alt="Result" className="w-full h-full object-contain" />
              ) : state.isLoading ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  <div className="animate-pulse text-gray-500 font-mono text-sm">
                    RENDERING VIEW PERSPECTIVE...
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-600 space-y-2">
                  <div className="p-4 bg-gray-800 rounded-full w-fit mx-auto mb-4">
                    <Camera className="w-12 h-12" />
                  </div>
                  <p>Processed image will appear here</p>
                  <p className="text-xs max-w-xs mx-auto">Upload an image and click Generate to see the 3D angle modification.</p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Technical Summary</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Uses <span className="text-gray-200 font-medium">Gemini 2.5 Flash Image</span> with iterative visual identity preservation. The model transforms the input's geometry based on 3D spatial coordinates while maintaining texture consistency and lighting accuracy.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default App;
