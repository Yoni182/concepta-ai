
import React from 'react';
import { GroundFloorOption, LIGHTING_PRESETS, CONTEXT_PRESETS, LightingConfig } from '../types';

interface InspirationGroundProps {
  inspiration: string | null;
  setInspiration: (img: string | null) => void;
  groundFloorType: GroundFloorOption;
  setGroundFloorType: (t: GroundFloorOption) => void;
  groundFloorDesc: string;
  setGroundFloorDesc: (d: string) => void;
  lightingConfig: LightingConfig;
  setLightingConfig: (lc: LightingConfig) => void;
  context: string;
  setContext: (c: string) => void;
}

const InspirationGround: React.FC<InspirationGroundProps> = ({
  inspiration, setInspiration,
  groundFloorType, setGroundFloorType,
  groundFloorDesc, setGroundFloorDesc,
  lightingConfig, setLightingConfig,
  context, setContext
}) => {
  const handleInspiration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setInspiration(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const applyLightingPreset = (presetName: string) => {
    const preset = LIGHTING_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setLightingConfig({
        preset: preset.name,
        timeOfDay: preset.time,
        sunAzimuth: preset.azimuth,
        sunIntensity: preset.intensity,
        haze: preset.haze
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in slide-in-from-right-8 duration-700 pb-20">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        
        {/* Left Column: Context & Ground Floor */}
        <div className="space-y-12">
          <section className="space-y-6">
            <h2 className="text-3xl font-light tracking-tight">Environmental Context</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Select a procedural environment preset. Neighboring buildings and landscape will be generated based on architectural logic.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONTEXT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setContext(preset.name)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    context === preset.name 
                      ? 'bg-white/10 border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-bold uppercase mono mb-1">{preset.name}</p>
                  <p className="text-[10px] leading-tight opacity-60">{preset.desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xs font-bold mono uppercase tracking-widest text-white/40 border-b border-white/10 pb-2">Ground Floor Detail</h3>
            <div className="flex gap-4">
              {(['Lobby', 'Retail', 'Other'] as GroundFloorOption[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setGroundFloorType(t)}
                  className={`flex-1 py-3 rounded-xl border transition-all text-sm font-medium ${
                    groundFloorType === t 
                      ? 'bg-white text-black border-white' 
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Describe specific ground floor articulation (e.g., 'Double-height glass lobby with stone columns')..."
              value={groundFloorDesc}
              onChange={(e) => setGroundFloorDesc(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-white/30 h-28 resize-none transition-colors"
            />
          </section>

          <section className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-light tracking-tight">Style Inspiration (Optional)</h2>
              <div className="aspect-[16/9] rounded-2xl border-2 border-dashed border-white/10 overflow-hidden relative group bg-white/[0.02]">
                {inspiration ? (
                  <>
                    <img src={inspiration} className="w-full h-full object-cover" alt="Inspiration" />
                    <button 
                      onClick={() => setInspiration(null)}
                      className="absolute top-4 right-4 p-2 bg-black/60 rounded-full hover:bg-black"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-colors">
                    <span className="text-2xl mb-2 opacity-20">🖼️</span>
                    <span className="text-[10px] mono uppercase text-white/30">Upload Reference Language</span>
                    <input type="file" className="hidden" onChange={handleInspiration} />
                  </label>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Lighting Scenario Customizer */}
        <div className="space-y-12 bg-white/[0.02] p-8 rounded-3xl border border-white/10 h-fit">
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-light tracking-tight">Lighting Scenario</h2>
              <p className="text-white/40 text-xs mono uppercase tracking-wider">Granular Environment Control</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] mono text-white/40 uppercase tracking-widest">Presets</label>
                <div className="flex flex-wrap gap-2">
                  {LIGHTING_PRESETS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => applyLightingPreset(p.name)}
                      className={`px-4 py-2 rounded-full text-[10px] mono transition-all border ${
                        lightingConfig.preset === p.name ? 'bg-white border-white text-black font-bold' : 'border-white/10 text-white/40 hover:text-white/60'
                      }`}
                    >
                      {p.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] mono text-white/40 uppercase">Sun Azimuth (Direction)</label>
                    <span className="text-[10px] mono text-white/80">{lightingConfig.sunAzimuth}°</span>
                  </div>
                  <input 
                    type="range" min="0" max="360" value={lightingConfig.sunAzimuth} 
                    onChange={(e) => setLightingConfig({...lightingConfig, sunAzimuth: parseInt(e.target.value), preset: 'Custom'})}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[8px] mono text-white/20">
                    <span>NORTH (0°)</span>
                    <span>EAST (90°)</span>
                    <span>SOUTH (180°)</span>
                    <span>WEST (270°)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] mono text-white/40 uppercase">Sun Intensity</label>
                    <span className="text-[10px] mono text-white/80">{lightingConfig.sunIntensity}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={lightingConfig.sunIntensity} 
                    onChange={(e) => setLightingConfig({...lightingConfig, sunIntensity: parseInt(e.target.value), preset: 'Custom'})}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] mono text-white/40 uppercase">Time of Day</label>
                    <input 
                      type="time" value={lightingConfig.timeOfDay} 
                      onChange={(e) => setLightingConfig({...lightingConfig, timeOfDay: e.target.value, preset: 'Custom'})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-white/30 text-white"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] mono text-white/40 uppercase">Atmospheric Haze</label>
                      <span className="text-[10px] mono text-white/80">{lightingConfig.haze}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={lightingConfig.haze} 
                      onChange={(e) => setLightingConfig({...lightingConfig, haze: parseInt(e.target.value), preset: 'Custom'})}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                 <p className="text-[10px] mono text-white/30 uppercase tracking-widest">Global illumination Note</p>
                 <p className="text-[10px] text-white/40 italic leading-relaxed">
                   "Sun position and intensity directly drive ambient occlusion levels and shadow sharpness. Procedural atmosphere ensures color temperature consistency across materials."
                 </p>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default InspirationGround;
