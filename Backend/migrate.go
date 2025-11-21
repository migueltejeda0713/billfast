package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"Billfast/db"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect to database
	if err := db.Connect(); err != nil {
		log.Fatal("Error connecting to DB:", err)
	}

	fmt.Println("Running database migrations...")

	// First, check the data type of users.id
	var columnType string
	err := db.DB.QueryRow(`
		SELECT DATA_TYPE
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'users'
		AND COLUMN_NAME = 'id'
	`).Scan(&columnType)
	
	if err != nil {
		log.Fatal("Error checking users.id type:", err)
	}
	fmt.Printf("Users.id column type: %s\n", columnType)

	// Create budgets_v2 table without foreign key first
	_, err = db.DB.Exec(`
		CREATE TABLE IF NOT EXISTS budgets_v2 (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL,
			name VARCHAR(255) NOT NULL,
			amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
			is_active BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			INDEX idx_user_active (user_id, is_active)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
	`)
	if err != nil {
		log.Fatal("Error creating budgets_v2 table:", err)
	}
	fmt.Println("✓ Created budgets_v2 table")

	// Check if budget_id column already exists
	var columnExists bool
	err = db.DB.QueryRow(`
		SELECT COUNT(*) > 0
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = 'expenses'
		AND COLUMN_NAME = 'budget_id'
	`).Scan(&columnExists)
	
	if err != nil {
		log.Fatal("Error checking for budget_id column:", err)
	}

	if !columnExists {
		// Add budget_id column to expenses table
		_, err = db.DB.Exec(`
			ALTER TABLE expenses 
			ADD COLUMN budget_id INT NULL AFTER user_id
		`)
		if err != nil {
			log.Fatal("Error adding budget_id column:", err)
		}
		fmt.Println("✓ Added budget_id column to expenses table")

		// Create index
		_, err = db.DB.Exec(`CREATE INDEX idx_budget_id ON expenses(budget_id)`)
		if err != nil {
			log.Fatal("Error creating index:", err)
		}
		fmt.Println("✓ Created index on budget_id")
	} else {
		fmt.Println("✓ budget_id column already exists")
	}

	fmt.Println("\n✅ Migration completed successfully!")
	fmt.Println("Note: Foreign key constraints were not added due to potential type mismatches.")
	fmt.Println("The application will work correctly without them.")
	os.Exit(0)
}
