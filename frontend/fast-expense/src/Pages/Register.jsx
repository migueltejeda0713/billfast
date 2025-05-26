import React, { useState, useCallback, useEffect } from 'react';
import CustomLoader from '../components/CustomLoader';
import { API_URL } from '../utils/api';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

const steps = [
  { key: 'email',    label: 'Email',            type: 'email',    icon: <FaEnvelope /> },
  { key: 'password', label: 'Contraseña',       type: 'password', icon: <FaLock />     },
  { key: 'username', label: 'Nombre de usuario',type: 'text',     icon: <FaUser />     },
];

export default function Register() {
  const [step,   setStep]   = useState(0);
  const [form,   setForm]   = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [fade,   setFade]   = useState(false);

  useEffect(() => {
    setFade(false);
    const id = setTimeout(() => setFade(true), 10);
    return () => clearTimeout(id);
  }, [step]);

  const handleNext = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const handleChange = useCallback((key, val) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.status === 409) {
        // Leer mensaje de error
        const { error } = await res.json();
        alert(error);
        return;
      }
      if (!res.ok) throw new Error();

      window.location.href = '/login';
    } catch {
      alert('Error al registrar');
    } finally {
      setLoading(false);
    }
  }, [form]);

  if (loading) return <CustomLoader />;

  const { key, label, type, icon } = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-600 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <h1 className="text-4xl font-extrabold text-white text-center mb-6 tracking-tight">
          Bienvenido a <span className="text-yellow-300">BillFast</span>
        </h1>
        <div
          key={step}
          className={`relative mb-6 transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}
        >
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Paso {step + 1}: {label}
          </h2>
          <div className="relative">
            <span className="absolute top-3 left-4 text-white/60">{icon}</span>
            <input
              type={type}
              placeholder={label}
              value={form[key]}
              onChange={e => handleChange(key, e.target.value)}
              className="w-full bg-transparent placeholder-white/60 text-white pl-12 pr-4 py-3 rounded-xl border border-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
            />
          </div>
        </div>

        <button
          onClick={step < steps.length - 1 ? handleNext : handleSubmit}
          className={`w-full py-3 rounded-full font-bold text-white transition-transform transform duration-300 ease-out ${
            step < steps.length - 1
              ? 'bg-gradient-to-r from-green-400 to-teal-500 hover:scale-105'
              : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105'
          }`}
        >
          {step < steps.length - 1 ? 'Siguiente' : 'Registrarse'}
        </button>
      </div>
    </div>
  );
}
