import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Monitor, Tablet, Smartphone, ExternalLink, Loader2, AlertCircle, Terminal, Trash2, ChevronUp, ChevronDown, Sparkles, MousePointerClick, Edit2, Database, Cpu } from 'lucide-react';
import SystemDashboard from './SystemDashboard.jsx';

function CodeStreamer({ code }) {
  const [displayText, setDisplayText] = useState('');
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!code) return;
    let index = 0;
    const interval = setInterval(() => {
      const chunk = code.substring(index, index + 8);
      setDisplayText(prev => prev + chunk);
      index += 8;
      
      if (index >= code.length) {
        clearInterval(interval);
      }
      
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 10);
    
    return () => clearInterval(interval);
  }, [code]);
  
  return (
    <pre ref={containerRef} className="h-full w-full overflow-y-auto text-[10px] font-mono text-emerald-400 p-4 leading-normal bg-black/40 rounded-xl border border-white/5 scrollbar-thin select-text">
      <code>{displayText}</code>
      <span className="w-1.5 h-3 bg-emerald-400 inline-block animate-pulse ml-0.5"></span>
    </pre>
  );
}

export default function VisualCanvas({
  htmlSource,
  isMobile,
  isCompiling,
  compileError,
  onRefresh,
  inspectorActive,
  selectedElement,
  setSelectedElement,
  onElementSelected,
  onDirectAction,
  onRuntimeError,
  consoleLogs,
  onClearLogs,
  onAutoFix,
  onConsoleLog,

  // Dashboard configuration props passed from parent
  files,
  onLoadPreset,
  geminiKey,
  setGeminiKey,
  claudeKey,
  setClaudeKey,
  selectedModel,
  setSelectedModel,
  setIsMobile,
  onDownload,
  onDeploy,
  isGenerating,
  agentSteps
}) {
  const [viewport, setViewport] = useState('desktop'); // desktop, tablet, mobile
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [consoleTab, setConsoleTab] = useState('console'); // console, database
  const [dbState, setDbState] = useState({});
  const [activeTab, setActiveTab] = useState('preview'); // preview, dashboard
  const iframeRef = useRef(null);

  // Sync isMobile prop with viewport state
  useEffect(() => {
    if (isMobile) {
      setViewport('mobile');
    } else {
      setViewport('desktop');
    }
  }, [isMobile]);

  // Clear dbState on source reload
  useEffect(() => {
    setDbState({});
  }, [htmlSource]);

  // Inform iframe of inspector mode active/inactive
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SET_INSPECTOR_ACTIVE',
        active: inspectorActive
      }, '*');
    }
  }, [inspectorActive, htmlSource]);

  // Listen to postMessages from inside the preview iframe
  useEffect(() => {
    const handleIframeMessage = (e) => {
      if (e.data.type === 'ELEMENT_SELECTED') {
        onElementSelected(e.data.element);
      } else if (e.data.type === 'RUNTIME_ERROR') {
        onRuntimeError(e.data.message);
      } else if (e.data.type === 'CONSOLE_LOG') {
        onConsoleLog(e.data.method, e.data.text);
      } else if (e.data.type === 'DATABASE_CHANGE') {
        setDbState(prev => ({ ...prev, [e.data.key]: e.data.value }));
      } else if (e.data.type === 'DATABASE_REMOVE') {
        setDbState(prev => {
          const next = { ...prev };
          delete next[e.data.key];
          return next;
        });
      } else if (e.data.type === 'DATABASE_CLEAR') {
        setDbState({});
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [onElementSelected, onRuntimeError, onConsoleLog]);

  // Handle manual frame sizes
  const frameWidths = {
    desktop: 'w-full h-full',
    tablet: 'w-[768px] h-[90%] border-x border-white/10 rounded-2xl shadow-2xl',
    mobile: 'w-[375px] h-[780px] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden'
  };

  const isViewportMobile = viewport === 'mobile' || isMobile;
  const errorCount = consoleLogs.filter(x => x.method === 'error').length;

  return (
    <div className="flex-1 h-full bg-slate-950/90 flex flex-col relative overflow-hidden">
      
      {/* Canvas Top Bar */}
      <div className="h-12 border-b border-white/5 bg-slate-950/40 px-6 flex items-center justify-between select-none flex-shrink-0 z-30">
        
        {/* Mock Sandbox Domain link */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
          </div>
          <div className="bg-slate-900 px-3 py-1 rounded-full text-[10px] font-mono text-slate-400 flex items-center gap-2 border border-white/5">
            <span>https://lumina-sandbox.local/preview</span>
          </div>
        </div>

        {/* Viewport Selectors & Reload Control */}
        <div className="flex items-center gap-3">
          {!isMobile && (
            <div className="flex items-center bg-slate-900/40 p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setViewport('desktop')}
                title="Desktop View"
                className={`p-1.5 rounded transition-all ${viewport === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                title="Tablet View"
                className={`p-1.5 rounded transition-all ${viewport === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                title="Mobile View"
                className={`p-1.5 rounded transition-all ${viewport === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Reload control */}
          <button
            onClick={onRefresh}
            className="p-1.5 bg-slate-900 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Force hot reload"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container / Dashboard View */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950 overflow-y-auto relative">
        {isGenerating ? (
          <div className="w-full h-full bg-[#0a0d16] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden animate-[fadeIn_0.3s_ease-out]">
            {/* Grid & Blur Accent */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            {/* Left Column: Brain Pulse & Thinking Log */}
            <div className="flex-1 flex flex-col gap-6 relative z-10 h-full justify-between">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-inner">
                  <Cpu className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Lumina AI Thinking Brain</h3>
                  <span className="text-[10px] text-purple-400 font-mono font-bold block animate-pulse">Status: Generative Coding</span>
                </div>
              </div>

              {/* Animated Neural Network Map */}
              <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl flex items-center justify-center h-40 relative flex-shrink-0">
                <svg className="w-20 h-20 text-purple-400" viewBox="0 0 100 100">
                  <line x1="20" y1="50" x2="50" y2="20" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
                  <line x1="20" y1="50" x2="50" y2="80" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
                  <line x1="50" y1="20" x2="80" y2="50" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
                  <line x1="50" y1="80" x2="80" y2="50" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
                  <line x1="50" y1="20" x2="50" y2="80" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
                  <line x1="20" y1="50" x2="80" y2="50" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
                  
                  <circle cx="50" cy="20" r="5" fill="#818cf8" className="animate-ping" style={{ animationDuration: '3s' }} />
                  <circle cx="50" cy="20" r="4" fill="#6366f1" />
                  
                  <circle cx="20" cy="50" r="5" fill="#c084fc" className="animate-ping" style={{ animationDuration: '4s' }} />
                  <circle cx="20" cy="50" r="4" fill="#a855f7" />
                  
                  <circle cx="80" cy="50" r="5" fill="#c084fc" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                  <circle cx="80" cy="50" r="4" fill="#a855f7" />
                  
                  <circle cx="50" cy="80" r="5" fill="#818cf8" className="animate-ping" style={{ animationDuration: '3.5s' }} />
                  <circle cx="50" cy="80" r="4" fill="#6366f1" />
                  
                  <circle cx="50" cy="50" r="6" fill="#f472b6" className="animate-pulse" />
                </svg>
              </div>

              {/* Thoughts Stream Console */}
              <div className="flex-1 bg-black/30 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-slate-300 space-y-2 overflow-y-auto select-text min-h-[120px]">
                <div className="text-purple-400 font-bold uppercase tracking-wider border-b border-white/5 pb-1">Cognitive Logs</div>
                {agentSteps && (
                  <div className="space-y-1.5 leading-relaxed">
                    <div className="text-emerald-400">&gt; WAKING AGENT PERSONA: frontend_builder</div>
                    {agentSteps.activeIdx >= 0 && (
                      <div className="text-indigo-400 animate-pulse">&gt; Initializing Gemini API Provider link...</div>
                    )}
                    {agentSteps.activeIdx >= 1 && (
                      <div className="text-purple-400">&gt; Deconstructing user layout request components...</div>
                    )}
                    {agentSteps.activeIdx >= 2 && (
                      <div className="text-amber-400 animate-pulse">&gt; Writing Tailwind layout grids and state modifiers...</div>
                    )}
                    {agentSteps.activeIdx >= 3 && (
                      <div className="text-teal-400">&gt; Assembling app script tags. Compiling JSX elements...</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Code Writer Streamer */}
            <div className="flex-1 flex flex-col gap-3 relative z-10 min-w-0 h-full">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 block">Live Code Drafting</span>
              <div className="flex-1 h-full min-h-[250px]">
                <CodeStreamer code={files['App.jsx'] || ''} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Floating Contextual Inspector Controls */}
            {selectedElement && !isCompiling && !compileError && (
              <div className="absolute top-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md border border-purple-500/30 p-4 rounded-xl shadow-2xl z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-[slideDown_0.2s_ease-out] mx-auto max-w-4xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      Selected: <code className="bg-purple-950 px-1 py-0.5 rounded text-purple-300 text-[10px]">&lt;{selectedElement.tag}&gt;</code>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate max-w-[280px] sm:max-w-md mt-0.5">
                      {selectedElement.text ? `Content: "${selectedElement.text}"` : `Classes: ${selectedElement.classes}`}
                    </p>
                  </div>
                </div>

                {/* Actions list */}
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  {/* Edit Text Action */}
                  <button
                    onClick={() => {
                      const newText = prompt("Enter new text content for this element:", selectedElement.text || "");
                      if (newText !== null && newText.trim() !== "") {
                        onDirectAction('edit_text', newText.trim());
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-white/5 transition-all flex items-center gap-1.5 shadow"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                    Change Text
                  </button>

                  {/* Style Presets Dropdown */}
                  <div className="relative group">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-white/5 transition-all flex items-center gap-1.5 shadow">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      Apply Preset
                    </button>
                    <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col bg-slate-900 border border-white/10 rounded-xl p-2 shadow-2xl w-48 space-y-1 z-40">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 select-none">Color Variants</div>
                      <button 
                        onClick={() => onDirectAction('apply_style', 'bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-500/20')}
                        className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      >
                        Indigo Theme Button
                      </button>
                      <button 
                        onClick={() => onDirectAction('apply_style', 'bg-emerald-600 hover:bg-emerald-500 text-white shadow shadow-emerald-500/20')}
                        className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      >
                        Emerald Theme Button
                      </button>
                      <button 
                        onClick={() => onDirectAction('apply_style', 'bg-rose-600 hover:bg-rose-500 text-white shadow shadow-rose-500/20')}
                        className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      >
                        Rose Theme Button
                      </button>
                      <button 
                        onClick={() => onDirectAction('apply_style', 'text-indigo-400 hover:text-indigo-300 font-bold transition-all')}
                        className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      >
                        Highlight Text (Indigo)
                      </button>
                      <div className="border-t border-white/5 my-1"></div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 select-none">Spacing & Style</div>
                      <button 
                        onClick={() => onDirectAction('apply_style', 'p-4 m-2 rounded-xl')}
                        className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      >
                        Add Spacing & Radius
                      </button>
                      <button 
                        onClick={() => onDirectAction('apply_style', 'shadow-2xl border border-purple-500/20 ring-2 ring-purple-500/10')}
                        className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      >
                        Neon Glow Outline
                      </button>
                    </div>
                  </div>

                  {/* Delete Action */}
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete this <${selectedElement.tag}> element?`)) {
                        onDirectAction('delete');
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>

                  {/* Close controls */}
                  <button
                    onClick={() => setSelectedElement(null)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-white/5 transition-all shadow"
                    title="Deselect element"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {isCompiling ? (
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Compiling Code...</span>
              </div>
            ) : compileError ? (
              <div className="max-w-lg p-6 bg-slate-900/90 border border-rose-500/30 rounded-2xl shadow-xl flex gap-3 text-slate-200 z-10">
                <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Transpiler Syntax Exception</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap mt-1">{compileError}</p>
                  </div>
                  <button
                    onClick={() => onAutoFix(compileError)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-current animate-pulse" />
                    Auto-Fix with AI
                  </button>
                </div>
              </div>
            ) : (
              /* PREVIEW SHELL */
              <div 
                className={`transition-all duration-300 relative flex items-center justify-center ${
                  isViewportMobile && isMobile 
                    ? 'device-mobile border-[10px] border-slate-900 bg-slate-950 shadow-2xl relative w-[375px] h-[720px]' 
                    : frameWidths[viewport]
                }`}
              >
                {/* If native mobile phone outline, inject a status notch bar */}
                {isMobile && (
                  <>
                    {/* Speaker/Camera Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-slate-900 rounded-b-2xl z-40 flex items-center justify-center gap-1.5">
                      <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
                      <div className="w-2.5 h-2.5 bg-slate-950 rounded-full"></div>
                    </div>
                    {/* Simulated Time/Battery Status bar */}
                    <div className="absolute top-6 left-0 right-0 h-6 px-6 flex items-center justify-between text-[10px] text-slate-400 font-medium z-30 select-none pointer-events-none">
                      <span>9:41</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-2.5 rounded bg-slate-400"></span>
                      </div>
                    </div>
                  </>
                )}

                {/* Sandbox iframe */}
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlSource}
                  className={`w-full h-full border-0 bg-slate-950 ${isMobile ? 'pt-12 rounded-[24px]' : 'rounded-lg'}`}
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  title="Lumina Preview Sandboxed Frame"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Developer Console Drawer */}
      <div className={`border-t border-white/5 bg-[#0b0f19] flex flex-col z-20 transition-all duration-300 flex-shrink-0 ${consoleExpanded ? 'h-56' : 'h-10'}`}>
        {/* Header Tabs */}
        <div 
          onClick={() => setConsoleExpanded(!consoleExpanded)}
          className="h-10 px-6 flex items-center justify-between border-b border-white/5 cursor-pointer hover:bg-slate-900/30 transition-colors select-none"
        >
          <div className="flex items-center gap-4 text-slate-400 text-xs font-bold" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setConsoleTab('console');
                setConsoleExpanded(true);
              }}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md transition-all ${
                consoleTab === 'console' 
                  ? 'text-white bg-slate-900 border border-white/5 shadow-inner' 
                  : 'hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              Console Logs
              {consoleLogs.length > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${errorCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                  {consoleLogs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setConsoleTab('database');
                setConsoleExpanded(true);
              }}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md transition-all ${
                consoleTab === 'database' 
                  ? 'text-white bg-slate-900 border border-white/5 shadow-inner' 
                  : 'hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Database Simulator
              {Object.keys(dbState).length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/10">
                  {Object.keys(dbState).length}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {consoleTab === 'console' && consoleLogs.length > 0 && (
              <button 
                onClick={onClearLogs}
                title="Clear console output"
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {consoleTab === 'database' && Object.keys(dbState).length > 0 && (
              <button 
                onClick={() => {
                  if (iframeRef.current && iframeRef.current.contentWindow) {
                    iframeRef.current.contentWindow.postMessage({ type: 'CLEAR_DB' }, '*');
                  }
                  setDbState({});
                }}
                title="Clear all database items"
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors text-[10px] font-sans font-bold"
              >
                Clear DB
              </button>
            )}
            <button 
              onClick={() => setConsoleExpanded(!consoleExpanded)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              {consoleExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Logs Area */}
        {consoleExpanded && (
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] bg-black/30 select-text font-medium">
            {consoleTab === 'console' ? (
              <div className="space-y-1">
                {consoleLogs.length === 0 ? (
                  <div className="text-slate-600 text-center py-6 font-sans">No console prints recorded yet.</div>
                ) : (
                  consoleLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`flex items-start justify-between py-1 border-b border-white/[0.02] last:border-0 ${
                        log.method === 'error' ? 'text-rose-400 bg-rose-950/10 px-2 rounded' : 'text-slate-300'
                      }`}
                    >
                      <span className="break-all">{log.text}</span>
                      {log.method === 'error' && (
                        <button
                          onClick={() => onAutoFix(log.text)}
                          className="px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded border border-indigo-500/30 text-[9px] font-sans font-bold flex items-center gap-1 transition-all"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-current animate-pulse" />
                          Fix with AI
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* DATABASE SIMULATOR VIEW */
              <div className="space-y-3">
                {Object.keys(dbState).length === 0 ? (
                  <div className="text-slate-600 text-center py-6 font-sans">
                    No database records found. Interact with your app (e.g., toggle metrics, like tracks, add water) to store state data in the simulated localStorage database.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(dbState).map(([key, val]) => (
                      <div 
                        key={key} 
                        className="bg-slate-950/60 border border-white/5 p-2 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-indigo-400 font-bold font-sans text-[9px] block uppercase tracking-wider">Key: {key}</span>
                          <span className="text-slate-300 text-xs break-all font-mono">{val}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (iframeRef.current && iframeRef.current.contentWindow) {
                              iframeRef.current.contentWindow.postMessage({
                                type: 'REMOVE_DB_ITEM',
                                key: key
                              }, '*');
                            }
                            setDbState(prev => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                          }}
                          title="Remove item"
                          className="text-slate-500 hover:text-rose-400 font-sans transition-colors text-[9px] font-bold uppercase flex-shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
