'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  Plus,
  Check,
  GripVertical,
  Trash2,
  Edit2,
} from 'lucide-react';
import { ChevronsUpDown } from './icons/ChevronsUpDown';
import { Reorder } from 'framer-motion';
import { toast } from 'sonner';
import { FeedbackQuestion } from './FeedbackQuestion';
import type { FeedbackQuestion as FeedbackQuestionType } from '@/types/feedback';

type FeedbackSectionProps = {
  id: string;
  title: string;
  questions: FeedbackQuestionType[];
  defaultOpen?: boolean;
  forceOpen?: boolean;
  onQuestionsReorder?: (updatedQuestions: FeedbackQuestionType[]) => void;
  isEditing?: boolean;
  onStartEditing?: (sectionId: string) => void;
  onStopEditing?: (sectionId: string) => void;
  editingDisabled?: boolean;
  canManage?: boolean;
  isReorderMode?: boolean;
  onAddQuestion?: (moduleId: string, title: string) => Promise<void>;
  onUpdateQuestion?: (moduleId: string, questionId: string, title: string) => Promise<void>;
  onDeleteQuestion?: (moduleId: string, questionId: string) => Promise<void>;
  onAddElement?: (moduleId: string, questionId: string, content: string) => Promise<void>;
  onUpdateElement?: (moduleId: string, questionId: string, elementId: string, content: string) => Promise<void>;
  onDeleteElement?: (moduleId: string, questionId: string, elementId: string) => Promise<void>;
  onUpdateModule?: (moduleId: string, newTitle: string) => void;
  onDeleteModule?: (moduleId: string) => Promise<void>;
  theme: string;
  copiedId?: string | null;
  setCopiedId?: (id: string | null) => void;
} & Omit<React.ComponentProps<'div'>, 'children'>;

export function FeedbackSection({
  id: sectionId,
  title,
  questions,
  defaultOpen = false,
  forceOpen = false,
  onQuestionsReorder,
  isEditing = false,
  onStartEditing,
  onStopEditing,
  editingDisabled = false,
  canManage = false,
  isReorderMode = false,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onUpdateModule,
  onDeleteModule,
  theme,
  copiedId,
  setCopiedId,
  ...props
}: FeedbackSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [localQuestions, setLocalQuestions] = useState(questions);
  const [activeForm, setActiveForm] = useState<{
    mode: 'create';
  } | null>(null);
  const [formContent, setFormContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [moduleTitle, setModuleTitle] = useState(title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isQuestionReorderMode, setIsQuestionReorderMode] = useState(false);

  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  useEffect(() => {
    if (!isEditing) {
      setActiveForm(null);
    }
  }, [isEditing]);

  useEffect(() => {
    setModuleTitle(title);
  }, [title]);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  const baseActionButtonClasses =
    'inline-flex items-center justify-center rounded-2xl p-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const addButtonClasses =
    theme === 'dark'
      ? `${baseActionButtonClasses} text-white border border-purple-500/40 bg-gradient-to-br from-purple-500/20 to-violet-600/20 hover:from-purple-500/30 hover:to-violet-600/30 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30`
      : `${baseActionButtonClasses} text-white border border-purple-500/40 bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40`;

  const effectiveEditing = canManage && isEditing;

  const handleAddQuestion = async () => {
    if (!formContent.trim()) {
      toast.error('Question title cannot be empty');
      return;
    }
    if (!onAddQuestion) {
      toast.error('Unable to add question');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddQuestion(sectionId, formContent.trim());
      setFormContent('');
      setActiveForm(null);
      onStopEditing?.(sectionId);
      toast.success('Question added!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveModuleTitle = async () => {
    if (!moduleTitle.trim()) {
      toast.error('Module name cannot be empty');
      return;
    }
    setIsSavingTitle(true);
    try {
      const response = await fetch(`/api/feedback/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduleTitle.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update module');
      }

      setIsEditingTitle(false);
      onUpdateModule?.(sectionId, moduleTitle.trim());
      toast.success('Module name updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update module name');
      setModuleTitle(title); // Revert on error
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCancelModuleEdit = () => {
    setModuleTitle(title);
    setIsEditingTitle(false);
  };

  const handleModuleTitleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveModuleTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelModuleEdit();
    }
  };

  const editingBanner =
    isEditing &&
    'border border-purple-500/50 bg-purple-500/5 shadow-inner shadow-purple-500/10';

  return (
    <div
      id={sectionId}
      className={`rounded-2xl border overflow-hidden ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-[#050505] to-[#1f0139] border-purple-900/30'
          : 'bg-gradient-to-br from-slate-50 to-slate-100 border-purple-200'
      } ${isEditing ? 'ring-2 ring-purple-500/60' : ''}`}
      {...props}
    >
      {/* Section Header */}
      {isEditingTitle ? (
        <div
          className={`w-full px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between transition-colors ${
            theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100/50'
          } ${editingBanner ?? ''}`}
        >
          <div className="flex items-center gap-4 flex-1">
            {isReorderMode && (
              <GripVertical
                className={`w-5 h-5 flex-shrink-0 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                } cursor-grab active:cursor-grabbing`}
              />
            )}
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              } opacity-50`}
            />
            <div className="text-left flex-1">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={e => setModuleTitle(e.target.value)}
                  onKeyDown={handleModuleTitleKeyDown}
                  placeholder="Enter module name..."
                  autoFocus
                  disabled={isSavingTitle}
                  className={`h-9 px-3 rounded ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-white border-[#8C1D40]/30 text-slate-900'
                  } border focus:outline-none focus:ring-2 ${theme === 'dark' ? 'focus:ring-purple-500' : 'focus:ring-[#FFC627]'}`}
                />
                <button
                  type="button"
                  onClick={handleSaveModuleTitle}
                  disabled={isSavingTitle || !moduleTitle.trim()}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    theme === 'dark'
                      ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-700 disabled:text-slate-500'
                      : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-slate-300 disabled:text-slate-500'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelModuleEdit}
                  disabled={isSavingTitle}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    theme === 'dark'
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                  }`}
                >
                  ✕
                </button>
              </div>
              <p className={theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}>
                {localQuestions.length} Questions
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          role="button"
          tabIndex={0}
          className={`w-full px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between transition-colors cursor-pointer ${
            theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100/50'
          } ${editingBanner ?? ''}`}
        >
          <div className="flex items-center gap-4 flex-1">
            {isReorderMode && (
              <GripVertical
                className={`w-5 h-5 flex-shrink-0 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                } cursor-grab active:cursor-grabbing`}
              />
            )}
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              } ${isOpen ? 'rotate-0' : '-rotate-90'}`}
            />
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className={
                    theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                  }
                >
                  {moduleTitle}
                </h3>
                {canManage && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                    className={`p-1 rounded transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                        : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className={theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}>
                {localQuestions.length} Questions
              </p>
              {effectiveEditing && (
                <p className="mt-1 text-xs font-semibold text-purple-300">
                  Managing module
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {canManage && (
              <>
                <button
                  type="button"
                  className={addButtonClasses}
                  aria-label={`Add question to ${moduleTitle}`}
                  disabled={editingDisabled && !effectiveEditing}
                  onClick={e => {
                    e.stopPropagation();
                    if (editingDisabled && !effectiveEditing) return;
                    if (!effectiveEditing) {
                      onStartEditing?.(sectionId);
                    }
                    setActiveForm({ mode: 'create' });
                    setFormContent('');
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="sr-only">Add question</span>
                </button>
                <button
                  type="button"
                  className={`${baseActionButtonClasses} ${
                    isQuestionReorderMode
                      ? theme === 'dark'
                        ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40'
                        : 'text-emerald-700 bg-emerald-100 border border-emerald-300'
                      : theme === 'dark'
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
                      : 'text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100'
                  }`}
                  aria-label="Reorder questions"
                  onClick={e => {
                    e.stopPropagation();
                    if (!isOpen) {
                      setIsOpen(true);
                    }
                    setIsQuestionReorderMode(!isQuestionReorderMode);
                  }}
                >
                  {isQuestionReorderMode ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ChevronsUpDown width={16} height={16} stroke="#fbbf24" />
                  )}
                  <span className="sr-only">Reorder questions</span>
                </button>
                <button
                  type="button"
                  className={`${baseActionButtonClasses} ${theme === 'dark' ? 'text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20' : 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100'}`}
                  aria-label={`Delete ${moduleTitle}`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete the module "${moduleTitle}"? This will also delete all questions and comments in this module.`)) {
                      await onDeleteModule?.(sectionId);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sr-only">Delete module</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Questions List */}
      {isOpen && (
        <div
          className={`border-t ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          {/* Add Question Form */}
          {activeForm && canManage && (
            <div
              className={`p-4 mx-4 mt-4 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <input
                type="text"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Enter question title..."
                disabled={isSubmitting}
                className={`w-full p-3 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
                    : 'bg-white border-[#FFC627]/50 text-slate-900 placeholder-[#8C1D40]/50'
                } focus:outline-none focus:ring-2 ${theme === 'dark' ? 'focus:ring-purple-500' : 'focus:ring-[#FFC627]'}`}
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  disabled={isSubmitting || !formContent.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Add Question'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveForm(null);
                    setFormContent('');
                    onStopEditing?.(sectionId);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="p-4 space-y-2">
            {localQuestions.length === 0 ? (
              <div className={`px-6 py-8 text-center ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <p className="text-sm italic">No questions in this module</p>
              </div>
            ) : isQuestionReorderMode ? (
              <Reorder.Group
                axis="y"
                values={localQuestions}
                onReorder={questions => {
                  setLocalQuestions(questions);
                  onQuestionsReorder?.(questions);
                }}
                className="space-y-2"
              >
                {localQuestions.map((question, index) => (
                  <Reorder.Item
                    key={question.id}
                    value={question}
                    className="focus-visible:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                      <div className="flex-1">
                        <FeedbackQuestion
                          id={question.id}
                          moduleId={sectionId}
                          title={question.title}
                          elements={question.elements}
                          forceOpen={forceOpen}
                          alternatingBgIndex={index}
                          canManage={canManage}
                          theme={theme}
                          copiedId={copiedId}
                          setCopiedId={setCopiedId}
                          onAddElement={async (questionId, content) => {
                            if (onAddElement) {
                              await onAddElement(sectionId, questionId, content);
                            }
                          }}
                          onUpdateElement={async (questionId, elementId, content) => {
                            if (onUpdateElement) {
                              await onUpdateElement(sectionId, questionId, elementId, content);
                            }
                          }}
                          onDeleteElement={async (questionId, elementId) => {
                            if (onDeleteElement) {
                              await onDeleteElement(sectionId, questionId, elementId);
                            }
                          }}
                          onUpdateQuestion={(questionId, newTitle) => {
                            if (onUpdateQuestion) {
                              onUpdateQuestion(sectionId, questionId, newTitle);
                            }
                          }}
                          onDeleteQuestion={async (questionId) => {
                            if (onDeleteQuestion) {
                              await onDeleteQuestion(sectionId, questionId);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              localQuestions.map((question, index) => (
                <FeedbackQuestion
                  key={question.id}
                  id={question.id}
                  moduleId={sectionId}
                  title={question.title}
                  elements={question.elements}
                  forceOpen={forceOpen}
                  alternatingBgIndex={index}
                  canManage={canManage}
                  theme={theme}
                  copiedId={copiedId}
                  setCopiedId={setCopiedId}
                  onAddElement={async (questionId, content) => {
                    if (onAddElement) {
                      await onAddElement(sectionId, questionId, content);
                    }
                  }}
                  onUpdateElement={async (questionId, elementId, content) => {
                    if (onUpdateElement) {
                      await onUpdateElement(sectionId, questionId, elementId, content);
                    }
                  }}
                  onDeleteElement={async (questionId, elementId) => {
                    if (onDeleteElement) {
                      await onDeleteElement(sectionId, questionId, elementId);
                    }
                  }}
                  onUpdateQuestion={(questionId, newTitle) => {
                    if (onUpdateQuestion) {
                      onUpdateQuestion(sectionId, questionId, newTitle);
                    }
                  }}
                  onDeleteQuestion={async (questionId) => {
                    if (onDeleteQuestion) {
                      await onDeleteQuestion(sectionId, questionId);
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
