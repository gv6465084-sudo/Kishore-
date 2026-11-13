import { ShieldCheck } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export function PrivacyPage() {
  const { t } = useSession();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-[#E8EDF7]">
          {t.privacy.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.privacy.subtitle}</p>
      </div>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
          <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-[#E8EDF7]">
            {t.privacy.ephemeralHeading}
          </h2>
        </div>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc list-inside">
          {t.privacy.ephemeralPoints.map((pt, i) => (
            <li key={i}>{pt}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-3">
        <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-[#E8EDF7]">
          {t.privacy.externalHeading}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {t.privacy.externalBody}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-3">
        <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-[#E8EDF7]">
          {t.privacy.localArchitectureHeading}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {t.privacy.localArchitectureBody}
        </p>
      </section>
    </div>
  );
}
