import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert, XCircle } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import type { AssessmentCategory } from '../types/analysis';

interface AssessmentBadgeProps {
  assessment: AssessmentCategory;
  size?: 'sm' | 'md';
}

export function AssessmentBadge({ assessment, size = 'sm' }: AssessmentBadgeProps) {
  const { t } = useSession();

  const styles: Record<AssessmentCategory, string> = {
    Verified:
      'text-[#16A34A] border-[#16A34A]/35 bg-[#16A34A]/10',
    Contradicted:
      'text-[#DC2626] border-[#DC2626]/35 bg-[#DC2626]/10',
    Misleading:
      'text-[#F59E0B] border-[#F59E0B]/35 bg-[#F59E0B]/10',
    Suspicious:
      'text-[#F59E0B] border-[#F59E0B]/35 bg-[#F59E0B]/10',
    Inconclusive:
      'text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60',
  };

  const icons: Record<AssessmentCategory, React.ReactNode> = {
    Verified: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
    Contradicted: <XCircle className="h-3.5 w-3.5 shrink-0" />,
    Misleading: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
    Suspicious: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
    Inconclusive: <HelpCircle className="h-3.5 w-3.5 shrink-0" />,
  };

  const sizing =
    size === 'md'
      ? 'px-3 py-1 text-xs font-semibold gap-2 rounded-md'
      : 'px-2 py-0.5 text-xs font-medium gap-1.5 rounded';

  return (
    <span
      className={`inline-flex items-center border whitespace-nowrap shrink-0 ${sizing} ${styles[assessment]}`}
    >
      {icons[assessment]}
      <span>{t.assessments[assessment]}</span>
    </span>
  );
}
