
import React from 'react';
import { AppStage } from '../types';

interface SidebarProps {
  activeStage: AppStage;
  onJump: (s: AppStage) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeStage, onJump }) => {
  const steps = [
    { id: AppStage.MODEL_INPUT, label: 'Massing Input', desc: 'Geometry Base' },
    { id: AppStage.BUILDING_REF, label: 'Reference Analysis', desc: 'Ref Language' },
    { id: AppStage.MATERIAL_STRATEGY, label: 'Material Logic', desc: 'Selection' },
    { id: AppStage.ATMOSPHERE, label: 'Atmosphere', desc: 'Light & Context' },
    { id: AppStage.SUMMARY, label: 'Review', desc: 'Audit Logic' },
  ];

  const getStatus = (id: AppStage) => {
    const stages = Object.values(AppStage);
    const activeIndex = stages.indexOf(activeStage);
    const stepIndex = stages.indexOf(id);
    if (stepIndex < activeIndex) return 'complete';
    if (stepIndex === activeIndex) return 'active';
    return 'pending';
  };

  const isNavigable = (id: AppStage) => {
    // Can't jump while generating
    if (activeStage === AppStage.GENERATING) return false;
    // Can jump back to any stage if we've reached it or are in results
    const stages = Object.values(AppStage);
    const activeIndex = stages.indexOf(activeStage);
    const targetIndex = stages.indexOf(id);
    return targetIndex <= activeIndex || activeStage === AppStage.RESULT;
  };

  return (
    <aside className="w-80 border-r border-white/10 p-10 flex flex-col justify-between hidden md:flex shrink-0 bg-[#0a0a0a]">
      <div>
        <div className="mb-12">
          <h1 className="text-2xl font-bold tracking-tighter mb-1 uppercase">CONCEPTA</h1>
          <p className="text-[10px] mono text-white/40 uppercase tracking-[0.2em]">Arch Translation Engine</p>
        </div>
        <nav className="space-y-10">
          {steps.map((step, idx) => {
            const status = getStatus(step.id);
            const clickable = isNavigable(step.id);
            return (
              <button 
                key={step.id} 
                onClick={() => clickable && onJump(step.id)}
                disabled={!clickable}
                className={`relative w-full text-left group outline-none transition-all ${!clickable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:translate-x-1'}`}
              >
                {idx < steps.length - 1 && <div className={`absolute left-4 top-8 w-[1px] h-10 transition-colors ${status === 'complete' ? 'bg-pink-400' : 'bg-white/10'}`}></div>}
                <div className="flex gap-6">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] mono shrink-0 transition-all ${status === 'active' ? 'bg-white border-white text-black font-bold scale-110' : status === 'complete' ? 'bg-pink-400/20 border-pink-400 text-pink-400 group-hover:bg-pink-400/30' : 'border-white/20 text-white/30'}`}>{status === 'complete' ? '✓' : idx + 1}</div>
                  <div className="space-y-1">
                    <p className={`text-xs font-semibold tracking-tight transition-colors ${status === 'active' ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>{step.label}</p>
                    <p className="text-[10px] mono uppercase tracking-wider text-white/20">{step.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3">
        <p className="text-[10px] mono text-white/40 uppercase tracking-widest">Core Engine</p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]"></div>
          <span className="text-[10px] font-medium mono uppercase opacity-60 tracking-tighter">Constraint Mode: Fibonacci</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
