// src/Pages/Budgets.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { budgetAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomLoader from '../components/CustomLoader';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCheck, FaChevronRight } from 'react-icons/fa';

export default function Budgets() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);

    const [newBudgetName, setNewBudgetName] = useState('');
    const [newBudgetAmount, setNewBudgetAmount] = useState('');
    const [editName, setEditName] = useState('');
    const [editAmount, setEditAmount] = useState('');

    useEffect(() => {
        loadBudgets();
    }, [token]);

    const loadBudgets = async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const data = await budgetAPI.getUserBudgets(token);
            setBudgets(data || []);
        } catch (err) {
            setError('Error al cargar presupuestos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBudget = async (e) => {
        e.preventDefault();
        if (!newBudgetName.trim() || !newBudgetAmount) return;

        try {
            await budgetAPI.createBudget(newBudgetName, parseFloat(newBudgetAmount), token);
            setNewBudgetName('');
            setNewBudgetAmount('');
            setShowCreateForm(false);
            loadBudgets();
        } catch (err) {
            setError('Error al crear presupuesto');
        }
    };

    const handleBudgetClick = async (budget) => {
        if (editingBudget !== budget.id) {
            try {
                await budgetAPI.setActiveBudget(budget.id, token);
                navigate('/dashboard');
            } catch (err) {
                setError('Error al activar presupuesto');
            }
        }
    };

    const handleStartEdit = (e, budget) => {
        e.stopPropagation();
        setEditingBudget(budget.id);
        setEditName(budget.name);
        setEditAmount(budget.amount.toString());
    };

    const handleCancelEdit = () => {
        setEditingBudget(null);
        setEditName('');
        setEditAmount('');
    };

    const handleSaveEdit = async (e, budgetId) => {
        e.stopPropagation();
        try {
            const updates = {};
            if (editName.trim()) updates.name = editName;
            if (editAmount) updates.amount = parseFloat(editAmount);

            await budgetAPI.updateBudget(budgetId, updates, token);
            setEditingBudget(null);
            loadBudgets();
        } catch (err) {
            setError('Error al actualizar presupuesto');
        }
    };

    const handleDeleteBudget = async (e, budgetId) => {
        e.stopPropagation();
        if (!window.confirm('¿Estás seguro de eliminar este presupuesto?')) return;

        try {
            await budgetAPI.deleteBudget(budgetId, token);
            loadBudgets();
        } catch (err) {
            setError('No se puede eliminar un presupuesto con gastos asociados');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <CustomLoader size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
            <Navbar />

            <main className="px-4 py-4 max-w-md mx-auto space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Presupuestos</h1>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition shadow-sm"
                    >
                        {showCreateForm ? <FaTimes /> : <FaPlus />}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Create Form */}
                {showCreateForm && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 transition-colors duration-300">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Nuevo Presupuesto</h3>
                        <form onSubmit={handleCreateBudget} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={newBudgetName}
                                    onChange={(e) => setNewBudgetName(e.target.value)}
                                    placeholder="Ej: Personal"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newBudgetAmount}
                                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition"
                            >
                                Crear Presupuesto
                            </button>
                        </form>
                    </div>
                )}

                {/* Budgets List */}
                {budgets.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center transition-colors duration-300">
                        <p className="text-gray-400 dark:text-gray-500 mb-4">No tienes presupuestos</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            Crear tu primer presupuesto
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {budgets.map((budget) => (
                            <div
                                key={budget.id}
                                onClick={() => handleBudgetClick(budget)}
                                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${budget.is_active ? 'ring-2 ring-cyan-500 dark:ring-cyan-400' : ''
                                    }`}
                            >
                                {editingBudget === budget.id ? (
                                    <div className="p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editAmount}
                                            onChange={(e) => setEditAmount(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => handleSaveEdit(e, budget.id)}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold transition flex items-center justify-center space-x-2"
                                            >
                                                <FaCheck />
                                                <span>Guardar</span>
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{budget.name}</h3>
                                                    {budget.is_active && (
                                                        <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
                                                            ACTIVO
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(budget.created_at).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <FaChevronRight className="text-gray-400 dark:text-gray-500 mt-1" />
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                ${budget.amount.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => handleStartEdit(e, budget)}
                                                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center space-x-2 text-sm"
                                            >
                                                <FaEdit />
                                                <span>Editar</span>
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteBudget(e, budget.id)}
                                                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
