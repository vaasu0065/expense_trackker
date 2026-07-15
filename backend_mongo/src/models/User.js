const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, select: false },
  googleId: { type: String, sparse: true, index: true },
  
  // Encrypted Gmail OAuth tokens
  gmailAccessToken: { type: String, select: false },
  gmailRefreshToken: { type: String, select: false },
  gmailSyncEnabled: { type: Boolean, default: false },
  lastGmailSyncHistoryId: { type: String },
  lastGmailSyncDate: { type: Date },

  // User preferences
  settings: {
    smsTrackingEnabled: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    currency: { type: String, default: 'INR' },
    monthlyBudget: { type: Number, default: 50000 }
  }
}, { 
  timestamps: true 
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
