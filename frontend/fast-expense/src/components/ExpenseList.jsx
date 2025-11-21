import React, { memo } from 'react';
import { FaClipboardList, FaReceipt } from 'react-icons/fa';

function ExpenseList({ expenses }) {
  const list = Array.isArray(expenses) ? expenses : [];

  return (
    <div className="relative max-w-md mx-auto p-6 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-cyan-400 mb-8">
      {/* Overlay de brillo */}
      <div className="absolute inset-0 opacity-20 bg-white mix-blend-screen pointer-events-none"></div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <FaClipboardList className="text-2xl text-white animate-pulse" />
          <h2 className="text-xl font-semibold text-white">Gastos del Mes</h2>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center text-white/75 py-12">
            <FaReceipt className="text-4xl mb-3 animate-pulse" />
            <p>No hay gastos registrados aún.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/30">
            {list.map(exp => (
              <li
                key={exp.id ?? `${exp.concept}-${exp.amount}`}
                className="flex justify-between items-center py-3 hover:bg-white/10 transition rounded-lg"
              >
                <span className="text-white font-medium">{exp.concept}</span>
                <span className="text-white font-semibold">
                  ${exp.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default memo(ExpenseList);
