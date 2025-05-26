import React, { useMemo } from 'react';

export default function CircleProgress({ total, spent }) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = useMemo(
    () => circumference - (pct / 100) * circumference,
    [circumference, pct]
  );

  return (
    <div className="flex flex-col items-center mb-8">
      <svg height={radius * 2} width={radius * 2}>
        {/* Definimos el degradado para el progreso */}
        <defs>
          <linearGradient id="progressGradient" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BF1E2E" />  {/* secondary (rojo) */}
            <stop offset="100%" stopColor="#F59E0B" /> {/* accent (amarillo) */}
          </linearGradient>
        </defs>

        {/* Círculo base tenue */}
        <circle
          stroke="rgba(255,255,255,0.2)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        {/* Progreso */}
        <circle
          stroke="url(#progressGradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.8s ease-out',
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        {/* Texto en el centro */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        >
          {Math.round(pct)}%
        </text>
      </svg>

      {/* Leyenda */}
      <div className="mt-3 text-white/90 text-center">
        <p className="text-sm">Gastado</p>
        <p className="font-semibold">
          ${spent.toFixed(2)} <span className="text-white/60">de</span> ${total.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
