// main.go
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
    // 1) Carga variables de entorno
    _ = godotenv.Load()

    // 2) Conectar a la base de datos
    if err := db.Connect(); err != nil {
        log.Fatal("Error conectando a la DB:", err)
    }

    // 3) Creamos el router
    r := mux.NewRouter()

    // 4) Definimos rutas PÚBLICAS (sin JWT), incluyendo OPTIONS correctamente
    r.HandleFunc("/register", handlers.Register).Methods("POST", "OPTIONS")
    r.HandleFunc("/login",    handlers.Login).Methods("POST", "OPTIONS") // ← CORRECCIÓN: "OPTIONS"

    // 5) Subrouter con JWT para rutas protegidas
    api := r.PathPrefix("/").Subrouter()
    api.Use(middleware.JWTMiddleware)
    api.HandleFunc("/ws",               handlers.HandleWebSocket).Methods("GET", "OPTIONS")
    api.HandleFunc("/add-expense",      handlers.AddExpense).Methods("POST", "OPTIONS")
    api.HandleFunc("/expenses-current", handlers.GetCurrentExpenses).Methods("GET", "OPTIONS")
    api.HandleFunc("/available-months", handlers.GetAvailableMonths).Methods("GET", "OPTIONS")
    api.HandleFunc("/expenses/{month}", handlers.GetMonthExpenses).Methods("GET", "OPTIONS")
    api.HandleFunc("/budget",           handlers.SetBudget).Methods("POST", "OPTIONS")
    api.HandleFunc("/budget/{month}",   handlers.GetBudget).Methods("GET", "OPTIONS")

    // 6) Envolvemos TODO el router con CORS (antes que JWT)
    handler := middleware.CORS(r)

    // 7) Arranque del servidor usando el router envuelto
    port := os.Getenv("PORT")
    if port == "" {
        port = "5183"
    }
    log.Printf("Servidor corriendo en :%s\n", port)
    log.Fatal(http.ListenAndServe(":"+port, handler))
}
