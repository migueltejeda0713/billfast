package handlers

import (
    "log"
    "net/http"

    "github.com/gorilla/websocket"

    "Billfast/middleware"
)

// upgrader con CheckOrigin = true para que pase el CORS handshake
var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

// HandleWebSocket valida que el usuario tenga un JWT válido (ya inyectado
// por JWTMiddleware en el contexto) y luego hace el upgrade.
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    // 1) Extraer userID del contexto (inyectado por JWTMiddleware)
    ctx := r.Context()
    uidVal := ctx.Value(middleware.UserIDKey)
    if uidVal == nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    userID, ok := uidVal.(int)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // 2) Upgrade de la conexión
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("WebSocket upgrade error:", err)
        return
    }
    defer conn.Close()

    log.Printf("WebSocket conectado para user_id=%d\n", userID)

    // 3) Loop de lectura/escritura
    for {
        mt, msg, err := conn.ReadMessage()
        if err != nil {
            log.Println("WebSocket read error:", err)
            break
        }
        log.Printf("User %d envió: %s\n", userID, msg)

        // Ejemplo: eco del mensaje
        if err := conn.WriteMessage(mt, msg); err != nil {
            log.Println("WebSocket write error:", err)
            break
        }
    }
}
