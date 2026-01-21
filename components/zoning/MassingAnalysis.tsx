import React, { useState, useEffect } from 'react';
import { PlanningRightsObject, TamhilOutput } from '../../types';
import MassingView from './MassingView';

interface MassingAlternative {
  id: string;
  name: string;
  description: string;
  height_m: number;
  coverage_percent: number;
  setback_front_m: number;
  setback_sides_m: number;
  towers: any[];
  key_metrics: {
    total_floors: number;
    fsi: number;
    density_units_per_hectare: number;
  };
  design_rationale: string;
}

interface MassingAnalysisProps {
  rights: PlanningRightsObject;
  tamhil: TamhilOutput;
  onSelectMassing: (massing: MassingAlternative) => void;
  onProceedToVisualization?: (massing: MassingAlternative) => void;
  onBack?: () => void;
  isDetailView?: boolean;
  selectedMassing?: MassingAlternative | null;
}

const MassingAnalysis: React.FC<MassingAnalysisProps> = ({
  rights,
  tamhil,
  onSelectMassing,
  onProceedToVisualization,
  onBack,
  isDetailView = false,
  selectedMassing = null,
}) => {
  const [alternatives, setAlternatives] = useState<MassingAlternative[]>(selectedMassing ? [selectedMassing] : []);
  const [selectedId, setSelectedId] = useState<string | null>(selectedMassing?.id || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compare' | 'detail'>(isDetailView ? 'detail' : 'compare');
  const [hasInitiated, setHasInitiated] = useState(false);

  // Auto-generate when entering detail view WITHOUT pre-selected massing
  // If selectedMassing is provided (coming back from previous stage), don't regenerate
  useEffect(() => {
    if (isDetailView && !hasInitiated && alternatives.length === 0 && !loading && !selectedMassing) {
      setHasInitiated(true);
      handleGenerateMassing();
    }
  }, [isDetailView, selectedMassing]);

  // Sync viewMode when isDetailView prop changes
  useEffect(() => {
    if (isDetailView) {
      setViewMode('detail');
    } else {
      setViewMode('compare');
    }
  }, [isDetailView]);

  const handleGenerateMassing = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/zoning/generate-massing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planningRights: rights,
          tamhil: tamhil,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate massing');
      }

      const data = await response.json();
      setAlternatives(data.massingAlternatives);
      if (data.massingAlternatives.length > 0) {
        setSelectedId(data.massingAlternatives[0].id);
      }
    } catch (err: any) {
      console.error('Massing generation error:', err);
      setError(`${err.message}${err.response?.data?.details ? ' - ' + err.response.data.details : ''}`);
    } finally {
      setLoading(false);
    }
  };

  if (alternatives.length === 0 && !isDetailView) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-4xl font-light uppercase tracking-tighter">
            Stage 3: Massing Design
          </h1>
          <p className="text-white/40 text-xs md:text-sm">
            Generate a building form based on your planning rights and unit mix
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-3 rounded-lg flex items-center gap-3">
            <span>⚠️</span>
            <div>
              <p className="font-medium">{error}</p>
              <p className="text-xs text-red-200/60 mt-1">Please try again or contact support</p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30 rounded-2xl p-8 text-center space-y-4">
          <h3 className="text-xl font-light uppercase tracking-tighter">Generate Massing</h3>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Based on your planning rights and unit mix, we'll generate an optimized building form
            that maximizes efficiency and complies with all constraints.
          </p>
          <button
            onClick={handleGenerateMassing}
            disabled={loading}
            className="px-12 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : 'Generate Massing'}
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] mono uppercase text-amber-400 mb-2">What you'll get</p>
            <ul className="text-sm space-y-1 text-white/60">
              <li>✓ Optimized form option</li>
              <li>✓ Interactive 3D preview</li>
              <li>✓ Design metrics & FSI</li>
              <li>✓ Compliance check</li>
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] mono uppercase text-amber-400 mb-2">You can</p>
            <ul className="text-sm space-y-1 text-white/60">
              <li>✓ Rotate & zoom the form</li>
              <li>✓ View design metrics</li>
              <li>✓ Review compliance</li>
              <li>✓ Proceed to visualization</li>
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] mono uppercase text-amber-400 mb-2">Design approach</p>
            <ul className="text-sm space-y-1 text-white/60">
              <li>✓ Maximizes buildable area</li>
              <li>✓ Respects all setbacks</li>
              <li>✓ Optimized height</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const selectedAlternative = alternatives.length > 0 ? alternatives[0] : null;

  // Show loader while generating (when isDetailView and alternatives not yet loaded)
  if (isDetailView && loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-amber-400/5 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-24 h-24 border-4 border-amber-400/10 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-light uppercase tracking-tighter">Stage 3: Massing Design</h2>
          <div className="flex justify-center gap-8 text-[10px] mono uppercase text-amber-400/40 tracking-widest">
            <span className="animate-pulse">1. Analyzing Form Options...</span>
            <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>2. Optimizing Heights...</span>
            <span className="animate-pulse" style={{ animationDelay: '1s' }}>3. Generating 3D...</span>
          </div>
        </div>
        <p className="text-white/40 max-w-md leading-relaxed text-sm">
          Generating optimized massing based on your planning rights and unit mix.
        </p>
      </div>
    );
  }

  // Show error if generation failed
  if (isDetailView && error && alternatives.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-light uppercase tracking-tighter text-red-400">Generation Failed</h2>
          <p className="text-white/60 max-w-md">{error}</p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setHasInitiated(false);
          }}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 transition-all text-sm uppercase tracking-wider"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-light uppercase tracking-tighter">Stage 3: Massing Design</h1>
        <p className="text-white/40 text-xs md:text-sm mt-1">Your optimized building form</p>
      </div>

      {/* Detail View (Always show for single massing) */}
      {selectedAlternative && (
        <div className="space-y-6">
          {/* Large 3D View */}
          <div
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            style={{ height: '500px' }}
          >
            <MassingView
              alternative={selectedAlternative}
              isSelected={true}
              onSelect={() => {}} // No-op for detail view
            />
          </div>

          {/* Detail Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Metrics */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Design Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/40">Height</span>
                  <span className="font-bold text-amber-400">{selectedAlternative.height_m}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Coverage</span>
                  <span className="font-bold text-amber-400">{selectedAlternative.coverage_percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Total Floors</span>
                  <span className="font-bold text-amber-400">{selectedAlternative.key_metrics.total_floors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">FSI</span>
                  <span className="font-bold text-amber-400">{selectedAlternative.key_metrics.fsi.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Density (units/hectare)</span>
                  <span className="font-bold text-amber-400">
                    {selectedAlternative.key_metrics.density_units_per_hectare.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Front Setback</span>
                  <span className="font-bold text-amber-400">{selectedAlternative.setback_front_m}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Side Setback</span>
                  <span className="font-bold text-amber-400">{selectedAlternative.setback_sides_m}m</span>
                </div>
              </div>
            </div>

            {/* Right: Rationale */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Design Rationale</h3>
              <p className="text-white/70 leading-relaxed">{selectedAlternative.design_rationale}</p>

              {/* Compliance Check */}
              <div className="pt-4 space-y-2 border-t border-white/10">
                <p className="text-[10px] mono uppercase text-white/40">Compliance Check</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Height: {selectedAlternative.height_m}m ≤ {rights.rights.height_max_m}m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Floors: {selectedAlternative.key_metrics.total_floors} ≤ {rights.rights.floors_max}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Front Setback: {selectedAlternative.setback_front_m}m ≥ {rights.constraints?.building_lines?.front_m || 5}m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proceed to Visualization Button */}
      {selectedAlternative && (
        <div className="flex gap-4">
          <button
            onClick={() => onProceedToVisualization?.(selectedAlternative)}
            className="flex-1 px-12 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 transition-all text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
          >
            Proceed to Stage 4: 3D Visualization
          </button>
          <button
            onClick={onBack}
            className="px-6 py-4 rounded-full border border-white/20 text-white/60 hover:bg-white/5 transition-colors text-sm"
          >
            Back to Tamhil
          </button>
        </div>
      )}
    </div>
  );
};

export default MassingAnalysis;
