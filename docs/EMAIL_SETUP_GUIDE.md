# Quick Email Setup Guide for OTP Verification

## Gmail Setup (Easiest Option)

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Follow the steps to enable it

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" from the dropdown
3. Select "Other" for device and enter "Expense Tracker"
4. Click "Generate"
5. Copy the 16-character password (remove spaces)

### Step 3: Update .env File
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # The 16-char app password
EMAIL_FROM=Expense Tracker <your_email@gmail.com>
```

### Step 4: Test
```bash
cd backend
npm install
npm run dev
```

Register a new account and check your email!

---

## Alternative: Mailtrap (For Testing)

Perfect for development/testing without sending real emails.

### Step 1: Create Account
1. Go to https://mailtrap.io
2. Sign up for free account
3. Go to "Email Testing" → "Inboxes"

### Step 2: Get Credentials
1. Click on your inbox
2. Select "Nodemailer" from integrations
3. Copy the credentials

### Step 3: Update .env
```env
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_username
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_FROM=Expense Tracker <noreply@expensetracker.com>
```

All emails will appear in Mailtrap inbox instead of real inboxes!

---

## Alternative: SendGrid (Production Ready)

### Step 1: Create Account
1. Go to https://sendgrid.com
2. Sign up (free tier: 100 emails/day)
3. Verify your email

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Give it a name and select "Full Access"
4. Copy the API key

### Step 3: Update .env
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=Expense Tracker <noreply@yourdomain.com>
```

---

## Troubleshooting

### "Invalid login" Error
- **Gmail:** Make sure you're using App Password, not regular password
- **Other:** Verify username and password are correct

### "Connection timeout" Error
- Check if port 587 is blocked by firewall
- Try port 465 with `secure: true` in transporter

### "Self-signed certificate" Error
Add to `backend/utils/emailService.js`:
```javascript
const transporter = nodemailer.createTransport({
  // ... other config
  tls: {
    rejectUnauthorized: false
  }
});
```

### Email Goes to Spam
- Use a professional email service (SendGrid, Mailgun)
- Set up SPF, DKIM, DMARC records for your domain
- Use a verified sender email

### No Email Received
1. Check spam/junk folder
2. Check backend console for errors
3. Verify email address is correct
4. Try Mailtrap to see if emails are being sent

---

## Testing Without Email (Development)

If you want to skip email verification during development:

### Option 1: Check Console
The OTP is logged in the backend console. Look for:
```
OTP for user@example.com: 123456
```

### Option 2: Disable Verification
In `backend/routes/authRoutes.js`, temporarily set:
```javascript
is_verified: true  // Skip verification
```

**Remember to re-enable for production!**

---

## Production Recommendations

1. **Use Professional Service**
   - SendGrid (100 emails/day free)
   - Mailgun (5,000 emails/month free)
   - AWS SES (62,000 emails/month free)

2. **Use Custom Domain**
   - More professional
   - Better deliverability
   - Less likely to be marked as spam

3. **Monitor Delivery**
   - Track bounce rates
   - Monitor spam complaints
   - Set up webhooks for events

4. **Set Up DNS Records**
   - SPF record
   - DKIM signature
   - DMARC policy

---

## Quick Start Commands

```bash
# Install dependencies
cd backend
npm install

# Update .env with email credentials
nano .env  # or use your editor

# Initialize database
npm run init-db

# Start server
npm run dev

# In another terminal, start frontend
cd frontend
npm start
```

Now register a new account and check your email for the OTP!
