export const API_URL = process.env.REACT_APP_API_URL || 'http://billfast-backend-4kvrav-19c5fd-51-210-245-223.traefik.me';

// Budget API functions
export const budgetAPI = {
    // Create a new budget
    createBudget: async (name, amount, token) => {
        const response = await fetch(`${API_URL}/budgets`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, amount }),
        });
        if (!response.ok) throw new Error('Failed to create budget');
        return response.json();
    },

    // Get all user budgets
    getUserBudgets: async (token) => {
        const response = await fetch(`${API_URL}/budgets`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error('Failed to get budgets');
        return response.json();
    },

    // Get active budget
    getActiveBudget: async (token) => {
        const response = await fetch(`${API_URL}/budgets/active`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error('Failed to get active budget');
        return response.json();
    },

    // Set a budget as active
    setActiveBudget: async (budgetId, token) => {
        const response = await fetch(`${API_URL}/budgets/${budgetId}/activate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error('Failed to activate budget');
        return response;
    },

    // Update budget
    updateBudget: async (budgetId, data, token) => {
        const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update budget');
        return response;
    },

    // Delete budget
    deleteBudget: async (budgetId, token) => {
        const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error('Failed to delete budget');
        return response;
    },
};
