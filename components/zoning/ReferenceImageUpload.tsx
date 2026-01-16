import React, { useRef, useState } from 'react';

interface ReferenceImageUploadProps {
  onImageSelected: (base64: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  previewImage: string | null;
}

const ReferenceImageUpload: React.FC<ReferenceImageUploadProps> = ({
  onImageSelected,
  onAnalyze,
  isLoading,
  previewImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onImageSelected(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          dragActive
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-white/20 bg-white/5 hover:border-white/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div>
            <p className="text-white font-medium">
              {previewImage ? 'Reference Image Selected' : 'Upload Reference Building Image'}
            </p>
            <p className="text-white/40 text-sm mt-1">
              {previewImage
                ? 'Drag to replace'
                : 'Drag and drop an image, or click to browse'}
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all text-sm"
          >
            Browse Files
          </button>
        </div>
      </div>

      {previewImage && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
            <img
              src={previewImage}
              alt="Reference"
              className="w-full h-64 object-cover"
            />
          </div>

          <button
            onClick={onAnalyze}
            disabled={isLoading}
            className="w-full px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing Reference...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analyze & Extract Design DNA
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReferenceImageUpload;
