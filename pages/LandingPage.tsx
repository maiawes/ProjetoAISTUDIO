
import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div className="flex-grow">
      {/* Hero Section */}
      <section className="relative bg-white pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-wrap items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <span className="inline-block py-1 px-3 mb-4 text-xs font-semibold tracking-widest text-blue-600 uppercase bg-blue-50 rounded-full">
                New Strategy for 2025
              </span>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Build Hybrid Apps <span className="text-blue-600">Without Limits.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg">
                The most resilient architecture for modern React applications. Seamlessly switch between preview and production environments.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xl shadow-blue-200">
                  Get Started Now
                </button>
                <button className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-lg transition">
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 px-6">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <img 
                  src="https://picsum.photos/800/600" 
                  alt="App Interface" 
                  className="rounded-2xl shadow-2xl border border-gray-100"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-gray-50 hidden md:block">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Routing Active</p>
                      <p className="text-xs text-gray-500">Auto-detected environment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-16 text-gray-900">Engineered for Success</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: 'HashRouter Fail-safe', desc: 'Ensures previews never return 404 when refreshing deep links in proxies.' },
              { title: 'SEO Architecture', desc: 'Maintains clean URLs in production for crawlers and tracking pixels.' },
              { title: 'Vite Optimized', desc: 'Relative base paths guarantee assets load correctly anywhere.' }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center text-white mb-6 mx-auto">
                  <span className="text-xl font-bold">{i + 1}</span>
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
