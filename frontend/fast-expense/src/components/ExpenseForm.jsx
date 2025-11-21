// src/components/ExpenseForm.jsx

import React, { useState } from 'react';
import { FaReceipt, FaMoneyBillWave } from 'react-icons/fa';

export default function ExpenseForm({ onAdd }) {
  const [concept, setConcept] = useState('');
  const [amount, setAmount]   = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!concept.trim() || isNaN(parsed) || parsed <= 0) return;
    onAdd({ concept: concept.trim(), amount: parsed });
    setConcept('');
    setAmount('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative bg-gradient-to-br from-cyan-500 to-cyan-400 p-8 rounded-3xl shadow-2xl overflow-hidden"
    >
      {/* Overlay de brillo */}
      <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen"></div>

      <div className="relative flex flex-col space-y-6">
        <div className="flex items-center space-x-4">
          <FaReceipt className="text-white text-2xl animate-pulse" />
          <input
            type="text"
            placeholder="Concepto"
            value={concept}
            onChange={e => setConcept(e.target.value)}
            className="flex-1 bg-transparent placeholder-white/75 text-white font-medium border-b-2 border-white/50 focus:border-white focus:outline-none transition pb-2"
          />
        </div>

        <div className="flex items-center space-x-4">
          <FaMoneyBillWave className="text-white text-2xl animate-pulse" />
          <input
            type="number"
            placeholder="Monto"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-transparent placeholder-white/75 text-white font-medium border-b-2 border-white/50 focus:border-white focus:outline-none transition pb-2"
          />
        </div>

        <button
          type="submit"
          className="mt-4 self-end bg-white text-blue-600 font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 hover:shadow-2xl transition"
        >
          Agregar Gasto
        </button>
      </div>
    </form>
  );
}
