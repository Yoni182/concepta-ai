import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ZoningAnalysisState, ZoningDocument, PlanningRightsObject, TamhilOutput } from '../../types';
import { useAuth } from '../../services/authContext';
import { Project, createProject, updateProject } from '../../services/projectsService';
import MassingAnalysis from './MassingAnalysis';

interface ZoningAnalysisProps {
  onStepChange?: (step: number) => void;
  currentStep?: number;
}

// Exposed methods for parent component
export interface ZoningAnalysisRef {
  loadProject: (project: Project) => void;
}

const ZoningAnalysis = forwardRef<ZoningAnalysisRef, ZoningAnalysisProps>(({ onStepChange, currentStep = 1 }, ref) => {
  const { user } = useAuth();
  const [state, setState] = useState<ZoningAnalysisState>({
    stage: 'input',
    gush: '',
    helka: '',
    documents: [],
    result: null,
    report: null,
    tamhil: null,
    massing: null,
    error: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    loadProject: (project: Project) => {
      setCurrentProjectId(project.id || null);
      setState({
        stage: project.tamhilData ? 'tamhil_result' : project.tabaData ? 'rights_result' : 'input',
        gush: project.gush,
        helka: project.helka,
        documents: [],
        result: project.tabaData || null,
        report: project.tabaReport || null,
        tamhil: project.tamhilData || null,
        error: null,
      });
    },
  }));

  // Save project to database
  const saveProject = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const projectData = {
        userId: user.uid,
        name: `Gush ${state.gush} - Helka ${state.helka}`,
        gush: state.gush,
        helka: state.helka,
        currentStep: state.stage === 'tamhil_result' ? 2 : 1,
        tabaData: state.result,
        tabaReport: state.report,
        tamhilData: state.tamhil,
      };

      if (currentProjectId) {
        await updateProject(currentProjectId, projectData);
        setSaveMessage('Project updated!');
      } else {
        const newId = await createProject(projectData);
        setCurrentProjectId(newId);
        setSaveMessage('Project saved!');
      }

      // Clear message after 2 seconds
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err: any) {
      console.error('Failed to save project:', err);
      setSaveMessage('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Notify parent of step changes
  useEffect(() => {
    if (onStepChange) {
      if (state.stage === 'input' || state.stage === 'processing') {
        onStepChange(1);
      } else if (state.stage === 'rights_result' || state.stage === 'generating_tamhil') {
        onStepChange(1); // Still on step 1 until tamhil is generated
      } else if (state.stage === 'tamhil_result' || state.stage === 'generating_massing') {
        onStepChange(2); // Step 2 until massing is selected
      } else if (state.stage === 'massing_result') {
        onStepChange(3); // Step 3 when massing is selected
      }
    }
  }, [state.stage, onStepChange]);

  // Respond to step changes from parent (e.g., back button, sidebar click)
  useEffect(() => {
    // Map currentStep to internal stage
    if (currentStep === 1 && state.stage === 'tamhil_result') {
      // Going back to step 1 from step 2 - show rights_result if we have data
      if (state.result) {
        setState(prev => ({ ...prev, stage: 'rights_result' }));
      }
    } else if (currentStep === 1 && state.stage === 'massing_result') {
      // Going back to step 1 from step 3 - show rights_result if we have data
      if (state.result) {
        setState(prev => ({ ...prev, stage: 'rights_result' }));
      }
    } else if (currentStep === 2 && state.stage === 'rights_result' && state.tamhil) {
      // Going forward to step 2 - show tamhil_result if we have data
      setState(prev => ({ ...prev, stage: 'tamhil_result' }));
    } else if (currentStep === 2 && state.stage === 'massing_result') {
      // Going back to step 2 from step 3 - show tamhil_result
      setState(prev => ({ ...prev, stage: 'tamhil_result' }));
    } else if (currentStep === 3 && state.stage === 'tamhil_result' && state.massing) {
      // Going forward to step 3 - show massing_result
      setState(prev => ({ ...prev, stage: 'massing_result' }));
    }
  }, [currentStep]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter((f: File) => f.type === 'application/pdf');
    
    for (const file of files) {
      const base64 = await fileToBase64(file as File);
      const doc: ZoningDocument = {
        id: crypto.randomUUID(),
        name: (file as File).name,
        file: file as File,
        base64,
        type: 'unknown',
      };
      setState(prev => ({ ...prev, documents: [...prev.documents, doc] }));
    }
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf') continue;
      const base64 = await fileToBase64(file);
      const doc: ZoningDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        file,
        base64,
        type: 'unknown',
      };
      setState(prev => ({ ...prev, documents: [...prev.documents, doc] }));
    }
  };

  const removeDocument = (id: string) => {
    setState(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
  };

  const handleAnalyze = async () => {
    if (!state.gush || !state.helka || state.documents.length === 0) {
      setState(prev => ({ ...prev, error: 'Please fill in Gush, Helka and upload at least one zoning document' }));
      return;
    }

    setState(prev => ({ ...prev, stage: 'processing', error: null }));

    try {
      const response = await fetch('/api/zoning/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gush: state.gush,
          helka: state.helka,
          documents: state.documents.map(d => ({
            name: d.name,
            base64: d.base64,
            type: d.type,
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        stage: 'rights_result',
        result: data.planningRights,
        report: data.report,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, stage: 'input', error: err.message }));
    }
  };

  const handleGenerateTamhil = async () => {
    if (!state.result) return;

    setState(prev => ({ ...prev, stage: 'generating_tamhil', error: null }));

    try {
      const response = await fetch('/api/zoning/generate-tamhil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planningRights: state.result,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Tamhil generation failed');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        stage: 'tamhil_result',
        tamhil: data.tamhil,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, stage: 'rights_result', error: err.message }));
    }
  };

  const handleSelectMassing = (massing: any) => {
    setState(prev => ({
      ...prev,
      stage: 'massing_result',
      massing,
    }));
    if (onStepChange) {
      onStepChange(3);
    }
  };

  const resetAnalysis = () => {
    setState({
      stage: 'input',
      gush: '',
      helka: '',
      documents: [],
      result: null,
      report: null,
      tamhil: null,
      massing: null,
      error: null,
    });
  };

  const backToRights = () => {
    setState(prev => ({ ...prev, stage: 'rights_result', tamhil: null, massing: null }));
  };

  const backToTamhil = () => {
    setState(prev => ({ ...prev, stage: 'tamhil_result', massing: null }));
  };

  // Processing view (Stage 1)
  if (state.stage === 'processing') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-amber-400/5 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-24 h-24 border-4 border-amber-400/10 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-light uppercase tracking-tighter">Stage 1: Extracting Rights</h2>
          <div className="flex justify-center gap-8 text-[10px] mono uppercase text-amber-400/40 tracking-widest">
            <span className="animate-pulse">1. OCR Processing...</span>
            <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>2. Parsing Tables...</span>
            <span className="animate-pulse" style={{ animationDelay: '1s' }}>3. Extracting Rights...</span>
          </div>
        </div>
        <p className="text-white/40 max-w-md leading-relaxed text-sm">
          Processing zoning documents and extracting structured building rights. This may take up to 60 seconds.
        </p>
      </div>
    );
  }

  // Generating Tamhil view (Stage 2)
  if (state.stage === 'generating_tamhil') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-amber-400/5 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-24 h-24 border-4 border-amber-400/10 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-light uppercase tracking-tighter">Stage 2: Generating Tamhil</h2>
          <div className="flex justify-center gap-8 text-[10px] mono uppercase text-amber-400/40 tracking-widest">
            <span className="animate-pulse">1. Optimizing Unit Mix...</span>
            <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>2. Floor Distribution...</span>
            <span className="animate-pulse" style={{ animationDelay: '1s' }}>3. Finalizing Plan...</span>
          </div>
        </div>
        <p className="text-white/40 max-w-md leading-relaxed text-sm">
          Generating optimal unit mix based on the extracted planning rights. Creating floor-by-floor breakdown.
        </p>
      </div>
    );
  }

  // Generating Massing view (Stage 3)
  if (state.stage === 'generating_massing') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-amber-400/5 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-24 h-24 border-4 border-amber-400/10 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-light uppercase tracking-tighter">Stage 3: Generating Massing</h2>
          <div className="flex justify-center gap-8 text-[10px] mono uppercase text-amber-400/40 tracking-widest">
            <span className="animate-pulse">1. Analyzing Form Options...</span>
            <span className="animate-pulse" style={{ animationDelay: '0.5s' }}>2. Optimizing Heights...</span>
            <span className="animate-pulse" style={{ animationDelay: '1s' }}>3. Generating 3D...</span>
          </div>
        </div>
        <p className="text-white/40 max-w-md leading-relaxed text-sm">
          Generating 3 distinct massing alternatives optimized for different design strategies.
        </p>
      </div>
    );
  }

  // Massing Result view
  if (state.stage === 'massing_result') {
    return (
      <MassingAnalysis
        rights={state.result!}
        tamhil={state.tamhil!}
        onSelectMassing={handleSelectMassing}
        onReset={resetAnalysis}
      />
    );
  }

  // Massing Design view (user choosing between alternatives)
  if (state.stage === 'tamhil_result' && state.result && state.tamhil) {
    return (
      <MassingAnalysis
        rights={state.result}
        tamhil={state.tamhil}
        onSelectMassing={handleSelectMassing}
        onReset={resetAnalysis}
      />
    );
  }

  // Tamhil Result view
  if (state.stage === 'tamhil_result' && state.tamhil) {
    return (
      <TamhilView 
        tamhil={state.tamhil} 
        rights={state.result} 
        onBack={backToRights} 
        onReset={resetAnalysis}
        onSave={saveProject}
        isSaving={isSaving}
        saveMessage={saveMessage}
      />
    );
  }

  // Rights Result view (Stage 1 complete)
  if (state.stage === 'rights_result' && state.result) {
    return (
      <RightsResultView 
        result={state.result} 
        report={state.report} 
        onGenerateTamhil={handleGenerateTamhil}
        onReset={resetAnalysis}
        onSave={saveProject}
        isSaving={isSaving}
        saveMessage={saveMessage}
      />
    );
  }

  // Input view
  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-4xl font-light uppercase tracking-tighter">Planning Rights Analysis</h1>
        <p className="text-white/40 text-xs md:text-sm">Upload zoning documents and enter parcel details to extract structured rights</p>
      </div>

      {/* Error message */}
      {state.error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-6 py-3 rounded-lg flex items-center gap-3">
          <span>⚠️</span>
          <p>{state.error}</p>
          <button onClick={() => setState(prev => ({ ...prev, error: null }))} className="ml-auto hover:text-white">✕</button>
        </div>
      )}

      {/* Parcel info inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <label className="text-[10px] mono uppercase tracking-widest text-white/40">Gush (Block)</label>
          <input
            type="text"
            value={state.gush}
            onChange={e => setState(prev => ({ ...prev, gush: e.target.value }))}
            placeholder="e.g., 8234"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-400/50 focus:outline-none transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] mono uppercase tracking-widest text-white/40">Helka (Parcel)</label>
          <input
            type="text"
            value={state.helka}
            onChange={e => setState(prev => ({ ...prev, helka: e.target.value }))}
            placeholder="e.g., 105"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-400/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* PDF Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          isDragging ? 'border-amber-400 bg-amber-400/5' : 'border-white/20 hover:border-white/40'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-white/60">Drag & drop zoning PDF files here</p>
            <p className="text-[10px] mono uppercase tracking-widest text-white/30 mt-2">or click to browse files</p>
          </div>
        </div>
      </div>

      {/* Uploaded documents list */}
      {state.documents.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] mono uppercase tracking-widest text-white/40">Uploaded Documents ({state.documents.length})</p>
          <div className="space-y-2">
            {state.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-400/20 rounded flex items-center justify-center">
                    <span className="text-amber-400 text-xs">PDF</span>
                  </div>
                  <span className="text-sm text-white/80">{doc.name}</span>
                </div>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="text-white/40 hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyze button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleAnalyze}
          disabled={!state.gush || !state.helka || state.documents.length === 0}
          className="px-12 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
        >
          Stage 1: Extract Building Rights
        </button>
      </div>
    </div>
  );
});

// Rights Result component (Stage 1 output)
const RightsResultView: React.FC<{
  result: PlanningRightsObject;
  report: string | null;
  onGenerateTamhil: () => void;
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveMessage: string | null;
}> = ({ result, report, onGenerateTamhil, onReset, onSave, isSaving, saveMessage }) => {
  const [showJson, setShowJson] = useState(false);

  const confidenceColors = {
    high: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    low: 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  const confidenceLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-3xl font-light uppercase tracking-tighter">Stage 1: Rights Extracted</h1>
          <p className="text-white/40 text-xs md:text-sm mt-1">
            Gush {result.parcel.gush} | Helka {result.parcel.helka}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <button
            onClick={() => setShowJson(!showJson)}
            className="px-3 md:px-4 py-2 text-[10px] md:text-xs mono uppercase border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
          >
            {showJson ? 'Cards' : 'JSON'}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 md:px-6 py-2 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition-colors text-xs md:text-sm flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
                Saving...
              </>
            ) : saveMessage ? (
              <>✓ {saveMessage}</>
            ) : (
              '💾 Save'
            )}
          </button>
          <button
            onClick={onReset}
            className="px-4 md:px-6 py-2 rounded-full border border-white/20 hover:bg-white/5 transition-colors text-xs md:text-sm"
          >
            Start Over
          </button>
        </div>
      </div>

      {/* Confidence badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${confidenceColors[result.confidence_level]}`}>
        <span className="text-sm">Confidence Level:</span>
        <span className="font-bold">{confidenceLabels[result.confidence_level]}</span>
      </div>

      {showJson ? (
        <div className="bg-black/50 border border-white/10 rounded-xl p-6 overflow-auto">
          <pre className="text-xs text-amber-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parcel Info Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Parcel Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/40">Gush:</span>
                <span className="font-medium">{result.parcel.gush}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Helka:</span>
                <span className="font-medium">{result.parcel.helka}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Net Area:</span>
                <span className="font-medium">{result.parcel.area_net_sqm.toLocaleString()} sqm</span>
              </div>
            </div>
          </div>

          {/* Building Rights Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Building Rights</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/40">Max Units:</span>
                <span className="font-bold text-lg text-amber-400">{result.rights.max_units}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Main Area:</span>
                <span className="font-medium">{result.rights.main_area_sqm.toLocaleString()} sqm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Max Floors:</span>
                <span className="font-medium">{result.rights.floors_max}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Max Height:</span>
                <span className="font-medium">{result.rights.height_max_m}m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Tamhil CTA */}
      <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30 rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-xl font-light uppercase tracking-tighter">Ready for Stage 2</h3>
        <p className="text-white/60 text-sm max-w-lg mx-auto">
          Based on the extracted rights, generate an optimal unit mix (Tamhil) with floor-by-floor breakdown.
        </p>
        <button
          onClick={onGenerateTamhil}
          className="px-12 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 transition-all text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
        >
          Stage 2: Generate Tamhil
        </button>
      </div>

      {/* Risk Notes */}
      {result.risk_notes.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6 space-y-4">
          <h3 className="text-[10px] mono uppercase tracking-widest text-yellow-400">Notes & Risks</h3>
          <ul className="space-y-2">
            {result.risk_notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-yellow-200/80">
                <span className="text-yellow-400">⚠️</span>
                <span>{note.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Tamhil View component (Stage 2 output)
// Professional color palette for real estate visualization
const unitColors: Record<string, string> = {
  // Residential by size
  n3: '#5BC07A',         // 81 sqm - Green
  n4: '#F4C84A',         // 109 sqm - Gold
  n4_115: '#E8A93B',     // 115 sqm - Amber
  n5: '#F08A5D',         // 135 sqm - Coral
  n5_145: '#E05A5A',     // 145 sqm - Red
  mini_ph: '#B86AD9',    // 154 sqm - Purple
  ph: '#20B7B0',         // 180 sqm Penthouse - Teal
  // Non-residential
  commercial: '#6B7280', // Commercial - Gray
  lobby: '#D7DEE8',      // Entrance Lobby - Light gray
  storage: '#374151',    // Storage - Dark gray
  pool: '#2F7CF6',       // Pool - Blue
  club: '#7C3AED',       // Club/Amenities - Violet
  // Hebrew aliases
  '3room': '#5BC07A',
  '4room': '#F4C84A',
  '5room': '#F08A5D',
  'penthouse': '#20B7B0',
  'mini-penthouse': '#B86AD9',
  'בריכה': '#2F7CF6',
  'מועדון': '#7C3AED',
  'מסחר': '#6B7280',
  'לובי': '#D7DEE8',
};

// Get color based on unit size - each size is clearly distinguishable
const getColorBySize = (size: number): string => {
  if (size >= 180) return '#20B7B0';      // Teal - Penthouse (180)
  if (size >= 154) return '#B86AD9';      // Purple - Mini PH (154)
  if (size >= 145) return '#E05A5A';      // Red - n5 large (145)
  if (size >= 135) return '#F08A5D';      // Coral - n5 (135)
  if (size >= 115) return '#E8A93B';      // Amber - n4 large (115)
  if (size >= 109) return '#F4C84A';      // Gold - n4 (109)
  if (size >= 81) return '#5BC07A';       // Green - n3 (81)
  return '#6B7280';                        // Gray - other
};

const TamhilView: React.FC<{
  tamhil: TamhilOutput;
  rights: PlanningRightsObject | null;
  onBack: () => void;
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveMessage: string | null;
}> = ({ tamhil, rights, onBack, onReset, onSave, isSaving, saveMessage }) => {
  const [viewMode, setViewMode] = useState<'building' | 'summary' | 'floors' | 'json'>('building');

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-3xl font-light uppercase tracking-tighter">Tamhil Generated</h1>
          <p className="text-white/40 text-xs md:text-sm mt-1">
            Gush {tamhil.project_info.gush} | Helka {tamhil.project_info.helka}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
          <div className="flex flex-wrap justify-center bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('building')}
              className={`px-2 md:px-3 py-1 text-[10px] md:text-xs mono uppercase rounded transition-colors ${viewMode === 'building' ? 'bg-amber-500 text-white' : 'text-white/50 hover:text-white'}`}
            >
              🏢 Building
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-2 md:px-3 py-1 text-[10px] md:text-xs mono uppercase rounded transition-colors ${viewMode === 'summary' ? 'bg-amber-500 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Summary
            </button>
            <button
              onClick={() => setViewMode('floors')}
              className={`px-2 md:px-3 py-1 text-[10px] md:text-xs mono uppercase rounded transition-colors ${viewMode === 'floors' ? 'bg-amber-500 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Floors
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-2 md:px-3 py-1 text-[10px] md:text-xs mono uppercase rounded transition-colors ${viewMode === 'json' ? 'bg-amber-500 text-white' : 'text-white/50 hover:text-white'}`}
            >
              JSON
            </button>
          </div>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 md:px-6 py-2 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition-colors text-xs md:text-sm flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
                Saving...
              </>
            ) : saveMessage ? (
              <>✓ {saveMessage}</>
            ) : (
              '💾 Save'
            )}
          </button>
          <button
            onClick={onReset}
            className="px-4 md:px-6 py-2 rounded-full border border-white/20 hover:bg-white/5 transition-colors text-xs md:text-sm"
          >
            Start Over
          </button>
        </div>
      </div>

      {/* Building Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{tamhil.building_summary.total_units}</p>
          <p className="text-[10px] mono uppercase text-white/40 mt-1">Total Units</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{tamhil.building_summary.floors_above_ground}</p>
          <p className="text-[10px] mono uppercase text-white/40 mt-1">Floors Above Ground</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{(tamhil.building_summary.total_main_area_sqm || 0).toLocaleString()}</p>
          <p className="text-[10px] mono uppercase text-white/40 mt-1">Main Area (sqm)</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{(tamhil.building_summary.total_balcony_area_sqm || 0).toLocaleString()}</p>
          <p className="text-[10px] mono uppercase text-white/40 mt-1">Balcony Area (sqm)</p>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'building' && (
        <div className="space-y-6">
          {/* Visual Building Representation */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 overflow-x-auto">
            {/* Mobile scroll hint */}
            <div className="md:hidden text-center text-[10px] text-white/40 mb-2">← Scroll horizontally to view full building →</div>
            
            <div className="min-w-[1000px]">
              <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Building Visualization</h3>
                {/* Legend - matching PDF colors exactly */}
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {[
                    { label: '81 sqm', color: '#5BC07A' },
                    { label: '109 sqm', color: '#F4C84A' },
                    { label: '115 sqm', color: '#E8A93B' },
                    { label: '135 sqm', color: '#F08A5D' },
                    { label: '145 sqm', color: '#E05A5A' },
                    { label: '154 sqm', color: '#B86AD9' },
                    { label: '180 sqm (PH)', color: '#20B7B0' },
                    { label: 'מסחר', color: '#6B7280' },
                    { label: 'לובי כניסה', color: '#D7DEE8' },
                    { label: 'בריכה', color: '#2F7CF6' },
                    { label: 'מועדון', color: '#7C3AED' },
                  ].map(({ label, color }, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-3 h-3 border border-gray-500" style={{ backgroundColor: color }}></div>
                      <span className="text-[10px] text-white/50">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Full Tamhil Layout with Summary Tables */}
              <div className="flex gap-6">
              {/* LEFT SIDE - Summary Tables (like PDF) */}
              <div className="flex flex-col gap-4 text-[10px]">
                {/* סיכום תמהיל - HARDCODED for demo */}
                <div className="border border-gray-500">
                  <div className="bg-gray-200 text-black text-center font-bold py-1 border-b border-gray-500">סיכום תמהיל</div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 text-black">
                        <th className="border border-gray-400 px-2 py-1">%</th>
                        <th className="border border-gray-400 px-2 py-1">כמות</th>
                        <th className="border border-gray-400 px-2 py-1">חדרים</th>
                      </tr>
                    </thead>
                    <tbody className="text-black bg-white">
                      <tr><td className="border border-gray-400 px-2 py-0.5 text-center">21</td><td className="border border-gray-400 px-2 py-0.5 text-center">31</td><td className="border border-gray-400 px-2 py-0.5 text-center">n3</td></tr>
                      <tr><td className="border border-gray-400 px-2 py-0.5 text-center">42</td><td className="border border-gray-400 px-2 py-0.5 text-center">63</td><td className="border border-gray-400 px-2 py-0.5 text-center">n4</td></tr>
                      <tr><td className="border border-gray-400 px-2 py-0.5 text-center">35</td><td className="border border-gray-400 px-2 py-0.5 text-center">52</td><td className="border border-gray-400 px-2 py-0.5 text-center">n5</td></tr>
                      <tr><td className="border border-gray-400 px-2 py-0.5 text-center">1</td><td className="border border-gray-400 px-2 py-0.5 text-center">1</td><td className="border border-gray-400 px-2 py-0.5 text-center">mini PH</td></tr>
                      <tr><td className="border border-gray-400 px-2 py-0.5 text-center">2</td><td className="border border-gray-400 px-2 py-0.5 text-center">3</td><td className="border border-gray-400 px-2 py-0.5 text-center">PH</td></tr>
                      <tr className="font-bold bg-gray-100">
                        <td className="border border-gray-400 px-2 py-0.5 text-center">100</td>
                        <td className="border border-gray-400 px-2 py-0.5 text-center">150</td>
                        <td className="border border-gray-400 px-2 py-0.5 text-center">סה"כ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* חניות - Parking */}
                <div className="border border-gray-500">
                  <div className="bg-gray-200 text-black text-center font-bold py-1 border-b border-gray-500">חניות</div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 text-black">
                        <th className="border border-gray-400 px-1 py-0.5">חניות</th>
                        <th className="border border-gray-400 px-1 py-0.5">תקן</th>
                        <th className="border border-gray-400 px-1 py-0.5">כמות</th>
                        <th className="border border-gray-400 px-1 py-0.5">שטח</th>
                      </tr>
                    </thead>
                    <tbody className="text-black bg-white">
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center">31</td><td className="border border-gray-400 px-1 py-0.5 text-center">1</td><td className="border border-gray-400 px-1 py-0.5 text-center">31</td><td className="border border-gray-400 px-1 py-0.5 text-center">עד 105</td></tr>
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center">94.5</td><td className="border border-gray-400 px-1 py-0.5 text-center">1.5</td><td className="border border-gray-400 px-1 py-0.5 text-center">63</td><td className="border border-gray-400 px-1 py-0.5 text-center">עד 130</td></tr>
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center">78</td><td className="border border-gray-400 px-1 py-0.5 text-center">1.5</td><td className="border border-gray-400 px-1 py-0.5 text-center">52</td><td className="border border-gray-400 px-1 py-0.5 text-center">עד 130</td></tr>
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center">6</td><td className="border border-gray-400 px-1 py-0.5 text-center">2</td><td className="border border-gray-400 px-1 py-0.5 text-center">3</td><td className="border border-gray-400 px-1 py-0.5 text-center">מעל 130</td></tr>
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center">26</td><td className="border border-gray-400 px-1 py-0.5 text-center">1:50</td><td className="border border-gray-400 px-1 py-0.5 text-center">1300</td><td className="border border-gray-400 px-1 py-0.5 text-center">מסחר</td></tr>
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center">8</td><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center">נכים</td></tr>
                      <tr className="font-bold bg-gray-100"><td className="border border-gray-400 px-1 py-0.5 text-center">243.5</td><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center">סה"כ</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* מרפסת - Balcony */}
                <div className="border border-gray-500">
                  <div className="bg-gray-200 text-black text-center font-bold py-1 border-b border-gray-500">מרפסת</div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 text-black">
                        <th className="border border-gray-400 px-1 py-0.5">סה"כ</th>
                        <th className="border border-gray-400 px-1 py-0.5">שטח</th>
                        <th className="border border-gray-400 px-1 py-0.5">כמות</th>
                        <th className="border border-gray-400 px-1 py-0.5">חדרים</th>
                      </tr>
                    </thead>
                    <tbody className="text-black bg-white">
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center">324</td><td className="border border-gray-400 px-1 py-0.5 text-center">12</td><td className="border border-gray-400 px-1 py-0.5 text-center">27</td><td className="border border-gray-400 px-1 py-0.5 text-center">n3</td></tr>
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center">885</td><td className="border border-gray-400 px-1 py-0.5 text-center">15</td><td className="border border-gray-400 px-1 py-0.5 text-center">59</td><td className="border border-gray-400 px-1 py-0.5 text-center">n4</td></tr>
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center">1066</td><td className="border border-gray-400 px-1 py-0.5 text-center">20.5</td><td className="border border-gray-400 px-1 py-0.5 text-center">52</td><td className="border border-gray-400 px-1 py-0.5 text-center">n5</td></tr>
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center">גג</td><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center">mini PH</td></tr>
                      <tr><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center">גג</td><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center">PH</td></tr>
                      <tr className="font-bold bg-gray-100"><td className="border border-gray-400 px-1 py-0.5 text-center">2275</td><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center"></td><td className="border border-gray-400 px-1 py-0.5 text-center">סה"כ</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT SIDE - Building Towers - HARDCODED for demo */}
              <div className="flex flex-col gap-0 flex-1">
              {(() => {
                // Hardcoded floor layouts matching the PDF exactly
                const floors = [
                  { floor: 'ק.טכנית', tower1: ['ק.טכנית'], tower2: ['ק.טכנית'], units: 0, type: 'tech' },
                  { floor: '16', tower1: [180, 180], tower2: [180, 180], units: 4, type: 'ph' },
                  { floor: '15', tower1: [135, 145, 154], tower2: [154, 145, 135], units: 6, type: 'n5' },
                  { floor: '14', tower1: [135, 145, 145, 135], tower2: [135, 145, 145, 135], units: 8, type: 'n5' },
                  { floor: '13', tower1: [135, 145, 145, 135], tower2: [135, 145, 145, 135], units: 8, type: 'n5' },
                  { floor: '12', tower1: [135, 145, 145, 135], tower2: [135, 145, 145, 135], units: 8, type: 'n5' },
                  { floor: '11', tower1: [135, 145, 145, 135], tower2: [135, 145, 145, 135], units: 8, type: 'n5' },
                  { floor: '10', tower1: [135, 145, 145, 135], tower2: [135, 145, 145, 135], units: 8, type: 'n5' },
                  { floor: '9', tower1: [135, 145, 145, 135], tower2: [135, 145, 145, 135], units: 8, type: 'n5' },
                  { floor: '8', tower1: [109, 109, 115, 115, 81, 81], tower2: [109, 109, 115, 115, 81, 81], units: 12, type: 'mixed' },
                  { floor: '7', tower1: [109, 109, 115, 115, 81, 81], tower2: [109, 109, 115, 115, 81, 81], units: 12, type: 'mixed' },
                  { floor: '6', tower1: [109, 109, 115, 115, 81, 81], tower2: [109, 109, 115, 115, 81, 81], units: 12, type: 'mixed' },
                  { floor: '5', tower1: [109, 109, 115, 115, 81, 81], tower2: [109, 109, 115, 115, 81, 81], units: 12, type: 'mixed' },
                  { floor: '4', tower1: [109, 109, 115, 115, 81, 81], tower2: [109, 109, 115, 115, 81, 81], units: 12, type: 'mixed' },
                  { floor: '3', tower1: [109, 109, 115, 115, 81, 81], tower2: [109, 109, 115, 115, 81, 81], units: 12, type: 'mixed' },
                  { floor: '2', tower1: [109, 109, 115, 115, 81, 81], tower2: [109, 109, 115, 115, 81, 81], units: 12, type: 'mixed' },
                  { floor: '1', tower1: [109, 115, 81, 81], tower2: [81, 81, 115, 109], units: 8, type: 'floor1', hasPool: true },
                  { floor: '0', tower1: ['מסחר', 'לובי כניסה'], tower2: ['לובי כניסה', 'מסחר'], units: 0, type: 'ground', hasCommercialGap: true },
                ];
                
                const getColor = (val: number | string) => {
                  if (typeof val === 'string') {
                    if (val === 'ק.טכנית') return '#374151';
                    if (val === 'מסחר') return '#6B7280';
                    if (val === 'לובי כניסה') return '#D7DEE8';
                    return '#374151';
                  }
                  // Each size has a distinct color
                  if (val === 81) return '#5BC07A';   // Green - 81 sqm
                  if (val === 109) return '#F4C84A';  // Gold - 109 sqm
                  if (val === 115) return '#E8A93B';  // Amber - 115 sqm
                  if (val === 135) return '#F08A5D';  // Coral - 135 sqm
                  if (val === 145) return '#E05A5A';  // Red - 145 sqm
                  if (val === 154) return '#B86AD9';  // Purple - 154 sqm
                  if (val === 180) return '#20B7B0';  // Teal - 180 sqm (Penthouse)
                  return '#6B7280';                    // Gray - other
                };
                
                return (
                  <>
                    {floors.map((f, idx) => (
                      <div key={idx} className="flex items-stretch">
                        <div className="w-12 flex items-center justify-center text-[11px] text-white/70 mono border-r border-gray-600 shrink-0">{f.floor}</div>
                        
                        {/* Tower 1 */}
                        <div className="flex-1 flex border border-gray-600">
                          {f.tower1.map((val, j) => (
                            <div key={j} className={`${f.type === 'tech' ? 'h-6' : 'h-8'} flex-1 flex items-center justify-center text-gray-800 font-bold text-[11px] border border-gray-400`} style={{ backgroundColor: getColor(val) }}>
                              {val}
                            </div>
                          ))}
                          {f.type === 'floor1' && (
                            <div className="h-8 flex-1 flex items-center justify-center text-white text-[10px] font-bold border border-violet-600" style={{ backgroundColor: '#7C3AED' }}>מועדון</div>
                          )}
                        </div>
                        
                        {/* Gap */}
                        <div className={`${f.hasCommercialGap ? 'w-32' : 'w-20'} flex items-center justify-center`}>
                          {f.hasPool && (
                            <div className="w-full h-8 flex items-center justify-center text-white text-[10px] font-bold border border-blue-700" style={{ backgroundColor: '#2F7CF6' }}>בריכה</div>
                          )}
                          {f.hasCommercialGap && (
                            <div className="w-full h-8 bg-gray-400 flex items-center justify-center text-black text-[10px] font-bold border border-gray-500">מסחר</div>
                          )}
                        </div>
                        
                        {/* Tower 2 */}
                        <div className="flex-1 flex border border-gray-600">
                          {f.type === 'floor1' && (
                            <div className="h-8 flex-1 flex items-center justify-center text-white text-[10px] font-bold border border-violet-600" style={{ backgroundColor: '#7C3AED' }}>מועדון</div>
                          )}
                          {f.tower2.map((val, j) => (
                            <div key={j} className={`${f.type === 'tech' ? 'h-6' : 'h-8'} flex-1 flex items-center justify-center text-gray-800 font-bold text-[11px] border border-gray-400`} style={{ backgroundColor: getColor(val) }}>
                              {val}
                            </div>
                          ))}
                        </div>
                        
                        {/* Unit count */}
                        <div className="w-10 flex items-center justify-end text-[11px] text-white/70 mono pr-1">
                          {f.units > 0 ? f.units : ''}
                        </div>
                      </div>
                    ))}

                    {/* Total units row */}
                    <div className="flex items-center mt-2 pt-2 border-t border-gray-600">
                      <div className="w-12"></div>
                      <div className="flex-1"></div>
                      <div className="w-20"></div>
                      <div className="flex-1"></div>
                      <div className="w-10 text-[12px] text-white font-bold mono text-right pr-1">150</div>
                    </div>
                  </>
                );
              })()}
              </div>{/* End RIGHT SIDE - Building Towers */}
            </div>{/* End Full Tamhil Layout */}
            </div>{/* End min-w-[1000px] wrapper */}
          </div>

          {/* Unit Distribution - CALCULATED FROM floor_plans for 100% accuracy */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400 mb-4">Unit Distribution</h3>
            <div className="space-y-3">
              {(() => {
                // Calculate from floor_plans (same logic as סיכום תמהיל)
                const unitData: { [key: string]: { count: number; totalArea: number; label: string; order: number } } = {};
                
                const unitTypeInfo: { [key: string]: { label: string; order: number } } = {
                  'n3': { label: 'n3 (3 חדרים)', order: 1 },
                  'n4': { label: 'n4 (4 חדרים)', order: 2 },
                  'n5': { label: 'n5 (5 חדרים)', order: 3 },
                  'mini_ph': { label: 'mini PH', order: 4 },
                  'ph': { label: 'PH (פנטהאוס)', order: 5 },
                };
                
                tamhil.floor_plans?.forEach(floor => {
                  floor.units?.forEach(unit => {
                    const type = unit.unit_type?.toLowerCase();
                    if (!type || ['commercial', 'lobby', 'pool', 'club'].includes(type)) return;
                    
                    const count = unit.count || 1;
                    const area = unit.area_sqm || 0;
                    
                    if (!unitData[type]) {
                      unitData[type] = { 
                        count: 0, 
                        totalArea: 0,
                        label: unitTypeInfo[type]?.label || unit.label || type,
                        order: unitTypeInfo[type]?.order || 99
                      };
                    }
                    unitData[type].count += count;
                    unitData[type].totalArea += area * count;
                  });
                });
                
                const totalUnits = Object.values(unitData).reduce((sum, u) => sum + u.count, 0);
                
                const rows = Object.entries(unitData)
                  .sort((a, b) => a[1].order - b[1].order)
                  .filter(([_, data]) => data.count > 0)
                  .map(([type, data]) => ({
                    type,
                    label: data.label,
                    count: data.count,
                    avgSize: data.count > 0 ? Math.round(data.totalArea / data.count) : 0,
                    percent: totalUnits > 0 ? Math.round((data.count / totalUnits) * 100) : 0
                  }));
                
                return rows.map((row, i) => {
                  const color = unitColors[row.type] || '#FFD54F';
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{row.label}</span>
                        <span className="text-white/60">{row.count} units ({row.percent}%)</span>
                      </div>
                      <div className="h-6 bg-white/5 rounded overflow-hidden">
                        <div
                          className="h-full rounded flex items-center px-2 text-black text-xs font-bold transition-all"
                          style={{
                            backgroundColor: color,
                            width: `${Math.max(row.percent, 5)}%`
                          }}
                        >
                          {row.avgSize} sqm avg
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'summary' && (
        <div className="space-y-6">
          {/* Unit Mix Summary Table - CALCULATED FROM floor_plans for consistency */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Unit Mix Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] mono uppercase text-white/40">
                    <th className="px-6 py-3 text-left">Unit Type</th>
                    <th className="px-6 py-3 text-center">Rooms</th>
                    <th className="px-6 py-3 text-center">Size (sqm)</th>
                    <th className="px-6 py-3 text-center">Count</th>
                    <th className="px-6 py-3 text-center">Total Area</th>
                    <th className="px-6 py-3 text-center">% of Units</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Calculate from floor_plans for consistency with other tabs
                    const unitData: { [key: string]: { count: number; totalArea: number; rooms: number; avgSize: number } } = {};
                    const unitTypeInfo: { [key: string]: { label: string; rooms: number; avgSize: number; order: number } } = {
                      'n3': { label: 'n3', rooms: 3, avgSize: 81, order: 1 },
                      'n4': { label: 'n4', rooms: 4, avgSize: 112, order: 2 },
                      'n5': { label: 'n5', rooms: 5, avgSize: 140, order: 3 },
                      'mini_ph': { label: 'mini PH', rooms: 4, avgSize: 154, order: 4 },
                      'ph': { label: 'PH', rooms: 5, avgSize: 180, order: 5 },
                    };
                    
                    tamhil.floor_plans?.forEach(floor => {
                      floor.units?.forEach(unit => {
                        const type = unit.unit_type?.toLowerCase();
                        if (!type || ['commercial', 'lobby', 'pool', 'club'].includes(type)) return;
                        const count = unit.count || 1;
                        const area = unit.area_sqm || unitTypeInfo[type]?.avgSize || 100;
                        if (!unitData[type]) {
                          unitData[type] = { count: 0, totalArea: 0, rooms: unitTypeInfo[type]?.rooms || 4, avgSize: 0 };
                        }
                        unitData[type].count += count;
                        unitData[type].totalArea += area * count;
                      });
                    });
                    
                    const totalUnits = Object.values(unitData).reduce((sum, u) => sum + u.count, 0);
                    
                    const rows = Object.entries(unitData)
                      .map(([type, data]) => ({
                        type,
                        label: unitTypeInfo[type]?.label || type,
                        rooms: data.rooms,
                        avgSize: data.count > 0 ? Math.round(data.totalArea / data.count) : unitTypeInfo[type]?.avgSize || 0,
                        count: data.count,
                        totalArea: data.totalArea,
                        percentage: totalUnits > 0 ? Math.round((data.count / totalUnits) * 100) : 0,
                        order: unitTypeInfo[type]?.order || 99
                      }))
                      .sort((a, b) => a.order - b.order);
                    
                    return rows.map((row, i) => {
                      const color = unitColors[row.type] || '#FFD54F';
                      return (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-6 py-3 font-medium flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                            {row.label}
                          </td>
                          <td className="px-6 py-3 text-center text-white/60">{row.rooms}</td>
                          <td className="px-6 py-3 text-center text-white/60">{row.avgSize}</td>
                          <td className="px-6 py-3 text-center font-bold text-amber-400">{row.count}</td>
                          <td className="px-6 py-3 text-center text-white/60">{row.totalArea.toLocaleString()}</td>
                          <td className="px-6 py-3 text-center">
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">{row.percentage}%</span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Design Notes */}
          {tamhil.design_notes.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6 space-y-4">
              <h3 className="text-[10px] mono uppercase tracking-widest text-blue-400">Design Notes</h3>
              <ul className="space-y-2">
                {tamhil.design_notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-blue-200/80">
                    <span className="text-blue-400">💡</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {viewMode === 'floors' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Floor-by-Floor Breakdown</h3>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0a0a0a]">
                <tr className="border-b border-white/10 text-[10px] mono uppercase text-white/40">
                  <th className="px-4 py-3 text-left">Floor</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Units</th>
                  <th className="px-4 py-3 text-center">Total Units</th>
                  <th className="px-4 py-3 text-center">Total Area</th>
                </tr>
              </thead>
              <tbody>
                {tamhil.floor_plans.map((floor, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-bold">{floor.floor_number}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        floor.floor_type === 'penthouse' ? 'bg-purple-500/20 text-purple-400' :
                        floor.floor_type === 'ground' ? 'bg-blue-500/20 text-blue-400' :
                        floor.floor_type === 'typical' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {floor.floor_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {floor.units?.filter(u => u.count > 0).map((unit, j) => (
                          <span 
                            key={j} 
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ backgroundColor: unit.color || '#444', color: unit.color ? '#000' : '#fff' }}
                          >
                            {unit.count}× {unit.label || unit.unit_type_name || unit.unit_type} ({unit.area_sqm}m²)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{floor.total_units}</td>
                    <td className="px-4 py-3 text-center text-white/60">{floor.total_area_sqm} sqm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'json' && (
        <div className="bg-black/50 border border-white/10 rounded-xl p-6 overflow-auto max-h-[600px]">
          <pre className="text-xs text-amber-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(tamhil, null, 2)}
          </pre>
        </div>
      )}

      {/* Comparison with Rights */}
      {rights && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-[10px] mono uppercase tracking-widest text-amber-400">Rights vs. Generated</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[10px] mono uppercase text-white/40">Metric</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] mono uppercase text-white/40">Allowed (Rights)</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] mono uppercase text-white/40">Generated (Tamhil)</p>
            </div>
            
            <div className="text-center py-2 border-t border-white/10">Units</div>
            <div className="text-center py-2 border-t border-white/10 font-medium">{rights.rights.max_units}</div>
            <div className="text-center py-2 border-t border-white/10 font-bold text-amber-400">{tamhil.building_summary.total_units}</div>
            
            <div className="text-center py-2 border-t border-white/10">Main Area (sqm)</div>
            <div className="text-center py-2 border-t border-white/10 font-medium">{rights.rights.main_area_sqm.toLocaleString()}</div>
            <div className="text-center py-2 border-t border-white/10 font-bold text-amber-400">{tamhil.building_summary.total_main_area_sqm.toLocaleString()}</div>
            
            <div className="text-center py-2 border-t border-white/10">Floors</div>
            <div className="text-center py-2 border-t border-white/10 font-medium">{rights.rights.floors_max}</div>
            <div className="text-center py-2 border-t border-white/10 font-bold text-amber-400">{tamhil.building_summary.floors_above_ground}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoningAnalysis;
