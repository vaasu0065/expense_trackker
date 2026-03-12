# Expense Tracker Application

A full-stack expense tracking application with two-step email verification, budget management, and data visualization.

## ✨ Features

✅ **Two-step email verification with OTP**
✅ User registration and authentication
✅ Add, edit, and delete expenses
✅ Filter expenses by date, month, category
✅ Sort expenses by date or amount
✅ Budget management with monthly tracking
✅ Visual analytics with pie and bar charts
✅ Export data to CSV or Excel
✅ Toast notifications for all actions
✅ Modern, responsive UI design

## 🛠 Tech Stack

### Backend
- Node.js + Express.js
- PostgreSQL
- JWT Authentication
- bcrypt for password hashing
- Nodemailer for email OTP verification

### Frontend
- React 19
- React Router
- Tailwind CSS
- Chart.js for data visualization
- Axios for API calls

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Email account for OTP (Gmail recommended)

## 🚀 Quick Start

### 1. Database Setup

```bash
# Create database
createdb expense_tracker
```

### 2. Backend Configuration

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your credentials
```

**Important:** Configure email settings in `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password  # See EMAIL_SETUP_GUIDE.md
EMAIL_FROM=Expense Tracker <your_email@gmail.com>
```

### 3. Initialize Database

```bash
cd backend
npm run init-db
```

### 4. Start Backend

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:4000`

### 5. Start Frontend

```bash
cd frontend
npm install
npm start
```

App opens at `http://localhost:3000`

## 📧 Email Setup

**For OTP verification to work, you MUST configure email.**

### Gmail (Recommended)
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `.env`

**Detailed guide:** See [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)

## 🔐 Registration Flow

1. User fills registration form (name, email, password)
2. System sends 6-digit OTP to email
3. User enters OTP on verification page
4. Email verified → Account activated
5. Welcome email sent
6. User can now login

## 📚 Documentation

- **[OTP_VERIFICATION_SETUP.md](OTP_VERIFICATION_SETUP.md)** - Complete OTP system documentation
- **[EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)** - Quick email configuration guide
- **[NOTIFICATION_SYSTEM.md](NOTIFICATION_SYSTEM.md)** - Toast notification documentation
- **[UI_IMPROVEMENTS.md](UI_IMPROVEMENTS.md)** - UI/UX enhancements
- **[FIXES_APPLIED.md](FIXES_APPLIED.md)** - Bug fixes and improvements
- **[QUICK_START.md](QUICK_START.md)** - Quick setup guide

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### OTP Verification
- `POST /otp/send` - Send OTP for registration
- `POST /otp/verify` - Verify OTP and activate account
- `POST /otp/resend` - Resend OTP

### Expenses
- `POST /expenses/add` - Add expense
- `GET /expenses/filter` - Filter expenses
- `DELETE /expenses/:id` - Delete expense
- `GET /expenses/summary` - Get summary
- `GET /expenses/export/csv` - Export to CSV
- `GET /expenses/export/excel` - Export to Excel

### Budget
- `POST /expenses/budget` - Save budget
- `GET /expenses/budget` - Get budget summary

## 🔒 Security Features

- Email verification required for registration
- Passwords hashed with bcrypt
- JWT token authentication
- SQL injection prevention
- Input validation
- OTP expiration (10 minutes)
- Rate limiting on OTP resend

## 🐛 Troubleshooting

### Email Not Sending
- Check email credentials in `.env`
- Use App Password for Gmail (not regular password)
- Check spam folder
- See [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env`
- Ensure database exists

### Port Already in Use
- Backend (4000): Change `PORT` in `.env`
- Frontend (3000): Will prompt to use another port

## 📄 License

ISC
