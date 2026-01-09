'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Plus,
  Check,
  GripVertical,
  Copy,
  Trash2,
  Edit2,
} from 'lucide-react';
import { ChevronsUpDown } from './icons/ChevronsUpDown';
import { Reorder } from 'framer-motion';
import { toast } from 'sonner';
import type { FeedbackElement } from '@/types/feedback';

type FeedbackQuestionProps = {
  id: string;
  moduleId: string;
  title: string;
  elements: FeedbackElement[];
  defaultOpen?: boolean;
  forceOpen?: boolean;
  alternatingBgIndex?: number;
  onElementsReorder?: (updatedElements: FeedbackElement[]) => void;
  isEditing?: boolean;
  onStartEditing?: (questionId: string) => void;
  onStopEditing?: (questionId: string) => void;
  editingDisabled?: boolean;
  canManage?: boolean;
  onAddElement?: (questionId: string, content: string) => Promise<void>;
  onUpdateElement?: (questionId: string, elementId: string, content: string) => Promise<void>;
  onDeleteElement?: (questionId: string, elementId: string) => Promise<void>;
  onUpdateQuestion?: (questionId: string, newTitle: string) => void;
  onDeleteQuestion?: (questionId: string) => Promise<void>;
  theme: string;
  copiedId?: string | null;
  setCopiedId?: (id: string | null) => void;
} & Omit<React.ComponentProps<'div'>, 'children'>;

export function FeedbackQuestion({
  id: questionId,
  moduleId,
  title,
  elements,
  defaultOpen = false,
  forceOpen = false,
  alternatingBgIndex = 0,
  onElementsReorder,
  isEditing = false,
  onStartEditing,
  onStopEditing,
  editingDisabled = false,
  canManage = false,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onUpdateQuestion,
  onDeleteQuestion,
  theme,
  copiedId: propCopiedId,
  setCopiedId: propSetCopiedId,
  ...props
}: FeedbackQuestionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return defaultOpen;
    const stored = localStorage.getItem(`question-open-${questionId}`);
    return stored !== null ? stored === 'true' : defaultOpen;
  });
  const [localElements, setLocalElements] = useState(elements);
  
  // Use prop if provided, otherwise fall back to local state for backward compatibility
  const [localCopiedId, setLocalCopiedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lastCopiedElementId');
  });
  const copiedId = propCopiedId !== undefined ? propCopiedId : localCopiedId;
  const setCopiedId = propSetCopiedId || setLocalCopiedId;
  const [wasCopiedAgain, setWasCopiedAgain] = useState(false);
  const [activeForm, setActiveForm] = useState<{
    mode: 'create' | 'edit';
    element?: FeedbackElement;
  } | null>(null);
  const [formContent, setFormContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [questionTitle, setQuestionTitle] = useState(title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);

  useEffect(() => {
    setLocalElements(elements);
  }, [elements]);

  useEffect(() => {
    if (!isEditing) {
      setActiveForm(null);
    }
  }, [isEditing]);

  useEffect(() => {
    setQuestionTitle(title);
  }, [title]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`question-open-${questionId}`, String(isOpen));
    }
  }, [isOpen, questionId]);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleReorder = (reorderedElements: FeedbackElement[]) => {
    setLocalElements(reorderedElements);
    onElementsReorder?.(reorderedElements);
  };

  const handleToggleReorder = () => {
    setIsReorderMode(!isReorderMode);
  };

  const handleCopy = (content: string, elementId: string) => {
    navigator.clipboard.writeText(content);
    
    if (copiedId === elementId) {
      setWasCopiedAgain(true);
      setTimeout(() => setWasCopiedAgain(false), 2000);
    } else {
      setCopiedId(elementId);
      setWasCopiedAgain(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastCopiedElementId', elementId);
      }
    }
  };

  const handleAddElement = async () => {
    if (!formContent.trim() || !onAddElement) return;
    setIsSubmitting(true);
    try {
      await onAddElement(questionId, formContent.trim());
      setActiveForm(null);
      setFormContent('');
      toast.success('Comment added!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateElement = async () => {
    if (!formContent.trim() || !activeForm?.element || !onUpdateElement) return;
    setIsSubmitting(true);
    try {
      await onUpdateElement(questionId, activeForm.element.id, formContent.trim());
      setActiveForm(null);
      setFormContent('');
      toast.success('Comment updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    if (!onDeleteElement) return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setIsSubmitting(true);
    try {
      await onDeleteElement(questionId, elementId);
      toast.success('Comment deleted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveQuestionTitle = async () => {
    if (!questionTitle.trim()) {
      toast.error('Question name cannot be empty');
      return;
    }
    setIsSavingTitle(true);
    try {
      const response = await fetch(`/api/feedback/${moduleId}/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: questionTitle.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update question');
      }

      setIsEditingTitle(false);
      onUpdateQuestion?.(questionId, questionTitle.trim());
      toast.success('Question name updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update question name');
      setQuestionTitle(title);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCancelQuestionEdit = () => {
    setQuestionTitle(title);
    setIsEditingTitle(false);
  };

  const handleQuestionTitleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveQuestionTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelQuestionEdit();
    }
  };

  const baseActionButtonClasses = 'p-2 rounded-lg transition-colors';
  const addButtonClasses = `${baseActionButtonClasses} ${
    theme === 'dark'
      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20'
      : 'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100'
  }`;

  const editingBanner =
    isEditing &&
    'border border-blue-500/50 bg-blue-500/5 shadow-inner shadow-blue-500/10';

  return (
    <div
      className={`rounded-lg border overflow-hidden mb-2 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-blue-700/30'
          : 'bg-gradient-to-br from-white to-slate-50 border-blue-300'
      } ${isEditing ? 'ring-1 ring-blue-500/40' : ''}`}
      {...props}
    >
      {/* Question Header */}
      {isEditingTitle ? (
        <div
          className={`w-full px-4 py-3 flex items-center gap-3 transition-colors border-l-4 ${
            theme === 'dark'
              ? 'hover:bg-slate-700/50 border-[#8C1D40] bg-slate-800/40'
              : 'hover:bg-amber-50/50 border-[#8C1D40] bg-amber-50/30'
          } ${editingBanner ?? ''}`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
            } opacity-50`}
          />
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={questionTitle}
              onChange={e => setQuestionTitle(e.target.value)}
              onKeyDown={handleQuestionTitleKeyDown}
              placeholder="Enter question..."
              autoFocus
              disabled={isSavingTitle}
              className={`flex-1 h-8 px-3 rounded ${
                theme === 'dark'
                  ? 'bg-slate-700 border-slate-600 text-slate-100'
                  : 'bg-white border-slate-300 text-slate-900'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
              type="button"
              onClick={handleSaveQuestionTitle}
              disabled={isSavingTitle || !questionTitle.trim()}
              className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-700 disabled:text-slate-500'
                  : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-slate-300 disabled:text-slate-500'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelQuestionEdit}
              disabled={isSavingTitle}
              className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                theme === 'dark'
                  ? 'bg-slate-600 hover:bg-slate-500 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
              }`}
            >
              ✕
            </button>
          </div>
          <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
            {localElements.length} Comments
          </span>
        </div>
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer border-l-4 ${
            theme === 'dark'
              ? 'hover:bg-slate-700/70 border-[#8C1D40] bg-slate-800/30'
              : 'hover:bg-amber-100/50 border-[#8C1D40] bg-amber-50/30'
          } ${editingBanner ?? ''}`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
            } ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          />
          <div className="flex items-center gap-2 flex-1">
            <h4
              className={`text-sm font-semibold ${
                theme === 'dark' ? 'text-[#FFC627]' : 'text-[#8C1D40]'
              }`}
            >
              {questionTitle}
            </h4>
            {canManage && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
                className={`p-1 rounded transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-slate-600 text-slate-400 hover:text-slate-200'
                    : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
            {localElements.length} Comments
          </span>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {canManage && (
              <>
                <button
                  type="button"
                  className={`p-1.5 rounded transition-colors ${addButtonClasses}`}
                  aria-label={`Add comment to ${questionTitle}`}
                  onClick={e => {
                    e.stopPropagation();
                    if (!isOpen) {
                      setIsOpen(true);
                    }
                    setActiveForm({ mode: 'create' });
                    setFormContent('');
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={`p-1.5 rounded transition-colors ${
                    isReorderMode
                      ? theme === 'dark'
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-emerald-100 border border-emerald-300 text-emerald-700'
                      : theme === 'dark'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100'
                  }`}
                  aria-label="Reorder comments"
                  onClick={e => {
                    e.stopPropagation();
                    if (!isOpen) {
                      setIsOpen(true);
                    }
                    handleToggleReorder();
                  }}
                >
                  {isReorderMode ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronsUpDown width={14} height={14} stroke={theme === 'dark' ? '#fbbf24' : '#d97706'} />
                  )}
                </button>
                <button
                  type="button"
                  className={`p-1.5 rounded transition-colors ${
                    theme === 'dark'
                      ? 'text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                      : 'text-red-600 bg-red-50 border border-red-200 hover:bg-red-100'
                  }`}
                  aria-label={`Delete ${questionTitle}`}
                  onClick={async e => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        `Are you sure you want to delete the question "${questionTitle}"? This will also delete all comments in this question.`
                      )
                    ) {
                      await onDeleteQuestion?.(questionId);
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Elements List */}
      {isOpen && (
        <div
          className={`border-t ${
            theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          }`}
        >
          {/* Edit Form */}
          {activeForm && canManage && (
            <div
              className={`p-3 mx-3 mt-3 rounded border ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder="Enter feedback comment..."
                disabled={isSubmitting}
                className={`w-full p-2 rounded border text-sm ${
                  theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={
                    activeForm.mode === 'create'
                      ? handleAddElement
                      : handleUpdateElement
                  }
                  disabled={isSubmitting || !formContent.trim()}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : activeForm.mode === 'create'
                    ? 'Add'
                    : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveForm(null);
                    setFormContent('');
                  }}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-sm bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Elements */}
          {localElements.length === 0 ? (
            <div
              className={`px-4 py-6 text-center ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <p className="text-xs italic">No comments in this question</p>
            </div>
          ) : isReorderMode ? (
            <div className="p-2">
              <Reorder.Group
                axis="y"
                values={localElements}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {localElements.map((element, idx) => (
                  <Reorder.Item
                    key={element.id}
                    value={element}
                    className="focus-visible:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                      <div className="flex-1">
                        <FeedbackElementRow
                          element={element}
                          theme={theme}
                          index={idx}
                          onCopy={handleCopy}
                          copiedId={copiedId}
                          wasCopiedAgain={wasCopiedAgain}
                          canManage={canManage}
                          onEdit={
                            canManage
                              ? () => {
                                  setActiveForm({ mode: 'edit', element });
                                  setFormContent(element.content);
                                }
                              : undefined
                          }
                          onDelete={
                            canManage ? () => handleDeleteElement(element.id) : undefined
                          }
                          isSubmitting={isSubmitting}
                        />
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {localElements.map((element, idx) => (
                <FeedbackElementRow
                  key={element.id}
                  element={element}
                  theme={theme}
                  index={idx}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                  wasCopiedAgain={wasCopiedAgain}
                  canManage={canManage}
                  onEdit={
                    canManage
                      ? () => {
                          setActiveForm({ mode: 'edit', element });
                          setFormContent(element.content);
                        }
                      : undefined
                  }
                  onDelete={
                    canManage ? () => handleDeleteElement(element.id) : undefined
                  }
                  isSubmitting={isSubmitting}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FeedbackElementRowProps {
  element: FeedbackElement;
  theme: string;
  index: number;
  onCopy: (content: string, elementId: string) => void;
  copiedId: string | null;
  wasCopiedAgain: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  canManage?: boolean;
}

function FeedbackElementRow({
  element,
  theme,
  index,
  onCopy,
  copiedId,
  wasCopiedAgain,
  onEdit,
  onDelete,
  isSubmitting,
  canManage,
}: FeedbackElementRowProps) {
  const handleRowClick = () => {
    if (!canManage) {
      onCopy(element.content, element.id);
    }
  };

  const isEven = index % 2 === 0;

  return (
    <div
      className={`group transition-colors relative rounded border border-l-4 ${
        !canManage && copiedId === element.id
          ? 'border-green-500 bg-green-500/10'
          : theme === 'dark'
          ? isEven
            ? 'border-slate-600 border-l-slate-500 bg-slate-700/40'
            : 'border-slate-700 border-l-slate-600 bg-slate-800/50'
          : isEven
          ? 'border-amber-200/30 border-l-slate-300 bg-white'
          : 'border-amber-200/50 border-l-slate-400 bg-amber-50/60'
      } ${!canManage ? 'cursor-pointer' : ''} p-2`}
      onClick={!canManage ? handleRowClick : undefined}
    >
      <div className="flex items-start gap-2">
        <p
          className={`flex-1 text-sm whitespace-pre-wrap ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {element.content}
        </p>

        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="flex items-center gap-1">
            {copiedId === element.id && (
              <span
                className={`${
                  wasCopiedAgain ? 'bg-blue-600' : 'bg-green-600'
                } text-white px-2 py-0.5 rounded text-xs font-semibold shadow-lg whitespace-nowrap`}
              >
                <span className="inline-block animate-pulse">
                  {wasCopiedAgain ? 'Already Copied!' : 'Copied!'}
                </span>
              </span>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                onCopy(element.content, element.id);
              }}
              className={`p-1.5 rounded transition-colors ${
                copiedId === element.id
                  ? 'bg-green-600 text-white'
                  : theme === 'dark'
                  ? `bg-slate-700 text-slate-300 hover:bg-slate-600 ${
                      canManage ? 'opacity-0 group-hover:opacity-100' : ''
                    }`
                  : `bg-slate-200 text-slate-700 hover:bg-slate-300 ${
                      canManage ? 'opacity-0 group-hover:opacity-100' : ''
                    }`
              }`}
              aria-label="Copy comment"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          {canManage && onEdit && (
            <>
              <button
                onClick={onEdit}
                disabled={isSubmitting}
                className={`p-1.5 rounded transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-slate-700 text-slate-400'
                    : 'hover:bg-slate-200 text-slate-600'
                }`}
                aria-label="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                disabled={isSubmitting}
                className={`p-1.5 rounded transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-red-900/30 text-red-400'
                    : 'hover:bg-red-100 text-red-600'
                }`}
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
