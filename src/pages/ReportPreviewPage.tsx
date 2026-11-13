import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Download, FileCode2, FileText, Loader2 } from 'lucide-react';
import { AssessmentBadge } from '../components/AssessmentBadge';
import { TruthScanLogo } from '../components/TruthScanLogo';
import { useSession } from '../context/SessionContext';

export function ReportPreviewPage() {
  const { t, results, activeResult, selectResult, downloadReport } = useSession();
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'json' | 'markdown' | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'json' | 'markdown') => {
    if (!activeResult) return;
    setError(null);
    setDownloadingFormat(format);
    try {
      await downloadReport(activeResult, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (!activeResult) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2D] p-10 text-center">
        <h1 className="font-display font-bold text-xl text-slate-900 dark:text-[#E8EDF7]">
          {t.report.noReportTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          {t.report.noReportBody}
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
          >
            {t.nav.dashboard}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-[#E8EDF7]">
            {t.report.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.report.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {results.length > 1 && (
            <select
              value={activeResult.analysis_id}
              onChange={(e) => selectResult(e.target.value)}
              aria-label={t.result.selectSessionItem}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2D] text-xs font-medium text-slate-900 dark:text-[#E8EDF7]"
            >
              {results.map((r) => (
                <option key={r.analysis_id} value={r.analysis_id}>
                  {r.analysis_id} — {r.title.slice(0, 32)}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('pdf')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            {downloadingFormat === 'pdf' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>{downloadingFormat === 'pdf' ? t.report.downloading : t.report.downloadPdf}</span>
          </button>

          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('json')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2D] hover:border-[#2563EB] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>{t.report.downloadJson}</span>
          </button>

          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('markdown')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2D] hover:border-[#2563EB] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t.report.downloadMarkdown}</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/10 px-4 py-3 text-sm text-[#DC2626] dark:text-red-300 flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Formatted Document Sheet */}
      <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <TruthScanLogo size={32} animated={false} />
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-[#E8EDF7]">
                {t.brand} — Verification Report
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.tagline}</p>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 space-y-0.5 text-right">
            <p>ID: {activeResult.analysis_id}</p>
            <p>Date: {new Date(activeResult.created_at).toUTCString()}</p>
            <p>
              Module: {activeResult.module.toUpperCase()} · Lang: {activeResult.language.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display font-bold text-xl text-slate-900 dark:text-[#E8EDF7]">
            {activeResult.title}
          </h3>
          <AssessmentBadge assessment={activeResult.assessment} size="md" />
        </div>

        <section className="space-y-2">
          <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
            {t.result.summaryHeading}
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {activeResult.summary}
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
            {t.result.explanationHeading}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {activeResult.explanation}
          </p>
        </section>

        {activeResult.evidence.length > 0 && (
          <section className="space-y-2">
            <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
              {t.result.evidenceHeading}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {activeResult.evidence.map((ev, i) => (
                <li key={i}>
                  <span className="font-mono uppercase font-semibold">[{ev.stance}]</span> {ev.title}{' '}
                  — {ev.publisher} ({ev.url})
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7] mb-2">
              {t.result.limitationsHeading}
            </h4>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
              {activeResult.limitations.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7] mb-2">
              {t.result.nextStepsHeading}
            </h4>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
              {activeResult.next_steps.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </div>
  );
}
