import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { Project, getUserProjects, deleteProject, formatProjectDate } from '../services/projectsService';

interface LibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: Project) => void;
}

const Library: React.FC<LibraryProps> = ({ isOpen, onClose, onLoadProject }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadProjects();
    }
  }, [isOpen, user]);

  const loadProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userProjects = await getUserProjects(user.uid);
      setProjects(userProjects);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete project. Please try again.');
    }
  };

  const handleLoadProject = (project: Project) => {
    onLoadProject(project);
    onClose();
  };

  const getStepLabel = (step: number): string => {
    const labels: Record<number, string> = {
      1: 'Planning Rights',
      2: 'Unit Mix (Tamhil)',
      3: 'Massing Design',
      4: '3D Visualization',
      5: 'Export & Report',
    };
    return labels[step] || 'Unknown';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-light uppercase tracking-tighter">Project Library</h2>
            <p className="text-xs text-white/40 mt-1">Load or manage your saved projects</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-center">
              {error}
              <button 
                onClick={loadProjects}
                className="ml-3 underline hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">📁</span>
              </div>
              <p className="text-white/40">No saved projects yet</p>
              <p className="text-white/30 text-sm">Projects will appear here when you save them during your workflow</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => handleLoadProject(project)}>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-white">{project.name}</h3>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] mono uppercase rounded">
                          Step {project.currentStep}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>Gush: {project.gush}</span>
                        <span>Helka: {project.helka}</span>
                        <span>•</span>
                        <span>{formatProjectDate(project.updatedAt)}</span>
                      </div>
                      <p className="text-xs text-white/30 mt-1">
                        Last stage: {getStepLabel(project.currentStep)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleLoadProject(project)}
                        className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs rounded-lg hover:bg-amber-500/30 transition-colors"
                      >
                        Load
                      </button>
                      {deleteConfirm === project.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(project.id!)}
                            className="px-2 py-1.5 bg-red-500/20 text-red-400 text-xs rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1.5 text-white/40 text-xs hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(project.id!)}
                          className="px-3 py-1.5 border border-white/20 text-white/50 text-xs rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
          <p className="text-xs text-white/30">
            {projects.length} project{projects.length !== 1 ? 's' : ''} saved
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-white/20 text-white/60 hover:bg-white/5 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Library;
