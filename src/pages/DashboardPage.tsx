import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Image as ImageIcon,
  Newspaper,
  ShieldCheck,
  Trash2,
  Video,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AssessmentBadge } from '../components/AssessmentBadge';
import { useSession } from '../context/SessionContext';
import type { AssessmentCategory } from '../types/analysis';

const CATEGORY_COLORS: Record<AssessmentCategory, string> = {
  Verified: '#16A34A',
  Contradicted: '#DC2626',
  Misleading: '#F59E0B',
  Suspicious: '#D97706',
  Inconclusive: '#64748B',
};

export function DashboardPage() {
  const { t, results, clearSession, selectResult, searchQuery, health } = useSession();
  const navigate = useNavigate();

  const newsCount = results.filter((r) => r.module === 'news').length;
  const imageCount = results.filter((r) => r.module === 'image').length;
  const videoCount = results.filter((r) => r.module === 'video').length;

  const categories: AssessmentCategory[] = [
    'Verified',
    'Contradicted',
    'Misleading',
    'Suspicious',
    'Inconclusive',
  ];

  const chartData = categories.map((cat) => ({
    key: cat,
    label: t.assessments[cat],
    count: results.filter((r) => r.assessment === cat).length,
    color: CATEGORY_COLORS[cat],
  }));

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredResults = normalizedSearch
    ? results.filter(
        (r) =>
          r.title.toLowerCase().includes(normalizedSearch) ||
          r.assessment.toLowerCase().includes(normalizedSearch) ||
          r.module.toLowerCase().includes(normalizedSearch) ||
          r.analysis_id.toLowerCase().includes(normalizedSearch)
      )
    : results;

  const handleInspect = (id: string) => {
    selectResult(id);
    navigate(`/result/${id}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-[#E8EDF7]">
            {t.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.dashboard.subtitle}</p>
        </div>

        {results.length > 0 && (
          <button
            type="button"
            onClick={clearSession}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#DC2626] hover:text-[#DC2626] transition-colors whitespace-nowrap self-start"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t.dashboard.clearSession}</span>
          </button>
        )}
      </div>

      {/* Session KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.dashboard.totalAnalyses, value: results.length },
          { label: t.dashboard.newsAnalyses, value: newsCount },
          { label: t.dashboard.imageAnalyses, value: imageCount },
          { label: t.dashboard.videoAnalyses, value: videoCount },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-5"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-slate-900 dark:text-[#E8EDF7]">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Module Shortcuts */}
      <div>
        <h2 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-3">
          {t.dashboard.moduleShortcutsTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/news"
            className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] hover:border-[#2563EB] p-5 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Newspaper className="h-5 w-5 text-[#2563EB] shrink-0" />
              <div>
                <p className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.nav.news}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Article · Headline · URL · தமிழ்
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
          </Link>

          <Link
            to="/image"
            className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] hover:border-[#2563EB] p-5 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <ImageIcon className="h-5 w-5 text-[#2563EB] shrink-0" />
              <div>
                <p className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.nav.image}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  EXIF · ELA Heatmap · Classifier
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
          </Link>

          <Link
            to="/video"
            className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] hover:border-[#7C3AED] p-5 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Video className="h-5 w-5 text-[#7C3AED] shrink-0" />
              <div>
                <p className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                  {t.nav.video}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  FFmpeg Frames · Deepfake Triage
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#7C3AED] transition-colors" />
          </Link>
        </div>
      </div>

      {/* Empty State OR Populated Distribution + Activity */}
      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111B2D] p-10 text-center">
          <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-[#E8EDF7]">
            {t.dashboard.emptyTitle}
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {t.dashboard.emptyBody}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/news"
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              {t.dashboard.startNewsCheck}
            </Link>
            <Link
              to="/image"
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#2563EB] transition-colors"
            >
              {t.dashboard.startImageCheck}
            </Link>
            <Link
              to="/video"
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#7C3AED] transition-colors"
            >
              {t.dashboard.startVideoCheck}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Distribution Chart */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-4">
              {t.dashboard.distributionTitle}
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: '8px',
                      color: '#E8EDF7',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Table */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 overflow-hidden">
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7] mb-4">
              {t.dashboard.recentActivityTitle}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <th className="pb-2.5 font-medium">{t.dashboard.tableSubject}</th>
                    <th className="pb-2.5 font-medium">{t.dashboard.tableModule}</th>
                    <th className="pb-2.5 font-medium">{t.dashboard.tableAssessment}</th>
                    <th className="pb-2.5 font-medium">{t.dashboard.tableConfidence}</th>
                    <th className="pb-2.5 font-medium text-right">{t.dashboard.tableAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {filteredResults.map((item) => (
                    <tr
                      key={item.analysis_id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/35 transition-colors"
                    >
                      <td className="py-3 pr-3 max-w-[220px]">
                        <p className="font-medium text-slate-900 dark:text-[#E8EDF7] truncate">
                          {item.title}
                        </p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          {item.analysis_id} · {new Date(item.created_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="py-3 pr-3 text-xs font-mono uppercase text-slate-600 dark:text-slate-300">
                        {item.module}
                      </td>
                      <td className="py-3 pr-3">
                        <AssessmentBadge assessment={item.assessment} />
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600 dark:text-slate-300">
                        {item.confidence}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleInspect(item.analysis_id)}
                          className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
                        >
                          {t.dashboard.inspect}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Backend Capabilities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 flex items-start gap-4">
          <ShieldCheck className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
              {t.dashboard.privacyStatusTitle}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.dashboard.privacyStatusBody}
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6">
          <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7] mb-3">
            {t.dashboard.capabilitiesTitle}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Gemini Multimodal</span>
              <span className="font-mono text-slate-900 dark:text-[#E8EDF7]">
                {health?.capabilities.gemini_configured ? t.common.configured : t.common.notConfigured}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">FFmpeg Pipeline</span>
              <span className="font-mono text-slate-900 dark:text-[#E8EDF7]">
                {health?.capabilities.ffmpeg_available ? t.common.available : t.common.unavailable}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600 dark:text-slate-400">Fact Check Tools API</span>
              <span className="font-mono text-slate-900 dark:text-[#E8EDF7]">
                {health?.capabilities.fact_check_api_configured
                  ? t.common.configured
                  : t.common.notConfigured}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600 dark:text-slate-400">Local Forensics Engine</span>
              <span className="font-mono text-slate-900 dark:text-[#E8EDF7]">
                {health?.capabilities.local_forensics_available
                  ? t.common.available
                  : t.common.unavailable}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
