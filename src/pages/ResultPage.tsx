import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, FileText } from 'lucide-react';
import { AssessmentBadge } from '../components/AssessmentBadge';
import { useSession } from '../context/SessionContext';

export function ResultPage() {
  const { id } = useParams<{ id?: string }>();
  const { t, results, activeResult, selectResult } = useSession();

  useEffect(() => {
    if (id) {
      selectResult(id);
    }
  }, [id, selectResult]);

  if (!activeResult) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2D] p-10 text-center">
        <h1 className="font-display font-bold text-xl text-slate-900 dark:text-[#E8EDF7]">
          {t.result.noResultTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          {t.result.noResultBody}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/news"
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
          >
            {t.nav.news}
          </Link>
          <Link
            to="/image"
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
          >
            {t.nav.image}
          </Link>
          <Link
            to="/video"
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
          >
            {t.nav.video}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Session Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-[#E8EDF7]">
            {t.result.title}
          </h1>
          <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">
            {activeResult.analysis_id} · {activeResult.module.toUpperCase()} ·{' '}
            {new Date(activeResult.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {results.length > 1 && (
            <select
              aria-label={t.result.selectSessionItem}
              value={activeResult.analysis_id}
              onChange={(e) => selectResult(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2D] text-xs font-medium text-slate-900 dark:text-[#E8EDF7]"
            >
              {results.map((r) => (
                <option key={r.analysis_id} value={r.analysis_id}>
                  {r.analysis_id} — {r.title.slice(0, 42)}
                </option>
              ))}
            </select>
          )}
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t.result.openReportPreview}</span>
          </Link>
        </div>
      </div>

      {/* Primary Assessment Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-[#E8EDF7] max-w-3xl">
            {activeResult.title}
          </h2>
          <div className="flex items-center gap-3">
            <AssessmentBadge assessment={activeResult.assessment} size="md" />
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {t.common.confidence}: {activeResult.confidence}
            </span>
          </div>
        </div>

        {activeResult.ai_status?.mode === 'local_fallback' && (
          <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300">
            {activeResult.ai_status.status_message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.result.summaryHeading}
              </h3>
              <p className="mt-1.5 text-sm text-slate-900 dark:text-[#E8EDF7] leading-relaxed">
                {activeResult.summary}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.result.explanationHeading}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeResult.explanation}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2.5 text-xs border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7] mb-2">
              {t.result.indicatorsHeading}
            </h3>
            <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400">{t.result.verificationStatus}</span>
              <span className="font-semibold text-slate-900 dark:text-[#E8EDF7]">
                {t.assessments[activeResult.indicators.verification_status]}
              </span>
            </div>
            <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400">{t.result.evidenceStrength}</span>
              <span className="text-right text-slate-900 dark:text-[#E8EDF7]">
                {activeResult.indicators.evidence_strength}
              </span>
            </div>
            <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400">{t.result.sourceReliability}</span>
              <span className="text-right text-slate-900 dark:text-[#E8EDF7]">
                {activeResult.indicators.source_reliability}
              </span>
            </div>
            <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400">{t.result.modelConfidence}</span>
              <span className="text-right text-slate-900 dark:text-[#E8EDF7]">
                {activeResult.indicators.model_confidence}
              </span>
            </div>
            <div className="flex justify-between gap-3 py-1.5">
              <span className="text-slate-500 dark:text-slate-400">{t.result.forensicAnomalies}</span>
              <span className="text-right text-slate-900 dark:text-[#E8EDF7]">
                {activeResult.indicators.forensic_anomalies}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Findings & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
          <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-3">
            {t.result.findingsHeading}
          </h3>
          {activeResult.findings.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No discrete findings logged.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
              {activeResult.findings.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
          <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-3">
            {t.result.evidenceHeading}
          </h3>
          {activeResult.evidence.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.result.noEvidenceNote}</p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeResult.evidence.map((ev, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {ev.stance.toUpperCase()} · {ev.publisher}
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-[#E8EDF7] mt-0.5">
                      {ev.title}
                    </p>
                    {ev.snippet && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{ev.snippet}</p>
                    )}
                  </div>
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Source</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Limitations & Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
          <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-3">
            {t.result.limitationsHeading}
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
            {activeResult.limitations.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
          <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-3">
            {t.result.nextStepsHeading}
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
            {activeResult.next_steps.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
