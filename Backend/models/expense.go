package models

import "time"

type Expense struct {
    ID        int       `json:"id"`
    UserID    int       `json:"user_id"`
    Amount    float64   `json:"amount"`
    Concept   string    `json:"concept"`
    CreatedAt time.Time `json:"created_at"`
}
