// src/pages/PastMonth.jsx

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '../components/Navbar';
import MonthSelector from '../components/MonthSelector';
import CustomLoader from '../components/CustomLoader';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CircleProgress = React.lazy(() => import('../components/CircleProgress'));
const ExpenseList   = React.lazy(() => import('../components/ExpenseList'));

export default function PastMonth() {
  const { token } = useAuth();
  const [selected, setSelected] = useState('');
  const [data, setData]         = useState({ total: 0, expenses: [] });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!token || !selected) return;
    setLoading(true);
    setError('');
    fetch(`${API_URL}/expenses/${selected}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(d => setData(d))
      .catch(() => setError('Error cargando mes seleccionado.'))
      .finally(() => setLoading(false));
  }, [token, selected]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-pink-500">
      <Navbar />
      <div className="p-6 max-w-2xl mx-auto text-white space-y-6">
        <h2 className="text-3xl font-extrabold drop-shadow-lg">
          Meses Anteriores
        </h2>

        {/* Selector de mes */}
        <MonthSelector onSelect={setSelected} />

        {/* Mensajes */}
        {loading && (
          <div className="flex justify-center py-10">
            <CustomLoader size="lg" />
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-400 bg-opacity-20 text-red-100 rounded-lg">
            {error}
          </div>
        )}

        {/* Contenido del mes seleccionado */}
        {!loading && selected && (
          <Suspense fallback={<CustomLoader size="sm" />}>
            {/* Progreso circular */}
            <div className="relative p-6 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
              <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen pointer-events-none"></div>
              <div className="relative flex flex-col items-center">
                <h3 className="text-xl font-semibold mb-4">Progreso de {selected}</h3>
                <CircleProgress
                  total={data.total}
                  spent={data.expenses.reduce((s, e) => s + e.amount, 0)}
                />
              </div>
            </div>

            {/* Lista de gastos */}
            <div className="relative p-6 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
              <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen pointer-events-none"></div>
              <div className="relative">
                <h3 className="text-xl font-semibold mb-4">Gastos de {selected}</h3>
                <ExpenseList expenses={data.expenses} />
              </div>
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
}
