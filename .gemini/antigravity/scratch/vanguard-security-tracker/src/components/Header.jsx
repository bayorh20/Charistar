import React from 'react';
import { Download, Globe, Smartphone, RefreshCw, Zap, Sparkles, Undo2, Redo2 } from 'lucide-react';

export default function Header({ 
  isMobile, 
  setIsMobile, 
  onReset, 
  onDownload, 
  onDeploy,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showCodePanel,
  setShowCodePanel
}) {
  return (
    <header className="h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-30 select-none">
      
      {/* Brand Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Lumina Studio
          </span>
          <span className="text-[9px] font-mono text-purple-400 block tracking-wider uppercase -mt-0.5 font-bold">
            Easy AI Builder
          </span>
        </div>
      </div>

      {/* Center Toggles: Web App vs Mobile App */}
      <div className="flex items-center bg-slate-900/60 p-1 rounded-full border border-white/5">
        <button
          onClick={() => setIsMobile(false)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            !isMobile
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow shadow-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Web App
        </button>
        <button
          onClick={() => setIsMobile(true)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            isMobile
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow shadow-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Mobile App
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Undo last change */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last change"
          className="p-2 bg-slate-900/40 hover:bg-slate-900 border border-white/5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo next change */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo next change"
          className="p-2 bg-slate-900/40 hover:bg-slate-900 border border-white/5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Reset Canvas */}
        <button
          onClick={onReset}
          title="Reset back to start"
          className="p-2 bg-slate-900/40 hover:bg-slate-900 border border-white/5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Toggle Code Panel */}
        <button
          onClick={() => setShowCodePanel(!showCodePanel)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
            showCodePanel 
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
              : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
          }`}
          title="Toggle code workspace panel"
        >
          <span className="font-mono text-[10px] font-bold">&lt;/&gt;</span>
          <span className="hidden sm:inline">{showCodePanel ? 'Hide Code' : 'Code View'}</span>
        </button>

        {/* Download Code */}
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 border border-white/10 rounded-lg text-xs font-semibold text-white transition-colors"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline">Download Files</span>
        </button>

        {/* Launch / Deploy */}
        <button
          onClick={onDeploy}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-102 active:scale-98 transition-all"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-current" />
          Publish
        </button>
      </div>
    </header>
  );
}
