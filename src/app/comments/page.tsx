'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { FeedbackSection } from '@/components/FeedbackSection';
import { ChevronsUpDown } from '@/components/icons/ChevronsUpDown';
import { Reorder } from 'framer-motion';
import styles from './button64.module.css';
import type {
  FeedbackModule,
  FeedbackQuestion,
  FeedbackElement,
} from '@/types/feedback';

export const dynamic = 'force-dynamic';

const sortElements = (elements: FeedbackElement[] = []) =>
  [...elements].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

const sortQuestions = (questions: FeedbackQuestion[] = []) =>
  [...questions].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map(question => ({
    ...question,
    elements: sortElements(question.elements ?? []),
  }));

const normalizeModules = (modules: FeedbackModule[] = []): FeedbackModule[] =>
  [...modules]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(module => ({
      ...module,
      questions: sortQuestions(module.questions ?? []),
    }));

const applyModuleOrder = (modules: FeedbackModule[]) =>
  modules.map((module, index) => ({
    ...module,
    position: index + 1,
    questions: sortQuestions(module.questions),
  }));

export default function Comments() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('commentsAuth') === 'true';
    }
    return false;
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [isSiteLocked, setIsSiteLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modules, setModules] = useState<FeedbackModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'grader'>(() => {
    // Load saved mode from localStorage, default to 'grader'
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('commentsPageMode');
      return (savedMode === 'edit' || savedMode === 'grader') ? savedMode : 'grader';
    }
    return 'grader';
  });
  const [isGlobalEditing, setIsGlobalEditing] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleOrderDirty, setModuleOrderDirty] = useState(false);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastCopiedElementId');
    }
    return null;
  });
  const { theme, toggleTheme } = useTheme();
  const canManage = true;

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === 'SER222ASU') {
      setIsAuthenticated(true);
      localStorage.setItem('commentsAuth', 'true');
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscodeInput('');
    }
  };

  // Check site lock status
  useEffect(() => {
    const checkSiteLock = async () => {
      try {
        const response = await fetch('/api/site-settings');
        const data = await response.json();
        if (data.success && data.locked) {
          setIsSiteLocked(true);
          setIsAuthenticated(false);
          localStorage.removeItem('commentsAuth');
        } else {
          setIsSiteLocked(false);
        }
      } catch (error) {
        console.error('Error checking site lock:', error);
      } finally {
        setCheckingLock(false);
      }
    };

    checkSiteLock();

    // Check lock status every 10 seconds
    const interval = setInterval(checkSiteLock, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('commentsPageMode', mode);
  }, [mode]);

  // Fetch modules
  useEffect(() => {
    if (!isAuthenticated || isSiteLocked) {
      setLoading(false);
      return;
    }

    const fetchModules = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/feedback');
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch feedback modules');
        }
        setModules(normalizeModules(data.modules || []));
        setError(null);
      } catch (error: any) {
        console.error('Error fetching modules:', error);
        setError(error.message || 'Failed to fetch modules');
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [isAuthenticated, isSiteLocked]);

  const isFiltering = searchQuery.trim().length > 0;

  // Filter modules, questions, and elements based on search
  const filteredModules = searchQuery
    ? modules
        .map(module => ({
          ...module,
          questions: module.questions
            .map(question => ({
              ...question,
              elements: question.elements.filter((element: FeedbackElement) =>
                element.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.title.toLowerCase().includes(searchQuery.toLowerCase())
              ),
            }))
            .filter(question => 
              question.elements.length > 0 || 
              question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              module.title.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        }))
        .filter(module => 
          module.questions.length > 0 || 
          module.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : modules;

  const updateModuleQuestions = useCallback(
    (moduleId: string, updater: (questions: FeedbackQuestion[]) => FeedbackQuestion[]) => {
      setModules(prev =>
        prev.map(module =>
          module.id === moduleId
            ? { ...module, questions: updater(module.questions) }
            : module
        )
      );
    },
    []
  );

  const updateQuestionElements = useCallback(
    (moduleId: string, questionId: string, updater: (elements: FeedbackElement[]) => FeedbackElement[]) => {
      setModules(prev =>
        prev.map(module =>
          module.id === moduleId
            ? {
                ...module,
                questions: module.questions.map(question =>
                  question.id === questionId
                    ? { ...question, elements: updater(question.elements) }
                    : question
                ),
              }
            : module
        )
      );
    },
    []
  );

  const persistModuleOrder = useCallback(async () => {
    if (!canManage || !moduleOrderDirty || modules.length === 0)
      return;
    try {
      await fetch('/api/feedback/modules/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderedIds: modules.map(module => module.id),
        }),
      });
      setModuleOrderDirty(false);
    } catch (error) {
      console.error('Failed to persist module order', error);
    }
  }, [canManage, moduleOrderDirty, modules]);

  const handleAddQuestion = useCallback(
    async (moduleId: string, title: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      const response = await fetch(`/api/feedback/${moduleId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to add question');
      }
      updateModuleQuestions(moduleId, questions =>
        sortQuestions([...questions, data.question as FeedbackQuestion])
      );
    },
    [canManage, updateModuleQuestions]
  );

  const handleUpdateQuestion = useCallback(
    async (moduleId: string, questionId: string, title: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      const response = await fetch(`/api/feedback/${moduleId}/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to update question');
      }
      updateModuleQuestions(moduleId, questions =>
        questions.map(question =>
          question.id === questionId
            ? { ...question, title: data.question.title }
            : question
        )
      );
    },
    [canManage, updateModuleQuestions]
  );

  const handleDeleteQuestion = useCallback(
    async (moduleId: string, questionId: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      const response = await fetch(`/api/feedback/${moduleId}/questions/${questionId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to delete question');
      }
      updateModuleQuestions(moduleId, questions =>
        questions.filter(question => question.id !== questionId)
      );
    },
    [canManage, updateModuleQuestions]
  );

  const handleAddElement = useCallback(
    async (moduleId: string, questionId: string, content: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      const response = await fetch(`/api/feedback/${moduleId}/questions/${questionId}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to add element');
      }
      updateQuestionElements(moduleId, questionId, elements =>
        sortElements([...elements, data.element as FeedbackElement])
      );
    },
    [canManage, updateQuestionElements]
  );

  const handleUpdateElement = useCallback(
    async (moduleId: string, questionId: string, elementId: string, content: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      const response = await fetch(`/api/feedback/${moduleId}/questions/${questionId}/elements/${elementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to update element');
      }
      updateQuestionElements(moduleId, questionId, elements =>
        sortElements(
          elements.map(element =>
            element.id === elementId
              ? (data.element as FeedbackElement)
              : element
          )
        )
      );
    },
    [canManage, updateQuestionElements]
  );

  const handleDeleteElement = useCallback(
    async (moduleId: string, questionId: string, elementId: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      const response = await fetch(`/api/feedback/${moduleId}/questions/${questionId}/elements/${elementId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to delete element');
      }
      updateQuestionElements(moduleId, questionId, elements =>
        elements.filter(element => element.id !== elementId)
      );
    },
    [canManage, updateQuestionElements]
  );

  const handleUpdateModule = useCallback(
    (moduleId: string, newTitle: string) => {
      setModules(prev =>
        prev.map(module =>
          module.id === moduleId
            ? { ...module, title: newTitle }
            : module
        )
      );
    },
    []
  );

  const handleAddModule = useCallback(
    async (title: string) => {
      if (!title.trim()) {
        return;
      }
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim() }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to create module');
        }
        const newModule = data.module as FeedbackModule;
        setModules(prev => [...prev, newModule]);
        setNewModuleTitle('');
        setIsAddingModule(false);
      } catch (error: any) {
        console.error('Error creating module:', error);
      }
    },
    []
  );

  const handleDeleteModule = useCallback(
    async (moduleId: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      try {
        const response = await fetch(`/api/feedback/${moduleId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to delete module');
        }
        setModules(prev => prev.filter(module => module.id !== moduleId));
      } catch (error: any) {
        console.error('Error deleting module:', error);
        throw error;
      }
    },
    [canManage]
  );

  const handleSectionEditStart = useCallback((_moduleId: string) => {
    setEditingModuleId(_moduleId);
  }, []);

  const handleSectionEditStop = useCallback(
    async (_moduleId: string) => {
      setEditingModuleId(null);
      // No longer needed since questions don't have reordering
    },
    []
  );

  const handleGlobalEditToggle = useCallback(async () => {
    if (!canManage) return;
    if (!isGlobalEditing) {
      if (isFiltering) {
        return;
      }
      if (searchQuery) {
        setSearchQuery('');
      }
      setEditingModuleId(null);
      setIsGlobalEditing(true);
    } else {
      setIsGlobalEditing(false);
      await persistModuleOrder();
    }
  }, [canManage, isGlobalEditing, isFiltering, searchQuery, persistModuleOrder]);

  const handleToggleSiteLock = useCallback(async () => {
    if (!canManage) return;
    
    const confirmMessage = isSiteLocked 
      ? 'Unlock the website for all users?'
      : 'Lock the website for all users? Everyone will need to enter the passcode again.';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !isSiteLocked }),
      });

      const data = await response.json();
      if (data.success) {
        setIsSiteLocked(data.locked);
        if (data.locked) {
          setIsAuthenticated(false);
          localStorage.removeItem('commentsAuth');
        }
      }
    } catch (error) {
      console.error('Error toggling site lock:', error);
      alert('Failed to toggle site lock');
    }
  }, [canManage, isSiteLocked]);

  // Show loading while checking lock status
  if (checkingLock) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  // Passcode Screen
  if (!isAuthenticated || isSiteLocked) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950' 
          : 'bg-gradient-to-br from-[#8C1D40] via-[#FFC627] to-[#8C1D40]'
      }`}>
        <button
          onClick={toggleTheme}
          className={`absolute top-8 right-8 p-3 rounded-lg transition-colors shadow-lg ${
            theme === 'dark'
              ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 backdrop-blur-sm'
              : 'bg-white/30 hover:bg-white/50 text-white backdrop-blur-sm'
          }`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <div className={`w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl backdrop-blur-sm ${
          theme === 'dark'
            ? 'bg-slate-900/80 border border-purple-500/30'
            : 'bg-white/95 border border-[#8C1D40]/20'
        }`}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/40'
                : 'bg-gradient-to-br from-[#8C1D40]/10 to-[#FFC627]/10 border border-[#8C1D40]/20'
            }`}>
              <svg className={`w-10 h-10 ${
                theme === 'dark' ? 'text-purple-400' : 'text-[#8C1D40]'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-[#8C1D40]'
            }`}>
              Access Required
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-[#8C1D40]/70'
            }`}>
              Enter passcode to access grading feedback
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setPasscodeError(false);
                }}
                placeholder="Enter passcode"
                autoFocus
                className={`w-full px-4 py-3 rounded-lg border-2 text-center text-lg font-mono tracking-wider transition-all ${
                  passcodeError
                    ? 'border-red-500 bg-red-50/50 text-red-900 placeholder-red-400 animate-shake'
                    : theme === 'dark'
                    ? 'border-purple-500/30 bg-slate-800 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    : 'border-[#8C1D40]/30 bg-white text-[#8C1D40] placeholder-[#8C1D40]/40 focus:border-[#8C1D40] focus:ring-2 focus:ring-[#FFC627]/20'
                } focus:outline-none`}
              />
              {passcodeError && (
                <p className="text-red-500 text-sm mt-2 text-center font-medium">
                  ❌ Incorrect passcode. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-purple-500/50'
                  : 'bg-gradient-to-r from-[#8C1D40] to-[#8C1D40]/90 hover:from-[#8C1D40]/90 hover:to-[#8C1D40]/80 shadow-[#8C1D40]/30'
              }`}
            >
              🔓 Unlock Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
            Loading feedback modules...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-[#8C1D40]'
      }`}>
        <div className="text-center">
          <p className={`${theme === 'dark' ? 'text-red-400' : 'text-white'} mb-4`}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 rounded-lg font-semibold ${
              theme === 'dark' 
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-[#FFC627] text-[#8C1D40] hover:bg-[#FFC627]/90'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark'
        ? 'bg-slate-950 text-slate-50'
        : 'bg-white text-slate-900'
    }`}>
      {/* Header - Title Only */}
      <div className={`border-b ${
        theme === 'dark'
          ? 'border-slate-700/50'
          : 'border-[#FFC627]/30 bg-[#8C1D40]/95 backdrop-blur-sm'
      }`}
      style={theme === 'dark' ? {
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)'
      } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? '' : 'text-[#FFC627]'}`}>SER222 Grading Notes</h1>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-[#FFC627]/80'} mt-1`}>
            {modules.length} modules · Manage and share grading feedback
          </p>
        </div>
      </div>

      {/* Controls - Search and Mode Toggle */}
      <div className={`sticky top-0 z-40 border-b ${
        theme === 'dark'
          ? 'border-slate-700/50'
          : 'border-[#FFC627]/30 bg-[#8C1D40]/95'
      } backdrop-blur-sm`}
      style={theme === 'dark' ? {
        background: 'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 50%, rgba(2,6,23,0.95) 100%)'
      } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-[#8C1D40]'}`} />
              <Input
                type="text"
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-[#FFC627]/50 text-slate-900 placeholder-[#8C1D40]/50 focus:border-[#FFC627] focus:ring-[#FFC627]/50'}`}
              />
            </div>

            {/* Mode Selector */}
            <div className="flex gap-3 items-center">
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                    : 'bg-[#FFC627] hover:bg-[#FFC627]/90 text-[#8C1D40] border border-[#FFC627] shadow-lg'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <button
                className={styles.button64}
                role="button"
                onClick={() => {
                  setMode('edit');
                  setIsGlobalEditing(false);
                }}
                style={{
                  opacity: mode === 'edit' ? 1 : 0.5,
                  filter: mode === 'edit' ? 'none' : 'grayscale(1)',
                }}
              >
                <span className={styles.button64span}>EDITOR</span>
              </button>
              <button
                onClick={() => {
                  setMode('grader');
                  setIsGlobalEditing(false);
                }}
                style={{
                  background: mode === 'grader' ? 'linear-gradient(144deg,#AF40FF, #5B42F3 50%,#00DDEB)' : '#1e293b',
                  color: '#fff',
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: '16px',
                  minWidth: 110,
                  padding: mode === 'grader' ? '3px' : '10px 20px',
                  border: 'none',
                  marginLeft: 0,
                  boxShadow: mode === 'grader' ? 'rgba(151, 65, 252, 0.2) 0 15px 30px -5px' : 'none',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {mode === 'grader' ? (
                  <span style={{
                    backgroundColor: 'rgb(5, 6, 45)',
                    padding: '10px 20px',
                    borderRadius: 6,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: '300ms',
                  }}>
                    GRADER
                  </span>
                ) : (
                  'GRADER'
                )}
              </button>
            </div>

            {/* Edit Toggle removed - moved to module controls below */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Module Management Controls - Only in Edit Mode */}
        {mode === 'edit' && canManage && (
          <div className="mb-8">
            {!isAddingModule ? (
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setIsAddingModule(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-sm border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-100'
                      : 'bg-[#FFC627] text-[#8C1D40] border-[#FFC627] hover:bg-[#FFC627]/90 shadow-lg'
                  }`}
                  style={{ minHeight: 38, minWidth: 0, fontSize: '1.02rem' }}
                >
                  <span style={{fontSize: '1.2em', fontWeight: 700, marginRight: 2}}>+</span> Add Module
                </button>
                <button
                  onClick={handleGlobalEditToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-sm border transition-colors ${
                    isGlobalEditing
                      ? theme === 'dark' 
                        ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                        : 'bg-green-600 text-white border-green-700 hover:bg-green-700 shadow-lg'
                      : theme === 'dark'
                      ? 'bg-black text-white border-neutral-800 hover:bg-neutral-900'
                      : 'bg-white text-[#8C1D40] border-[#FFC627] hover:bg-[#FFC627]/10 shadow-lg'
                  }`}
                  style={{ minHeight: 38, minWidth: 0, fontSize: '1.02rem' }}
                >
                  {isGlobalEditing ? '✓ Done' : (
                    <>
                      <ChevronsUpDown
                        width={20}
                        height={20}
                        stroke={theme === 'dark' ? '#fff' : '#8C1D40'}
                      />
                      Reorder
                    </>
                  )}
                </button>
                <button
                  onClick={handleToggleSiteLock}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-sm border transition-colors ${
                    isSiteLocked
                      ? theme === 'dark'
                        ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-lg'
                        : 'bg-red-600 text-white border-red-700 hover:bg-red-700 shadow-lg'
                      : theme === 'dark'
                      ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300'
                  }`}
                  style={{ minHeight: 38 }}
                >
                  {isSiteLocked ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Unlock Website
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Lock Website
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className={`p-4 rounded-lg border shadow-lg ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-[#FFC627] shadow-[#FFC627]/20'
              }`}>
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Enter module name..."
                  autoFocus
                  className={`w-full p-2 rounded border ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-400'
                      : 'bg-white border-[#FFC627]/50 text-slate-900 placeholder-slate-500'
                  } focus:outline-none focus:ring-2 ${theme === 'dark' ? 'focus:ring-blue-500' : 'focus:ring-[#FFC627]'} mb-3`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddModule(newModuleTitle);
                    } else if (e.key === 'Escape') {
                      setIsAddingModule(false);
                      setNewModuleTitle('');
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddModule(newModuleTitle)}
                    className={`px-4 py-2 text-white rounded-lg font-semibold shadow-md ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-[#FFC627] text-[#8C1D40] hover:bg-[#FFC627]/90'
                    }`}
                  >
                    Add Module
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingModule(false);
                      setNewModuleTitle('');
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        : 'bg-white hover:bg-[#8C1D40]/10 text-[#8C1D40] border border-[#8C1D40]/30'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {filteredModules.length === 0 && !isFiltering && (
          <div className="text-center py-12">
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-white/80'}>
              No feedback modules yet
            </p>
          </div>
        )}

        {filteredModules.length === 0 && isFiltering && (
          <div className="text-center py-12">
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-white/80'}>
              No modules match your search
            </p>
          </div>
        )}

        {mode === 'edit' && isGlobalEditing && !isFiltering ? (
          <Reorder.Group
            axis="y"
            values={modules}
            onReorder={(updated: FeedbackModule[]) => {
              setModules(applyModuleOrder(updated));
              setModuleOrderDirty(true);
            }}
            className="space-y-6"
          >
            {modules.map((module, index) => (
              <Reorder.Item key={module.id} value={module}>
                <FeedbackSection
                  id={module.id}
                  title={module.title}
                  questions={module.questions}
                  defaultOpen={isFiltering || index === 0}
                  forceOpen={isFiltering}
                  onQuestionsReorder={(_updated: FeedbackQuestion[]) => {
                    // Handle question reordering if needed
                  }}
                  isEditing={true}
                  onStartEditing={handleSectionEditStart}
                  onStopEditing={handleSectionEditStop}
                  editingDisabled={false}
                  canManage={true}
                  isReorderMode={true}
                  onAddQuestion={handleAddQuestion}
                  onUpdateQuestion={handleUpdateQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onAddElement={handleAddElement}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onUpdateModule={handleUpdateModule}
                  onDeleteModule={handleDeleteModule}
                  theme={theme}
                  copiedId={copiedId}
                  setCopiedId={setCopiedId}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : mode === 'edit' ? (
          <div className="space-y-6">
            {filteredModules.map((module, index) => {
            const isSectionEditing = editingModuleId === module.id;
            return (
              <FeedbackSection
                key={module.id}
                id={module.id}
                title={module.title}
                questions={module.questions}
                defaultOpen={isFiltering || index === 0}
                forceOpen={isFiltering}
                onQuestionsReorder={(_updated: FeedbackQuestion[]) => {
                  // Handle question reordering if needed
                }}
                isEditing={isSectionEditing}
                onStartEditing={handleSectionEditStart}
                onStopEditing={handleSectionEditStop}
                editingDisabled={isGlobalEditing || (editingModuleId !== null && !isSectionEditing)}
                canManage={true}
                onAddQuestion={handleAddQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onUpdateModule={handleUpdateModule}
                onDeleteModule={handleDeleteModule}
                theme={theme}
                copiedId={copiedId}
                setCopiedId={setCopiedId}
              />
            );
          })}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredModules.map((module, index) => (
            <FeedbackSection
              key={module.id}
              id={module.id}
              title={module.title}
              questions={module.questions}
              defaultOpen={isFiltering || index === 0}
              forceOpen={isFiltering}
              onQuestionsReorder={undefined}
              isEditing={false}
              onStartEditing={undefined}
              onStopEditing={undefined}
              editingDisabled={true}
              canManage={false}
              onAddQuestion={undefined}
              onUpdateQuestion={undefined}
              onDeleteQuestion={undefined}
              onAddElement={undefined}
              onUpdateElement={undefined}
              onDeleteElement={undefined}
              onUpdateModule={undefined}
              theme={theme}
              copiedId={copiedId}
              setCopiedId={setCopiedId}
            />
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
