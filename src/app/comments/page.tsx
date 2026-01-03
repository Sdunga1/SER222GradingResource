'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { FeedbackSection } from '@/components/FeedbackSection';
import { ChevronsUpDown } from '@/components/icons/ChevronsUpDown';
import { Reorder } from 'framer-motion';
import styles from './button64.module.css';
import type {
  FeedbackModule,
  FeedbackElement,
} from '@/types/feedback';

export const dynamic = 'force-dynamic';

const sortElements = (elements: FeedbackElement[] = []) =>
  [...elements].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

const normalizeModules = (modules: FeedbackModule[] = []): FeedbackModule[] =>
  [...modules]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(module => ({
      ...module,
      elements: sortElements(module.elements ?? []),
    }));

const applyElementOrder = (elements: FeedbackElement[]) =>
  elements.map((element, index) => ({ ...element, position: index + 1 }));

const applyModuleOrder = (modules: FeedbackModule[]) =>
  modules.map((module, index) => ({
    ...module,
    position: index + 1,
    elements: sortElements(module.elements),
  }));

export default function Comments() {
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
  const { theme } = useTheme();
  const canManage = true;

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('commentsPageMode', mode);
  }, [mode]);

  // Fetch modules
  useEffect(() => {
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
  }, []);

  const isFiltering = searchQuery.trim().length > 0;

  // Filter modules and elements based on search
  const filteredModules = searchQuery
    ? modules
        .map(module => ({
          ...module,
          elements: module.elements.filter((element: FeedbackElement) =>
            element.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            module.title.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter(module => module.elements.length > 0 || module.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : modules;

  const updateModuleElements = useCallback(
    (moduleId: string, updater: (elements: FeedbackElement[]) => FeedbackElement[]) => {
      setModules(prev =>
        prev.map(module =>
          module.id === moduleId
            ? { ...module, elements: updater(module.elements) }
            : module
        )
      );
    },
    []
  );

  const handleElementsReorder = useCallback(
    (moduleId: string, updated: FeedbackElement[]) => {
      updateModuleElements(moduleId, () =>
        applyElementOrder(updated)
      );
      setModuleOrderDirty(true);
    },
    [updateModuleElements]
  );

  const persistElementOrder = useCallback(
    async (moduleId: string) => {
      if (!canManage) return;
      const module = modules.find(m => m.id === moduleId);
      if (!module || module.elements.length === 0) return;
      try {
        await fetch('/api/feedback/elements/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: moduleId,
            orderedIds: module.elements.map((element: FeedbackElement) => element.id),
          }),
        });
      } catch (error) {
        console.error('Failed to persist element order', error);
      }
    },
    [canManage, modules]
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

  const handleAddElement = useCallback(
    async (moduleId: string, content: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      const response = await fetch(`/api/feedback/${moduleId}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to add element');
      }
      updateModuleElements(moduleId, elements =>
        sortElements([...elements, data.element as FeedbackElement])
      );
    },
    [canManage, updateModuleElements]
  );

  const handleUpdateElement = useCallback(
    async (moduleId: string, elementId: string, content: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      const response = await fetch(`/api/feedback/${moduleId}/elements/${elementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to update element');
      }
      updateModuleElements(moduleId, elements =>
        sortElements(
          elements.map(element =>
            element.id === elementId
              ? (data.element as FeedbackElement)
              : element
          )
        )
      );
    },
    [canManage, updateModuleElements]
  );

  const handleDeleteElement = useCallback(
    async (moduleId: string, elementId: string) => {
      if (!canManage) {
        throw new Error('Not authorized');
      }
      const response = await fetch(`/api/feedback/${moduleId}/elements/${elementId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to delete element');
      }
      updateModuleElements(moduleId, elements =>
        elements.filter(element => element.id !== elementId)
      );
    },
    [canManage, updateModuleElements]
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

  const handleSectionEditStart = useCallback((moduleId: string) => {
    setEditingModuleId(moduleId);
  }, []);

  const handleSectionEditStop = useCallback(
    async (moduleId: string) => {
      setEditingModuleId(null);
      await persistElementOrder(moduleId);
    },
    [persistElementOrder]
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
        theme === 'dark' ? 'bg-slate-950' : 'bg-white'
      }`}>
        <div className="text-center">
          <p className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-4`}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
          ? 'border-slate-800/40 bg-slate-950'
          : 'border-slate-200 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">SER222 Grading Notes</h1>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
            {modules.length} modules · Manage and share grading feedback
          </p>
        </div>
      </div>

      {/* Controls - Search and Mode Toggle */}
      <div className={`sticky top-0 z-40 border-b ${
        theme === 'dark'
          ? 'border-slate-800/40 bg-slate-950/80'
          : 'border-slate-200 bg-white/80'
      } backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`}
              />
            </div>

            {/* Mode Selector */}
            <div className="flex gap-3 items-center">
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
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddingModule(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-900 font-semibold shadow-sm border border-neutral-200 hover:bg-neutral-100 transition-colors"
                  style={{ minHeight: 38, minWidth: 0, fontSize: '1.02rem' }}
                >
                  <span style={{fontSize: '1.2em', fontWeight: 700, marginRight: 2}}>+</span> Add Module
                </button>
                <button
                  onClick={handleGlobalEditToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-sm border transition-colors ${
                    isGlobalEditing
                      ? 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                      : 'bg-black text-white border-neutral-800 hover:bg-neutral-900'
                  }`}
                  style={{ minHeight: 38, minWidth: 0, fontSize: '1.02rem' }}
                >
                  {isGlobalEditing ? '✓ Done' : (
                    <>
                      <ChevronsUpDown
                        width={20}
                        height={20}
                        stroke={'#fff'}
                      />
                      Reorder
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className={`p-4 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
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
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3`}
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
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
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
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
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
              No feedback modules yet
            </p>
          </div>
        )}

        {filteredModules.length === 0 && isFiltering && (
          <div className="text-center py-12">
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
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
                  elements={module.elements}
                  defaultOpen={index === 0}
                  onElementsReorder={(updated: FeedbackElement[]) =>
                    handleElementsReorder(module.id, updated)
                  }
                  isEditing={true}
                  onStartEditing={handleSectionEditStart}
                  onStopEditing={handleSectionEditStop}
                  editingDisabled={false}
                  canManage={true}
                  isReorderMode={true}
                  onAddElement={handleAddElement}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onUpdateModule={handleUpdateModule}
                  onDeleteModule={handleDeleteModule}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : mode === 'edit' ? (
          filteredModules.map((module, index) => {
            const isSectionEditing = editingModuleId === module.id;
            return (
              <FeedbackSection
                key={module.id}
                id={module.id}
                title={module.title}
                elements={module.elements}
                defaultOpen={index === 0}
                onElementsReorder={(updated: FeedbackElement[]) =>
                  handleElementsReorder(module.id, updated)
                }
                isEditing={isSectionEditing}
                onStartEditing={handleSectionEditStart}
                onStopEditing={handleSectionEditStop}
                editingDisabled={isGlobalEditing || (editingModuleId !== null && !isSectionEditing)}
                canManage={true}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onUpdateModule={handleUpdateModule}
                onDeleteModule={handleDeleteModule}
              />
            );
          })
        ) : (
          filteredModules.map((module, index) => (
            <FeedbackSection
              key={module.id}
              id={module.id}
              title={module.title}
              elements={module.elements}
              defaultOpen={index === 0}
              onElementsReorder={undefined}
              isEditing={false}
              onStartEditing={undefined}
              onStopEditing={undefined}
              editingDisabled={true}
              canManage={false}
              onAddElement={undefined}
              onUpdateElement={undefined}
              onDeleteElement={undefined}
              onUpdateModule={undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
