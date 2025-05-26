// handlers/auth.go
package handlers

import (
    "database/sql"
    "encoding/json"
    "errors"
    "fmt"
    "log"
    "net/http"
    "os"
    "strings"
    "time"

    mysql "github.com/go-sql-driver/mysql"
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"

    "Billfast/db"
    "Billfast/models"
)

// Register crea un nuevo usuario en la DB.
func Register(w http.ResponseWriter, r *http.Request) {
    var user models.User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, "JSON inválido", http.StatusBadRequest)
        return
    }

    // Cifra la contraseña
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
    if err != nil {
        http.Error(w, "Error al encriptar contraseña", http.StatusInternalServerError)
        return
    }
    user.Password = string(hashedPassword)

    // Intento de inserción
    _, err = db.DB.Exec(
        "INSERT INTO users (email, password, username) VALUES (?, ?, ?)",
        user.Email, user.Password, user.Username,
    )
    if err != nil {
        // Desempaquetar error MySQL
        var mysqlErr *mysql.MySQLError
        if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
            field := "Email"
            // MySQLError.Message contiene el índice duplicado
            if strings.Contains(mysqlErr.Message, "username") {
                field = "Nombre de usuario"
            }
            w.WriteHeader(http.StatusConflict)
            json.NewEncoder(w).Encode(map[string]string{
                "error": fmt.Sprintf("%s ya registrado", field),
            })
            return
        }
        // Log para depuración si no es un 1062
        log.Printf("[REGISTER] Error al insertar usuario: %T %v\n", err, err)
        http.Error(w, "Error al registrar usuario", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
}

// Login autentica al usuario y devuelve un JWT.
func Login(w http.ResponseWriter, r *http.Request) {
    // Delay intencional de 3 segundos
    time.Sleep(3 * time.Second)

    var input models.User
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Solicitud inválida", http.StatusBadRequest)
        return
    }

    // Consulta de usuario
    var user models.User
    err := db.DB.QueryRow(
        "SELECT id, password FROM users WHERE email = ?",
        input.Email,
    ).Scan(&user.ID, &user.Password)

    if err != nil {
        if err == sql.ErrNoRows {
            http.Error(w, "Credenciales inválidas", http.StatusUnauthorized)
        } else {
            http.Error(w, "Error interno", http.StatusInternalServerError)
        }
        return
    }

    // Verificar contraseña
    if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)) != nil {
        http.Error(w, "Credenciales inválidas", http.StatusUnauthorized)
        return
    }

    // Obtener secreto JWT
    secret := os.Getenv("JWT_SECRET")
    if secret == "" {
        log.Println("[LOGIN] JWT_SECRET no está definido en el entorno")
        http.Error(w, "Error interno", http.StatusInternalServerError)
        return
    }

    // Crear claims y token
    claims := jwt.MapClaims{
        "user_id": user.ID,
        "exp":     time.Now().Add(72 * time.Hour).Unix(),
    }
    tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := tokenObj.SignedString([]byte(secret))
    if err != nil {
        http.Error(w, "Error al generar token", http.StatusInternalServerError)
        return
    }

    // Devolver token
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}
