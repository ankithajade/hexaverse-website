import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SpotlightProvider, useSpotlight } from './context/SpotlightContext';
import PageBackground from './components/PageBackground';
import DotCursor from './components/DotCursor';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import DepartmentPage from './pages/DepartmentPage';
import EventPage from './pages/EventPage';
import RegisterPage from './pages/RegisterPage';
import AdminAuthGate from './pages/admin/AdminAuthGate';
import AdminLayout from './pages/admin/AdminLayout';
import AdminHome from './pages/admin/AdminHome';

function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = setTimeout(() => {
        const el = document.getElementById(hash.replace('#', ''));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(id);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function ResetSpotlightOnRoute() {
  const { pathname } = useLocation();
  const { resetColor } = useSpotlight();

  useEffect(() => {
    if (!pathname.startsWith('/departments/')) {
      resetColor();
    }
  }, [pathname, resetColor]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SpotlightProvider>
          {/* Fixed, behind every route */}
          <PageBackground />
          <DotCursor />

          <ScrollToHash />
          <ResetSpotlightOnRoute />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/departments/:deptId" element={<DepartmentPage />} />
            <Route path="/events/:eventId" element={<EventPage />} />
            <Route path="/register/:eventId" element={<RegisterPage />} />
            <Route path="/ops/console" element={<AdminAuthGate><AdminLayout /></AdminAuthGate>}>
              <Route index element={<AdminHome />} />
              {/* Department pages — content added in later batch */}
              <Route path="departments/:deptId" element={<div style={{ padding: '32px', color: 'var(--text-dim)' }}>Department detail — coming soon</div>} />
              {/* Mega event pages — content added in later batch */}
              <Route path="events/:eventId" element={<div style={{ padding: '32px', color: 'var(--text-dim)' }}>Event detail — coming soon</div>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SpotlightProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
