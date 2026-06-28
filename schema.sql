-- Turso/libSQL Database Schema
-- Run this on your Turso database using the Turso CLI

-- User table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  doctorName TEXT,
  emailVerified INTEGER DEFAULT 0 NOT NULL,
  verificationToken TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- SymptomLog table
CREATE TABLE IF NOT EXISTS SymptomLog (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  date TEXT NOT NULL,
  painLevel REAL DEFAULT 0 NOT NULL,
  stoolFrequency REAL DEFAULT 0 NOT NULL,
  stoolType REAL,
  stressLevel REAL DEFAULT 0 NOT NULL,
  triggers TEXT NOT NULL,
  notes TEXT,
  medicationTaken TEXT,
  bloodInStool INTEGER DEFAULT 0 NOT NULL,
  urgencyLevel INTEGER DEFAULT 0 NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_symptomlog_userid ON SymptomLog(userId);
CREATE INDEX IF NOT EXISTS idx_symptomlog_date ON SymptomLog(date);
