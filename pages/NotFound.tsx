
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-grow bg-white p-6 text-center">
      <h1 className="text-9xl font-black text-gray-200">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</h2>
      <p className="text-gray-600 mt-2 max-w-sm">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
