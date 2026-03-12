# Troubleshooting Guide

## Registration Failed Error

### Quick Fix (Development Mode)

The app now works WITHOUT email configuration! When email is not configured:

1. **Register normally** - Fill the form and click "Continue"
2. **Check backend console** - You'll see the OTP printed there:
   ```
   ⚠️  EMAIL NOT CONFIGURED!
   📧 OTP for user@example.com : 123456
   ⏰ Expires at: 2/11/2026, 10:30:00 AM
   ```
3. **Enter the OTP** - Copy it from console and paste in verification page
4. **Complete registration** - Account will be created!

### Steps to Fix

1. **Restart Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Try Registration Again**
   - Go to http://localhost:3000/register
   - Fill in the form
   - Click "Continue"
   - Check the backend console for the OTP
   - Enter the OTP on verification page

3. **Check Backend Console**
   Look for error messages that show what went wrong:
   - Database connection errors
   - Email configuration errors
   - OTP generation errors

### Common Errors & Solutions

#### Error: "Registration Failed"

**Possible Causes:**
1. Backend server not running
2. Database not initialized
3. Email configuration missing (now handled gracefully)

**Solutions:**

**1. Check Backend is Running**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Should see: "Server running on 4000"
```

**2. Initialize Database**
```bash
cd backend
npm run init-db
```

**3. Check Database Connection**
```bash
# Test PostgreSQL
pg_isready

# Connect to database
psql -d expense_tracker

# Check tables exist
\dt

# Should see: users, otp_verification, budget
```

#### Error: "Email sending failed"

**This is now handled!** The app will:
- Show OTP in backend console
- Display warning message
- Still allow registration to proceed

**To enable email (optional):**
1. Configure email in `.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=Expense Tracker <your_email@gmail.com>
   ```

2. For Gmail, get App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Generate password
   - Use it in EMAIL_PASSWORD

#### Error: "Server error"

**Check backend console for details:**
```bash
cd backend
npm run dev
# Watch for error messages
```

**Common issues:**
- Database not running: `brew services start postgresql` (Mac) or `sudo service postgresql start` (Linux)
- Wrong database credentials in `.env`
- Missing tables: Run `npm run init-db`

#### Error: "Invalid OTP"

**Solutions:**
1. Check if OTP expired (10 minutes)
2. Make sure you copied the correct OTP from console
3. Click "Resend Code" to get a new OTP

#### Error: "OTP has expired"

**Solution:**
- Click "Resend Code" button
- Wait 1 minute if needed
- Check console for new OTP

### Development Mode Features

When email is NOT configured, the app automatically:

✅ Prints OTP to backend console
✅ Shows warning notification
✅ Still creates user account
✅ Allows verification to proceed
✅ Displays OTP in frontend (dev mode only)

### Testing Without Email

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Register**
   - Go to http://localhost:3000/register
   - Fill form with any email (doesn't need to be real)
   - Click "Continue"

4. **Get OTP from Console**
   - Look at backend terminal
   - Find the 6-digit OTP
   - Copy it

5. **Verify**
   - Paste OTP in verification page
   - Click "Verify Email"
   - Done!

### Enable Email Later

When ready to enable email:

1. **Update `.env`**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=Expense Tracker <your_email@gmail.com>
   ```

2. **Restart Backend**
   ```bash
   cd backend
   npm run dev
   ```

3. **Test**
   - Register with real email
   - Check inbox for OTP
   - Verify account

### Check Logs

**Backend Console Shows:**
- ✅ OTP email sent to: user@example.com
- ⚠️ EMAIL NOT CONFIGURED!
- 📧 OTP for user@example.com : 123456
- ❌ Failed to send email: [error message]
- ❌ Registration error: [error details]

**Frontend Console Shows:**
- Network errors (if backend not running)
- API response errors
- Navigation errors

### Quick Diagnostic Commands

```bash
# Check if backend is running
curl http://localhost:4000/test

# Check if frontend is running
curl http://localhost:3000

# Check PostgreSQL
pg_isready

# Check database exists
psql -l | grep expense_tracker

# Check tables
psql -d expense_tracker -c "\dt"

# Check users table structure
psql -d expense_tracker -c "\d users"

# Check if nodemailer is installed
cd backend
npm list nodemailer
```

### Still Having Issues?

1. **Check all services are running:**
   - PostgreSQL: `pg_isready`
   - Backend: `curl http://localhost:4000/test`
   - Frontend: Browser at http://localhost:3000

2. **Check environment variables:**
   ```bash
   cd backend
   cat .env
   # Verify DB_* variables are correct
   ```

3. **Reinitialize database:**
   ```bash
   cd backend
   npm run init-db
   ```

4. **Clear and reinstall:**
   ```bash
   cd backend
   rm -rf node_modules
   npm install
   npm run dev
   ```

5. **Check browser console:**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

### Success Indicators

You'll know it's working when:

✅ Backend shows: "Server running on 4000"
✅ Registration shows: "OTP generated (check server console)"
✅ Backend console shows: "📧 OTP for user@example.com : 123456"
✅ Verification page loads
✅ OTP verification succeeds
✅ Can login after verification

### Need More Help?

Check these files:
- [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) - Email configuration
- [INSTALLATION_CHECKLIST.md](INSTALLATION_CHECKLIST.md) - Setup steps
- [OTP_VERIFICATION_SETUP.md](OTP_VERIFICATION_SETUP.md) - Complete documentation
