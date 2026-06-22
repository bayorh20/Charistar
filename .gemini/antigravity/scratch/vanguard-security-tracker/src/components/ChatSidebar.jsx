import React, { useRef, useEffect, useState } from 'react';
import { Send, Cpu, Compass, MousePointerClick, CheckCircle, CircleDot, Play, Settings, Key, AlertCircle, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function ChatSidebar({
  messages,
  prompt,
  setPrompt,
  onSend,
  isGenerating,
  agentSteps,
  inspectorActive,
  setInspectorActive,
  selectedElement,
  setSelectedElement,
  isMobile,
  selectedModel,
  setSelectedModel,
  geminiKey,
  setGeminiKey,
  claudeKey,
  setClaudeKey
}) {
  const feedEndRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiKey);
  const [localClaudeKey, setLocalClaudeKey] = useState(claudeKey);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentSteps]);

  // Update local key states when parent props change
  useEffect(() => {
    setLocalGeminiKey(geminiKey);
  }, [geminiKey]);

  useEffect(() => {
    setLocalClaudeKey(claudeKey);
  }, [claudeKey]);

  // Non-tech founder-friendly suggestions
  const webSuggestions = [
    "Build a pricing page with 3 tiers",
    "Add a newsletter subscription form",
    "Create a customer testimonial slider",
    "Add a FAQ dropdown list section",
    "Add a contact section with email & social links"
  ];

  const mobileSuggestions = [
    "Add bottom tab bar navigation",
    "Create a clean user profile card page",
    "Build a fitness dashboard stats grid",
    "Create a clean settings menu list",
    "Add track control sliders & volume bar"
  ];

  const suggestions = isMobile ? mobileSuggestions : webSuggestions;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSaveKeys = () => {
    localStorage.setItem('lumina_gemini_key', localGeminiKey);
    localStorage.setItem('lumina_claude_key', localClaudeKey);
    setGeminiKey(localGeminiKey);
    setClaudeKey(localClaudeKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const hasKeys = geminiKey.trim() !== '' || claudeKey.trim() !== '';

  return (
    <div className="w-80 h-full border-r border-white/5 bg-slate-950/40 flex flex-col z-20">
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          Lumina AI Assistant
        </h2>
        
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={`p-1.5 rounded-lg border transition-all ${
            settingsOpen 
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
              : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
          }`}
          title="AI Settings & API Keys"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible Settings Drawer */}
      {settingsOpen && (
        <div className="p-4 bg-slate-950/90 border-b border-white/5 space-y-4 animate-[slideDown_0.20s_ease-out]">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              Unlock Unlimited Builds
            </h3>
            <p className="text-[10px] text-slate-500">
              Provide your API Keys. They are saved securely in your local browser storage.
            </p>
          </div>

          <div className="space-y-3">
            {/* Gemini Key Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Google Gemini Key</label>
              <input
                type="password"
                value={localGeminiKey}
                onChange={(e) => setLocalGeminiKey(e.target.value)}
                placeholder="Paste Gemini API Key..."
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>

            {/* Claude Key Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Anthropic Claude Key</label>
              <input
                type="password"
                value={localClaudeKey}
                onChange={(e) => setLocalClaudeKey(e.target.value)}
                placeholder="Paste Claude API Key..."
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>

            {/* Model Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Model Engine</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <optgroup label="Google (Fast & Free)">
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Ultra Smart)</option>
                  <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Lightweight)</option>
                </optgroup>
                <optgroup label="Anthropic Claude">
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                  <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
                </optgroup>
              </select>
            </div>

            {/* Save Buttons */}
            <button
              onClick={handleSaveKeys}
              className="w-full py-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5"
            >
              {keySaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  Keys Saved!
                </>
              ) : (
                <>Save Configurations</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Demo Status Banner */}
      {!hasKeys && !settingsOpen && (
        <div className="mx-4 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-[10px] text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase tracking-wider mb-0.5">Demo Mode Active</span>
            Lumina is using mock templates. Add an API Key in settings to build custom features!
          </div>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4 py-2">
            {/* Welcome banner */}
            <div className="p-4 rounded-xl bg-gradient-to-tr from-violet-600/10 to-indigo-600/10 border border-indigo-500/10 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <Compass className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-sans">Let's build your app!</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe the section or features you want to add, or click a suggestions card below. You can also click the preview to edit elements visually.
              </p>
            </div>

            {/* Suggestions list */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pl-1">
                Suggested Actions
              </span>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(sug)}
                    className="w-full text-left p-3 rounded-lg bg-slate-900/40 border border-white/5 text-xs text-slate-300 hover:text-white hover:bg-slate-900 hover:border-purple-500/30 transition-all font-medium flex items-center justify-between"
                  >
                    {sug}
                    <Play className="w-2.5 h-2.5 text-purple-400 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* List Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col space-y-1 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            } animate-[fadeIn_0.2s_ease-out]`}
          >
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide px-1">
              {msg.role === 'user' ? 'You' : 'Lumina AI'}
            </span>
            <div
              className={`p-3 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-white/5 text-slate-300 rounded-tl-none shadow'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Stepper Progress */}
        {isGenerating && agentSteps && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20 space-y-3 shadow-lg animate-pulse">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
              Building your app...
            </span>
            <div className="space-y-2">
              {agentSteps.steps.map((st, i) => {
                const isActive = i === agentSteps.activeIdx;
                const isDone = i < agentSteps.activeIdx;
                return (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-checkmark" />
                    ) : isActive ? (
                      <CircleDot className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-800 flex-shrink-0"></div>
                    )}
                    <span
                      className={
                        isDone
                          ? 'text-slate-500 line-through'
                          : isActive
                          ? 'text-white font-medium'
                          : 'text-slate-600'
                      }
                    >
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div ref={feedEndRef} />
      </div>

      {/* Active Inspector Alert */}
      {inspectorActive && (
        <div className="p-3 bg-purple-950/40 border-t border-purple-500/20 text-xs text-purple-300 flex items-start gap-2.5 animate-[slideUp_0.15s_ease-out]">
          <MousePointerClick className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1 flex-1 min-w-0">
            <span className="font-bold text-[10px] uppercase tracking-wider text-white block">
              Visual Edit Mode Active
            </span>
            {selectedElement ? (
              <p className="text-[10px] text-slate-300 truncate">
                Selected: <code className="bg-purple-950 px-1 py-0.5 rounded text-white font-bold">&lt;{selectedElement.tag}&gt;</code> 
                {selectedElement.text && ` ("${selectedElement.text}")`}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400">
                Click any part of your preview screen to make edits.
              </p>
            )}
          </div>
          {selectedElement && (
            <button 
              onClick={() => setSelectedElement(null)}
              className="text-slate-400 hover:text-white font-bold text-xs"
              title="Clear selection"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Input panel */}
      <div className="p-4 border-t border-white/5 bg-slate-950/20 space-y-3">
        <div className="flex gap-2">
          {/* Visual selector toggle */}
          <button
            onClick={() => setInspectorActive(!inspectorActive)}
            title="Toggle Visual Edit Mode"
            className={`p-2.5 rounded-xl border transition-all ${
              inspectorActive
                ? 'bg-purple-500/15 border-purple-500/50 text-purple-400 shadow shadow-purple-500/10'
                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200 shadow'
            }`}
          >
            <MousePointerClick className="w-4.5 h-4.5" />
          </button>

          {/* Prompt textarea */}
          <div className="flex-1 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                selectedElement 
                  ? `Describe change to selected <${selectedElement.tag}>...`
                  : "Type what you want to add or change..."
              }
              rows={2}
              className="w-full bg-slate-900 border border-white/5 rounded-xl pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none placeholder-slate-500 shadow-inner"
            />
            <button
              onClick={onSend}
              disabled={isGenerating || !prompt.trim()}
              className="absolute right-2.5 bottom-3 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors"
            >
              <Send className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
