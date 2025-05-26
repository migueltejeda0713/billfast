import React, { useEffect, useState, memo } from 'react';
import { API_URL } from '../utils/api';
import CustomLoader from './CustomLoader';
import { FaCalendarAlt } from 'react-icons/fa';

function MonthSelector({ onSelect }) {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/available-months`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setMonths(data);
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [token]);

  if (loading) return <CustomLoader size="sm" />;

  return (
    <div className="relative max-w-md mx-auto p-6 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 mb-8">
      {/* Overlay de brillo */}
      <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen pointer-events-none"></div>

      {/* Contenido */}
      <div className="relative">
        <div className="flex items-center mb-4">
          <FaCalendarAlt className="text-white text-2xl animate-pulse mr-3" />
          <h3 className="text-white text-lg font-semibold">Seleccionar mes</h3>
        </div>
        <select
          onChange={e => onSelect(e.target.value)}
          className="w-full bg-transparent text-white placeholder-white/75 px-4 py-3 rounded-full border-2 border-white/50 focus:border-white focus:outline-none transition"
        >
          <option value="" className="text-gray-800">
            -- Elige un mes --
          </option>
          {months.map(m => (
            <option key={m} value={m} className="bg-white text-gray-800">
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default memo(MonthSelector);
