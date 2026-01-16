import React, { useState } from 'react';
import { MassingAlternative, DesignDNA, StyledMassing } from '../../types';
import ReferenceImageUpload from './ReferenceImageUpload';
import VisualizationViewer from './VisualizationViewer';

interface VisualizationStepProps {
  massing: MassingAlternative;
  onSelectVisualization: (styled: StyledMassing) => void;
  onBack: () => void;
  onReset: () => void;
  onSave: (currentStep: number, visualization: StyledMassing) => void;
  isSaving: boolean;
  saveMessage: string | null;
}

const VisualizationStep: React.FC<VisualizationStepProps> = ({
  massing,
  onSelectVisualization,
  onBack,
  onReset,
  onSave,
  isSaving,
  saveMessage
}) => {
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null);
  const [designDNA, setDesignDNA] = useState<DesignDNA | null>(null);
  const [styledMassing, setStyledMassing] = useState<StyledMassing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'generating' | 'result'>('upload');

  const handleImageSelected = (base64: string) => {
    setReferenceImageBase64(base64);
    setError(null);
  };

  const handleAnalyzeReference = async () => {
    if (!referenceImageBase64) {
      setError('Please upload an image first');
      return;
    }

    setStep('analyzing');
    setLoading(true);
    setError(null);

    try {
      // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64Only = referenceImageBase64.includes(',') 
        ? referenceImageBase64.split(',')[1] 
        : referenceImageBase64;

      // Step 1: Analyze reference image to extract design DNA
      const analysisResponse = await fetch('/api/zoning/analyze-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceImageBase64: base64Only })
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze reference image');
      }

      const analysisData = await analysisResponse.json();
      setDesignDNA(analysisData.designDNA);

      // Step 2: Generate visualization with design applied to massing
      setStep('generating');

      const visualizationResponse = await fetch('/api/zoning/generate-visualization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          massing,
          designDNA: analysisData.designDNA,
          referenceImageBase64: base64Only
        })
      });

      if (!visualizationResponse.ok) {
        throw new Error('Failed to generate visualization');
      }

      const visualizationData = await visualizationResponse.json();
      setStyledMassing(visualizationData.styledMassing);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Failed to process visualization');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-3xl font-light uppercase tracking-tighter">Stage 4: 3D Visualization</h1>
          <p className="text-white/40 text-xs md:text-sm mt-1">
            Design your massing according to a reference architectural style
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center md:justify-end">
          {styledMassing && (
            <button
              onClick={() => onSave(4, styledMassing)}
              disabled={isSaving}
              className="px-4 py-2 rounded-full border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 transition-colors text-xs md:text-sm flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-amber-400/50 border-t-amber-400 rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  Save
                </>
              )}
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 md:px-6 py-2 rounded-full border border-white/20 hover:bg-white/5 transition-colors text-xs md:text-sm"
          >
            Back to Massing
          </button>
          <button
            onClick={onReset}
            className="px-4 md:px-6 py-2 rounded-full border border-white/20 hover:bg-white/5 transition-colors text-xs md:text-sm"
          >
            Start Over
          </button>
        </div>
      </div>

      {/* Messages */}
      {saveMessage && (
        <div className="bg-green-900/30 border border-green-500/50 text-green-200 px-6 py-3 rounded-lg flex items-center gap-3">
          <span>✅</span>
          <p>{saveMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-3 rounded-lg flex items-center gap-3">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Content */}
      {step === 'upload' && !styledMassing && (
        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
            <div>
              <h2 className="text-xl font-light uppercase tracking-tighter mb-2">Step 1: Reference Image</h2>
              <p className="text-white/60 text-sm">
                Upload a reference building or architectural style you want to apply to the massing
              </p>
            </div>
            <p className="text-[10px] text-white/40">
              💡 The reference image should showcase the architectural style, facade design, and materials you want to use
            </p>
          </div>

          <ReferenceImageUpload
            onImageSelected={handleImageSelected}
            onAnalyze={handleAnalyzeReference}
            isLoading={loading}
            previewImage={referenceImageBase64}
          />
        </div>
      )}

      {(step === 'analyzing' || step === 'generating') && (
        <div className="h-96 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-amber-400/5 rounded-full animate-ping absolute inset-0"></div>
            <div className="w-24 h-24 border-4 border-amber-400/10 border-t-amber-400 rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-light uppercase tracking-tighter">
              {step === 'analyzing' ? 'Analyzing Reference Style' : 'Generating Visualization'}
            </h2>
            <div className="flex justify-center gap-6 text-[10px] mono uppercase text-amber-400/40 tracking-widest flex-wrap">
              <span className={step === 'analyzing' ? 'animate-pulse' : 'text-white/20'}>1. Extracting Design DNA...</span>
              <span className={step === 'generating' ? 'animate-pulse' : 'text-white/20'}>2. Applying Style...</span>
            </div>
          </div>
          <p className="text-white/40 max-w-md leading-relaxed text-sm">
            {step === 'analyzing'
              ? 'Analyzing the reference building to extract architectural style, materials, and design language'
              : 'Applying the reference design to your massing and generating the 3D visualization'}
          </p>
        </div>
      )}

      {step === 'result' && styledMassing && (
        <VisualizationViewer styledMassing={styledMassing} />
      )}

      {step === 'result' && styledMassing && (
        <button
          onClick={() => {
            onSelectVisualization(styledMassing);
          }}
          className="w-full px-12 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 transition-all text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
        >
          Approve Visualization & Proceed to Step 5
        </button>
      )}
    </div>
  );
};

export default VisualizationStep;
