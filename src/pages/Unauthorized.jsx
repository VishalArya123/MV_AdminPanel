// src/pages/Unauthorized.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const { handleLogout } = useAuth();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You do not have access to the Admin Panel. For privilege access, contact the Admin at{' '}
          <a href="mailto:admin@example.com" className="text-emerald-600 hover:underline">
            info@marichiventures.com
          </a>
        </p>
        <div className="flex flex-col space-y-3">
          <a
            href="https://marichiventures.com/"
            className="bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 transition duration-200"
          >
            Go to Main Website
          </a>
          <button
            onClick={handleLogout}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;