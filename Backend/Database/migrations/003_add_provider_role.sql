-- Migration 003: Add provider role to users table
ALTER TABLE users MODIFY COLUMN role ENUM('client', 'provider', 'admin') DEFAULT 'client';
