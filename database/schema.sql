CREATE DATABASE IF NOT EXISTS document_verification;
USE document_verification;

-- User Table (Stores user details)
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Store hashed password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table (Stores uploaded documents)
CREATE TABLE document (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    document_name VARCHAR(255) NOT NULL,
    document_hash VARCHAR(255) NOT NULL, -- Stores blockchain hash
    file_path VARCHAR(500) NOT NULL, -- Stores the file location (if needed)
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
