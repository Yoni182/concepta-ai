import React from 'react';
import { useAuth } from '../services/authContext';

interface HeaderProps {
  onOpenLibrary?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenLibrary }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-12 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
      {/* Left side - Library Button */}
      <button
        onClick={onOpenLibrary}
        className="px-4 py-1.5 rounded-lg border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500 transition-all text-xs font-medium uppercase tracking-wider"
      >
        Library
      </button>

      {/* Right side - User info */}
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 truncate max-w-[180px]">
            {user.email}
          </span>
          <button
            onClick={logout}
            className="px-4 py-1.5 rounded-lg border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-all text-xs font-medium uppercase tracking-wider"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
