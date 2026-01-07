
import React from 'react';

interface MaterialReferencesProps {
  images: string[];
  setImages: (imgs: string[]) => void;
}

const MaterialReferences: React.FC<MaterialReferencesProps> = ({ images, setImages }) => {
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fix: Explicitly type the result of Array.from to File[] to avoid 'unknown' type issues in the loop
    const files = Array.from(e.target.files || []) as File[];
    const newImages: string[] = [];
    let loaded = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newImages.push(ev.target?.result as string);
        loaded++;
        if (loaded === files.length) {
          setImages([...images, ...newImages].slice(0, 5));
        }
      };
      // Fixed: file is now correctly inferred as File (which extends Blob)
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-700">
      <div className="space-y-4">
        <h2 className="text-4xl font-light tracking-tight">Material References</h2>
        <p className="text-white/50 text-lg leading-relaxed max-w-2xl">
          Upload up to 5 reference images of façade materials. Our system will extract color, texture, and surface reflectivity behavior.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
            <img src={img} className="w-full h-full object-cover" alt={`Material ${i}`} />
            <button 
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < 5 && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/[0.02]">
            <span className="text-2xl mb-2 opacity-20">+</span>
            <span className="text-[10px] mono uppercase text-white/30">Add Image</span>
            <input type="file" multiple className="hidden" accept="image/*" onChange={handleFiles} />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <h4 className="text-xs font-bold mono uppercase mb-4 text-white/40">Extraction Logic</h4>
          <p className="text-sm text-white/60 leading-relaxed italic">
            "Materials are applied based on façade hierarchy. The same material will be articulated differently for balconies, typical floors, and the ground floor to maintain architectural logic."
          </p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-gradient-to-br from-gray-200 to-gray-500 border border-white/20"></div>
            <div>
              <p className="text-xs font-bold uppercase mono text-white/80">Surface Behavior</p>
              <p className="text-[10px] text-white/30">Physical based rendering (PBR) analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialReferences;
