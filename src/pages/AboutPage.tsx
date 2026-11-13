import { useSession } from '../context/SessionContext';

export function AboutPage() {
  const { t } = useSession();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-[#E8EDF7]">
          {t.about.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.about.subtitle}</p>
      </div>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6 space-y-3">
        <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-[#E8EDF7]">
          {t.about.missionHeading}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {t.about.missionBody}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-[#E8EDF7]">
          {t.about.principlesHeading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {t.about.principles.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-5"
            >
              <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-[#E8EDF7]">
                {p.title}
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
