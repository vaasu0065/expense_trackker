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
