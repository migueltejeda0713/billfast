package handlers

import (
    "database/sql"
    "encoding/json"
    "net/http"

    "github.com/gorilla/mux"
    "Billfast/db"
)

// SetBudget crea o actualiza el presupuesto de un mes.
func SetBudget(w http.ResponseWriter, r *http.Request) {
    userID := getUserID(r)
    var in struct {
        Month  string  `json:"month"`
        Amount float64 `json:"amount"`
    }
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        http.Error(w, "JSON inválido", http.StatusBadRequest)
        return
    }

    _, err := db.DB.Exec(`
        INSERT INTO budgets (user_id, month_year, amount)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE amount = VALUES(amount)
    `, userID, in.Month, in.Amount)
    if err != nil {
        http.Error(w, "Error al guardar presupuesto", http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusNoContent)
}

// GetBudget obtiene el presupuesto de un mes (0 si no existe).
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
        http.Error(w, "Error al leer presupuesto", http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(map[string]float64{"amount": amount})
}
