
import React from 'react';

interface Props {
  image: string | null;
  setImage: (img: string | null) => void;
}

const BuildingRefInput: React.FC<Props> = ({ image, setImage }) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analysisModules = [
    "Massing & Volumetric Logic",
    "Façade Zoning & Hierarchy",
    "Geometric Language Bias",
    "Architectural Elements Coupling",
    "Material System Behavior",
    "Indoor–Outdoor Relationship",
    "Green Integration Logic",
    "Human Scale & Ground Activation"
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-700">
      <div className="space-y-4">
        <h2 className="text-4xl font-light tracking-tight">Building Reference Analysis</h2>
        <p className="text-white/50 text-lg leading-relaxed max-w-2xl">
          Upload an image of a real building or a high-end render. CONCEPTA will extract its architectural DNA to inform the translation of your massing model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-[4/3] rounded-3xl border-2 border-dashed border-white/10 overflow-hidden relative group bg-white/[0.02] flex flex-col items-center justify-center">
          {image ? (
            <>
              <img src={image} className="w-full h-full object-cover" alt="Ref" />
              <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-[10px] mono uppercase tracking-widest bg-black/80 px-4 py-2 rounded-full border border-white/10">Reference Locked</span>
              </div>
              <button onClick={() => setImage(null)} className="absolute top-4 right-4 p-2 bg-black/60 rounded-full hover:bg-black transition-colors z-10">✕</button>
            </>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-colors p-12 text-center">
              <span className="text-4xl mb-6 opacity-20">🏗️</span>
              <p className="text-sm font-semibold mb-2">Architectural Logic Source</p>
              <p className="text-xs text-white/30 mb-6 max-w-xs">Upload built project or professional visualization for system analysis</p>
              <span className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] mono uppercase tracking-widest hover:bg-white/10 transition-all">Select Image</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
            </label>
          )}
        </div>

        <div className="space-y-8">
          <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/10 space-y-6">
             <div className="flex justify-between items-center border-b border-white/5 pb-4">
               <h4 className="text-[10px] mono uppercase text-white/40 tracking-widest">Active Extraction Modules</h4>
               <span className="text-[10px] mono text-pink-400 animate-pulse">SYSTEM READY</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                {analysisModules.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 text-[11px] text-white/60">
                    <div className="w-1 h-1 rounded-full bg-pink-400/40"></div>
                    {m}
                  </div>
                ))}
             </div>
          </div>
          
          <div className="p-6 bg-pink-900/5 border border-pink-500/10 rounded-2xl">
            <p className="text-[11px] text-white/40 leading-relaxed italic">
              "The engine analyzes architectural references as built logic—proportion, hierarchy, and construction systems—rather than visual style."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingRefInput;
