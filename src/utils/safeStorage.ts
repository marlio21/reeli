/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Exception-safe wrappers for localStorage and sessionStorage,
 * specifically built to immunize the KONU application against
 * "SecurityError: Access is denied" crashes within restricted environments like:
 * - Android WebViews / WhatsApp In-App Browser
 * - Facebook / Instagram In-App Browsers
 * - Strict Privacy or Sandboxed iFrames
 */

export const getSafeLocalStorage = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage !== null) {
      return localStorage.getItem(key);
    }
  } catch (error) {
    console.warn(`safeStorage: Caught exception reading ${key} from localStorage`, error);
  }
  return null;
};

export const setSafeLocalStorage = (key: string, value: string): boolean => {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage !== null) {
      localStorage.setItem(key, value);
      return true;
    }
  } catch (error) {
    console.warn(`safeStorage: Caught exception writing ${key} to localStorage`, error);
  }
  return false;
};

export const removeSafeLocalStorage = (key: string): boolean => {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage !== null) {
      localStorage.removeItem(key);
      return true;
    }
  } catch (error) {
    console.warn(`safeStorage: Caught exception removing ${key} from localStorage`, error);
  }
  return false;
};

export const getSafeSessionStorage = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window && window.sessionStorage !== null) {
      return sessionStorage.getItem(key);
    }
  } catch (error) {
    console.warn(`safeStorage: Caught exception reading ${key} from sessionStorage`, error);
  }
  return null;
};

export const setSafeSessionStorage = (key: string, value: string): boolean => {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window && window.sessionStorage !== null) {
      sessionStorage.setItem(key, value);
      return true;
    }
  } catch (error) {
    console.warn(`safeStorage: Caught exception writing ${key} to sessionStorage`, error);
  }
  return false;
};

export const removeSafeSessionStorage = (key: string): boolean => {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window && window.sessionStorage !== null) {
      sessionStorage.removeItem(key);
      return true;
    }
  } catch (error) {
    console.warn(`safeStorage: Caught exception removing ${key} from sessionStorage`, error);
  }
  return false;
};
