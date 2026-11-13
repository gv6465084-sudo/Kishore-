import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  ScanSearch,
  Upload,
} from 'lucide-react';
import { AssessmentBadge } from '../components/AssessmentBadge';
import { useSession } from '../context/SessionContext';
import type { AnalysisResult } from '../types/analysis';
import { analyzeMediaFile } from '../utils/ephemeralUpload';

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;

export function ImageCheckPage() {
  const { t, language, health, addResult } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastRequestKey, setLastRequestKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'original' | 'ela' | 'split'>('split');

  const handleSelectedFile = (candidate: File | null) => {
    setError(null);
    if (!candidate) return;

    if (!ALLOWED_EXT.test(candidate.name) && !/^image\/(jpeg|jpg|png|webp)$/i.test(candidate.type)) {
      setError(`${t.common.invalidFileType} (JPG, JPEG, PNG, WebP)`);
      return;
    }

    if (candidate.size > MAX_BYTES) {
      setError(t.common.fileTooLarge);
      return;
    }

    setFile(candidate);
    setResult(null);
    setLastRequestKey(null);
    const reader = new FileReader();
    reader.onload = () => {
      setLocalPreview(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(candidate);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError(null);

    const requestKey = `${file.name}:${file.size}:${file.lastModified}:${language}`;
    if (result && lastRequestKey === requestKey && result.ai_status?.mode !== 'local_fallback') {
      return;
    }

    setLoading(true);
    setUploadProgress(null);

    try {
      const data = await analyzeMediaFile({
        endpoint: '/api/image/analyze',
        file,
        language,
        fallbackError: 'Image forensic analysis failed',
        serverless: Boolean(health?.capabilities.serverless),
        onUploadProgress: (label) => setUploadProgress(label),
      });

      addResult(data);
      setResult(data);
      setLastRequestKey(requestKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error analyzing image.');
    } finally {
      setUploadProgress(null);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-[#E8EDF7]">
          {t.image.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.image.subtitle}</p>
      </div>

      {/* Upload Dropzone */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleSelectedFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-[#2563EB] bg-[#2563EB]/10'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080D18]/60'
          }`}
        >
          <Upload className="h-8 w-8 text-[#2563EB] mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-900 dark:text-[#E8EDF7]">
            {t.image.dropPrompt}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.image.dropHint}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              handleSelectedFile(e.target.files?.[0] ?? null);
              e.currentTarget.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2D] text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-[#2563EB] transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
            <span>{t.image.selectFile}</span>
          </button>
        </div>

        {file && localPreview && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src={localPreview}
                alt={file.name}
                className="h-14 w-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-[#E8EDF7] truncate">
                  {file.name}
                </p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              <span>
                {loading
                  ? uploadProgress
                    ? `Uploading ${uploadProgress}...`
                    : t.image.analyzing
                  : t.image.analyzeButton}
              </span>
            </button>
          </div>
        )}

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
      </div>

      {/* Results View */}
      {result && result.image_details && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>{result.analysis_id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{result.image_details.format}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {result.image_details.width}×{result.image_details.height}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t.common.confidence}: {result.confidence}
                  </span>
                </div>
                <h2 className="mt-1 font-display font-bold text-xl text-slate-900 dark:text-[#E8EDF7]">
                  {result.title}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <AssessmentBadge assessment={result.assessment} size="md" />
                <Link
                  to="/report"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#2563EB]"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{t.result.openReportPreview}</span>
                </Link>
              </div>
            </div>

            {result.ai_status?.mode === 'local_fallback' && (
              <div className="mt-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                {result.ai_status.status_message}
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <p className="text-sm font-medium text-slate-900 dark:text-[#E8EDF7] leading-relaxed">
                  {result.summary}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {result.explanation}
                </p>
              </div>
              <div className="lg:col-span-5 space-y-2 text-xs border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">{t.image.formatLabel}</span>
                  <span className="font-mono text-slate-900 dark:text-[#E8EDF7]">
                    {result.image_details.format} ({result.image_details.mime_type})
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">{t.image.dimensionsLabel}</span>
                  <span className="font-mono text-slate-900 dark:text-[#E8EDF7]">
                    {result.image_details.width} × {result.image_details.height} px
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">{t.image.fileSizeLabel}</span>
                  <span className="font-mono text-slate-900 dark:text-[#E8EDF7]">
                    {(result.image_details.file_size_bytes / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">{t.image.exifLabel}</span>
                  <span className="font-mono text-slate-900 dark:text-[#E8EDF7]">
                    {result.image_details.has_exif ? t.image.exifPresent : t.image.exifAbsent}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Viewer: Original vs ELA Heatmap */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7]">
                  {t.image.elaMetricsTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {result.image_details.ela_stats.interpretation_note}
                </p>
              </div>
              <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#080D18] border border-slate-200 dark:border-slate-800">
                {(
                  [
                    ['original', t.image.previewTabOriginal],
                    ['ela', t.image.previewTabEla],
                    ['split', t.image.previewTabSplit],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewMode === mode
                        ? 'bg-[#2563EB] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`grid gap-4 ${
                viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {(viewMode === 'original' || viewMode === 'split') && (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col">
                  <div className="px-3 py-2 text-xs font-mono text-slate-400 border-b border-slate-800">
                    {t.image.previewTabOriginal}
                  </div>
                  <img
                    src={result.image_details.original_preview_data_url || localPreview || ''}
                    alt="Original uploaded image"
                    className="w-full max-h-96 object-contain mx-auto"
                  />
                </div>
              )}

              {(viewMode === 'ela' || viewMode === 'split') &&
                result.image_details.ela_heatmap_data_url && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col">
                    <div className="px-3 py-2 text-xs font-mono text-slate-400 border-b border-slate-800 flex justify-between">
                      <span>{t.image.previewTabEla}</span>
                      <span>
                        mean {result.image_details.ela_stats.mean_difference} · high-var{' '}
                        {result.image_details.ela_stats.high_variance_ratio}%
                      </span>
                    </div>
                    <img
                      src={result.image_details.ela_heatmap_data_url}
                      alt="Error Level Analysis compression residual visualization"
                      className="w-full max-h-96 object-contain mx-auto"
                    />
                  </div>
                )}
            </div>
          </div>

          {/* EXIF & Classifier Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
              <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-3">
                {t.image.metadataTitle}
              </h3>
              {result.image_details.has_exif ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {Object.entries(result.image_details.exif_summary).map(([k, v]) => (
                    <div key={k} className="py-2 flex justify-between gap-4">
                      <span className="font-mono text-slate-500 dark:text-slate-400">{k}</span>
                      <span className="font-mono text-slate-900 dark:text-[#E8EDF7] text-right truncate max-w-[240px]">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  No EXIF camera tags found. Note: messaging apps, screenshots, and web exports commonly strip EXIF headers; missing EXIF is not proof of tampering.
                </p>
              )}
            </div>

            <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-4">
              <div>
                <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7]">
                  {t.image.specialisedClassifierTitle}
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {result.image_details.specialised_detector.status_message}
                </p>
                {result.image_details.specialised_detector.available && (
                  <p className="mt-2 text-sm font-mono text-[#2563EB]">
                    {result.image_details.specialised_detector.top_label} (
                    {result.image_details.specialised_detector.confidence}%)
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.result.findingsHeading}
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {result.findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Next Steps & Limitations */}
          {(result.limitations.length > 0 || result.next_steps.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.limitations.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
                  <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7] mb-2">
                    {t.result.limitationsHeading}
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                    {result.limitations.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.next_steps.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
                  <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7] mb-2">
                    {t.result.nextStepsHeading}
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                    {result.next_steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
