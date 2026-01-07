
import React, { useState, useEffect } from 'react';
import { AppStage, AppState, LIGHTING_PRESETS } from './types';
import { GeminiService } from './services/geminiService';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ModelInput from './components/ModelInput';
import BuildingRefInput from './components/BuildingRefInput';
import MaterialSelection from './components/MaterialSelection';
import AtmosphereSettings from './components/AtmosphereSettings';
import DecisionSummary from './components/DecisionSummary';
import ResultView from './components/ResultView';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    stage: AppStage.MODEL_INPUT,
    modelImage: null,
    buildingRefImage: null,
    detectedMaterials: [],
    selectedMaterialIds: [],
    manualMaterialImages: [],
    groundFloorType: 'Lobby',
    groundFloorDescription: '',
    lightingConfig: { 
      ...LIGHTING_PRESETS[0], 
      preset: LIGHTING_PRESETS[0].name, 
      sunAzimuth: LIGHTING_PRESETS[0].azimuth, 
      sunIntensity: LIGHTING_PRESETS[0].intensity, 
      timeOfDay: LIGHTING_PRESETS[0].time, 
      haze: LIGHTING_PRESETS[0].haze 
    },
    contextSetting: 'Dense Urban',
    finalAlternatives: [],
  });

  const [hasApiKey, setHasApiKey] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      }
    };
    checkKey();
  }, []);

  const gemini = new GeminiService();

  const handleNext = async () => {
    setIsAnalyzing(true);
    try {
      if (state.stage === AppStage.MODEL_INPUT && state.modelImage) {
        const desc = await gemini.analyzeModel(state.modelImage);
        setState(p => ({ ...p, stage: AppStage.BUILDING_REF, analysisResults: { ...p.analysisResults!, modelDescription: desc, buildingRefDescription: '', archIntelligence: { massingHierarchy: '', facadeZoning: '', geometricLanguage: '', elementLogic: '', materialSystem: '', indoorOutdoor: '', greenIntegration: '', humanScale: '' } } }));
      } else if (state.stage === AppStage.BUILDING_REF && state.buildingRefImage) {
        const { description, materials, intel } = await gemini.analyzeBuildingRef(state.buildingRefImage);
        setState(p => ({ 
          ...p, 
          stage: AppStage.MATERIAL_STRATEGY, 
          detectedMaterials: materials,
          selectedMaterialIds: materials.map(m => m.id),
          analysisResults: { ...p.analysisResults!, buildingRefDescription: description, archIntelligence: intel } 
        }));
      } else if (state.stage === AppStage.MATERIAL_STRATEGY) {
        setState(p => ({ ...p, stage: AppStage.ATMOSPHERE }));
      } else if (state.stage === AppStage.ATMOSPHERE) {
        setState(p => ({ ...p, stage: AppStage.SUMMARY }));
      } else if (state.stage === AppStage.SUMMARY) {
        // @ts-ignore
        if (!hasApiKey && window.aistudio) await window.aistudio.openSelectKey();
        setState(p => ({ ...p, stage: AppStage.GENERATING }));
        const alts = await gemini.generateAlternatives(state);
        setState(p => ({ ...p, stage: AppStage.RESULT, finalAlternatives: alts }));
      }
    } catch (err: any) {
      setState(p => ({ ...p, error: err.message, stage: AppStage.SUMMARY }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    const stages = Object.values(AppStage);
    const currentIndex = stages.indexOf(state.stage);
    if (currentIndex > 0) setState(prev => ({ ...prev, stage: stages[currentIndex - 1] as AppStage }));
  };

  const jumpToStage = (s: AppStage) => {
    setState(p => ({ ...p, stage: s }));
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white selection:bg-pink-500/20">
      <Sidebar activeStage={state.stage} onJump={jumpToStage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 relative">
          {state.error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/50 border border-red-500 text-red-200 px-6 py-3 rounded-lg z-50 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p>{state.error}</p>
              <button onClick={() => setState(p => ({...p, error: undefined}))} className="ml-4 hover:text-white">✕</button>
            </div>
          )}

          {state.stage === AppStage.MODEL_INPUT && <ModelInput image={state.modelImage} setImage={img => setState(p => ({...p, modelImage: img}))} />}
          {state.stage === AppStage.BUILDING_REF && <BuildingRefInput image={state.buildingRefImage} setImage={img => setState(p => ({...p, buildingRefImage: img}))} />}
          {state.stage === AppStage.MATERIAL_STRATEGY && (
            <MaterialSelection 
              detected={state.detectedMaterials}
              selectedIds={state.selectedMaterialIds}
              setSelectedIds={ids => setState(p => ({...p, selectedMaterialIds: ids}))}
              manualImages={state.manualMaterialImages}
              setManualImages={imgs => setState(p => ({...p, manualMaterialImages: imgs}))}
            />
          )}
          {state.stage === AppStage.ATMOSPHERE && (
            <AtmosphereSettings 
              groundFloorType={state.groundFloorType}
              setGroundFloorType={t => setState(p => ({...p, groundFloorType: t}))}
              groundFloorDesc={state.groundFloorDescription}
              setGroundFloorDesc={d => setState(p => ({...p, groundFloorDescription: d}))}
              lightingConfig={state.lightingConfig}
              setLightingConfig={lc => setState(p => ({...p, lightingConfig: lc}))}
              context={state.contextSetting}
              setContext={c => setState(p => ({...p, contextSetting: c}))}
            />
          )}
          {state.stage === AppStage.SUMMARY && <DecisionSummary state={state} />}
          {state.stage === AppStage.GENERATING && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
              <div className="relative">
                <div className="w-24 h-24 border-2 border-pink-400/5 rounded-full animate-ping absolute inset-0"></div>
                <div className="w-24 h-24 border-4 border-pink-400/10 border-t-pink-400 rounded-full animate-spin"></div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-light uppercase tracking-tighter">Computing Architectural Alternatives</h2>
                <div className="flex justify-center gap-8 text-[10px] mono uppercase text-pink-400/40 tracking-widest">
                  <span className="animate-pulse">1. Fibonacci Scaling...</span>
                  <span className="animate-pulse" style={{animationDelay: '0.5s'}}>2. Color Harmony Check...</span>
                  <span className="animate-pulse" style={{animationDelay: '1s'}}>3. Parallel Rendering...</span>
                </div>
              </div>
              <p className="text-white/40 max-w-md leading-relaxed text-sm">
                Generating 3 distinct interpretations based on material logic and proportional constraints. This parallel process ensures objective design exploration.
              </p>
            </div>
          )}
          {state.stage === AppStage.RESULT && (
            <ResultView 
              alternatives={state.finalAlternatives} 
              onBackToSummary={() => setState(p => ({ ...p, stage: AppStage.SUMMARY }))}
              onReset={() => window.location.reload()} 
            />
          )}
        </main>

        {![AppStage.GENERATING, AppStage.RESULT].includes(state.stage) && (
          <footer className="h-20 border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between px-8 shrink-0">
            <button onClick={handleBack} disabled={state.stage === AppStage.MODEL_INPUT || isAnalyzing} className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 disabled:opacity-20 transition-all text-xs font-bold mono uppercase">Back</button>
            <div className="flex items-center gap-4">
              {isAnalyzing && <span className="text-[10px] mono animate-pulse text-pink-400/50">ARCHITECTURAL KERNEL ACTIVE...</span>}
              <button onClick={handleNext} disabled={isAnalyzing || (state.stage === AppStage.MODEL_INPUT && !state.modelImage) || (state.stage === AppStage.BUILDING_REF && !state.buildingRefImage)} className="px-8 py-2 rounded-full bg-white text-black font-bold hover:bg-white/90 disabled:opacity-50 transition-all text-xs uppercase tracking-wider">
                {state.stage === AppStage.SUMMARY ? 'Execute Translation' : 'Continue'}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;
