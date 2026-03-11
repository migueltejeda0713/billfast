package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
	"fmt"

	mysql "github.com/go-sql-driver/mysql"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"Billfast/db"
	"Billfast/models"
)

const (
	minPasswordLength = 4
	maxPasswordLength = 128
	maxEmailLength    = 255
	maxUsernameLength = 100
	bcryptCost        = 12
	jwtExpiration     = 72 * time.Hour
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

type ErrorResponse struct {
	Error string `json:"error"`
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, ErrorResponse{Error: message})
}

func validateEmail(email string) error {
	if len(email) == 0 {
		return errors.New("email is required")
	}
	if len(email) > maxEmailLength {
		return errors.New("email is too long")
	}
	if !emailRegex.MatchString(email) {
		return errors.New("invalid email format")
	}
	return nil
}

func validatePassword(password string) error {
	if len(password) < minPasswordLength {
		return errors.New("password is too short")
	}
	if len(password) > maxPasswordLength {
		return errors.New("password is too long")
	}
	return nil
}

func validateUsername(username string) error {
	if len(username) == 0 {
		return errors.New("username is required")
	}
	if len(username) > maxUsernameLength {
		return errors.New("username is too long")
	}
	return nil
}

func Register(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if err := validateEmail(user.Email); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := validatePassword(user.Password); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := validateUsername(user.Username); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcryptCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Internal server error")
		fmt.Print("error", err)
		return
	}
	user.Password = string(hashedPassword)

	_, err = db.DB.Exec(
		"INSERT INTO users (email, password, username) VALUES (?, ?, ?)",
		user.Email, user.Password, user.Username,
	)
	if err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			field := "Email"
			if strings.Contains(mysqlErr.Message, "username") {
				field = "Username"
			}
			respondError(w, http.StatusConflict, field+" already exists")
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func Login(w http.ResponseWriter, r *http.Request) {
	var input models.User
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	if err := validateEmail(input.Email); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	err := db.DB.QueryRow(
		"SELECT id, password FROM users WHERE email = ?",
		input.Email,
	).Scan(&user.ID, &user.Password)

	if err != nil {
		if err == sql.ErrNoRows {
			time.Sleep(time.Duration(100+time.Now().UnixNano()%200) * time.Millisecond)
			respondError(w, http.StatusUnauthorized, "Invalid credentials")
		} else {
			respondError(w, http.StatusInternalServerError, "Internal server error")
			fmt.Print("error", err)
		}
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)) != nil {
		time.Sleep(time.Duration(100+time.Now().UnixNano()%200) * time.Millisecond)
		respondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		respondError(w, http.StatusInternalServerError, "Internal server error")
		fmt.Print("error", err)
		return
	}

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(jwtExpiration).Unix(),
		"iat":     time.Now().Unix(),
	}
	tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := tokenObj.SignedString([]byte(secret))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"token":   tokenString,
		"user_id": user.ID,
	})
}
