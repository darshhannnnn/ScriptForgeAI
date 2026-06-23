"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ApiKeyContext = createContext({
  hasKey: null,
  ensureKey: () => false,
  openModal: () => {},
});

export function useApiKeyContext() {
  return useContext(ApiKeyContext);
}

/**
 * ApiKeyProvider
 *
 * Wrap any authenticated area with this provider to enable the
 * API key prompt flow. It checks if the user already has a key
 * stored on mount, and exposes `ensureKey()` which other components
 * can call before triggering Gemini-powered actions.
 */
export default function ApiKeyProvider({ children }) {
  const [hasKey, setHasKey] = useState(true);

  /**
   * Call before triggering any Gemini-powered action.
   * Always returns true as the key is handled server-side via env.local.
   */
  const ensureKey = useCallback(() => {
    return true;
  }, []);

  return (
    <ApiKeyContext.Provider value={{ hasKey, ensureKey, openModal: () => {} }}>
      {children}
    </ApiKeyContext.Provider>
  );
}
