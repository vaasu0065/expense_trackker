# Two-Step Email Verification Setup Guide

## Overview
The application now includes a two-step email verification system using OTP (One-Time Password) for new user registration. Users must verify their email address before they can log in.

## Features

✅ 6-digit OTP sent to user's email
✅ 10-minute expiration time
✅ Resend OTP functionality (after 1 minute)
✅ Beautiful HTML email templates
✅ Auto-focus and paste support for OTP input
✅ Timer countdown display
✅ Prevents login until email is verified
✅ Welcome email after successful verification

## Architecture

### Backend Components

1. **Email Service** (`backend/utils/emailService.js`)
   - Nodemailer configuration
   - OTP generation (6-digit random number)
   - Send OTP email with HTML template
   - Send welcome email after verification

2. **OTP Controller** (`backend/controllers/otpController.js`)
   - `sendRegistrationOTP` - Generate and send OTP
   - `verifyOTP` - Verify OTP and activate account
   - `resendOTP` - Resend new OTP

3. **OTP Routes** (`backend/routes/otpRoutes.js`)
   - POST `/otp/send` - Send OTP
   - POST `/otp/verify` - Verify OTP
   - POST `/otp/resend` - Resend OTP

4. **Database Tables**
   - `users` - Added `is_verified` column
   - `otp_verification` - Stores OTP codes with expiration

### Frontend Components

1. **Register.js** - Updated to send OTP instead of direct registration
2. **VerifyOTP.js** - New component for OTP verification
3. **App.js** - Added `/verify-otp` route

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install nodemailer
```

### 2. Configure Email Service

Update `backend/.env` with your email credentials:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=Expense Tracker <your_email@gmail.com>
```

### 3. Gmail Setup (Recommended)

If using Gmail:

1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
   - Use this as `EMAIL_PASSWORD` in .env

**Important:** Don't use your regular Gmail password!

### 4. Update Database Schema

Run the database initialization to create new tables:

```bash
cd backend
npm run init-db
```

This creates:
- `is_verified` column in `users` table
- `otp_verification` table for storing OTPs

### 5. Alternative Email Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your_mailgun_username
EMAIL_PASSWORD=your_mailgun_password
```

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_password
```

## User Flow

### Registration Flow

1. User fills registration form (name, email, password)
2. Click "Continue" button
3. Backend generates 6-digit OTP
4. OTP stored in database with 10-minute expiration
5. Email sent to user with OTP
6. User redirected to OTP verification page

### Verification Flow

1. User enters 6-digit OTP
2. Can paste OTP (auto-fills all boxes)
3. Auto-focus moves to next input
4. Click "Verify Email" button
5. Backend validates OTP and expiration
6. User account marked as verified
7. User-specific expense table created
8. Welcome email sent
9. User redirected to login page

### Resend OTP

- Available after 1 minute
- Generates new OTP
- Deletes old OTP
- Resets 10-minute timer
- Sends new email

### Login Protection

- Users with unverified emails cannot log in
- Error message: "Please verify your email before logging in"
- Provides option to resend OTP

## Email Templates

### OTP Email
- Purple gradient header
- Large, centered OTP code
- 10-minute expiration warning
- Professional styling
- Mobile responsive

### Welcome Email
- Celebration theme
- Feature highlights
- "Get Started" button
- Links to login page

## Security Features

1. **OTP Expiration** - 10 minutes
2. **One-time Use** - OTP deleted after verification
3. **Rate Limiting** - Resend available after 1 minute
4. **Hashed Passwords** - Stored securely with bcrypt
5. **Email Validation** - Regex validation on frontend
6. **SQL Injection Protection** - Parameterized queries

## Testing

### Test Email Sending

```javascript
// Test in Node.js console
const { sendOTPEmail } = require('./backend/utils/emailService');
sendOTPEmail('test@example.com', '123456', 'Test User')
  .then(() => console.log('Email sent!'))
  .catch(err => console.error('Error:', err));
```

### Test OTP Flow

1. Register with a real email address
2. Check inbox (and spam folder)
3. Enter OTP on verification page
4. Verify successful login

## Troubleshooting

### Email Not Sending

**Check:**
- Email credentials in .env are correct
- App password (not regular password) for Gmail
- Port 587 is not blocked by firewall
- SMTP server is accessible
- Check backend console for errors

**Common Errors:**
```
Error: Invalid login
→ Wrong email/password in .env

Error: Connection timeout
→ Port 587 blocked or wrong host

Error: self signed certificate
→ Add to transporter: { rejectUnauthorized: false }
```

### OTP Not Received

1. Check spam/junk folder
2. Verify email address is correct
3. Check backend logs for email sending errors
4. Try resending OTP
5. Check email service status

### OTP Expired

- OTPs expire after 10 minutes
- Click "Resend Code" to get a new one
- Timer shows remaining time

### Can't Resend OTP

- Must wait 1 minute between resends
- Timer shows when resend is available

## Database Schema

### users table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### otp_verification table
```sql
CREATE TABLE otp_verification (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### POST /otp/send
Send OTP for registration

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "msg": "OTP sent to your email. Please check your inbox.",
  "email": "john@example.com"
}
```

### POST /otp/verify
Verify OTP and complete registration

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "msg": "Email verified successfully! You can now login.",
  "verified": true
}
```

### POST /otp/resend
Resend OTP

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "msg": "New OTP sent to your email"
}
```

## Frontend Features

### OTP Input Component

- 6 separate input boxes
- Auto-focus on next box
- Backspace moves to previous box
- Paste support (auto-fills all boxes)
- Only accepts numbers
- Visual feedback

### Timer Display

- Shows remaining time (MM:SS format)
- Updates every second
- Red text when expired
- Disables verify button when expired

### Resend Logic

- Disabled for first 60 seconds
- Shows countdown until available
- Generates new OTP
- Resets timer

## Production Considerations

1. **Email Service**
   - Use professional email service (SendGrid, Mailgun, AWS SES)
   - Set up SPF, DKIM, DMARC records
   - Monitor email delivery rates

2. **Rate Limiting**
   - Limit OTP requests per email (e.g., 5 per hour)
   - Prevent abuse and spam

3. **Logging**
   - Log OTP generation (not the OTP itself)
   - Log verification attempts
   - Monitor failed attempts

4. **Cleanup**
   - Periodically delete expired OTPs
   - Delete unverified users after X days

5. **Error Handling**
   - Graceful fallback if email fails
   - User-friendly error messages
   - Admin notifications for email failures

## Future Enhancements

- SMS OTP as alternative
- Social login (Google, Facebook)
- Remember device (skip OTP for trusted devices)
- Biometric authentication
- Two-factor authentication for login
- Email change verification
- Password reset via OTP

## Support

For issues:
1. Check backend console logs
2. Verify email configuration
3. Test email sending separately
4. Check database for OTP records
5. Review network/firewall settings
