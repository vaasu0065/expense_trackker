# Quick Start Guide

## Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

## Setup Steps

### 1. Database Setup
```bash
# Create database
createdb expense_tracker

# Or using psql
psql -U postgres
CREATE DATABASE expense_tracker;
\q
```

### 2. Backend Configuration
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
# - DB_PASSWORD: Your PostgreSQL password
# - JWT_SECRET: A strong random string

# Initialize database tables
npm run init-db
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on http://localhost:4000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
App opens at http://localhost:3000

## First Time Use

1. Navigate to http://localhost:3000
2. Click "Register" to create an account
3. Login with your credentials
4. Start tracking expenses!

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `backend/.env`
- Ensure database exists: `psql -l | grep expense_tracker`

### Port Already in Use
- Backend (4000): Change PORT in `backend/.env`
- Frontend (3000): It will prompt to use another port

### Module Not Found
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

## Default Categories
- Food
- Travel
- Shopping
- Bills
- Other

You can add custom categories by typing them in the expense form.

## Features to Try
1. Add expenses with different categories
2. Set monthly budget and income
3. Filter expenses by month/category
4. View charts and statistics
5. Export data to CSV or Excel
6. Check budget vs spending progress

## Security Notes
- Never share your `.env` file
- Use strong passwords
- Keep JWT_SECRET secure
- Don't commit sensitive data to git
