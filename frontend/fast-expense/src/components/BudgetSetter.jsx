import React, { useState, useEffect } from 'react';
import {
  FaPiggyBank,
  FaLock,
  FaPen,
  FaEdit,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import CustomLoader from './CustomLoader';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function BudgetSetter({ onSet }) {
  const [budget, setBudget] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const { token } = useAuth();
  const month = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/budget/${month}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 404) {
          setBudget(null);
        } else {
          const { amount } = await res.json();
          setBudget(amount);
        }
      } catch {
        setError('No se pudo cargar el presupuesto.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, month]);

  const handleSubmit = async () => {
    if (!input || isNaN(input) || Number(input) <= 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/budget`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ month, amount: Number(input) })
      });
      if (!res.ok) throw new Error();
      setBudget(Number(input));
      onSet(Number(input));
      setInput('');
      setEditing(false);
    } catch {
      setError('Falló al guardar presupuesto.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CustomLoader size="sm" />;

  const hasBudget = budget != null && budget > 0;

  return (
    <div className="relative max-w-md mx-auto p-6 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-cyan-400 mb-8">
      {/* Overlay de brillo */}
      <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen pointer-events-none"></div>

      {/* Contenido */}
      <div className="relative space-y-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FaPiggyBank className="text-4xl animate-pulse" />
            <div>
              <p className="text-sm opacity-80">Presupuesto</p>
              <p className="text-2xl font-bold">
                {hasBudget ? `$ ${budget.toFixed(2)}` : 'No definido'}
              </p>
            </div>
          </div>
          {hasBudget && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-2 bg-white/30 rounded-full hover:bg-white/50 transition"
              title="Editar presupuesto"
            >
              <FaEdit className="text-white" />
            </button>
          )}
        </div>

        {/* Input para fijar o editar */}
        {(!hasBudget || editing) && (
          <div className="flex items-center gap-3">
            <FaPen className="text-xl opacity-75" />
            <input
              type="number"
              placeholder="Ingresa monto $"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-transparent placeholder-white/75 text-white font-medium border-b-2 border-white/50 focus:border-white focus:outline-none transition pb-2"
            />
            <button
              onClick={handleSubmit}
              disabled={!input || isNaN(input) || Number(input) <= 0}
              className={`p-2 rounded-full transition ${
                input && Number(input) > 0
                  ? 'bg-white text-blue-600 hover:scale-105'
                  : 'bg-white/30 cursor-not-allowed'
              }`}
              title="Fijar presupuesto"
            >
              <FaCheck />
            </button>
            {editing && (
              <button
                onClick={() => {
                  setEditing(false);
                  setInput('');
                }}
                className="p-2 bg-red-400 rounded-full hover:scale-105 transition"
                title="Cancelar"
              >
                <FaTimes className="text-white" />
              </button>
            )}
          </div>
        )}

        {/* Indicador de bloqueo */}
        {hasBudget && !editing && (
          <div className="flex items-center gap-2 opacity-80">
            <FaLock />
            <span className="text-sm">Presupuesto bloqueado</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
