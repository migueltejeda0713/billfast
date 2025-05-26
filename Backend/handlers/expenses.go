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

// getUserID extrae el user_id del contexto de la request.
func getUserID(r *http.Request) int {
    return r.Context().Value(middleware.UserIDKey).(int)
}

// AddExpense añade un nuevo gasto al mes actual.
func AddExpense(w http.ResponseWriter, r *http.Request) {
    userID := getUserID(r)

    var expense models.Expense
    if err := json.NewDecoder(r.Body).Decode(&expense); err != nil {
        http.Error(w, "JSON inválido", http.StatusBadRequest)
        return
    }

    expense.UserID = userID
    expense.CreatedAt = time.Now()

    _, err := db.DB.Exec(
        "INSERT INTO expenses (user_id, amount, concept, created_at) VALUES (?, ?, ?, ?)",
        expense.UserID, expense.Amount, expense.Concept, expense.CreatedAt,
    )
    if err != nil {
        http.Error(w, "No se pudo guardar el gasto", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
}

// GetCurrentExpenses lista los gastos del mes en curso.
func GetCurrentExpenses(w http.ResponseWriter, r *http.Request) {
    userID := getUserID(r)
    month := time.Now().Format("2006-01")

    rows, err := db.DB.Query(`
        SELECT id, amount, concept, created_at
        FROM expenses
        WHERE user_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
    `, userID, month)
    if err != nil {
        http.Error(w, "Error al obtener gastos", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var exps []models.Expense
    for rows.Next() {
        var e models.Expense
        rows.Scan(&e.ID, &e.Amount, &e.Concept, &e.CreatedAt)
        exps = append(exps, e)
    }
    json.NewEncoder(w).Encode(exps)
}

// GetAvailableMonths lista los meses con gastos (actuales o archivados).
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
        http.Error(w, "Error al listar meses", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var months []string
    for rows.Next() {
        var m string
        rows.Scan(&m)
        months = append(months, m)
    }
    json.NewEncoder(w).Encode(months)
}

// GetMonthExpenses lista los gastos de un mes específico.
func GetMonthExpenses(w http.ResponseWriter, r *http.Request) {
    userID := getUserID(r)
    month := mux.Vars(r)["month"]

    var exps []models.Expense
    total := 0.0

    // Primero busca en tabla activa
    rows, err := db.DB.Query(`
        SELECT id, amount, concept, created_at
        FROM expenses
        WHERE user_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
    `, userID, month)
    if err != nil {
        http.Error(w, "Error al leer gastos", http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    for rows.Next() {
        var e models.Expense
        rows.Scan(&e.ID, &e.Amount, &e.Concept, &e.CreatedAt)
        exps = append(exps, e)
        total += e.Amount
    }

    // Si no hay, busca en archivo
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

    json.NewEncoder(w).Encode(map[string]interface{}{
        "total":    total,
        "expenses": exps,
    })
}
