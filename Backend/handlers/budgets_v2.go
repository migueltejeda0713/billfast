package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"Billfast/db"
	"Billfast/models"
)

func CreateBudget(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var input struct {
		Name   string  `json:"name"`
		Amount float64 `json:"amount"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if input.Name == "" {
		respondError(w, http.StatusBadRequest, "Budget name is required")
		return
	}

	if len(input.Name) > maxBudgetNameLength {
		respondError(w, http.StatusBadRequest, "Budget name is too long")
		return
	}

	if input.Amount < 0 || input.Amount > maxBudgetAmount {
		respondError(w, http.StatusBadRequest, "Invalid amount")
		return
	}

	var count int
	db.DB.QueryRow("SELECT COUNT(*) FROM budgets_v2 WHERE user_id = ?", userID).Scan(&count)
	isActive := count == 0

	result, err := db.DB.Exec(`
		INSERT INTO budgets_v2 (user_id, name, amount, is_active, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, userID, input.Name, input.Amount, isActive, time.Now())
	
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create budget")
		return
	}

	id, _ := result.LastInsertId()
	budget := models.Budget{
		ID:        int(id),
		UserID:    userID,
		Name:      input.Name,
		Amount:    input.Amount,
		IsActive:  isActive,
		CreatedAt: time.Now(),
	}

	respondJSON(w, http.StatusCreated, budget)
}

func GetUserBudgets(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	rows, err := db.DB.Query(`
		SELECT id, user_id, name, amount, is_active, created_at
		FROM budgets_v2
		WHERE user_id = ?
		ORDER BY created_at DESC
	`, userID)
	
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve budgets")
		return
	}
	defer rows.Close()

	var budgets []models.Budget
	for rows.Next() {
		var b models.Budget
		if err := rows.Scan(&b.ID, &b.UserID, &b.Name, &b.Amount, &b.IsActive, &b.CreatedAt); err != nil {
			continue
		}
		budgets = append(budgets, b)
	}

	if budgets == nil {
		budgets = []models.Budget{}
	}

	respondJSON(w, http.StatusOK, budgets)
}

func SetActiveBudget(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	budgetIDStr := mux.Vars(r)["id"]
	budgetID, err := strconv.Atoi(budgetIDStr)
	
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid budget ID")
		return
	}

	var ownerID int
	err = db.DB.QueryRow("SELECT user_id FROM budgets_v2 WHERE id = ?", budgetID).Scan(&ownerID)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Budget not found")
		return
	}
	if ownerID != userID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to process request")
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec("UPDATE budgets_v2 SET is_active = false WHERE user_id = ?", userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update budgets")
		return
	}

	_, err = tx.Exec("UPDATE budgets_v2 SET is_active = true WHERE id = ?", budgetID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to activate budget")
		return
	}

	if err = tx.Commit(); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to commit changes")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func UpdateBudget(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	budgetIDStr := mux.Vars(r)["id"]
	budgetID, err := strconv.Atoi(budgetIDStr)
	
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid budget ID")
		return
	}

	var input struct {
		Name   *string  `json:"name,omitempty"`
		Amount *float64 `json:"amount,omitempty"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	var ownerID int
	err = db.DB.QueryRow("SELECT user_id FROM budgets_v2 WHERE id = ?", budgetID).Scan(&ownerID)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Budget not found")
		return
	}
	if ownerID != userID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	if input.Name != nil && len(*input.Name) > maxBudgetNameLength {
		respondError(w, http.StatusBadRequest, "Budget name is too long")
		return
	}

	if input.Amount != nil && (*input.Amount < 0 || *input.Amount > maxBudgetAmount) {
		respondError(w, http.StatusBadRequest, "Invalid amount")
		return
	}

	query := "UPDATE budgets_v2 SET "
	args := []interface{}{}
	updates := []string{}

	if input.Name != nil {
		updates = append(updates, "name = ?")
		args = append(args, *input.Name)
	}
	if input.Amount != nil {
		updates = append(updates, "amount = ?")
		args = append(args, *input.Amount)
	}

	if len(updates) == 0 {
		respondError(w, http.StatusBadRequest, "No fields to update")
		return
	}

	query += updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += " WHERE id = ?"
	args = append(args, budgetID)

	_, err = db.DB.Exec(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update budget")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func DeleteBudget(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	budgetIDStr := mux.Vars(r)["id"]
	budgetID, err := strconv.Atoi(budgetIDStr)
	
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid budget ID")
		return
	}

	var ownerID int
	err = db.DB.QueryRow("SELECT user_id FROM budgets_v2 WHERE id = ?", budgetID).Scan(&ownerID)
	if err == sql.ErrNoRows {
		respondError(w, http.StatusNotFound, "Budget not found")
		return
	}
	if ownerID != userID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	var expenseCount int
	db.DB.QueryRow("SELECT COUNT(*) FROM expenses WHERE budget_id = ?", budgetID).Scan(&expenseCount)
	if expenseCount > 0 {
		respondError(w, http.StatusBadRequest, "Cannot delete budget with associated expenses")
		return
	}

	_, err = db.DB.Exec("DELETE FROM budgets_v2 WHERE id = ?", budgetID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete budget")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func GetActiveBudget(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	var budget models.Budget
	err := db.DB.QueryRow(`
		SELECT id, user_id, name, amount, is_active, created_at
		FROM budgets_v2
		WHERE user_id = ? AND is_active = true
		LIMIT 1
	`, userID).Scan(&budget.ID, &budget.UserID, &budget.Name, &budget.Amount, &budget.IsActive, &budget.CreatedAt)
	
	if err == sql.ErrNoRows {
		respondJSON(w, http.StatusOK, map[string]interface{}{"budget": nil})
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve active budget")
		return
	}

	respondJSON(w, http.StatusOK, budget)
}
