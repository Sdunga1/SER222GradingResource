'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { Copy } from 'lucide-react';

interface FeedbackElement {
  id: string;
  moduleId: string;
  content: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackModule {
  id: string;
  title: string;
  description?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  elements: FeedbackElement[];
}

export default function GraderMode() {
  const { theme } = useTheme();
  const [modules, setModules] = useState<FeedbackModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffledModules, setShuffledModules] = useState<FeedbackModule[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);

  // Fetch modules
  const fetchModules = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback');
      const data = await response.json();
      if (data.success) {
        setModules(data.modules);
        setShuffledModules(data.modules);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      toast.error('Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleShuffleModules = () => {
    const shuffled = [...modules].sort(() => Math.random() - 0.5);
    setShuffledModules(shuffled);
    setIsShuffled(true);
    toast.success('Modules shuffled');
  };

  const handleShuffleElements = (moduleId: string) => {
    setShuffledModules(
      shuffledModules.map((m) =>
        m.id === moduleId
          ? { ...m, elements: [...m.elements].sort(() => Math.random() - 0.5) }
          : m
      )
    );
    toast.success('Elements shuffled');
  };

  const displayedModules = isShuffled ? shuffledModules : modules;

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
            Loading feedback modules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Feedback Comments</h2>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {displayedModules.length} modules available
          </p>
        </div>
        <button
          onClick={handleShuffleModules}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            theme === 'dark'
              ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
          }`}
        >
          🔀 Shuffle
        </button>
      </div>

      {displayedModules.length === 0 ? (
        <div className="text-center py-12">
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
            No feedback modules available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedModules.map((module) => (
            <div
              key={module.id}
              className={`rounded-lg border p-6 ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{module.title}</h3>
                {module.description && (
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {module.description}
                  </p>
                )}
              </div>

              {module.elements.length === 0 ? (
                <p className={`text-sm italic ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  No feedback elements in this module.
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {module.elements.map((element) => (
                    <div
                      key={element.id}
                      className={`p-3 rounded-md flex justify-between items-start gap-3 group ${
                        theme === 'dark'
                          ? 'bg-slate-800 border border-slate-700'
                          : 'bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <p className={`text-sm whitespace-pre-wrap flex-1 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {element.content}
                      </p>
                      <button
                        onClick={() => handleCopyToClipboard(element.content)}
                        className={`p-2 rounded transition-colors shrink-0 ${
                          theme === 'dark'
                            ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100'
                            : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900 opacity-0 group-hover:opacity-100'
                        }`}
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {module.elements.length > 1 && (
                <button
                  onClick={() => handleShuffleElements(module.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  🔀 Shuffle Elements
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
