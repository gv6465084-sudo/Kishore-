import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  FileText,
  Film,
  Loader2,
  ScanSearch,
  Upload,
} from 'lucide-react';
import { AssessmentBadge } from '../components/AssessmentBadge';
import { useSession } from '../context/SessionContext';
import type { AnalysisResult } from '../types/analysis';
import {
  analyzeMediaFile,
  extractClientVideoFramesAndAnalyze,
} from '../utils/ephemeralUpload';

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXT = /\.(mp4|mov|webm|m4v|avi)$/i;

export function VideoCheckPage() {
  const { t, language, addResult } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastRequestKey, setLastRequestKey] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoObjectUrl) {
        URL.revokeObjectURL(videoObjectUrl);
      }
    };
  }, [videoObjectUrl]);

  const handleSelectedFile = (candidate: File | null) => {
    setError(null);
    if (!candidate) return;

    if (
      !ALLOWED_EXT.test(candidate.name) &&
      !/^video\/(mp4|quicktime|webm|x-m4v|x-msvideo|avi)$/i.test(candidate.type)
    ) {
      setError(`${t.common.invalidFileType} (MP4, MOV, WEBM, M4V)`);
      return;
    }

    if (candidate.size > MAX_BYTES) {
      setError(t.common.fileTooLarge);
      return;
    }

    if (videoObjectUrl) {
      URL.revokeObjectURL(videoObjectUrl);
    }

    setFile(candidate);
    setResult(null);
    setLastRequestKey(null);
    setVideoObjectUrl(URL.createObjectURL(candidate));
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
      let data: AnalysisResult;
      try {
        data = await analyzeMediaFile({
          endpoint: '/api/video/analyze',
          file,
          language,
          fallbackError: 'Video verification failed',
          onUploadProgress: (label) => setUploadProgress(label),
        });
      } catch (uploadErr) {
        // If hosted proxy or slow mobile network drops raw video upload (e.g. TypeError: Failed to fetch),
        // fall back cleanly to sampling frames directly from the browser's decoded video.
        if (uploadErr instanceof TypeError) {
          setUploadProgress(null);
          data = await extractClientVideoFramesAndAnalyze({ file, language });
        } else {
          throw uploadErr;
        }
      }

      addResult(data);
      setResult(data);
      setLastRequestKey(requestKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error analyzing video.');
    } finally {
      setUploadProgress(null);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-[#E8EDF7]">
          {t.video.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.video.subtitle}</p>
      </div>

      {/* Upload Box */}
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
              ? 'border-[#7C3AED] bg-[#7C3AED]/10'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080D18]/60'
          }`}
        >
          <Upload className="h-8 w-8 text-[#7C3AED] mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-900 dark:text-[#E8EDF7]">
            {t.video.dropPrompt}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.video.dropHint}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mov,.webm,.m4v,.avi,video/mp4,video/quicktime,video/webm,video/x-m4v,video/x-msvideo"
            className="hidden"
            onChange={(e) => {
              handleSelectedFile(e.target.files?.[0] ?? null);
              e.currentTarget.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2D] text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-[#7C3AED] transition-colors"
          >
            <Film className="h-4 w-4" />
            <span>{t.video.selectFile}</span>
          </button>
        </div>

        {file && videoObjectUrl && (
          <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <video
              src={videoObjectUrl}
              controls
              className="w-full max-h-80 rounded-lg bg-black border border-slate-200 dark:border-slate-800"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-[#E8EDF7]">{file.name}</p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
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
                      : t.video.analyzing
                    : t.video.analyzeButton}
                </span>
              </button>
            </div>
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
      {result && result.video_details && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>{result.analysis_id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{result.video_details.resolution}</span>
                  <span aria-hidden="true">·</span>
                  <span>{result.video_details.duration_sec}s</span>
                  <span aria-hidden="true">·</span>
                  <span>{result.video_details.fps} fps</span>
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
                <p className="font-semibold text-slate-900 dark:text-[#E8EDF7] mb-2">
                  {t.video.containerMetadata}
                </p>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">Video Codec</span>
                  <span className="font-mono">{result.video_details.codec}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
                  <span className="text-slate-500 dark:text-slate-400">Duration</span>
                  <span className="font-mono">{result.video_details.duration_sec} s</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Audio Stream</span>
                  <span className="font-mono">
                    {result.video_details.has_audio
                      ? `${result.video_details.audio_codec} (${result.video_details.audio_sample_rate ?? ''})`
                      : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Separated 4 Verification Tracks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.video.trackVisual}
                </h3>
                <span className="text-xs font-mono text-[#16A34A]">
                  {result.video_details.tracks.general_visual_analysis.status === 'local_only'
                    ? 'Local FFmpeg'
                    : t.common.available}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.video_details.tracks.general_visual_analysis.summary}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400 list-disc list-inside">
                {result.video_details.tracks.general_visual_analysis.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.video.trackDeepfake}
                </h3>
                <span
                  className={`text-xs font-mono ${
                    result.video_details.tracks.specialised_deepfake_detection.available
                      ? 'text-[#16A34A]'
                      : 'text-amber-500'
                  }`}
                >
                  {result.video_details.tracks.specialised_deepfake_detection.available
                    ? t.common.available
                    : t.common.unavailable}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.video_details.tracks.specialised_deepfake_detection.status_message}
              </p>
              {result.video_details.tracks.specialised_deepfake_detection.findings.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs font-mono text-[#2563EB]">
                  {result.video_details.tracks.specialised_deepfake_detection.findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.video.trackAudio}
                </h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {result.video_details.tracks.audio_analysis.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.video_details.tracks.audio_analysis.summary}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.video.trackLipSync}
                </h3>
                <span className="text-xs font-mono text-amber-500">{t.common.unavailable}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.video_details.tracks.lip_sync_analysis.summary}
              </p>
            </div>
          </div>

          {/* Contact Sheet & Timestamped Frames */}
          {result.video_details.contact_sheet_data_url && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-5">
              <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7]">
                {t.video.contactSheetTitle}
              </h3>
              <img
                src={result.video_details.contact_sheet_data_url}
                alt="Extracted video frame contact sheet"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800"
              />

              <div>
                <h4 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7] mb-3">
                  {t.video.framesTitle}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {result.video_details.frames.map((frame, i) => (
                    <div
                      key={i}
                      className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950"
                    >
                      <img
                        src={frame.data_url}
                        alt={`Video frame at ${frame.timestamp_label}`}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="px-2 py-1 text-[11px] font-mono text-slate-300 text-center">
                        {frame.timestamp_label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Limitations & Next Steps */}
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
