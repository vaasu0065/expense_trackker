# OTP Verification Debugging Guide

## Step-by-Step Debugging

### Step 1: Check Backend is Running

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Should see: "Server running on 4000"
```

### Step 2: Register a New User

1. Go to http://localhost:3000/register
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
3. Click "Continue"

### Step 3: Check Backend Console

You should see output like this:

```
⚠️  EMAIL NOT CONFIGURED!
📧 OTP for test@example.com : 123456
⏰ Expires at: 2/11/2026, 10:30:00 AM

To enable email sending, configure EMAIL_* variables in .env
See EMAIL_SETUP_GUIDE.md for instructions
```

**Copy the 6-digit OTP code!**

### Step 4: Verify OTP

1. You should be redirected to verification page
2. Enter the OTP you copied
3. Click "Verify Email"

### Step 5: Check Backend Console Again

You should see:

```
🔍 Verifying OTP for: test@example.com
📝 OTP received: 123456
📊 OTP records found: 1
👤 User found: Test User
✅ User marked as verified
🗑️ OTP deleted
📊 Expense table created: expenses_test_user_1
✅ Verification complete!
```

### Step 6: Check Browser Console

Open DevTools (F12) and check Console tab for:

```
🔍 Verifying OTP: 123456 for email: test@example.com
✅ Verification response: {msg: "Email verified successfully!", verified: true}
```

## Common Issues & Solutions

### Issue 1: "Invalid OTP"

**Symptoms:**
- Error message: "Invalid OTP. Please check and try again."
- Backend shows: "❌ Wrong OTP. Expected: 123456 Got: 654321"

**Solutions:**
1. Make sure you copied the correct OTP from backend console
2. Check for extra spaces when pasting
3. OTP is case-sensitive (though it's only numbers)
4. Try typing it manually instead of pasting

**Debug:**
```bash
# Check what OTP is in database
psql -d expense_tracker
SELECT email, otp, expires_at FROM otp_verification;
```

### Issue 2: "OTP has expired"

**Symptoms:**
- Error message: "OTP has expired. Please request a new one."
- Backend shows: "❌ OTP expired"

**Solutions:**
1. Click "Resend Code" button
2. Wait 1 minute if needed
3. Get new OTP from backend console
4. Enter new OTP quickly (within 10 minutes)

**Debug:**
```bash
# Check OTP expiration time
psql -d expense_tracker
SELECT email, otp, expires_at, NOW() as current_time FROM otp_verification;
```

### Issue 3: "No OTP found"

**Symptoms:**
- Error message: "No OTP found. Please request a new one."
- Backend shows: "❌ No OTP found for this email"

**Solutions:**
1. Go back to registration
2. Register again with same email
3. New OTP will be generated

**Debug:**
```bash
# Check if OTP exists
psql -d expense_tracker
SELECT * FROM otp_verification WHERE email = 'test@example.com';
```

### Issue 4: "User not found"

**Symptoms:**
- Error message: "User not found"
- Backend shows: "❌ User not found"

**Solutions:**
1. User wasn't created during registration
2. Check backend logs for registration errors
3. Try registering again

**Debug:**
```bash
# Check if user exists
psql -d expense_tracker
SELECT id, name, email, is_verified FROM users WHERE email = 'test@example.com';
```

### Issue 5: Network Error

**Symptoms:**
- Error in browser console: "Network Error"
- No response from backend

**Solutions:**
1. Check backend is running: `curl http://localhost:4000/test`
2. Check CORS is enabled
3. Check firewall settings

### Issue 6: Database Connection Error

**Symptoms:**
- Backend error: "Connection refused"
- Backend error: "database does not exist"

**Solutions:**
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL if needed
brew services start postgresql  # Mac
sudo service postgresql start   # Linux

# Check database exists
psql -l | grep expense_tracker

# Create database if missing
createdb expense_tracker

# Initialize tables
cd backend
npm run init-db
```

## Manual Database Checks

### Check OTP Table

```sql
-- Connect to database
psql -d expense_tracker

-- View all OTPs
SELECT * FROM otp_verification;

-- Check specific email
SELECT email, otp, expires_at, 
       CASE WHEN expires_at > NOW() THEN 'Valid' ELSE 'Expired' END as status
FROM otp_verification 
WHERE email = 'test@example.com';

-- Delete expired OTPs
DELETE FROM otp_verification WHERE expires_at < NOW();
```

### Check Users Table

```sql
-- View all users
SELECT id, name, email, is_verified FROM users;

-- Check specific user
SELECT * FROM users WHERE email = 'test@example.com';

-- Manually verify a user (for testing)
UPDATE users SET is_verified = true WHERE email = 'test@example.com';
```

### Reset Everything

```sql
-- Delete all OTPs
DELETE FROM otp_verification;

-- Delete all unverified users
DELETE FROM users WHERE is_verified = false;

-- Or delete specific user
DELETE FROM users WHERE email = 'test@example.com';
```

## Testing Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 3000
- [ ] PostgreSQL running
- [ ] Database `expense_tracker` exists
- [ ] Tables `users` and `otp_verification` exist
- [ ] Can register new user
- [ ] OTP appears in backend console
- [ ] Can navigate to verification page
- [ ] Can enter OTP
- [ ] Backend receives verification request
- [ ] OTP matches in database
- [ ] User gets verified
- [ ] Can login after verification

## Quick Test Script

```bash
# Test backend
curl http://localhost:4000/test
# Should return: "Backend Running OK"

# Test registration (replace with your data)
curl -X POST http://localhost:4000/otp/send \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Check database
psql -d expense_tracker -c "SELECT * FROM otp_verification;"

# Test verification (use OTP from above)
curl -X POST http://localhost:4000/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

## Enable Detailed Logging

Add to `backend/.env`:
```env
NODE_ENV=development
```

This will show more detailed error messages.

## Still Not Working?

1. **Restart everything:**
   ```bash
   # Stop all processes (Ctrl+C)
   
   # Backend
   cd backend
   npm run dev
   
   # Frontend (new terminal)
   cd frontend
   npm start
   ```

2. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

3. **Check all logs:**
   - Backend terminal
   - Frontend terminal
   - Browser console (F12)
   - Network tab in DevTools

4. **Try with a different email:**
   - Sometimes old data causes issues
   - Use a fresh email address

5. **Verify database schema:**
   ```bash
   cd backend
   npm run init-db
   ```

## Success Indicators

✅ Backend shows: "✅ Verification complete!"
✅ Frontend shows: "Email verified successfully! 🎉"
✅ Redirects to login page
✅ Can login with credentials
✅ Dashboard loads successfully

## Get Help

If still having issues, provide:
1. Backend console output
2. Frontend console output (F12)
3. Network tab errors (F12 → Network)
4. Database query results
5. Steps you followed
