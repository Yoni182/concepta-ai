import React from 'react';
import { useAuth } from '../services/authContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
          <span className="text-[10px] mono uppercase text-white/60">Stage Analysis Active</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
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
