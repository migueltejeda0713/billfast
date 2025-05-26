// middleware/jwt.go
package middleware

import (
    "context"
    "log"
    "net/http"
    "os"
    "strings"

    "github.com/golang-jwt/jwt/v5"
)

type key int

const UserIDKey key = 0

func JWTMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")

        if tokenString == "" {
            log.Printf("[JWT] 401 No autorizado — Token faltante. Authorization header: %q\n", authHeader)
            http.Error(w, "No autorizado", http.StatusUnauthorized)
            return
        }

        secret := os.Getenv("JWT_SECRET")
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            return []byte(secret), nil
        })
        if err != nil {
            log.Printf("[JWT] 401 Token inválido — Error parse: %v.\nToken recibido: %q\nSecreto usado para verificar firma: %q\n",
                err, tokenString, secret)
            http.Error(w, "Token inválido", http.StatusUnauthorized)
            return
        }
        if !token.Valid {
            log.Printf("[JWT] 401 Token inválido — token.Valid=false.\nToken recibido: %q\nSecreto usado: %q\n",
                tokenString, secret)
            http.Error(w, "Token inválido", http.StatusUnauthorized)
            return
        }

        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            log.Printf("[JWT] 401 Token inválido — no MapClaims.\nToken recibido: %q\n", tokenString)
            http.Error(w, "Token inválido", http.StatusUnauthorized)
            return
        }

        uidFloat, ok := claims["user_id"].(float64)
        if !ok {
            log.Printf("[JWT] 401 Token inválido — claim user_id ausente o mal tipeado.\nToken recibido: %q\n", tokenString)
            http.Error(w, "Token inválido", http.StatusUnauthorized)
            return
        }
        userID := int(uidFloat)

        ctx := context.WithValue(r.Context(), UserIDKey, userID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
