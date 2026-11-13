import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Newspaper,
  Send,
} from 'lucide-react';
import { AssessmentBadge } from '../components/AssessmentBadge';
import { apiUrl, useSession } from '../context/SessionContext';
import type { AnalysisResult } from '../types/analysis';

type NewsInputMode = 'article' | 'headline' | 'social' | 'url';

export function NewsCheckPage() {
  const { t, language, addResult } = useSession();
  const [inputMode, setInputMode] = useState<NewsInputMode>('article');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [evidenceUrlsText, setEvidenceUrlsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(null);
  const [lastRequestKey, setLastRequestKey] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedContent = (inputMode === 'url' ? urlInput : textInput).trim().replace(/\s+/g, ' ');
    const evidenceUrls = evidenceUrlsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//i.test(s));
    const requestKey = JSON.stringify({
      inputMode,
      normalizedContent,
      evidenceUrls,
      language,
    });

    if (
      latestResult &&
      lastRequestKey === requestKey &&
      latestResult.ai_status?.mode !== 'local_fallback'
    ) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/news/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_mode: inputMode,
          text: inputMode === 'url' ? undefined : textInput,
          url: inputMode === 'url' ? urlInput : undefined,
          evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
          language,
        }),
      });

      const data = (await res.json()) as AnalysisResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'News verification request failed.');
      }

      addResult(data);
      setLatestResult(data);
      setLastRequestKey(requestKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error during news verification.');
    } finally {
      setLoading(false);
    }
  };

  const applySample = (kind: 'verified' | 'tamil' | 'misleading' | 'contradicted') => {
    setError(null);
    if (kind === 'verified') {
      setInputMode('headline');
      setTextInput(
        'NASA’s James Webb Space Telescope launched in December 2021 and observes infrared light from the L2 Lagrange point.'
      );
    } else if (kind === 'contradicted') {
      setInputMode('headline');
      setTextInput(
        'NASA’s James Webb Space Telescope launched in 1995 and currently orbits the planet Jupiter.'
      );
    } else if (kind === 'tamil') {
      setInputMode('social');
      setTextInput(
        'சந்திரயான்-3 விண்கலம் நிலவின் தென் துருவப் பகுதியில் 2023 ஆகஸ்ட் மாதம் வெற்றிகரமாக தரையிறங்கியது.'
      );
    } else {
      setInputMode('social');
      setTextInput(
        'URGENT SHARE BEFORE DELETED: A secret government order starting Monday will freeze 100% of citizen bank accounts for 90 days unless citizens pay an immediate verification fee!'
      );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-[#E8EDF7]">
          {t.news.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.news.subtitle}</p>
      </div>

      {/* Input Card */}
      <form
        onSubmit={handleAnalyze}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#080D18] border border-slate-200 dark:border-slate-800"
            role="tablist"
            aria-label="News Input Method"
          >
            {(
              [
                ['article', t.news.modeArticle],
                ['headline', t.news.modeHeadline],
                ['social', t.news.modeSocial],
                ['url', t.news.modeUrl],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={inputMode === mode}
                onClick={() => {
                  setInputMode(mode);
                  setError(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  inputMode === mode
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{t.news.samplesLabel}</span>
            <button
              type="button"
              onClick={() => applySample('verified')}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB] transition-colors"
            >
              {t.news.sampleEnglishClaim}
            </button>
            <button
              type="button"
              onClick={() => applySample('tamil')}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB] transition-colors"
            >
              {t.news.sampleTamilClaim}
            </button>
            <button
              type="button"
              onClick={() => applySample('contradicted')}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB] transition-colors"
            >
              {t.news.sampleContradicted}
            </button>
            <button
              type="button"
              onClick={() => applySample('misleading')}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB] transition-colors"
            >
              {t.news.sampleMisleading}
            </button>
          </div>
        </div>

        {inputMode === 'url' ? (
          <div>
            <label
              htmlFor="news-url-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              {t.news.inputLabelUrl}
            </label>
            <div className="relative">
              <Globe className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="news-url-input"
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t.news.placeholderUrl}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080D18] text-sm text-slate-900 dark:text-[#E8EDF7] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="news-text-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              {t.news.inputLabelText}
            </label>
            <textarea
              id="news-text-input"
              rows={inputMode === 'headline' ? 3 : 6}
              required
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t.news.placeholderText}
              className="w-full p-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080D18] text-sm text-slate-900 dark:text-[#E8EDF7] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="news-evidence-urls"
            className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
          >
            {language === 'ta'
              ? 'விருப்பமான ஆதார இணைப்புகள் (ஒவ்வொரு வரியிலும் ஒரு URL)'
              : 'Optional Reference Source URLs (one per line for Free-Mode cross-checking)'}
          </label>
          <input
            id="news-evidence-urls"
            type="text"
            value={evidenceUrlsText}
            onChange={(e) => setEvidenceUrlsText(e.target.value)}
            placeholder="https://reuters.com/..., https://pib.gov.in/..."
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080D18] text-xs text-slate-900 dark:text-[#E8EDF7] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/10 px-4 py-3 text-sm text-[#DC2626] dark:text-red-300 flex items-start gap-2.5"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {t.common.errorPrefix} {error}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Language: {language === 'ta' ? 'தமிழ் (Tamil)' : 'English'} · Free Local Heuristics + Open Reference + Gemini Free Tier
          </span>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{loading ? t.news.analyzing : t.news.analyzeButton}</span>
          </button>
        </div>

        <details className="pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
          <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300 hover:text-[#2563EB] select-none">
            {t.news.guideTitle}
          </summary>
          <ul className="mt-2.5 space-y-1.5 list-disc list-inside leading-relaxed">
            {t.news.guideSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </details>
      </form>

      {/* Inline Verification Output */}
      {latestResult && latestResult.news_details && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <Newspaper className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>{latestResult.analysis_id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{latestResult.news_details.input_mode}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t.common.confidence}: {latestResult.confidence}
                  </span>
                </div>
                <h2 className="font-display font-bold text-xl text-slate-900 dark:text-[#E8EDF7]">
                  {latestResult.title}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <AssessmentBadge assessment={latestResult.assessment} size="md" />
                <Link
                  to="/report"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#2563EB] transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{t.result.openReportPreview}</span>
                </Link>
              </div>
            </div>

            {latestResult.ai_status?.mode === 'local_fallback' && (
              <div className="mt-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                {latestResult.ai_status.status_message}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t.result.summaryHeading}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {latestResult.summary}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t.result.explanationHeading}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {latestResult.explanation}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-3 text-xs border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">{t.result.evidenceStrength}</span>
                  <span className="font-medium text-right text-slate-900 dark:text-[#E8EDF7]">
                    {latestResult.indicators.evidence_strength}
                  </span>
                </div>
                <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">{t.result.sourceReliability}</span>
                  <span className="font-medium text-right text-slate-900 dark:text-[#E8EDF7]">
                    {latestResult.indicators.source_reliability}
                  </span>
                </div>
                <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">{t.result.forensicAnomalies}</span>
                  <span className="font-medium text-right text-slate-900 dark:text-[#E8EDF7]">
                    {latestResult.indicators.forensic_anomalies}
                  </span>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Fact Check Tools API</span>
                  <span className="font-mono text-slate-900 dark:text-[#E8EDF7]">
                    {latestResult.news_details.fact_check_api_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Claims & Signals */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
              <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-4">
                {t.news.extractedClaims}
              </h3>
              {latestResult.news_details.extracted_claims.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {latestResult.news_details.original_claim}
                </p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {latestResult.news_details.extracted_claims.map((c, idx) => (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900 dark:text-[#E8EDF7]">
                          {c.claim}
                        </p>
                        <AssessmentBadge assessment={c.status} />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{c.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-5">
              <div>
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.news.namedEntities}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {latestResult.news_details.named_entities.length > 0
                    ? latestResult.news_details.named_entities.join(' · ')
                    : 'None extracted'}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.news.manipulationSignals}
                </h3>
                {latestResult.news_details.manipulation_signals.length === 0 ? (
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    No overt manipulative framing detected.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-amber-600 dark:text-amber-300 list-disc list-inside">
                    {latestResult.news_details.manipulation_signals.map((sig, i) => (
                      <li key={i}>{sig}</li>
                    ))}
                  </ul>
                )}
              </div>
              {latestResult.news_details.unsupported_numbers.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                    {t.news.unsupportedNumbers}
                  </h3>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                    {latestResult.news_details.unsupported_numbers.map((num, i) => (
                      <li key={i}>{num}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Sources */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-4">
              {t.result.evidenceHeading}
            </h3>
            {latestResult.evidence.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.result.noEvidenceNote}</p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {latestResult.evidence.map((ev, idx) => (
                  <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold uppercase text-slate-700 dark:text-slate-200">
                          {ev.stance === 'supporting'
                            ? t.result.supportingLabel
                            : ev.stance === 'contradicting'
                              ? t.result.contradictingLabel
                              : t.result.contextualLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.publisher}</span>
                        {ev.published_date && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{ev.published_date}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-[#E8EDF7] truncate">
                        {ev.title}
                      </p>
                      {ev.snippet && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">{ev.snippet}</p>
                      )}
                    </div>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>Open Source</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
