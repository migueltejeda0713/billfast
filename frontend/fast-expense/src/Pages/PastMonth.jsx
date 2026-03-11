// src/pages/PastMonth.jsx

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MonthSelector from '../components/MonthSelector';
import CustomLoader from '../components/CustomLoader';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Remove this line - ExpenseList is not being used
// const ExpenseList = React.lazy(() => import('../components/ExpenseList'));

export default function PastMonth() {
  const { token } = useAuth();
  const [selected, setSelected] = useState('');
  const [data, setData] = useState({ total: 0, expenses: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const totalSpent = data.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      <Navbar />

      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Historial</h1>

        {/* Month Selector */}
        <MonthSelector onSelect={setSelected} />

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-10">
            <CustomLoader size="lg" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && selected && (
          <Suspense fallback={<CustomLoader size="sm" />}>
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 to-cyan-400 dark:from-blue-700 dark:to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
              <p className="text-blue-100 text-sm font-medium mb-2">
                Total gastado en {selected}
              </p>
              <p className="text-4xl font-bold">${totalSpent.toFixed(2)}</p>
              <p className="text-blue-100 text-sm mt-2">
                {data.expenses.length} {data.expenses.length === 1 ? 'gasto' : 'gastos'}
              </p>
            </div>

            {/* Expenses List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 transition-colors duration-300">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Gastos de {selected}
              </h3>

              {data.expenses.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm">
                  No hay gastos en este mes
                </p>
              ) : (
                <div className="space-y-2">
                  {data.expenses.map((expense, idx) => (
                    <div
                      key={expense.id || idx}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{expense.concept}</p>
                        {expense.created_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(expense.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 dark:text-blue-400">${expense.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Suspense>
        )}
      </main>

      <Footer />
    </div>
  );
}
