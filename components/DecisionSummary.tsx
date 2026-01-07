
import React from 'react';
import { AppState } from '../types';

interface DecisionSummaryProps {
  state: AppState;
}

const DecisionSummary: React.FC<DecisionSummaryProps> = ({ state }) => {
  const intel = state.analysisResults?.archIntelligence;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-light tracking-tight">Review Translation Logic</h2>
        <p className="text-white/40 mono text-[10px] uppercase tracking-[0.4em]">Final Proportional Verification</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Arch Intelligence Panel */}
        <div className="xl:col-span-2 p-8 bg-white/[0.02] border border-white/10 rounded-3xl space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h4 className="text-xs font-bold mono uppercase text-white/40">Architectural System Audit</h4>
            <span className="text-[10px] mono text-pink-400">ANALYTICS ACTIVE</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Module label="Massing Hierarchy" value={intel?.massingHierarchy} />
              <Module label="Facade Zoning" value={intel?.facadeZoning} />
              <Module label="Geometric Language" value={intel?.geometricLanguage} />
              <Module label="Structural Element Logic" value={intel?.elementLogic} />
            </div>
            <div className="space-y-6">
              <Module label="Material System Behavior" value={intel?.materialSystem} />
              <Module label="Indoor-Outdoor Permeability" value={intel?.indoorOutdoor} />
              <Module label="Green Integration" value={intel?.greenIntegration} />
              <Module label="Human Scale Calibration" value={intel?.humanScale} />
            </div>
          </div>
        </div>

        {/* Translation Constraints */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-8">
             <h4 className="text-xs font-bold mono uppercase text-white/40 tracking-widest">Translation Constraints</h4>
             
             <div className="space-y-6">
                <div className="p-4 rounded-xl bg-pink-900/10 border border-pink-500/20">
                  <p className="text-[10px] font-bold text-pink-200 uppercase mb-2">Fidelity Engine</p>
                  <p className="text-[10px] text-pink-200/60 leading-relaxed">Massing and camera view are strictly locked. Translation only affects material distribution and facade articulation.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] mono text-white/30 uppercase">Balancing Rule</p>
                    <p className="text-xs font-semibold">Fibonacci Proportional Scaling</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] mono text-white/30 uppercase">Color Strategy</p>
                    <p className="text-xs font-semibold">Scientific Hue Harmony</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] mono text-white/30 uppercase">Ground Floor</p>
                    <p className="text-xs font-semibold">{state.groundFloorType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] mono text-white/30 uppercase">Context Setting</p>
                    <p className="text-xs font-semibold">{state.contextSetting}</p>
                  </div>
                </div>
             </div>
             
             <div className="space-y-2 border-t border-white/10 pt-4">
                <p className="text-[10px] mono text-white/30 uppercase tracking-widest mb-3">Material Set</p>
                <div className="flex flex-wrap gap-2">
                  {state.detectedMaterials.filter(m => state.selectedMaterialIds.includes(m.id)).map(m => (
                    <div key={m.id} className="w-5 h-5 rounded-lg border border-white/10 shadow-sm" style={{ backgroundColor: m.hexColor }} title={m.name}></div>
                  ))}
                  {state.manualMaterialImages.map((_, i) => (
                    <div key={i} className="w-5 h-5 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[7px] mono">M</div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Module = ({ label, value }: { label: string, value?: string }) => (
  <div className="space-y-1.5">
    <p className="text-[9px] mono text-white/30 uppercase tracking-widest">{label}</p>
    <p className="text-[11px] text-white/70 leading-relaxed line-clamp-3 italic">
      {value || "Analyzing reference system..."}
    </p>
  </div>
);

export default DecisionSummary;
