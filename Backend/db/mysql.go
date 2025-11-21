package db

import (
    "database/sql"
    "fmt"
    "os"
    "time"

    _ "github.com/go-sql-driver/mysql"
    "github.com/joho/godotenv"
)

var DB *sql.DB

// Connect carga la configuración y abre la conexión a la base de datos.
// Retorna error si falla en cualquier paso.
func Connect() error {
    // 1) Carga variables de entorno desde .env (no aborta si el archivo no existe)
    if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
        return fmt.Errorf("cargando .env: %w", err)
    }

    // 2) Construye el DSN
    user := os.Getenv("DB_USER")
    pass := os.Getenv("DB_PASSWORD")
    host := os.Getenv("DB_HOST")
    port := os.Getenv("DB_PORT")
    name := os.Getenv("DB_NAME")

    if user == "" || pass == "" || host == "" || name == "" {
        return fmt.Errorf("variables de entorno DB_USER, DB_PASSWORD, DB_HOST o DB_NAME no definidas")
    }

    // Si no especifican puerto, usa el default de MySQL
    if port == "" {
        port = "3306"
    }

    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, pass, host, port, name)

    // 3) Abre la conexión (no valida aún)
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return fmt.Errorf("sql.Open: %w", err)
    }

    // 4) Configura pool de conexiones
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(25)
    db.SetConnMaxLifetime(5 * time.Minute)

    // 5) Intenta un ping para verificar
    if err := db.Ping(); err != nil {
        return fmt.Errorf("db.Ping: %w", err)
    }

    // 6) Asigna al paquete
    DB = db
    return nil
}
