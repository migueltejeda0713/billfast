// middleware/cors.go
package middleware

import (
    "net/http"
)

// CORS es un middleware que habilita CORS para todas las rutas.
// Debe aplicarse antes de tu middleware de autenticación.
func CORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Permite cualquier origen (en producción cámbialo a tu dominio)
        w.Header().Set("Access-Control-Allow-Origin", "*")
        // Métodos HTTP permitidos
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        // Cabeceras que el cliente puede enviar
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        // Permite enviar credenciales si es necesario
        w.Header().Set("Access-Control-Allow-Credentials", "true")

        // Responde al preflight OPTIONS sin pasar al siguiente handler
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }

        // Continúa con el siguiente handler
        next.ServeHTTP(w, r)
    })
}
