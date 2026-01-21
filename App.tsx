import React, { useState, useRef } from 'react';
import { useAuth } from './services/authContext';
import { Project } from './services/projectsService';

import Header from './components/Header';
import LoginPage from './components/LoginPage';
import Library from './components/Library';
import ZoningAnalysis, { ZoningAnalysisRef } from './components/zoning/ZoningAnalysis';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Current step in the workflow (will be managed by ZoningAnalysis component)
  const [currentStep, setCurrentStep] = useState(1);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const zoningRef = useRef<ZoningAnalysisRef>(null);

  // Handle loading a project from the library
  const handleLoadProject = (project: Project) => {
    if (zoningRef.current) {
      zoningRef.current.loadProject(project);
    }
    setCurrentStep(project.currentStep);
  };

  // Step definitions for the sidebar
  const steps = [
    { id: 1, name: 'Planning Rights', description: 'Extract from TABA', completed: currentStep > 1 },
    { id: 2, name: 'Unit Mix (Tamhil)', description: 'Generate proposal', completed: currentStep > 2 },
    { id: 3, name: 'Massing Design', description: 'Building form', completed: currentStep > 3 },
    { id: 4, name: '3D Visualization', description: 'Render & preview', completed: currentStep > 4 },
    { id: 5, name: 'Export & Report', description: 'Final deliverables', completed: currentStep > 5 },
  ];

  const handleStepClick = (stepId: number) => {
    // Only allow clicking on completed steps or the current step
    if (stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white selection:bg-amber-500/20">
      {/* Sidebar with 5 steps */}
      <aside className="w-72 border-r border-white/10 p-8 flex flex-col justify-between hidden md:flex shrink-0 bg-[#0a0a0a]">
        <div>
          {/* Logo - Clickable to reset to Step 1 */}
          <button
            onClick={() => setCurrentStep(1)}
            className="w-full mb-10 text-center hover:opacity-80 transition-opacity"
          >
            <h1 className="text-2xl font-bold tracking-tighter mb-1 uppercase">CONCEPTA</h1>
            <p className="text-[10px] mono text-white/40 uppercase tracking-[0.2em]">AI Architecture Engine</p>
          </button>

          {/* 5 Steps */}
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = step.completed;
              const isClickable = step.id <= currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isClickable}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    isActive
                      ? 'bg-amber-500/20 border border-amber-500/40'
                      : isCompleted
                      ? 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer'
                      : 'bg-white/5 border border-white/10 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted || isActive
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/10 text-white/40'
                    }`}>
                      {isCompleted ? '✓' : step.id}
              </div>
                    <div>
                      <p className={`text-sm font-medium ${isActive || isCompleted ? 'text-white' : 'text-white/60'}`}>
                        {step.name}
                      </p>
                      <p className="text-[10px] text-white/40">{step.description}</p>
                </div>
              </div>
                </button>
              );
            })}
          </div>
            </div>

        {/* Back Button - only show on step 2+ */}
        {currentStep > 1 && (
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className="w-full py-3 rounded-xl border border-white/20 text-white/60 hover:bg-white/5 hover:text-white transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            <span>←</span> Back
          </button>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onOpenLibrary={() => setIsLibraryOpen(true)} />
        <main className="flex-1 overflow-y-auto py-8 px-4 md:px-8">
          <ZoningAnalysis 
            ref={zoningRef}
            onStepChange={setCurrentStep} 
            currentStep={currentStep} 
            />
        </main>
      </div>

      {/* Library Modal */}
      <Library
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onLoadProject={handleLoadProject}
      />
    </div>
  );
};

export default App;
