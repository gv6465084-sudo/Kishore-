import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Image as ImageIcon, Lock, Newspaper, ShieldCheck, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { useSession } from '../context/SessionContext';
import { TruthScanLogo } from '../components/TruthScanLogo';

const HERO_IMAGE = '/src/assets/images/hero_forensics_lab_1794582321555.jpg';
const OPTICS_IMAGE = '/src/assets/images/optical_sensor_prism_1794582322091.jpg';

export function LandingPage() {
  const { t, language, setLanguage, theme, toggleTheme } = useSession();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080D18] dark:text-[#E8EDF7]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#080D18]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg font-display font-bold tracking-tight text-slate-900 dark:text-[#E8EDF7] whitespace-nowrap shrink-0"
          >
            <TruthScanLogo size={28} animated />
            <span>{t.brand}</span>
          </Link>

          {/* Zone 2: 4 Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#modules"
              className="hover:text-[#2563EB] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.news} &amp; Media
            </a>
            <a
              href="#workflow"
              className="hover:text-[#2563EB] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Workflow
            </a>
            <Link
              to="/privacy"
              className="hover:text-[#2563EB] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.privacy}
            </Link>
            <Link
              to="/about"
              className="hover:text-[#2563EB] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {t.nav.about}
            </Link>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>{t.topbar.openWorkspace}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
        <div
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-100"
          style={{
            background:
              'radial-gradient(ellipse 75% 50% at 65% 0%, rgba(37, 99, 235, 0.16), transparent 70%), radial-gradient(ellipse 50% 45% at 15% 15%, rgba(124, 58, 237, 0.12), transparent 65%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 relative">
          {/* Below-header quick bilingual & theme utility row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-10 border-b border-slate-200/80 dark:border-slate-800/70 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>{t.tagline}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center p-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D]">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ta')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    language === 'ta'
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              >
                {theme === 'dark' ? t.topbar.lightMode : t.topbar.darkMode}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <motion.div
              className="lg:col-span-6 flex flex-col justify-center"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-display font-bold tracking-tight text-slate-900 dark:text-[#E8EDF7] text-balance text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08]">
                {t.landing.heroTitle}
              </h1>
              <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {t.landing.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <span>{t.landing.heroPrimaryCta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/privacy"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <Lock className="h-4 w-4" />
                  <span>{t.landing.heroSecondaryCta}</span>
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="lg:col-span-6 flex"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 relative min-h-[280px] lg:min-h-[380px]">
                <img
                  src={HERO_IMAGE}
                  alt="TruthScan AI digital verification and forensics operations center"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080D18]/90 via-[#080D18]/25 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-300">
                    <span>NewsCheck</span>
                    <span aria-hidden="true">·</span>
                    <span>ImageCheck</span>
                    <span aria-hidden="true">·</span>
                    <span>VideoCheck</span>
                    <span aria-hidden="true">·</span>
                    <span>English &amp; தமிழ்</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-b border-slate-200 dark:border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-[#E8EDF7] text-balance">
              {t.landing.introHeading}
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {t.landing.introBody}
            </p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                <span>{t.assessments.Verified}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#DC2626] shrink-0" aria-hidden="true" />
                <span>{t.assessments.Contradicted}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B] shrink-0" aria-hidden="true" />
                <span>
                  {t.assessments.Misleading} / {t.assessments.Suspicious}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-400 shrink-0" aria-hidden="true" />
                <span>{t.assessments.Inconclusive}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Verification Modules (Asymmetric Grid) */}
      <section id="modules" className="max-w-7xl mx-auto px-6 py-16 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-2xl mb-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-[#E8EDF7]">
            {t.landing.modulesHeading}
          </h2>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
            {t.landing.modulesSubheading}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Module 1: NewsCheck */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <Newspaper className="h-6 w-6 text-[#2563EB]" />
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Google Fact Check · Search Grounding · Gemini
                </span>
              </div>
              <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-[#E8EDF7]">
                {t.landing.moduleNewsTitle}
              </h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.landing.moduleNewsDesc}
              </p>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Article · Headline · Social Post · URL
              </span>
              <Link
                to="/news"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
              >
                <span>{t.nav.news}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Module 2: ImageCheck (with optical sensor photo) */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] overflow-hidden grid grid-cols-1 sm:grid-cols-12">
            <div className="sm:col-span-5 min-h-[200px] bg-slate-900 relative">
              <img
                src={OPTICS_IMAGE}
                alt="Precision optical lens and prism representing image sensor forensics"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="sm:col-span-7 p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <ImageIcon className="h-4 w-4 text-[#2563EB]" />
                  <span>EXIF · ELA · Multimodal</span>
                </div>
                <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-[#E8EDF7]">
                  {t.landing.moduleImageTitle}
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.landing.moduleImageDesc}
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">JPG · PNG · WebP</span>
                <Link
                  to="/image"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
                >
                  <span>{t.nav.image}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Module 3: VideoCheck (Full width horizontal strip) */}
          <div className="lg:col-span-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                <Video className="h-4 w-4 text-[#7C3AED]" />
                <span>FFprobe · FFmpeg Contact Sheet · Deepfake &amp; Track Separation</span>
              </div>
              <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-[#E8EDF7]">
                {t.landing.moduleVideoTitle}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.landing.moduleVideoDesc}
              </p>
            </div>
            <Link
              to="/video"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-[#2563EB] text-sm font-semibold text-slate-900 dark:text-[#E8EDF7] transition-colors whitespace-nowrap shrink-0 self-start md:self-center"
            >
              <span>{t.nav.video}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-16 border-b border-slate-200 dark:border-slate-800/80">
        <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-[#E8EDF7] mb-10">
          {t.landing.howItWorksHeading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.landing.steps.map((step) => (
            <div
              key={step.title}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6"
            >
              <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features & Privacy */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-b border-slate-200 dark:border-slate-800/80">
        <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-[#E8EDF7] mb-10">
          {t.landing.featuresHeading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.landing.features.map((feat) => (
            <div
              key={feat.title}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-6"
            >
              <h3 className="font-display font-semibold text-base text-slate-900 dark:text-[#E8EDF7]">
                {feat.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B2D] p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-3xl">
            <ShieldCheck className="h-6 w-6 text-[#16A34A] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-[#E8EDF7]">
                {t.landing.privacyHeading}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.landing.privacyBody}
              </p>
            </div>
          </div>
          <Link
            to="/privacy"
            className="text-sm font-semibold text-[#2563EB] hover:underline whitespace-nowrap shrink-0"
          >
            {t.nav.privacy}
          </Link>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
        <div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">{t.landing.footerNote}</p>
          <p className="mt-1">{t.tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <Link to="/dashboard" className="hover:text-slate-900 dark:hover:text-white">
            {t.nav.dashboard}
          </Link>
          <Link to="/news" className="hover:text-slate-900 dark:hover:text-white">
            {t.nav.news}
          </Link>
          <Link to="/image" className="hover:text-slate-900 dark:hover:text-white">
            {t.nav.image}
          </Link>
          <Link to="/video" className="hover:text-slate-900 dark:hover:text-white">
            {t.nav.video}
          </Link>
          <Link to="/about" className="hover:text-slate-900 dark:hover:text-white">
            {t.nav.about}
          </Link>
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white">
            {t.nav.privacy}
          </Link>
        </div>
      </footer>
    </div>
  );
}
