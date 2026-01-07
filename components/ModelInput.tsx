
import React from 'react';

interface ModelInputProps {
  image: string | null;
  setImage: (img: string | null) => void;
}

const ModelInput: React.FC<ModelInputProps> = ({ image, setImage }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="space-y-4">
        <h2 className="text-4xl font-light tracking-tight">Abstract 3D Model Input</h2>
        <p className="text-white/50 text-lg leading-relaxed max-w-2xl">
          Upload a screenshot of your massing model from Revit, SketchUp, Rhino, or Blender. 
          Use <span className="text-white border-b border-white/20">White</span> for Residential and <span className="text-pink-300 border-b border-pink-300/20">Light Blue</span> for Office/Commercial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative group aspect-video rounded-2xl border-2 border-dashed border-white/10 hover:border-pink-300/30 transition-all flex flex-col items-center justify-center p-8 bg-white/[0.02]">
          {image ? (
            <div className="relative w-full h-full">
              <img src={image} className="w-full h-full object-contain rounded-lg" alt="Model" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-black transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="text-5xl mb-6 opacity-20">📐</div>
              <p className="text-sm text-white/40 mb-4 text-center">Drag and drop your massing model or</p>
              <label className="px-6 py-2 bg-white/5 rounded-full text-xs font-bold border border-white/20 hover:bg-white/10 cursor-pointer transition-all">
                Select File
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-center">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h4 className="text-xs font-bold mono uppercase mb-4 text-white/40">Requirements</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex items-start gap-3">
                <span className="text-pink-400">•</span>
                High resolution viewport screenshot
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-400">•</span>
                Clear massing logic (no interior details)
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-400">•</span>
                Preserve specific camera perspective
              </li>
            </ul>
          </div>
          
          <div className="bg-pink-900/10 p-6 rounded-2xl border border-pink-500/20">
            <h4 className="text-xs font-bold mono uppercase mb-2 text-pink-300/80">Fidelity Note</h4>
            <p className="text-xs text-pink-200/60 leading-relaxed">
              CONCEPTA uses pixel-perfect depth analysis to ensure the final render never deviates from your original geometry. Proportions, floors, and setbacks are locked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelInput;
