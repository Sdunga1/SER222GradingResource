'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2 } from 'lucide-react';

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

export default function EditorMode() {
  const { theme } = useTheme();
  const [modules, setModules] = useState<FeedbackModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [isCreateElementOpen, setIsCreateElementOpen] = useState(false);
  const [isEditElementOpen, setIsEditElementOpen] = useState(false);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteElementId, setDeleteElementId] = useState<string | null>(null);

  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [editingModule, setEditingModule] = useState<FeedbackModule | null>(null);
  const [elementForm, setElementForm] = useState({ content: '' });
  const [editingElement, setEditingElement] = useState<FeedbackElement | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Fetch modules
  const fetchModules = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback');
      const data = await response.json();
      if (data.success) {
        setModules(data.modules);
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

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error('Module title is required');
      return;
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleForm),
      });

      const data = await response.json();
      if (data.success) {
        setModules([...modules, data.module]);
        setModuleForm({ title: '', description: '' });
        setIsCreateModuleOpen(false);
        toast.success('Module created successfully');
      } else {
        toast.error(data.message || 'Failed to create module');
      }
    } catch (error) {
      console.error('Failed to create module:', error);
      toast.error('Failed to create module');
    }
  };

  const handleUpdateModule = async () => {
    if (!editingModule || !moduleForm.title.trim()) {
      toast.error('Module title is required');
      return;
    }

    try {
      const response = await fetch(`/api/feedback/${editingModule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleForm),
      });

      const data = await response.json();
      if (data.success) {
        setModules(modules.map((m) => (m.id === editingModule.id ? data.module : m)));
        setModuleForm({ title: '', description: '' });
        setEditingModule(null);
        setIsEditModuleOpen(false);
        toast.success('Module updated successfully');
      } else {
        toast.error(data.message || 'Failed to update module');
      }
    } catch (error) {
      console.error('Failed to update module:', error);
      toast.error('Failed to update module');
    }
  };

  const handleDeleteModule = async (id: string) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setModules(modules.filter((m) => m.id !== id));
        toast.success('Module deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete module');
      }
    } catch (error) {
      console.error('Failed to delete module:', error);
      toast.error('Failed to delete module');
    }
  };

  const handleCreateElement = async () => {
    if (!selectedModuleId || !elementForm.content.trim()) {
      toast.error('Element content is required');
      return;
    }

    try {
      const response = await fetch(`/api/feedback/${selectedModuleId}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: elementForm.content }),
      });

      const data = await response.json();
      if (data.success) {
        setModules(
          modules.map((m) =>
            m.id === selectedModuleId
              ? { ...m, elements: [...m.elements, data.element] }
              : m
          )
        );
        setElementForm({ content: '' });
        setIsCreateElementOpen(false);
        toast.success('Element created successfully');
      } else {
        toast.error(data.message || 'Failed to create element');
      }
    } catch (error) {
      console.error('Failed to create element:', error);
      toast.error('Failed to create element');
    }
  };

  const handleUpdateElement = async () => {
    if (!editingElement || !elementForm.content.trim()) {
      toast.error('Element content is required');
      return;
    }

    try {
      const response = await fetch(
        `/api/feedback/${editingElement.moduleId}/elements/${editingElement.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: elementForm.content }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setModules(
          modules.map((m) =>
            m.id === editingElement.moduleId
              ? {
                  ...m,
                  elements: m.elements.map((el) =>
                    el.id === editingElement.id ? data.element : el
                  ),
                }
              : m
          )
        );
        setElementForm({ content: '' });
        setEditingElement(null);
        setIsEditElementOpen(false);
        toast.success('Element updated successfully');
      } else {
        toast.error(data.message || 'Failed to update element');
      }
    } catch (error) {
      console.error('Failed to update element:', error);
      toast.error('Failed to update element');
    }
  };

  const handleDeleteElement = async (moduleId: string, elementId: string) => {
    try {
      const response = await fetch(
        `/api/feedback/${moduleId}/elements/${elementId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        setModules(
          modules.map((m) =>
            m.id === moduleId
              ? { ...m, elements: m.elements.filter((el) => el.id !== elementId) }
              : m
          )
        );
        toast.success('Element deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete element');
      }
    } catch (error) {
      console.error('Failed to delete element:', error);
      toast.error('Failed to delete element');
    }
  };

  const handleShuffleModules = () => {
    const shuffled = [...modules].sort(() => Math.random() - 0.5);
    setModules(shuffled);
    toast.success('Modules shuffled');
  };

  const handleShuffleElements = (moduleId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, elements: [...m.elements].sort(() => Math.random() - 0.5) }
          : m
      )
    );
    toast.success('Elements shuffled');
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
            Loading modules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Feedback Modules</h2>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {modules.length} modules created
          </p>
        </div>
        <div className="flex gap-2">
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
          <button
            onClick={() => setIsCreateModuleOpen(true)}
            className="px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            New Module
          </button>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-12">
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
            No modules yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`rounded-lg border p-6 ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  {module.description && (
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {module.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingModule(module);
                      setModuleForm({ title: module.title, description: module.description || '' });
                      setIsEditModuleOpen(true);
                    }}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteModuleId(module.id)}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                        : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {module.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`p-3 rounded-md space-y-2 ${
                      theme === 'dark'
                        ? 'bg-slate-800 border border-slate-700'
                        : 'bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm whitespace-pre-wrap flex-1 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {element.content}
                      </p>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button
                          onClick={() => {
                            setEditingElement(element);
                            setElementForm({ content: element.content });
                            setIsEditElementOpen(true);
                          }}
                          className={`p-1 rounded transition-colors ${
                            theme === 'dark'
                              ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                              : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteElementId(element.id)}
                          className={`p-1 rounded transition-colors ${
                            theme === 'dark'
                              ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                              : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedModuleId(module.id);
                    setElementForm({ content: '' });
                    setIsCreateElementOpen(true);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add Element
                </button>
                {module.elements.length > 1 && (
                  <button
                    onClick={() => handleShuffleElements(module.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    🔀 Shuffle
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs and Alerts */}
      <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Module Title</label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="e.g., Prerequisites"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Add a description..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsCreateModuleOpen(false)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateModule}
                className="px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700"
              >
                Create
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModuleOpen} onOpenChange={setIsEditModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Module Title</label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditModuleOpen(false)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateModule}
                className="px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700"
              >
                Update
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateElementOpen} onOpenChange={setIsCreateElementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback Element</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Comment Content</label>
              <Textarea
                value={elementForm.content}
                onChange={(e) => setElementForm({ content: e.target.value })}
                placeholder="Enter your feedback comment..."
                rows={6}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsCreateElementOpen(false)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateElement}
                className="px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700"
              >
                Add
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditElementOpen} onOpenChange={setIsEditElementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feedback Element</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Comment Content</label>
              <Textarea
                value={elementForm.content}
                onChange={(e) => setElementForm({ content: e.target.value })}
                rows={6}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditElementOpen(false)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateElement}
                className="px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700"
              >
                Update
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteModuleId !== null} onOpenChange={() => setDeleteModuleId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Module</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this module? All feedback elements within it will be deleted as well.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteModuleId) {
                  handleDeleteModule(deleteModuleId);
                  setDeleteModuleId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteElementId !== null} onOpenChange={() => setDeleteElementId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Element</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this feedback element?
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const element = modules
                  .flatMap((m) => m.elements)
                  .find((e) => e.id === deleteElementId);
                if (deleteElementId && element) {
                  handleDeleteElement(element.moduleId, deleteElementId);
                  setDeleteElementId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
