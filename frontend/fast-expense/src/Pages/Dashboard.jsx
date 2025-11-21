// src/Pages/Dashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomLoader from '../components/CustomLoader';
import { useOptimisticExpenses } from '../hooks/useOptimisticExpenses';
import { API_URL, budgetAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaWallet, FaPlus, FaTrash } from 'react-icons/fa';

export default function Dashboard() {
  const { token } = useAuth();
  const [expenses, setExpensesRaw] = useOptimisticExpenses('gastos_temp') || [];
  const [expensesState, setExpenses] = useState(expenses);
  const [spent, setSpent] = useState(0);
  const [activeBudget, setActiveBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');

  useEffect(() => {
    setExpenses(expenses);
  }, [expenses]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const budgetData = await budgetAPI.getActiveBudget(token);
      setActiveBudget(budgetData);

      const resE = await fetch(`${API_URL}/expenses-current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resE.ok) {
        const dataE = await resE.json();
        setExpenses(dataE);
        setSpent(dataE.reduce((sum, e) => sum + e.amount, 0));
      }
    } catch {
      setError('Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!token || !activeBudget || !amount || !concept) return;

    const newExp = {
      amount: parseFloat(amount),
      concept: concept,
      user_id: +localStorage.getItem('user_id')
    };

    setExpenses(prev => Array.isArray(prev) ? [...prev, newExp] : [newExp]);
    setSpent(prev => (typeof prev === 'number' ? prev : 0) + newExp.amount);
    setAmount('');
    setConcept('');

    try {
      const response = await fetch(`${API_URL}/add-expense`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExp),
      });

      if (response.ok) {
        loadData();
      }
    } catch {
      setError('No se pudo guardar el gasto.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-cyan-400">
        <CustomLoader size="lg" className="text-white" />
      </div>
    );
  }

  if (!activeBudget) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Navbar />
        <main className="px-4 py-6 max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaWallet className="text-blue-600 text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Sin presupuesto activo</h2>
            <p className="text-gray-600 mb-6">
              Selecciona un presupuesto para comenzar
            </p>
            <Link
              to="/budgets"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Ver Presupuestos
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const remaining = activeBudget.amount - spent;
  const percentage = Math.min((spent / activeBudget.amount) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      <Navbar />

      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Budget Card */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-400 dark:from-blue-700 dark:to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Presupuesto Activo</p>
              <h2 className="text-2xl font-bold">{activeBudget.name}</h2>
            </div>
            <Link to="/budgets" className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition">
              <FaWallet className="text-lg" />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Gastado</span>
              <span>{percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-blue-100 mb-1">Total</p>
              <p className="font-bold text-lg">${activeBudget.amount.toFixed(0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-blue-100 mb-1">Gastado</p>
              <p className="font-bold text-lg">${spent.toFixed(0)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-blue-100 mb-1">Restante</p>
              <p className="font-bold text-lg">${remaining.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Add Expense Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 transition-colors duration-300">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Agregar Gasto</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concepto</label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Almuerzo"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center space-x-2"
            >
              <FaPlus />
              <span>Agregar Gasto</span>
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 transition-colors duration-300">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Gastos Recientes ({expensesState.length})
          </h3>

          {expensesState.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm">
              No hay gastos registrados
            </p>
          ) : (
            <div className="space-y-2">
              {expensesState.slice().reverse().map((expense, idx) => (
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
      </main>

      <Footer />
    </div>
  );
}
