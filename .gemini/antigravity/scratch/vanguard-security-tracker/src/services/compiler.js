let babelPromise = null;

export function loadBabel() {
  if (window.Babel) return Promise.resolve();
  if (babelPromise) return babelPromise;

  babelPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
    script.onload = () => resolve();
    script.onerror = () => {
      babelPromise = null; // reset to retry
      reject(new Error("Failed to load Babel compiler"));
    };
    document.head.appendChild(script);
  });

  return babelPromise;
}

export function compileJSX(code) {
  if (!window.Babel) {
    throw new Error("Babel compiler is loading... please wait.");
  }

  let processed = code;

  // ── Layer 1: Remove ALL import declarations (pre-Babel) ─────────────────────
  // Pass A: nuke any line starting with 'import' (handles 99% of cases)
  // We replace each such line with empty string, preserving line count.
  processed = processed.split('\n').map(line => {
    const t = line.trimStart();
    // Match: import ..., import{, import(, import 'x', import "x"
    if (/^import[\s{('"*]/.test(t)) {
      return '// [import removed]';
    }
    return line;
  }).join('\n');

  // Pass B: remove multi-line import blocks that span several lines
  // e.g. import {\n  Foo,\n  Bar\n} from 'pkg';
  processed = processed.replace(
    /\/\/ \[import removed\][\s\S]*?from\s+['"][^'"]*['"](;)?/g,
    ''
  );

  // Pass C: safety regex – catch anything that slipped through
  processed = processed.replace(
    /^[ \t]*import\s[\s\S]*?from\s+['"](.*?)['"](\s*;)?/gm,
    ''
  );
  processed = processed.replace(
    /^[ \t]*import\s+['"](.*?)['"](\s*;)?/gm,
    ''
  );

  // ── Layer 2: Strip export keywords ──────────────────────────────────────────
  processed = processed.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
  processed = processed.replace(/export\s+default\s+class\s+(\w+)/g, 'class $1');
  processed = processed.replace(/export\s+default\s+/g, '');
  processed = processed.replace(/export\s+const\s+/g, 'const ');
  processed = processed.replace(/export\s+function\s+/g, 'function ');
  processed = processed.replace(/export\s+class\s+/g, 'class ');
  processed = processed.replace(/export\s+\{[^}]*\};?/g, '');

  const preppedCode = `
    const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, createContext } = React;
    
    // Assign all Lucide React icons to global scope
    if (window.LucideReact) {
      Object.keys(window.LucideReact).forEach(function(key) {
        window[key] = window.LucideReact[key];
      });
    }

    ${processed}

    // Mount App component
    var rootElement = document.getElementById('root');
    if (rootElement && typeof App !== 'undefined') {
      var _root = ReactDOM.createRoot(rootElement);
      _root.render(React.createElement(App));
    } else {
      console.error('Lumina: App component or mount root not found.');
    }
  `;

  let compiled;
  try {
    const result = window.Babel.transform(preppedCode, {
      presets: ['react'],
      sourceType: 'script',  // force script mode – Babel errors if import remains
      plugins: []
    });
    compiled = result.code;
  } catch (err) {
    // If Babel chokes on a leftover import, try again with sourceType:module
    // then strip imports from the compiled output
    try {
      const result2 = window.Babel.transform(preppedCode, {
        presets: ['react'],
        sourceType: 'module',
        plugins: []
      });
      // ── Layer 3: post-Babel strip of any remaining import lines ────────────
      compiled = result2.code
        .split('\n')
        .filter(line => !/^\s*import\s/.test(line) && !/^\s*"use strict"/.test(line))
        .join('\n');
    } catch (err2) {
      console.error('Transpilation failed:', err2);
      throw err2;
    }
  }

  return compiled;
}


export function generatePreviewHTML(files, compiledJS) {
  const customCSS = files['styles.css'] || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.min.js"></script>
  <style>
    body { margin: 0; padding: 0; overflow-x: hidden; }
    ${customCSS}
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div id="root"></div>

  <script>
    // ── require() shim so any slipped-through imports resolve gracefully ────
    window.require = function(mod) {
      if (!mod) return {};
      var m = mod.toLowerCase();
      if (m === 'react') return window.React || {};
      if (m === 'react-dom') return window.ReactDOM || {};
      if (m.includes('lucide')) return window.LucideReact || {};
      // Return empty object for anything else
      return {};
    };
    // Robust local storage mock/simulator
    (function() {
      let storage = {};
      try {
        // Try accessing native localStorage
        window.localStorage.getItem('test');
      } catch (e) {
        console.warn("Lumina: Native LocalStorage blocked in sandbox. Using in-memory fallback.");
        window.localStorage = {
          getItem: function(key) { return storage[key] || null; },
          setItem: function(key, val) { storage[key] = String(val); },
          removeItem: function(key) { delete storage[key]; },
          clear: function() { storage = {}; },
          key: function(i) { return Object.keys(storage)[i] || null; },
          get length() { return Object.keys(storage).length; }
        };
      }

      // Wrap localStorage to report edits to parent
      const _setItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        try {
          _setItem.call(localStorage, key, value);
        } catch (e) {}
        window.parent.postMessage({
          type: 'DATABASE_CHANGE',
          key: key,
          value: value
        }, '*');
      };

      const _removeItem = localStorage.removeItem;
      localStorage.removeItem = function(key) {
        try {
          _removeItem.call(localStorage, key);
        } catch (e) {}
        window.parent.postMessage({
          type: 'DATABASE_REMOVE',
          key: key
        }, '*');
      };

      const _clear = localStorage.clear;
      localStorage.clear = function() {
        try {
          _clear.call(localStorage);
        } catch (e) {}
        window.parent.postMessage({
          type: 'DATABASE_CLEAR'
        }, '*');
      };
    })();

    // Capture runtime exceptions
    window.onerror = function(message, source, lineno, colno, error) {
      window.parent.postMessage({
        type: 'RUNTIME_ERROR',
        message: message,
        line: lineno
      }, '*');
      return false;
    };

    // Forward console logs to parent
    const _log = console.log;
    console.log = function(...args) {
      const msg = args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ');
      window.parent.postMessage({ type: 'CONSOLE_LOG', method: 'log', text: msg }, '*');
      _log.apply(console, args);
    };

    const _err = console.error;
    console.error = function(...args) {
      const msg = args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ');
      window.parent.postMessage({ type: 'CONSOLE_LOG', method: 'error', text: msg }, '*');
      _err.apply(console, args);
    };

    // Inspector functionality
    window.addEventListener('message', (e) => {
      if (e.data.type === 'SET_INSPECTOR_ACTIVE') {
        if (e.data.active) {
          enableInspector();
        } else {
          disableInspector();
        }
      }
    });

    function enableInspector() {
      document.addEventListener('mouseover', highlightElement);
      document.addEventListener('mouseout', unhighlightElement);
      document.addEventListener('click', selectElement, true);
    }

    function disableInspector() {
      document.removeEventListener('mouseover', highlightElement);
      document.removeEventListener('mouseout', unhighlightElement);
      document.removeEventListener('click', selectElement, true);
      const active = document.querySelector('.inspector-highlight');
      if (active) active.classList.remove('inspector-highlight');
    }

    function highlightElement(e) {
      e.stopPropagation();
      e.target.classList.add('inspector-highlight');
    }

    function unhighlightElement(e) {
      e.stopPropagation();
      e.target.classList.remove('inspector-highlight');
    }

    function selectElement(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const tag = e.target.tagName.toLowerCase();
      const text = e.target.innerText || '';
      const classes = e.target.className || '';
      
      window.parent.postMessage({
        type: 'ELEMENT_SELECTED',
        element: {
          tag: tag,
          text: text.trim().substring(0, 60),
          classes: classes.replace('inspector-highlight', '').trim()
        }
      }, '*');
    }
  </script>

  <style>
    .inspector-highlight {
      outline: 2px dashed #8b5cf6 !important;
      outline-offset: -2px !important;
      background-color: rgba(139, 92, 246, 0.15) !important;
      cursor: crosshair !important;
    }
  </style>

  <script>
    try {
      ${compiledJS}
    } catch (err) {
      console.error("Runtime exception:", err);
      document.getElementById('root').innerHTML = \`
        <div style="padding: 20px; color: #f87171; font-family: monospace; background: #090d16; border: 1px solid #f87171; border-radius: 8px; margin: 16px;">
          <h3 style="margin: 0 0 8px; font-size: 15px;">App Runtime Error</h3>
          <pre style="white-space: pre-wrap; margin: 0; font-size: 12px; line-height: 1.5;">\${err.message}</pre>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
}
