import React from 'react';
import { useAuth } from '../services/authContext';
import { AppModule } from '../types';

interface HeaderProps {
  activeModule: AppModule;
  onModuleChange: (module: AppModule) => void;
}

const Header: React.FC<HeaderProps> = ({ activeModule, onModuleChange }) => {
  const { user, logout } = useAuth();

  return (
    <header className="min-h-[56px] md:h-16 border-b border-white/10 flex flex-col md:flex-row items-center justify-between px-3 md:px-8 py-2 md:py-0 shrink-0 gap-2 md:gap-0">
      <div className="flex items-center gap-2 md:gap-6 w-full md:w-auto justify-between md:justify-start">
        {/* Module Switcher */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => onModuleChange('zoning')}
            className={`px-2 md:px-4 py-1 md:py-1.5 rounded text-[9px] md:text-[11px] mono uppercase transition-all ${
              activeModule === 'zoning'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            📋 <span className="hidden sm:inline">Zoning</span>
          </button>
          <button
            onClick={() => onModuleChange('visualization')}
            className={`px-2 md:px-4 py-1 md:py-1.5 rounded text-[9px] md:text-[11px] mono uppercase transition-all ${
              activeModule === 'visualization'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            🎨 <span className="hidden sm:inline">Viz</span>
          </button>
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
          <span className="text-[10px] mono uppercase text-white/60">
            {activeModule === 'zoning' ? 'Zoning Analysis' : 'Stage Analysis'} Active
          </span>
        </div>
        
        {/* Mobile user section */}
        {user && (
          <div className="md:hidden">
            <button
              onClick={logout}
              className="text-[9px] mono uppercase px-2 py-1 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      
      {/* Desktop right section */}
      <div className="hidden md:flex items-center gap-4">
        <div className="text-[10px] mono uppercase tracking-widest text-white/40 flex items-center gap-4">
          <span>V 0.1.0-ALPHA</span>
          <span className="text-white/10">|</span>
          <span>Studio Edition</span>
        </div>
        
        {user && (
          <>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/40 truncate max-w-[150px]">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="text-[10px] mono uppercase px-3 py-1 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
