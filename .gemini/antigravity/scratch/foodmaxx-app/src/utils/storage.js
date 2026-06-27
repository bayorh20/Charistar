// A resilient, fallback-backed localStorage and sessionStorage wrapper that prevents DOMException/SecurityError
// crashes in private browsing, inside strictly sandboxed PWAs, or webviews where storage is disabled.

const createSafeStorage = (storageType) => {
  let memoryStorage = {};
  
  const isStorageAvailable = () => {
    try {
      const storage = window[storageType];
      const key = '__storage_test__';
      storage.setItem(key, key);
      storage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  };

  const useStorage = isStorageAvailable();

  return {
    getItem(key) {
      if (useStorage) {
        try {
          return window[storageType].getItem(key);
        } catch (e) {
          return memoryStorage[key] || null;
        }
      }
      return memoryStorage[key] || null;
    },
    setItem(key, value) {
      if (useStorage) {
        try {
          window[storageType].setItem(key, value);
          return;
        } catch (e) {
          // Fall back to memory on write error (e.g. storage full)
        }
      }
      memoryStorage[key] = String(value);
    },
    removeItem(key) {
      if (useStorage) {
        try {
          window[storageType].removeItem(key);
          return;
        } catch (e) {
          // Fall back to memory
        }
      }
      delete memoryStorage[key];
    },
    clear() {
      if (useStorage) {
        try {
          window[storageType].clear();
          return;
        } catch (e) {
          // Fall back to memory
        }
      }
      memoryStorage = {};
    }
  };
};

export const safeLocalStorage = createSafeStorage('localStorage');
export const safeSessionStorage = createSafeStorage('sessionStorage');

// For backwards compatibility
export const safeStorage = safeLocalStorage;
