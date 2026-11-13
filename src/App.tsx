import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage } from './pages/DashboardPage';
import { ImageCheckPage } from './pages/ImageCheckPage';
import { LandingPage } from './pages/LandingPage';
import { NewsCheckPage } from './pages/NewsCheckPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ReportPreviewPage } from './pages/ReportPreviewPage';
import { ResultPage } from './pages/ResultPage';
import { SettingsPage } from './pages/SettingsPage';
import { VideoCheckPage } from './pages/VideoCheckPage';

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <WorkspaceLayout>
                <DashboardPage />
              </WorkspaceLayout>
            }
          />
          <Route
            path="/news"
            element={
              <WorkspaceLayout>
                <NewsCheckPage />
              </WorkspaceLayout>
            }
          />
          <Route
            path="/image"
            element={
              <WorkspaceLayout>
                <ImageCheckPage />
              </WorkspaceLayout>
            }
          />
          <Route
            path="/video"
            element={
              <WorkspaceLayout>
                <VideoCheckPage />
              </WorkspaceLayout>
            }
          />
          <Route
            path="/result"
            element={
              <WorkspaceLayout>
                <ResultPage />
              </WorkspaceLayout>
            }
          />
          <Route
            path="/result/:id"
            element={
              <WorkspaceLayout>
                <ResultPage />
              </WorkspaceLayout>
            }
          />
          <Route
            path="/report"
            element={
              <WorkspaceLayout>
                <ReportPreviewPage />
              </WorkspaceLayout>
            }
          />
          <Route
            path="/about"
            element={
              <WorkspaceLayout>
                <AboutPage />
              </WorkspaceLayout>
            }
          />
          <Route
            path="/privacy"
            element={
              <WorkspaceLayout>
                <PrivacyPage />
              </WorkspaceLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <WorkspaceLayout>
                <SettingsPage />
              </WorkspaceLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
