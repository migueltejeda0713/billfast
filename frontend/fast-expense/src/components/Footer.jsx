// src/components/Footer.jsx

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWallet, FaHistory, FaUser, FaSignOutAlt } from 'react-icons/fa';

export default function Footer() {
    const { pathname } = useLocation();
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const navItems = [
        { to: '/budgets', label: 'Presupuestos', icon: FaWallet },
        { to: '/past-month', label: 'Historial', icon: FaHistory },
    ];

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom transition-colors duration-300">
            <div className="max-w-md mx-auto px-2 py-2">
                <div className="flex justify-around items-center">
                    {/* Navigation Items */}
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = pathname === item.to;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-xl transition-all ${isActive
                                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <Icon className="text-xl" />
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Account Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                            className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-xl transition-all ${accountMenuOpen
                                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <FaUser className="text-xl" />
                            <span className="text-xs font-medium">Cuenta</span>
                        </button>

                        {accountMenuOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40"
                                    onClick={() => setAccountMenuOpen(false)}
                                ></div>

                                {/* Menu */}
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden z-50 border border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        <FaSignOutAlt className="text-red-500" />
                                        <span className="font-medium">Cerrar Sesión</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
