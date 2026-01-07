
import React, { useState } from 'react';
import { DesignAlternative } from '../types';

interface ResultViewProps {
  alternatives: DesignAlternative[];
  onBackToSummary: () => void;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ alternatives, onBackToSummary, onReset }) => {
  const [selectedId, setSelectedId] = useState(alternatives[0]?.id);
  const activeAlt = alternatives.find(a => a.id === selectedId) || alternatives[0];

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex justify-between items-end shrink-0">
        <div className="space-y-2">
          <h2 className="text-4xl font-light tracking-tight">Design Alternatives</h2>
          <p className="text-white/40 mono text-[10px] uppercase tracking-[0.3em]">Scientific Proportional & Chromatic Logic</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onBackToSummary}
            className="px-6 py-2 rounded-full text-[10px] mono font-bold border border-white/20 hover:bg-white/5 transition-all uppercase tracking-widest"
          >
            Refine Inputs
          </button>
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = activeAlt.url;
              link.download = `CONCEPTA-${activeAlt.label.replace(' ', '-')}.png`;
              link.click();
            }}
            className="px-6 py-2 rounded-full text-[10px] mono font-bold bg-white/10 border border-white/20 hover:bg-white/20 transition-all uppercase tracking-widest"
          >
            Export 8K
          </button>
          <button 
            onClick={onReset}
            className="px-6 py-2 rounded-full text-[10px] mono font-bold bg-white text-black hover:bg-white/90 transition-all uppercase tracking-widest"
          >
            New Project
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main Preview */}
        <div className="flex-1 rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative bg-white/[0.02]">
          <img src={activeAlt.url} className="w-full h-full object-contain" alt={activeAlt.label} />
          
          {/* Detailed Rationale Overlay */}
          <div className="absolute bottom-6 left-6 p-6 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-bold mono uppercase tracking-widest text-white">{activeAlt.label}</h3>
              <span className="text-[8px] mono text-pink-400">ANALYSIS EXPOSURE</span>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[8px] mono text-white/30 uppercase">Dominance</p>
                <p className="text-[10px] text-white/70">{activeAlt.rationale.dominance}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] mono text-white/30 uppercase">Softened</p>
                <p className="text-[10px] text-white/70">{activeAlt.rationale.softened}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] mono text-white/30 uppercase">Interpretation Emphasis</p>
                <p className="text-[10px] text-pink-200/80 italic">"{activeAlt.rationale.emphasis}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alternatives Shelf */}
        <div className="w-64 flex flex-col gap-4 overflow-y-auto pr-2">
          {alternatives.map((alt) => (
            <button
              key={alt.id}
              onClick={() => setSelectedId(alt.id)}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all shrink-0 aspect-[16/9] ${
                selectedId === alt.id ? 'border-white scale-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-white/10 grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
              }`}
            >
              <img src={alt.url} className="w-full h-full object-cover" alt={alt.label} />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 text-center">
                <span className="text-[8px] mono uppercase font-bold tracking-widest">{alt.label}</span>
              </div>
            </button>
          ))}
          
          <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] mono text-white/30 uppercase tracking-tighter">Constraint System</p>
              <p className="text-[10px] font-bold text-pink-400">FIBONACCI RATIOS ACTIVE</p>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/5">
              <p className="text-[8px] text-white/40 leading-relaxed italic uppercase">"Geometry is identical across all options. Variants represent controlled architectural readings."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
