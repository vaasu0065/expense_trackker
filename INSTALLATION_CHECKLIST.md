# Installation Checklist for OTP Feature

Follow this checklist to set up the two-step email verification system.

## ✅ Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

This will install `nodemailer` (already added to package.json).

### 2. Configure Environment Variables

Edit `backend/.env` and add email configuration:

```env
# Existing variables
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=expense_tracker
DB_PORT=5432
JWT_SECRET=your_secret_key
PORT=4000

# NEW: Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=Expense Tracker <your_email@gmail.com>
```

### 3. Set Up Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Enter "Expense Tracker"
6. Copy the 16-character password
7. Paste it as `EMAIL_PASSWORD` in .env (remove spaces)

### 4. Update Database Schema

```bash
cd backend
npm run init-db
```

This creates:
- `otp_verification` table
- `is_verified` column in `users` table

### 5. Verify Backend Files

Check these files exist:
- [ ] `backend/utils/emailService.js`
- [ ] `backend/controllers/otpController.js`
- [ ] `backend/routes/otpRoutes.js`
- [ ] `backend/db/schema.sql` (updated)
- [ ] `backend/server.js` (updated with OTP routes)

### 6. Start Backend

```bash
cd backend
npm run dev
```

You should see:
```
Server running on 4000
```

## ✅ Frontend Setup

### 1. Verify Frontend Files

Check these files exist:
- [ ] `frontend/src/components/VerifyOTP.js`
- [ ] `frontend/src/components/Register.js` (updated)
- [ ] `frontend/src/App.js` (updated with /verify-otp route)

### 2. Start Frontend

```bash
cd frontend
npm start
```

Browser should open at http://localhost:3000

## ✅ Testing

### Test 1: Registration Flow

1. Go to http://localhost:3000/register
2. Fill in:
   - Name: Test User
   - Email: your_real_email@gmail.com
   - Password: test123
3. Click "Continue"
4. Should see: "OTP sent to your email! 📧"
5. Should redirect to verification page

### Test 2: Email Received

1. Check your email inbox
2. Look for email from your configured sender
3. Should see 6-digit OTP code
4. Email should have purple gradient design

### Test 3: OTP Verification

1. On verification page, enter the 6-digit OTP
2. Click "Verify Email"
3. Should see: "Email verified successfully! 🎉"
4. Should redirect to login page
5. Check email for welcome message

### Test 4: Login

1. Go to http://localhost:3000/login
2. Enter email and password
3. Should see: "Welcome back, Test User! 🎉"
4. Should redirect to dashboard

### Test 5: Resend OTP

1. Register with another email
2. On verification page, wait 1 minute
3. Click "Resend Code"
4. Should receive new OTP
5. Timer should reset to 10:00

### Test 6: Expired OTP

1. Register with another email
2. Wait 10 minutes (or modify expiration in code)
3. Try to verify with old OTP
4. Should see: "OTP has expired. Please request a new one."

### Test 7: Invalid OTP

1. Register with another email
2. Enter wrong OTP (e.g., 000000)
3. Should see: "Invalid OTP"
4. OTP inputs should clear

### Test 8: Unverified Login Attempt

1. Register but don't verify
2. Try to login
3. Should see: "Please verify your email before logging in"

## ✅ Troubleshooting

### Email Not Sending

**Check Backend Console:**
```bash
# Look for errors like:
Error sending email: Invalid login
Error sending email: Connection timeout
```

**Solutions:**
- [ ] Verify EMAIL_USER and EMAIL_PASSWORD in .env
- [ ] Confirm using App Password (not regular password)
- [ ] Check if port 587 is open
- [ ] Try Mailtrap for testing (see EMAIL_SETUP_GUIDE.md)

### Database Errors

**Check if tables exist:**
```sql
psql -d expense_tracker
\dt
-- Should see: users, otp_verification, budget
\d users
-- Should see: is_verified column
```

**If tables missing:**
```bash
cd backend
npm run init-db
```

### Frontend Errors

**Check browser console for:**
- Network errors (API not responding)
- CORS errors (backend not running)
- Navigation errors (routes not configured)

**Solutions:**
- [ ] Ensure backend is running on port 4000
- [ ] Check API calls in Network tab
- [ ] Verify routes in App.js

## ✅ Production Checklist

Before deploying to production:

### Security
- [ ] Use strong JWT_SECRET
- [ ] Use professional email service (SendGrid, Mailgun)
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Set up monitoring

### Email
- [ ] Configure custom domain
- [ ] Set up SPF, DKIM, DMARC records
- [ ] Monitor bounce rates
- [ ] Set up email webhooks

### Database
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Add database indexes
- [ ] Set up monitoring

### Performance
- [ ] Add Redis for OTP caching
- [ ] Implement rate limiting
- [ ] Add CDN for frontend
- [ ] Optimize database queries

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Monitor email delivery
- [ ] Track OTP success rates
- [ ] Set up alerts

## ✅ Quick Commands Reference

```bash
# Backend
cd backend
npm install              # Install dependencies
npm run init-db          # Initialize database
npm run dev              # Start development server

# Frontend
cd frontend
npm install              # Install dependencies
npm start                # Start development server

# Database
createdb expense_tracker # Create database
psql -d expense_tracker  # Connect to database
\dt                      # List tables
\d users                 # Describe users table

# Testing
curl http://localhost:4000/test  # Test backend
```

## ✅ Support Resources

- **OTP System:** [OTP_VERIFICATION_SETUP.md](OTP_VERIFICATION_SETUP.md)
- **Email Setup:** [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)
- **Feature Summary:** [OTP_FEATURE_SUMMARY.md](OTP_FEATURE_SUMMARY.md)
- **Main README:** [README.md](README.md)

## ✅ Success Indicators

You'll know everything is working when:

✅ Backend starts without errors
✅ Frontend loads without errors
✅ Registration sends OTP email
✅ OTP email arrives in inbox
✅ OTP verification works
✅ Welcome email arrives
✅ Login works after verification
✅ Login blocked before verification
✅ Resend OTP works
✅ Timer counts down correctly

## 🎉 Congratulations!

If all checks pass, your two-step email verification system is ready!

Users can now:
- Register with email verification
- Receive OTP codes
- Verify their email
- Get welcome emails
- Login securely

Next steps:
- Test with multiple users
- Monitor email delivery
- Gather user feedback
- Consider additional features
