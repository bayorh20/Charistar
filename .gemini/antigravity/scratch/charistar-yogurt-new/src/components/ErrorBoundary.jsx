import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Auto-heal on version chunk mismatches (standard in PWAs on redeployment)
    const isChunkError = error && (
      error.name === 'ChunkLoadError' || 
      (error.message && error.message.includes('Failed to fetch dynamically imported module'))
    );
    if (isChunkError) {
      console.warn("ChunkLoadError caught. Clearing caches and reloading to force update...");
      (async () => {
        try {
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          }
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (let reg of regs) { await reg.unregister(); }
          }
        } catch (e) {}
        window.location.reload(true);
      })();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-charistar-dark flex flex-col items-center justify-center p-6 font-sans">
          <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/30">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            <h2 className="text-white text-2xl font-black tracking-tight mb-2">Oops, something broke!</h2>
            <p className="text-gray-400 text-sm font-medium mb-6 leading-relaxed">
              We encountered an unexpected error. Please try reloading the page.
            </p>
            
            {/* Only show error details in development — never expose internals to end users */}
            {process.env.NODE_ENV === 'development' && (
              <div className="w-full text-left bg-black/50 rounded-xl p-4 overflow-auto max-h-[200px] mb-6 border border-white/5">
                <p className="text-red-400 font-mono text-[10px] whitespace-pre-wrap font-bold break-words">
                  {this.state.error && this.state.error.toString()}
                </p>
                <p className="text-gray-500 font-mono text-[9px] whitespace-pre-wrap mt-2 break-words">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="bg-charistar-green text-black font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(163,198,68,0.2)] w-full"
            >
              <RefreshCw size={16} strokeWidth={3} />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}
