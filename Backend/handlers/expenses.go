package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"Billfast/db"
	"Billfast/middleware"
	"Billfast/models"
	"github.com/gorilla/mux"
)

const (
	maxConceptLength = 255
	maxExpenseAmount = 999999999.99
)

func getUserID(r *http.Request) int {
	return r.Context().Value(middleware.UserIDKey).(int)
}

func AddExpense(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	var expense models.Expense
	if err := json.NewDecoder(r.Body).Decode(&expense); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if expense.Amount <= 0 || expense.Amount > maxExpenseAmount {
		respondError(w, http.StatusBadRequest, "Invalid amount")
		return
	}

	if expense.Concept == "" {
		respondError(w, http.StatusBadRequest, "Concept is required")
		return
	}

	if len(expense.Concept) > maxConceptLength {
		respondError(w, http.StatusBadRequest, "Concept is too long")
		return
	}

	expense.UserID = userID
	expense.CreatedAt = time.Now()

	var activeBudgetID *int
	var budgetID int
	err := db.DB.QueryRow(`
		SELECT id FROM budgets_v2 
		WHERE user_id = ? AND is_active = true 
		LIMIT 1
	`, userID).Scan(&budgetID)
	
	if err == nil {
		activeBudgetID = &budgetID
	}

	expense.BudgetID = activeBudgetID

	_, err = db.DB.Exec(
		"INSERT INTO expenses (user_id, budget_id, amount, concept, created_at) VALUES (?, ?, ?, ?, ?)",
		expense.UserID, expense.BudgetID, expense.Amount, expense.Concept, expense.CreatedAt,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save expense")
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func GetCurrentExpenses(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	var activeBudgetID int
	err := db.DB.QueryRow(`
		SELECT id FROM budgets_v2 
		WHERE user_id = ? AND is_active = true 
		LIMIT 1
	`, userID).Scan(&activeBudgetID)
	
	if err != nil {
		respondJSON(w, http.StatusOK, []models.Expense{})
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, amount, concept, created_at
		FROM expenses
		WHERE user_id = ? AND budget_id = ?
		ORDER BY created_at DESC
	`, userID, activeBudgetID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve expenses")
		return
	}
	defer rows.Close()

	var exps []models.Expense
	for rows.Next() {
		var e models.Expense
		rows.Scan(&e.ID, &e.Amount, &e.Concept, &e.CreatedAt)
		exps = append(exps, e)
	}
	
	if exps == nil {
		exps = []models.Expense{}
	}
	
	respondJSON(w, http.StatusOK, exps)
}

func GetAvailableMonths(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	rows, err := db.DB.Query(`
		SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m')
		FROM (
		  SELECT created_at FROM expenses WHERE user_id = ?
		  UNION ALL
		  SELECT created_at FROM expenses_archive WHERE user_id = ?
		) AS t
		ORDER BY 1 DESC
	`, userID, userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve months")
		return
	}
	defer rows.Close()

	var months []string
	for rows.Next() {
		var m string
		rows.Scan(&m)
		months = append(months, m)
	}
	
	if months == nil {
		months = []string{}
	}
	
	respondJSON(w, http.StatusOK, months)
}

func GetMonthExpenses(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	month := mux.Vars(r)["month"]

	var exps []models.Expense
	total := 0.0

	rows, err := db.DB.Query(`
		SELECT id, amount, concept, created_at
		FROM expenses
		WHERE user_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
	`, userID, month)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve expenses")
		return
	}
	defer rows.Close()
	
	for rows.Next() {
		var e models.Expense
		rows.Scan(&e.ID, &e.Amount, &e.Concept, &e.CreatedAt)
		exps = append(exps, e)
		total += e.Amount
	}

	if len(exps) == 0 {
		rows2, _ := db.DB.Query(`
			SELECT id, amount, concept, created_at
			FROM expenses_archive
			WHERE user_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
		`, userID, month)
		defer rows2.Close()
		for rows2.Next() {
			var e models.Expense
			rows2.Scan(&e.ID, &e.Amount, &e.Concept, &e.CreatedAt)
			exps = append(exps, e)
			total += e.Amount
		}
	}

	if exps == nil {
		exps = []models.Expense{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"total":    total,
		"expenses": exps,
	})
}
