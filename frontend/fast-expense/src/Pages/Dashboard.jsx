// src/pages/Dashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import CustomLoader from '../components/CustomLoader';
import BudgetSetter from '../components/BudgetSetter';
import { useOptimisticExpenses } from '../hooks/useOptimisticExpenses';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CircleProgress from '../components/CircleProgress';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

export default function Dashboard() {
  const { token } = useAuth();
  const [expenses, setExpensesRaw] = useOptimisticExpenses('gastos_temp') || [];
  const [expensesState, setExpenses] = useState(expenses);
  const [spent, setSpent] = useState(0);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        // Gastos actuales
        const resE = await fetch(`${API_URL}/expenses-current`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resE.ok) {
          const dataE = await resE.json();
          setExpenses(dataE);
          setSpent(dataE.reduce((sum, e) => sum + e.amount, 0));
        }
        // Presupuesto mes actual
        const month = new Date().toISOString().slice(0, 7);
        const resB = await fetch(`${API_URL}/budget/${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resB.ok) {
          const { amount = 0 } = await resB.json();
          setBudget(amount);
        }
      } catch {
        setError('Error al cargar datos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleAdd = useCallback(async exp => {
    if (!token) return;
    const newExp = { ...exp, user_id: +localStorage.getItem('user_id') };
    setExpenses(prev => Array.isArray(prev) ? [...prev, newExp] : [newExp]);
    setSpent(prev => (typeof prev === 'number' ? prev : 0) + exp.amount);
    try {
      await fetch(`${API_URL}/add-expense`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExp),
      });
    } catch {
      setError('No se pudo guardar el gasto.');
    }
  }, [token]);

  const handleBudgetSet = useCallback(async amount => {
    setBudget(amount);
    try {
      await fetch(`${API_URL}/budget`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month: new Date().toISOString().slice(0, 7), amount }),
      });
    } catch {
      setError('No se pudo guardar el presupuesto.');
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-pink-500">
        <CustomLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto p-6 space-y-10">
        {error && (
          <div className="p-4 bg-red-300 text-red-900 rounded-lg shadow-md">
            {error}
          </div>
        )}

        {/* Presupuesto */}
        <BudgetSetter onSet={handleBudgetSet} />

        {/* Progreso Circular */}
        <section className="relative max-w-md mx-auto p-6 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen pointer-events-none"></div>
          <div className="relative flex flex-col items-center">
            <h3 className="text-white text-xl font-semibold mb-4">Tu Progreso</h3>
            <CircleProgress total={budget} spent={spent} />
          </div>
        </section>

        {/* Formulario de Gasto */}
        <section className="relative max-w-md mx-auto p-6 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen pointer-events-none"></div>
          <div className="relative">
            <h3 className="text-white text-xl font-semibold mb-4">Agregar Gasto</h3>
            <ExpenseForm onAdd={handleAdd} />
          </div>
        </section>

        {/* Lista de Gastos */}
        <section className="relative max-w-md mx-auto p-6 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen pointer-events-none"></div>
          <div className="relative">
            <h3 className="text-white text-xl font-semibold mb-4">Gastos del Mes</h3>
            <ExpenseList expenses={expensesState} />
          </div>
        </section>
      </main>
    </div>
  );
}
