import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ModalProvider } from './context/ModalContext';
import { SpotlightProvider } from './context/SpotlightContext';
import PageBackground from './components/PageBackground';
import CursorSpotlight from './components/CursorSpotlight';
import Home from './pages/Home';
import DepartmentPage from './pages/DepartmentPage';
import EventPage from './pages/EventPage';

import AdminDashboard from './pages/AdminDashboard';

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

export default function App() {
  return (
    <BrowserRouter>
      <SpotlightProvider>
        <ModalProvider>
          {/* Fixed, behind every route */}
          <PageBackground />
          <CursorSpotlight />

          <ScrollToHash />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/departments/:deptId" element={<DepartmentPage />} />
            <Route path="/events/:eventId" element={<EventPage />} />
            <Route path="/ops/console" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ModalProvider>
      </SpotlightProvider>
    </BrowserRouter>
  );
}
