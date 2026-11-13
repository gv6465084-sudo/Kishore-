import { RefreshCw, Trash2 } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export function SettingsPage() {
  const { t, language, setLanguage, theme, toggleTheme, health, refreshHealth, results, clearSession } =
    useSession();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-[#E8EDF7]">
          {t.settings.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.settings.subtitle}</p>
      </div>

      {/* Language Setting */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7]">
            {t.settings.languageHeading}
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t.settings.languageDesc}</p>
        </div>
        <div className="inline-flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#080D18] shrink-0">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              language === 'en' ? 'bg-[#2563EB] text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              language === 'ta' ? 'bg-[#2563EB] text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            தமிழ் (Tamil)
          </button>
        </div>
      </div>

      {/* Theme Setting */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7]">
            {t.settings.themeHeading}
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t.settings.themeDesc}</p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-[#E8EDF7] hover:border-[#2563EB] transition-colors shrink-0"
        >
          {theme === 'dark' ? t.topbar.lightMode : t.topbar.darkMode}
        </button>
      </div>

      {/* Backend Capabilities */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7]">
            {t.settings.backendStatusHeading}
          </h2>
          <button
            type="button"
            onClick={() => void refreshHealth()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Gemini Multimodal Engine</span>
            <span className="font-mono">
              {health?.capabilities.gemini_configured ? t.common.configured : t.common.notConfigured}
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Google Fact Check Tools API</span>
            <span className="font-mono">
              {health?.capabilities.fact_check_api_configured
                ? t.common.configured
                : t.common.notConfigured}
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Local Forensics Engine (EXIF / ELA)</span>
            <span className="font-mono">
              {health?.capabilities.local_forensics_available
                ? t.common.available
                : t.common.unavailable}
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">FFmpeg Frame Extraction</span>
            <span className="font-mono">
              {health?.capabilities.ffmpeg_available ? t.common.available : t.common.unavailable}
            </span>
          </div>
        </div>
      </div>

      {/* Session Clear */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7]">
            {t.settings.sessionDataHeading} ({results.length})
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t.settings.sessionDataDesc}</p>
        </div>
        <button
          type="button"
          onClick={clearSession}
          disabled={results.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 text-xs font-semibold text-[#DC2626] hover:border-[#DC2626] transition-colors shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{t.dashboard.clearSession}</span>
        </button>
      </div>
    </div>
  );
}
