package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"


	"github.com/gorilla/mux"
	"Billfast/db"
)

const (
	maxBudgetNameLength = 100
	maxBudgetAmount     = 999999999.99
)

func SetBudget(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var input struct {
		Month  string  `json:"month"`
		Amount float64 `json:"amount"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if input.Amount < 0 || input.Amount > maxBudgetAmount {
		respondError(w, http.StatusBadRequest, "Invalid amount")
		return
	}

	_, err := db.DB.Exec(`
		INSERT INTO budgets (user_id, month_year, amount)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE amount = VALUES(amount)
	`, userID, input.Month, input.Amount)
	
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save budget")
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

func GetBudget(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	month := mux.Vars(r)["month"]

	var amount float64
	err := db.DB.QueryRow(`
		SELECT amount FROM budgets
		WHERE user_id = ? AND month_year = ?
	`, userID, month).Scan(&amount)
	
	if err == sql.ErrNoRows {
		amount = 0
	} else if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to retrieve budget")
		return
	}

	respondJSON(w, http.StatusOK, map[string]float64{"amount": amount})
}
