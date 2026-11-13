import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  FileText,
  Home,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  Menu,
  Moon,
  Newspaper,
  Search,
  Settings,
  Shield,
  Sun,
  Video,
  X,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { TruthScanLogo } from './TruthScanLogo';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { t, language, setLanguage, theme, toggleTheme, searchQuery, setSearchQuery } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { to: '/news', label: t.nav.news, icon: Newspaper },
    { to: '/image', label: t.nav.image, icon: ImageIcon },
    { to: '/video', label: t.nav.video, icon: Video },
    { to: '/result', label: t.nav.result, icon: FileCheck2 },
    { to: '/report', label: t.nav.report, icon: FileText },
  ];

  const secondaryItems = [
    { to: '/about', label: t.nav.about, icon: Info },
    { to: '/privacy', label: t.nav.privacy, icon: Shield },
    { to: '/settings', label: t.nav.settings, icon: Settings },
  ];

  const currentTitle =
    [...navItems, ...secondaryItems].find((item) => location.pathname.startsWith(item.to))?.label ??
    t.brand;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#080D18] dark:text-[#E8EDF7]">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0B1220] transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/90">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded"
          >
            <TruthScanLogo size={26} animated={false} />
            <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-[#E8EDF7]">
              {t.brand}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Workspace Navigation">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-[#E8EDF7] dark:hover:bg-[#111B2D] transition-colors whitespace-nowrap"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>{t.nav.home}</span>
            </Link>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#2563EB]/12 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-[#E8EDF7] dark:hover:bg-[#111B2D]'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#2563EB]/12 text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-blue-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-[#E8EDF7] dark:hover:bg-[#111B2D]'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            {t.dashboard.privacyStatusTitle}
          </p>
          <p className="mt-1 leading-relaxed">{t.dashboard.privacyStatusBody}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-[#080D18]/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#111B2D]"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-display font-semibold text-sm sm:text-base text-slate-900 dark:text-[#E8EDF7] truncate">
              {currentTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Session Search */}
            <div className="relative hidden md:block w-56">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t.topbar.searchPlaceholder}
                aria-label={t.topbar.searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111B2D] text-slate-900 dark:text-[#E8EDF7] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {/* Language Switcher */}
            <div
              className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#111B2D]"
              role="group"
              aria-label="Language"
            >
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  language === 'en'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.topbar.langEnglish}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  language === 'ta'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.topbar.langTamil}
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t.topbar.lightMode : t.topbar.darkMode}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#111B2D] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/settings"
              aria-label={t.nav.settings}
              className="hidden sm:inline-flex p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#111B2D] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
