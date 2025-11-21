package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"

	"Billfast/db"
	"Billfast/handlers"
	"Billfast/middleware"
)

func main() {
	_ = godotenv.Load()

	if err := db.Connect(); err != nil {
		log.Fatal("Database connection failed:", err)
	}

	r := mux.NewRouter()

	r.HandleFunc("/register", handlers.Register).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", handlers.Login).Methods("POST", "OPTIONS")

	api := r.PathPrefix("/").Subrouter()
	api.Use(middleware.JWTMiddleware)
	api.HandleFunc("/ws", handlers.HandleWebSocket).Methods("GET", "OPTIONS")
	api.HandleFunc("/add-expense", handlers.AddExpense).Methods("POST", "OPTIONS")
	api.HandleFunc("/expenses-current", handlers.GetCurrentExpenses).Methods("GET", "OPTIONS")
	api.HandleFunc("/available-months", handlers.GetAvailableMonths).Methods("GET", "OPTIONS")
	api.HandleFunc("/expenses/{month}", handlers.GetMonthExpenses).Methods("GET", "OPTIONS")
	
	api.HandleFunc("/budget", handlers.SetBudget).Methods("POST", "OPTIONS")
	api.HandleFunc("/budget/{month}", handlers.GetBudget).Methods("GET", "OPTIONS")
	
	api.HandleFunc("/budgets", handlers.CreateBudget).Methods("POST", "OPTIONS")
	api.HandleFunc("/budgets", handlers.GetUserBudgets).Methods("GET", "OPTIONS")
	api.HandleFunc("/budgets/active", handlers.GetActiveBudget).Methods("GET", "OPTIONS")
	api.HandleFunc("/budgets/{id}", handlers.UpdateBudget).Methods("PUT", "OPTIONS")
	api.HandleFunc("/budgets/{id}", handlers.DeleteBudget).Methods("DELETE", "OPTIONS")
	api.HandleFunc("/budgets/{id}/activate", handlers.SetActiveBudget).Methods("PUT", "OPTIONS")

	handler := middleware.CORS(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "5183"
	}
	
	log.Printf("Server running on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
