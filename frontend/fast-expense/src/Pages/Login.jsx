import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomLoader from '../components/CustomLoader';
import { parseJWT } from '../utils/jwt';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FaUserAlt, FaLock } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = useCallback(async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      login(token);
      const payload = parseJWT(token);
      if (payload?.user_id) localStorage.setItem('user_id', payload.user_id);
      navigate('/dashboard');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate, login]);

  if (loading) return <CustomLoader />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-700 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-8 drop-shadow">Bienvenido</h2>
        {error && (
          <div className="bg-red-600/30 border border-red-500 text-red-100 px-4 py-2 rounded mb-6">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-6">
          {[
            { id: 'email', label: 'Email', type: 'email', icon: <FaUserAlt /> , value: email, setter: setEmail },
            { id: 'password', label: 'Contraseña', type: 'password', icon: <FaLock /> , value: password, setter: setPassword }
          ].map(field => (
            <div key={field.id} className="relative">
              <span className="absolute top-3 left-4 text-white/70">{field.icon}</span>
              <input
                id={field.id}
                type={field.type}
                placeholder={field.label}
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                className="w-full bg-transparent placeholder-white/60 text-white pl-12 pr-4 py-3 rounded-xl border border-white/40 focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                required
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold hover:scale-105 transition transform"
          >
            Entrar
          </button>
        </form>
        <p className="mt-8 text-center text-white/70 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="underline font-medium">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
