
import React from 'react';
import { GroundFloorOption, LIGHTING_PRESETS, CONTEXT_PRESETS, LightingConfig } from '../types';

interface Props {
  groundFloorType: GroundFloorOption;
  setGroundFloorType: (t: GroundFloorOption) => void;
  groundFloorDesc: string;
  setGroundFloorDesc: (d: string) => void;
  lightingConfig: LightingConfig;
  setLightingConfig: (lc: LightingConfig) => void;
  context: string;
  setContext: (c: string) => void;
}

const AtmosphereSettings: React.FC<Props> = ({
  groundFloorType, setGroundFloorType,
  groundFloorDesc, setGroundFloorDesc,
  lightingConfig, setLightingConfig,
  context, setContext
}) => {
  const applyPreset = (p: any) => setLightingConfig({ ...p, preset: p.name, sunAzimuth: p.azimuth, sunIntensity: p.intensity, timeOfDay: p.time, haze: p.haze });

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-16 animate-in slide-in-from-right-8 duration-700 pb-20">
      <div className="space-y-12">
        <section className="space-y-6">
          <h2 className="text-3xl font-light tracking-tight">Environmental Context</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONTEXT_PRESETS.map((p) => (
              <button key={p.id} onClick={() => setContext(p.name)} className={`p-4 rounded-xl border text-left transition-all ${context === p.name ? 'bg-pink-400/10 border-pink-400 text-white shadow-[0_0_20px_rgba(244,114,182,0.1)]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'}`}>
                <p className="text-xs font-bold uppercase mono mb-1">{p.name}</p>
                <p className="text-[10px] opacity-60">{p.desc}</p>
              </button>
            ))}
          </div>
        </section>
        <section className="space-y-6">
          <h3 className="text-xs font-bold mono uppercase tracking-widest text-white/40">Ground Floor Articulation</h3>
          <div className="flex gap-4">
            {(['Lobby', 'Retail', 'Other'] as GroundFloorOption[]).map(t => (
              <button key={t} onClick={() => setGroundFloorType(t)} className={`flex-1 py-3 rounded-xl border transition-all text-sm font-medium ${groundFloorType === t ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>{t}</button>
            ))}
          </div>
          <textarea placeholder="e.g., 'Double-height glass lobby with stone columns'..." value={groundFloorDesc} onChange={e => setGroundFloorDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-pink-300/30 h-28 resize-none transition-colors" />
        </section>
      </div>

      <div className="space-y-12 bg-white/[0.02] p-8 rounded-3xl border border-white/10">
        <section className="space-y-8">
          <div className="space-y-2"><h2 className="text-3xl font-light tracking-tight">Lighting Scenario</h2><p className="text-white/40 text-[10px] mono uppercase">Atmospheric computation parameters</p></div>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {LIGHTING_PRESETS.map(p => (
                <button key={p.name} onClick={() => applyPreset(p)} className={`px-4 py-2 rounded-full text-[10px] mono border transition-all ${lightingConfig.preset === p.name ? 'bg-pink-400 border-pink-400 text-black font-bold' : 'border-white/10 text-white/40 hover:text-white/60'}`}>{p.name.toUpperCase()}</button>
              ))}
            </div>
            <div className="space-y-8 pt-4">
               <div className="space-y-4">
                 <div className="flex justify-between items-center"><label className="text-[10px] mono text-white/40 uppercase">Sun Azimuth</label><span className="text-[10px] mono text-white/80">{lightingConfig.sunAzimuth}°</span></div>
                 <input type="range" min="0" max="360" value={lightingConfig.sunAzimuth} onChange={e => setLightingConfig({...lightingConfig, sunAzimuth: parseInt(e.target.value), preset: 'Custom'})} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
               </div>
               <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[10px] mono text-white/40 uppercase">Time of Day</label>
                    <input type="time" value={lightingConfig.timeOfDay} onChange={e => setLightingConfig({...lightingConfig, timeOfDay: e.target.value, preset: 'Custom'})} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-pink-300/30 outline-none" />
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center"><label className="text-[10px] mono text-white/40 uppercase">Atmosphere Haze</label><span className="text-[10px] mono text-white/80">{lightingConfig.haze}%</span></div>
                    <input type="range" min="0" max="100" value={lightingConfig.haze} onChange={e => setLightingConfig({...lightingConfig, haze: parseInt(e.target.value), preset: 'Custom'})} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                 </div>
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AtmosphereSettings;
