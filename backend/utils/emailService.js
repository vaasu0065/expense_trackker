const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name = "User") => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email - Expense Tracker",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px;
              border-radius: 10px;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              padding: 20px;
              background: #f7fafc;
              border-radius: 8px;
              margin: 20px 0;
            }
            .header {
              color: white;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              🔐 Email Verification
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for registering with Expense Tracker. To complete your registration, please verify your email address.</p>
              
              <p>Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              
              <div class="warning">
                ⚠️ This code will expire in 10 minutes. Do not share this code with anyone.
              </div>
              
              <p>If you didn't request this code, please ignore this email.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Expense Tracker! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px;
              border-radius: 10px;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .header {
              color: white;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .feature {
              background: #f7fafc;
              padding: 15px;
              margin: 10px 0;
              border-radius: 8px;
              text-align: left;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              🎉 Welcome to Expense Tracker!
            </div>
            <div class="content">
              <h2>Hi ${name}!</h2>
              <p>Your account has been successfully verified. Welcome aboard! 🚀</p>
              
              <h3>What you can do:</h3>
              <div class="feature">
                💰 Track your daily expenses
              </div>
              <div class="feature">
                📊 View detailed analytics and charts
              </div>
              <div class="feature">
                💳 Set and manage monthly budgets
              </div>
              <div class="feature">
                📈 Export data to CSV or Excel
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                Get Started
              </a>
              
              <p style="margin-top: 30px;">Happy tracking! 📱</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Don't throw error for welcome email - it's not critical
    return false;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
};
