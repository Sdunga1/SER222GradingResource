"use client";

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import EditorMode from '@/components/EditorMode';
import GraderMode from '@/components/GraderMode';

export default function Home() {
  const [mode, setMode] = useState<'editor' | 'grader'>('grader');
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark'
        ? 'bg-slate-950 text-slate-50'
        : 'bg-white text-slate-900'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 border-b ${
        theme === 'dark'
          ? 'border-slate-800/40 bg-slate-950/80'
          : 'border-slate-200 bg-white/80'
      } backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">SER222 Grading Comments</h1>
              <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                Manage feedback comments and modules
              </p>
            </div>

            {/* Mode Toggle Buttons */}
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setMode('editor')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  mode === 'editor'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : theme === 'dark'
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                ✎ Editor Mode
              </button>
              <button
                onClick={() => setMode('grader')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  mode === 'grader'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : theme === 'dark'
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                👁 Grader Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === 'editor' ? <EditorMode /> : <GraderMode />}
      </div>
    </div>
  );
}
