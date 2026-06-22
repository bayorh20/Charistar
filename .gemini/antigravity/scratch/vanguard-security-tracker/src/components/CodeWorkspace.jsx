import React, { useState, useEffect } from 'react';
import { FileCode, Folder, ChevronDown, Copy, Check, Edit2, Play, Eye } from 'lucide-react';

export default function CodeWorkspace({ files, activeFile, setActiveFile, onUpdateFile }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState('');

  // Sync edit code with active file
  useEffect(() => {
    setEditCode(files[activeFile] || '');
    setIsEditing(false); // Reset to view mode on file switch
  }, [activeFile, files]);

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = () => {
    onUpdateFile(activeFile, editCode);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    // Detect Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  // Simple, ultra-fast custom regex highlighter for JS/JSX/CSS
  const highlightCode = (code, filename) => {
    if (!code) return '';
    
    let escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    if (filename.endsWith('.jsx') || filename.endsWith('.js') || filename.endsWith('.json')) {
      escaped = escaped.replace(/(\/\/.*)/g, '<span class="text-slate-500 italic">$1</span>');
      escaped = escaped.replace(/\b(import|from|export|default|const|let|var|function|return|if|else|for|while|switch|case|break|new|typeof|class|extends|try|catch|finally|true|false|null)\b/g, '<span class="text-purple-400 font-semibold">$1</span>');
      escaped = escaped.replace(/\b(useState|useEffect|useRef|useMemo|useCallback)\b/g, '<span class="text-indigo-400 font-bold">$1</span>');
      escaped = escaped.replace(/(&lt;\/?[A-Z][a-zA-Z0-9]*)/g, '<span class="text-indigo-400 font-medium">$1</span>');
      escaped = escaped.replace(/(&lt;\/?[a-z][a-zA-Z0-9]*)/g, '<span class="text-rose-400">$1</span>');
      escaped = escaped.replace(/(&gt;)/g, '<span class="text-slate-400">$1</span>');
      escaped = escaped.replace(/(["'`])(.*?)\1/g, '<span class="text-teal-300 font-medium">$1$2$1</span>');
    } else if (filename.endsWith('.css')) {
      escaped = escaped.replace(/^([.#a-zA-Z_0-9\s,-]+)\s*\{/gm, '<span class="text-purple-400 font-semibold">$1</span> {');
      escaped = escaped.replace(/([a-zA-Z-]+)\s*:/g, '<span class="text-indigo-400 font-medium">$1</span>:');
      escaped = escaped.replace(/:\s*([^;]+);/g, ': <span class="text-teal-300">$1</span>;');
    }

    return escaped;
  };

  const codeToShow = isEditing ? editCode : (files[activeFile] || '');
  const highlighted = highlightCode(codeToShow, activeFile);
  const lines = codeToShow.split('\n');

  return (
    <div className="w-80 h-full border-l border-white/5 bg-slate-950/40 flex flex-col z-20">
      
      {/* File Tree Explorer */}
      <div className="p-4 border-b border-white/5 bg-slate-950/20 flex-shrink-0">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pl-1 mb-3">
          Workspace Files
        </span>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 px-1.5 py-1 text-xs text-slate-400 select-none">
            <ChevronDown className="w-3.5 h-3.5" />
            <Folder className="w-3.5 h-3.5 text-purple-400 fill-current" />
            <span className="font-bold">src</span>
          </div>
          <div className="pl-6 space-y-1">
            {Object.keys(files).map((filename) => {
              const isActive = activeFile === filename;
              return (
                <button
                  key={filename}
                  onClick={() => setActiveFile(filename)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow border border-white/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                  {filename}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editor Header panel */}
      <div className="px-4 py-2 border-b border-white/5 bg-slate-950/10 flex items-center justify-between select-none flex-shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          {activeFile} {isEditing && <span className="text-purple-400">(Editing...)</span>}
        </span>
        
        <div className="flex items-center gap-2">
          {/* Toggle View vs Edit */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-1 border rounded-md transition-colors ${
              isEditing 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
            title={isEditing ? "Switch to View Mode" : "Switch to Edit Mode"}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
          </button>

          {/* Copy code */}
          <button
            onClick={handleCopy}
            className="p-1 bg-slate-900 border border-white/5 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex font-mono text-[11px] h-full overflow-hidden bg-slate-950/20 select-text leading-relaxed relative">
        
        {/* Line Numbers column */}
        <div className="text-right pr-3 pl-4 py-4 select-none border-r border-white/5 text-slate-700 bg-slate-950/20 min-w-[36px] overflow-hidden">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        
        {/* Code View Area */}
        <div className="flex-1 h-full overflow-auto relative">
          {isEditing ? (
            <textarea
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-full bg-transparent text-slate-200 outline-none p-4 resize-none font-mono text-[11px] leading-relaxed border-0 focus:ring-0 whitespace-pre"
              spellCheck="false"
              placeholder="Write React JSX or CSS here..."
            />
          ) : (
            <pre className="p-4 text-slate-300">
              <code dangerouslySetInnerHTML={{ __html: highlighted }} />
            </pre>
          )}
        </div>

        {/* Floating Save button (only in Edit mode) */}
        {isEditing && (
          <button
            onClick={handleSave}
            className="absolute bottom-4 right-4 px-3 py-1.5 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce"
            title="Save changes (Ctrl+S)"
          >
            <Play className="w-3 h-3 fill-current" />
            Save & Run
          </button>
        )}

      </div>

    </div>
  );
}
