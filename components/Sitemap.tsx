
import React from 'react';
import { Link } from 'react-router-dom';

const Sitemap: React.FC = () => {
  const routes = [
    { path: '/lp-video', label: 'Main Landing Page (Production Route)', description: 'The primary video sales letter or landing page.' },
    { path: '/sitemap', label: 'Developer Sitemap (Preview Route)', description: 'Internal navigation for rapid testing.' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Project Sitemap</h1>
        <p className="text-gray-600 mt-2">This view is optimized for development and preview environments.</p>
      </header>

      <div className="grid gap-6">
        {routes.map((route) => (
          <Link 
            key={route.path} 
            to={route.path}
            className="group block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-500 transition-all"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">
                  {route.label}
                </h2>
                <p className="text-gray-500 mt-1">{route.description}</p>
                <code className="inline-block mt-3 px-2 py-1 bg-gray-100 rounded text-sm text-gray-700 font-mono">
                  {route.path}
                </code>
              </div>
              <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <footer className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-400 italic">
          Tip: Use <kbd className="bg-gray-200 px-1 rounded">Alt + S</kbd> to return here (if implemented).
        </p>
      </footer>
    </div>
  );
};

export default Sitemap;
