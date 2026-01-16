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
  onReset: () => void;
  onProceedToVisualization?: (massing: MassingAlternative) => void;
  onBack?: () => void;
  isDetailView?: boolean;
  selectedMassing?: MassingAlternative | null;
}

const MassingAnalysis: React.FC<MassingAnalysisProps> = ({
  rights,
  tamhil,
  onSelectMassing,
  onReset,
  onProceedToVisualization,
  onBack,
  isDetailView = false,
  selectedMassing = null,
}) => {
  const [alternatives, setAlternatives] = useState<MassingAlternative[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(selectedMassing?.id || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compare' | 'detail'>(isDetailView ? 'detail' : 'compare');

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

  if (alternatives.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-4xl font-light uppercase tracking-tighter">
            Stage 3: Massing Design
          </h1>
          <p className="text-white/40 text-xs md:text-sm">
            Generate 3 building form alternatives based on your planning rights and unit mix
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-3 rounded-lg flex items-center gap-3">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30 rounded-2xl p-8 text-center space-y-4">
          <h3 className="text-xl font-light uppercase tracking-tighter">Generate Massing Alternatives</h3>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Based on your planning rights and unit mix, we'll generate 3 distinct building form options
            optimized for different design strategies.
          </p>
          <button
            onClick={handleGenerateMassing}
            disabled={loading}
            className="px-12 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
          >
            {loading ? 'Generating...' : 'Generate 3 Alternatives'}
          </button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] mono uppercase text-amber-400 mb-2">What you'll get</p>
            <ul className="text-sm space-y-1 text-white/60">
              <li>✓ 3 distinct form options</li>
              <li>✓ Interactive 3D preview</li>
              <li>✓ Design metrics & FSI</li>
              <li>✓ Compliance check</li>
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] mono uppercase text-amber-400 mb-2">You can</p>
            <ul className="text-sm space-y-1 text-white/60">
              <li>✓ Rotate & zoom each form</li>
              <li>✓ Compare side-by-side</li>
              <li>✓ Select your favorite</li>
              <li>✓ Proceed to visualization</li>
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] mono uppercase text-amber-400 mb-2">Design strategies</p>
            <ul className="text-sm space-y-1 text-white/60">
              <li>✓ Compact tower</li>
              <li>✓ Balanced form</li>
              <li>✓ Articulated spread</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const selectedAlternative = alternatives.find((alt) => alt.id === selectedId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-light uppercase tracking-tighter">Stage 3: Massing Design</h1>
          <p className="text-white/40 text-xs md:text-sm mt-1">Select your preferred building form</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'compare' ? 'detail' : 'compare')}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:bg-white/5 text-sm"
          >
            {viewMode === 'compare' ? 'Detailed View' : 'Compare View'}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:bg-white/5 text-sm"
          >
            Start Over
          </button>
        </div>
      </div>

      {/* View Mode: Compare */}
      {viewMode === 'compare' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alternatives.map((alt) => (
            <div
              key={alt.id}
              onClick={() => setSelectedId(alt.id)}
              className={`border rounded-xl overflow-hidden cursor-pointer transition-all ${
                selectedId === alt.id
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              {/* 3D Preview */}
              <div style={{ height: '300px', backgroundColor: '#111111' }}>
                <MassingView 
                  alternative={alt} 
                  isSelected={selectedId === alt.id}
                  onSelect={(id) => setSelectedId(id)}
                />
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-medium text-white">{alt.name}</h3>
                  <p className="text-[10px] text-white/40 mt-1">{alt.description}</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <div>
                    <p className="text-[10px] text-white/40">Height</p>
                    <p className="font-bold text-amber-400">{alt.height_m}m</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40">Coverage</p>
                    <p className="font-bold text-amber-400">{alt.coverage_percent}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40">Floors</p>
                    <p className="font-bold text-amber-400">{alt.key_metrics.total_floors}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40">FSI</p>
                    <p className="font-bold text-amber-400">{alt.key_metrics.fsi.toFixed(2)}</p>
                  </div>
                </div>

                {/* Selection Button */}
                {selectedId === alt.id && (
                  <button
                    onClick={() => onSelectMassing(alt)}
                    className="w-full mt-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors text-sm"
                  >
                    Select This Option
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Mode: Detail */}
      {viewMode === 'detail' && selectedAlternative && (
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

          {/* Selection CTA */}
          <div className="flex gap-4 flex-col md:flex-row">
            {isDetailView ? (
              <>
                <button
                  onClick={() => onProceedToVisualization?.(selectedAlternative)}
                  className="flex-1 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 transition-all text-sm uppercase tracking-wider"
                >
                  Proceed to 3D Visualization (Step 4)
                </button>
                <button
                  onClick={onBack}
                  className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/5 transition-colors text-sm"
                >
                  Back to Selection
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectMassing(selectedAlternative)}
                  className="flex-1 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 transition-all text-sm uppercase tracking-wider"
                >
                  Proceed with this Massing
                </button>
                <button
                  onClick={onReset}
                  className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/5 transition-colors text-sm"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MassingAnalysis;
