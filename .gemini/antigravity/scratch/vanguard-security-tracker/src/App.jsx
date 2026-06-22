import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Loader2 } from 'lucide-react';

// Import components
import Header from './components/Header.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';
import VisualCanvas from './components/VisualCanvas.jsx';
import CodeWorkspace from './components/CodeWorkspace.jsx';
import LandingPage from './components/LandingPage.jsx';
import AuthPage from './components/AuthPage.jsx';

// Import services
import { TEMPLATES } from './services/templates.js';
import { loadBabel, compileJSX, generatePreviewHTML } from './services/compiler.js';
import { generateWithAI } from './services/ai.js';
import { downloadProjectZip } from './utils/exporter.js';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'auth', 'builder'
  const [initialPrompt, setInitialPrompt] = useState('');

  const [isMobile, setIsMobile] = useState(false);
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState('App.jsx');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentSteps, setAgentSteps] = useState(null);
  
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('lumina_gemini_key') || '');
  const [claudeKey, setClaudeKey] = useState(() => localStorage.getItem('lumina_claude_key') || '');
  
  const [inspectorActive, setInspectorActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState(null);
  const [htmlSource, setHtmlSource] = useState('');

  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployStep, setDeployStep] = useState(0);

  // Project Undo/Redo History States
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Live Developer Console log states
  const [consoleLogs, setConsoleLogs] = useState([]);

  // Code Workspace collapsed state (defaults to false for simplicity)
  const [showCodePanel, setShowCodePanel] = useState(false);

  // Initialize Babel on mount
  useEffect(() => {
    loadBabel()
      .then(() => console.log("Lumina: Babel Standalone compiler loaded successfully."))
      .catch((err) => console.error("Lumina: Failed to load Babel.", err));
  }, []);

  // Load default template on initial mount
  useEffect(() => {
    const template = TEMPLATES['dashboard'];
    if (template) {
      initHistory(template.files);
      setCompileError(null);
      setConsoleLogs([]);
      compileAndRender(template.files);
    }
  }, []);

  // Load a preset template manually
  const handleLoadPreset = (templateKey) => {
    const template = TEMPLATES[templateKey];
    if (template) {
      setIsMobile(template.type === 'mobile');
      initHistory(template.files);
      setCompileError(null);
      setConsoleLogs([]);
      compileAndRender(template.files);
      setMessages([]);
      setSelectedElement(null);
      setInspectorActive(false);
    }
  };

  // Switch platform and load default template for that platform
  const handleToggleMobile = (val) => {
    setIsMobile(val);
    const templateKey = val ? 'musicPlayer' : 'dashboard';
    const template = TEMPLATES[templateKey];
    if (template) {
      initHistory(template.files);
      setCompileError(null);
      setConsoleLogs([]);
      compileAndRender(template.files);
      setMessages([]);
      setSelectedElement(null);
      setInspectorActive(false);
    }
  };

  // Hook to handle landing-page prompt redirect after login
  useEffect(() => {
    if (currentView === 'builder' && initialPrompt) {
      const lowerPrompt = initialPrompt.toLowerCase();
      const needsMobile = lowerPrompt.includes("music") || 
                          lowerPrompt.includes("song") || 
                          lowerPrompt.includes("player") || 
                          lowerPrompt.includes("fit") || 
                          lowerPrompt.includes("workout") || 
                          lowerPrompt.includes("health") || 
                          lowerPrompt.includes("water");
      
      if (needsMobile) {
        setIsMobile(true);
      }
      
      triggerInitialBuild(initialPrompt, needsMobile);
      setInitialPrompt('');
    }
  }, [currentView]);

  // Transpile JSX and update iframe document
  const compileAndRender = async (currentFiles) => {
    setIsCompiling(true);
    setCompileError(null);
    try {
      await loadBabel();
      const code = currentFiles['App.jsx'] || '';
      const compiled = compileJSX(code);
      const htmlDoc = generatePreviewHTML(currentFiles, compiled);
      setHtmlSource(htmlDoc);
    } catch (err) {
      console.error(err);
      setCompileError(err.message || "Compilation failed. Check JSX syntax.");
    } finally {
      setIsCompiling(false);
    }
  };

  // Re-run compile manually
  const handleRefresh = () => {
    compileAndRender(files);
  };

  // Initialize workspace history
  const initHistory = (initialFiles) => {
    setHistory([initialFiles]);
    setHistoryIndex(0);
    setFiles(initialFiles);
  };

  // Save new code state onto Undo/Redo stack
  const saveToHistory = (newFiles) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newFiles);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setFiles(newFiles);
  };

  // Undo triggers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevFiles = history[prevIndex];
      setFiles(prevFiles);
      compileAndRender(prevFiles);
    }
  };

  // Redo triggers
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextFiles = history[nextIndex];
      setFiles(nextFiles);
      compileAndRender(nextFiles);
    }
  };

  // Reset to default files
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset your code back to the start? Your changes will be lost.")) {
      const templateKey = isMobile ? 'musicPlayer' : 'dashboard';
      const template = TEMPLATES[templateKey];
      initHistory(template.files);
      setCompileError(null);
      setConsoleLogs([]);
      compileAndRender(template.files);
      setMessages([]);
      setSelectedElement(null);
      setInspectorActive(false);
    }
  };

  // Exporter zip download
  const handleDownload = async () => {
    try {
      const appName = isMobile ? 'LuminaMobileApp' : 'LuminaWebApp';
      await downloadProjectZip(files, appName, isMobile);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  // Mock deployment pipeline
  const handleDeploy = () => {
    setShowDeployModal(true);
    setDeployStep(1);

    setTimeout(() => {
      setDeployStep(2); // Setting up website routing
      setTimeout(() => {
        setDeployStep(3); // Complete
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 1500);
    }, 1500);
  };

  // Landing Page start trigger
  const handleStartBuild = (userPrompt) => {
    setInitialPrompt(userPrompt);
    setCurrentView('auth');
  };

  // Auth Success redirect
  const handleAuthSuccess = (userData) => {
    setCurrentView('builder');
  };

  // Update file contents when edited in code panel
  const handleUpdateFile = (filename, newContent) => {
    const updated = {
      ...files,
      [filename]: newContent
    };
    saveToHistory(updated);
    compileAndRender(updated);
  };

  // Console management callbacks
  const handleClearLogs = () => setConsoleLogs([]);
  
  const handleConsoleLog = (method, text) => {
    setConsoleLogs(prev => [...prev, { method, text }]);
  };

  // Automated AI debugging runner
  const handleAutoFix = async (errorText) => {
    if (isGenerating) return;

    setIsGenerating(true);
    const activeKey = selectedModel.startsWith('gemini') ? geminiKey : claudeKey;
    
    // Add user question to the feed
    const shortenedError = errorText.length > 90 ? errorText.substring(0, 90) + '...' : errorText;
    const newMessages = [...messages, { role: 'user', text: `Please fix this execution bug: "${shortenedError}"` }];
    setMessages(newMessages);

    const initialSteps = {
      activeIdx: 0,
      steps: [
        "Initializing Lumina AI Builder...",
        "Designing interface layout...",
        "Applying modern styling...",
        "Updating live preview screen..."
      ]
    };
    setAgentSteps(initialSteps);

    const stepCallback = (msg, progress) => {
      setAgentSteps(prev => {
        if (!prev) return null;
        let nextIdx = prev.activeIdx;
        if (progress > 85) nextIdx = 3;
        else if (progress > 60) nextIdx = 2;
        else if (progress > 30) nextIdx = 1;
        return {
          ...prev,
          activeIdx: nextIdx
        };
      });
    };

    // Unified prompt asking AI specifically to fix compilation errors
    const repairPrompt = `An error occurred in the sandbox: "${errorText}". Please fix this error in App.jsx. Make sure to return the complete updated code matching our schemas.`;

    try {
      const result = await generateWithAI({
        prompt: repairPrompt,
        files: files,
        apiKey: activeKey,
        selectedModel: selectedModel,
        isMobile: isMobile,
        onProgress: stepCallback
      });

      saveToHistory(result.files);
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: `I corrected the code. Details: ${result.explanation || 'Fixed.'}` }
      ]);
      await compileAndRender(result.files);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: `Failed to auto-fix code: ${err.message}` }
      ]);
    } finally {
      setIsGenerating(false);
      setAgentSteps(null);
    }
  };

  // Automated prompt generator triggered from landing page
  const triggerInitialBuild = async (initialText, needsMobile) => {
    setPrompt(''); // clear inputs
    setIsGenerating(true);
    
    const initialSteps = {
      activeIdx: 0,
      steps: [
        "Initializing Lumina AI Builder...",
        "Designing interface layout...",
        "Applying modern styling...",
        "Updating live preview screen..."
      ]
    };
    setAgentSteps(initialSteps);

    setMessages([{ role: 'user', text: initialText }]);

    const stepCallback = (msg, progress) => {
      setAgentSteps(prev => {
        if (!prev) return null;
        let nextIdx = prev.activeIdx;
        if (progress > 85) nextIdx = 3;
        else if (progress > 60) nextIdx = 2;
        else if (progress > 30) nextIdx = 1;
        return {
          ...prev,
          activeIdx: nextIdx
        };
      });
    };

    try {
      const targetTemplateKey = needsMobile ? 'musicPlayer' : 'dashboard';
      const template = TEMPLATES[targetTemplateKey];

      const activeKey = selectedModel.startsWith('gemini') ? geminiKey : claudeKey;

      const result = await generateWithAI({
        prompt: initialText,
        files: template.files,
        apiKey: activeKey,
        selectedModel: selectedModel,
        isMobile: needsMobile,
        onProgress: stepCallback
      });

      saveToHistory(result.files);
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: result.explanation || "App updated successfully!" }
      ]);
      
      await compileAndRender(result.files);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: `Failed to compile edits: ${err.message}. Please refine your prompt.` }
      ]);
    } finally {
      setIsGenerating(false);
      setAgentSteps(null);
    }
  };

  // Execute Direct visual action (e.g. Delete, Edit Text, Style preset)
  const handleDirectElementAction = async (actionType, paramValue) => {
    if (!selectedElement || isGenerating) return;

    let actionPrompt = '';
    let userText = '';

    if (actionType === 'delete') {
      userText = `Delete the selected <${selectedElement.tag}> element`;
      actionPrompt = `[Direct Action: Delete Element] Please find and completely delete the HTML/JSX element <${selectedElement.tag}> containing class "${selectedElement.classes}" or text "${selectedElement.text}" from App.jsx. Ensure no syntax errors or empty tags are left behind.`;
    } else if (actionType === 'edit_text') {
      userText = `Change text of the selected <${selectedElement.tag}> element to "${paramValue}"`;
      actionPrompt = `[Direct Action: Edit Text] Please find the HTML/JSX element <${selectedElement.tag}> containing class "${selectedElement.classes}" and change its inner text, label or title to "${paramValue}" inside App.jsx.`;
    } else if (actionType === 'apply_style') {
      userText = `Apply style preset to <${selectedElement.tag}>: "${paramValue}"`;
      actionPrompt = `[Direct Action: Apply Style] Please find the HTML/JSX element <${selectedElement.tag}> containing class "${selectedElement.classes}" or text "${selectedElement.text}" inside App.jsx, and apply or append these styling classNames: "${paramValue}". Merge or replace existing conflicting classes.`;
    }

    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsGenerating(true);

    const initialSteps = {
      activeIdx: 0,
      steps: [
        "Initializing Lumina AI Builder...",
        "Designing interface layout...",
        "Applying modern styling...",
        "Updating live preview screen..."
      ]
    };
    setAgentSteps(initialSteps);

    const stepCallback = (msg, progress) => {
      setAgentSteps(prev => {
        if (!prev) return null;
        let nextIdx = prev.activeIdx;
        if (progress > 85) nextIdx = 3;
        else if (progress > 60) nextIdx = 2;
        else if (progress > 30) nextIdx = 1;
        return {
          ...prev,
          activeIdx: nextIdx
        };
      });
    };

    try {
      const activeKey = selectedModel.startsWith('gemini') ? geminiKey : claudeKey;

      const result = await generateWithAI({
        prompt: actionPrompt,
        files: files,
        apiKey: activeKey,
        selectedModel: selectedModel,
        isMobile: isMobile,
        onProgress: stepCallback
      });

      saveToHistory(result.files);
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: result.explanation || "App updated successfully!" }
      ]);
      
      await compileAndRender(result.files);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: `Failed to compile edits: ${err.message}. Please refine your prompt.` }
      ]);
    } finally {
      setIsGenerating(false);
      setAgentSteps(null);
      setSelectedElement(null);
      setInspectorActive(false);
    }
  };

  // Execute Agent prompt submission
  const handleSend = async () => {
    if (!prompt.trim() || isGenerating) return;

    const userText = prompt.trim();
    let apiPrompt = userText;

    if (selectedElement) {
      apiPrompt = `[Visual Inspect Selector Details] Target element <${selectedElement.tag}> with text context "${selectedElement.text}" and Tailwind classNames "${selectedElement.classes}". Request: ${userText}`;
    }

    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setPrompt('');
    setIsGenerating(true);

    const initialSteps = {
      activeIdx: 0,
      steps: [
        "Initializing Lumina AI Builder...",
        "Designing interface layout...",
        "Applying modern styling...",
        "Updating live preview screen..."
      ]
    };
    setAgentSteps(initialSteps);

    const stepCallback = (msg, progress) => {
      setAgentSteps(prev => {
        if (!prev) return null;
        let nextIdx = prev.activeIdx;
        if (progress > 85) nextIdx = 3;
        else if (progress > 60) nextIdx = 2;
        else if (progress > 30) nextIdx = 1;
        return {
          ...prev,
          activeIdx: nextIdx
        };
      });
    };

    try {
      const activeKey = selectedModel.startsWith('gemini') ? geminiKey : claudeKey;

      const result = await generateWithAI({
        prompt: apiPrompt,
        files: files,
        apiKey: activeKey,
        selectedModel: selectedModel,
        isMobile: isMobile,
        onProgress: stepCallback
      });

      saveToHistory(result.files);
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: result.explanation || "App updated successfully!" }
      ]);
      
      await compileAndRender(result.files);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: `Failed to compile edits: ${err.message}. Please refine your prompt.` }
      ]);
    } finally {
      setIsGenerating(false);
      setAgentSteps(null);
      setSelectedElement(null);
      setInspectorActive(false);
    }
  };

  // Outer View Router
  if (currentView === 'landing') {
    return <LandingPage onStartBuild={handleStartBuild} />;
  }

  if (currentView === 'auth') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} onBack={() => setCurrentView('landing')} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-bgDark text-slate-100 overflow-hidden font-sans">
      
      {/* Header Panel */}
      <Header
        isMobile={isMobile}
        setIsMobile={setIsMobile}
        onReset={handleReset}
        onDownload={handleDownload}
        onDeploy={handleDeploy}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        showCodePanel={showCodePanel}
        setShowCodePanel={setShowCodePanel}
      />

      {/* Main Panel Viewport */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Agent Chat panel */}
        <ChatSidebar
          messages={messages}
          prompt={prompt}
          setPrompt={setPrompt}
          onSend={handleSend}
          isGenerating={isGenerating}
          agentSteps={agentSteps}
          inspectorActive={inspectorActive}
          setInspectorActive={setInspectorActive}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          isMobile={isMobile}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          geminiKey={geminiKey}
          setGeminiKey={setGeminiKey}
          claudeKey={claudeKey}
          setClaudeKey={setClaudeKey}
        />

        {/* Center Sandbox preview canvas / System Dashboard */}
        <VisualCanvas
          htmlSource={htmlSource}
          isMobile={isMobile}
          isCompiling={isCompiling}
          compileError={compileError}
          onRefresh={handleRefresh}
          inspectorActive={inspectorActive}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          onElementSelected={(el) => setSelectedElement(el)}
          onDirectAction={handleDirectElementAction}
          onRuntimeError={(msg) => setCompileError(`Runtime Error inside sandbox: ${msg}`)}
          consoleLogs={consoleLogs}
          onClearLogs={handleClearLogs}
          onAutoFix={handleAutoFix}
          onConsoleLog={handleConsoleLog}

          files={files}
          onLoadPreset={handleLoadPreset}
          geminiKey={geminiKey}
          setGeminiKey={setGeminiKey}
          claudeKey={claudeKey}
          setClaudeKey={setClaudeKey}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          setIsMobile={setIsMobile}
          onDownload={handleDownload}
          onDeploy={handleDeploy}
          isGenerating={isGenerating}
          agentSteps={agentSteps}
        />

        {/* Right Code explorer panel */}
        {showCodePanel && (
          <CodeWorkspace
            files={files}
            activeFile={activeFile}
            setActiveFile={setActiveFile}
            onUpdateFile={handleUpdateFile}
          />
        )}

      </div>

      {/* Mock Deployment popup dialog */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-bgPanel border border-white/10 w-full max-w-sm p-6 rounded-2xl shadow-premium text-center space-y-4">
            <h3 className="text-base font-bold text-white">Publishing App</h3>
            
            <div className="py-4 flex flex-col items-center justify-center">
              {deployStep < 3 ? (
                <>
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                  <p className="text-xs text-slate-300 font-mono">
                    {deployStep === 1 ? 'Starting the server...' : 'Setting up the website...'}
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400">Your app is live!</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Anyone can visit your app now.</p>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`https://lumina-app-${Math.random().toString(36).substring(2, 7)}.vercel.app`}
                    className="w-full bg-slate-950 border border-white/5 rounded-lg text-center py-1.5 text-xs text-indigo-300 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                onClick={() => setShowDeployModal(false)}
                disabled={deployStep < 3}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all shadow"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
