import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translations, type TranslationDict } from '../i18n/translations';
import type { AnalysisResult, HealthResponse, LanguageCode } from '../types/analysis';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';

export function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE.replace(/\/$/, '')}${path}`;
}

interface SessionContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDict;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  results: AnalysisResult[];
  activeResultId: string | null;
  activeResult: AnalysisResult | null;
  addResult: (result: AnalysisResult) => void;
  selectResult: (id: string) => void;
  clearSession: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  health: HealthResponse | null;
  refreshHealth: () => Promise<void>;
  downloadReport: (result: AnalysisResult, format: 'pdf' | 'json' | 'markdown') => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const refreshHealth = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/health'));
      if (res.ok) {
        const data = (await res.json()) as HealthResponse;
        setHealth(data);
      }
    } catch {
      // Ignore offline transient check errors
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const addResult = useCallback((result: AnalysisResult) => {
    setResults((prev) => [result, ...prev]);
    setActiveResultId(result.analysis_id);
  }, []);

  const selectResult = useCallback((id: string) => {
    setActiveResultId(id);
  }, []);

  const clearSession = useCallback(() => {
    setResults([]);
    setActiveResultId(null);
    setSearchQuery('');
  }, []);

  const downloadReport = useCallback(async (result: AnalysisResult, format: 'pdf' | 'json' | 'markdown') => {
    const ext = format === 'markdown' ? 'md' : format;
    const res = await fetch(apiUrl(`/api/report/${format}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errData.error || 'Failed to generate report.');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `truthscan-${result.analysis_id}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  const activeResult =
    results.find((r) => r.analysis_id === activeResultId) ?? results[0] ?? null;

  return (
    <SessionContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        theme,
        toggleTheme,
        results,
        activeResultId,
        activeResult,
        addResult,
        selectResult,
        clearSession,
        searchQuery,
        setSearchQuery,
        health,
        refreshHealth,
        downloadReport,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
}
