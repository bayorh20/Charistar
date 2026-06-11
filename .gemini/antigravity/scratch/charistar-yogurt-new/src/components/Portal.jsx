import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal — renders children directly into document.body.
 * This escapes the app's overflow-hidden layout container so that
 * fixed overlays, modals, and bottom sheets always cover the full viewport.
 */
export default function Portal({ children }) {
  const el = useRef(document.createElement('div'));

  useEffect(() => {
    const container = el.current;
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, []);

  return createPortal(children, el.current);
}
