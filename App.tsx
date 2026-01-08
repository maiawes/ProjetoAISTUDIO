
import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sitemap from './components/Sitemap';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';

/**
 * Detects if the application is running in a cloud preview or development environment.
 * These environments often use proxies that break standard browser history routing.
 */
const checkPreviewEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const host = window.location.hostname.toLowerCase();
  const href = window.location.href.toLowerCase();
  
  const indicators = [
    'googleusercontent',
    'webcontainer',
    'shim',
    '.goog',
    'scf.usercontent',
    'stackblitz',
    'codesandbox'
  ];
  
  return indicators.some(indicator => host.includes(indicator) || href.includes(indicator));
};

const App: React.FC = () => {
  const isPreview = checkPreviewEnvironment();
  
  // Selection Logic:
  // - HashRouter for previews: Prevents 404 on refresh in proxy-based cloud editors.
  // - BrowserRouter for production: SEO friendly, supports tracking pixels/UTMs.
  const Router = isPreview ? HashRouter : BrowserRouter;

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {isPreview && (
          <div className="bg-yellow-500 text-white text-xs py-1 px-4 text-center font-medium">
            Preview Mode Active: Using HashRouter for compatibility.
          </div>
        )}
        
        <Routes>
          {/* Intelligent Redirect based on environment */}
          <Route 
            path="/" 
            element={
              <Navigate 
                to={isPreview ? "/sitemap" : "/lp-video"} 
                replace 
              />
            } 
          />
          
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/lp-video" element={<LandingPage />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
