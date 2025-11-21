// src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-md mx-auto px-4 py-3 relative flex items-center justify-center">
        <Link to="/dashboard" className="flex items-center justify-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            BillFast
          </h1>
        </Link>

        <button
          onClick={toggleTheme}
          className="absolute right-4 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <FaSun className="text-xl text-yellow-500" /> : <FaMoon className="text-xl text-blue-600" />}
        </button>
      </div>
    </nav>
  );
}
