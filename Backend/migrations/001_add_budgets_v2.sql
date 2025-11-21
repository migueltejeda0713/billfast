
CREATE TABLE IF NOT EXISTS budgets_v2 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE expenses 
ADD COLUMN budget_id INT NULL AFTER user_id,
ADD FOREIGN KEY (budget_id) REFERENCES budgets_v2(id) ON DELETE SET NULL;


CREATE INDEX idx_budget_id ON expenses(budget_id);

