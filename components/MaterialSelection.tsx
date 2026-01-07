
import React from 'react';
import { DetectedMaterial } from '../types';

interface Props {
  detected: DetectedMaterial[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  manualImages: string[];
  setManualImages: (imgs: string[]) => void;
}

const MaterialSelection: React.FC<Props> = ({ detected, selectedIds, setSelectedIds, manualImages, setManualImages }) => {
  const toggleMaterial = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleManual = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setManualImages([...manualImages, ev.target?.result as string].slice(0, 5));
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-in slide-in-from-right-8 duration-700 pb-20">
      <div className="space-y-4">
        <h2 className="text-4xl font-light tracking-tight">Material Strategy</h2>
        <p className="text-white/50 text-lg leading-relaxed max-w-2xl">
          Review the material logic extracted from your reference building. These recommendations are suggestions—curate the set for your final translation.
        </p>
      </div>

      <section className="space-y-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h3 className="text-xs mono uppercase tracking-[0.2em] text-white/30">Curated Recommendations</h3>
          <span className="text-[10px] mono text-white/20">SYSTEM DETECTED</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {detected.map((mat) => (
            <button
              key={mat.id}
              onClick={() => toggleMaterial(mat.id)}
              className={`p-6 rounded-2xl border text-left transition-all relative group h-full flex flex-col ${
                selectedIds.includes(mat.id) 
                  ? 'bg-white/10 border-white text-white shadow-[0_0_30px_rgba(255,255,255,0.05)]' 
                  : 'bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl shadow-inner border border-white/10 shrink-0" style={{ backgroundColor: mat.hexColor }}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold mono uppercase truncate">{mat.name}</p>
                  <p className="text-[10px] opacity-40">{mat.hexColor}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${selectedIds.includes(mat.id) ? 'bg-white border-white text-black' : 'border-white/10 text-transparent'}`}>
                  <span className="text-[10px] font-bold">✓</span>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-[10px] leading-relaxed opacity-60 italic line-clamp-2">"{mat.description}"</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex justify-between items-center">
          <h3 className="text-xs mono uppercase tracking-[0.2em] text-white/30">Manual Supplement</h3>
          <p className="text-[10px] text-white/20 uppercase mono">Add up to 5 custom references</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {manualImages.map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/10 relative group">
              <img src={img} className="w-full h-full object-cover" alt="Manual" />
              <button onClick={() => setManualImages(manualImages.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs">✕</button>
            </div>
          ))}
          {manualImages.length < 5 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/[0.02]">
              <span className="text-2xl mb-1 opacity-10">+</span>
              <span className="text-[10px] mono uppercase text-white/20">Custom Reference</span>
              <input type="file" multiple className="hidden" accept="image/*" onChange={handleManual} />
            </label>
          )}
        </div>
      </section>

      <div className="p-8 bg-white/[0.01] rounded-3xl border border-white/5 text-center">
        <p className="text-[11px] text-white/30 uppercase mono tracking-[0.2em]">The system suggests — the architect decides</p>
      </div>
    </div>
  );
};

export default MaterialSelection;
