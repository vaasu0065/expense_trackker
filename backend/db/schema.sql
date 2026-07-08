-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create OTP verification table
CREATE TABLE IF NOT EXISTS otp_verification (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create password reset code table
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create imported transaction ledger table
CREATE TABLE IF NOT EXISTS imported_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  title VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  category VARCHAR(255) DEFAULT 'Other',
  date DATE DEFAULT CURRENT_DATE,
  time VARCHAR(10) DEFAULT '',
  source TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bank connection table for Account Aggregator / Open Banking providers
CREATE TABLE IF NOT EXISTS bank_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'mock',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'failed')),
  consent_id VARCHAR(255),
  account_mask VARCHAR(50),
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store provider transaction ids so repeated syncs do not duplicate imports
CREATE TABLE IF NOT EXISTS bank_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  connection_id INTEGER REFERENCES bank_connections(id) ON DELETE CASCADE,
  provider_transaction_id VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  title VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  category VARCHAR(255) DEFAULT 'Other',
  date DATE DEFAULT CURRENT_DATE,
  time VARCHAR(10) DEFAULT '',
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider_transaction_id)
);

-- Create budget table
CREATE TABLE IF NOT EXISTS budget (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  income NUMERIC DEFAULT 0,
  budget NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month, year)
);

-- Create lend_borrow table
CREATE TABLE IF NOT EXISTS lend_borrow (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('lend', 'borrow')),
  person_name VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT DEFAULT '',
  date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
