// src/components/Navbar.jsx

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '../components/images/logo.png'; // Asegúrate de que esta ruta es correcta

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/dashboard', label: 'Actual' },
    { to: '/past-month', label: 'Anteriores' },
  ];

  return (
    <nav className="relative bg-gradient-to-br from-purple-500 to-pink-500">
      {/* Overlay de brillo */}
      <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen pointer-events-none"></div>

      <div className="relative max-w-4xl mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo actualizado */}
        <Link to="/dashboard" className="flex items-center space-x-3">
          <img
            src={logo}
            alt="BillFast Logo"
            className="h-12 w-auto drop-shadow-md"
          />

        </Link>

        {/* Menu desktop */}
        <ul className="hidden md:flex space-x-8">
          {links.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`relative text-white font-medium hover:opacity-90 transition ${pathname === link.to ? 'font-semibold' : 'opacity-80'
                  }`}
              >
                {link.label}
                {pathname === link.to && (
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-white rounded-full"></span>
                )}
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="text-white opacity-80 hover:opacity-90 transition font-medium"
            >
              Cerrar Sesión
            </button>
          </li>
        </ul>

        {/* Hamburger mobile */}
        <button
          className="md:hidden text-white text-xl"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden bg-white bg-opacity-10 backdrop-blur-sm">
          <ul className="flex flex-col space-y-2 p-4">
            {links.map(link => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`block text-white font-medium py-2 px-3 rounded-lg hover:bg-white/20 transition ${pathname === link.to ? 'bg-white/30' : 'opacity-80'
                    }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="block w-full text-white font-medium py-2 px-3 rounded-lg hover:bg-white/20 transition"
              >
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
