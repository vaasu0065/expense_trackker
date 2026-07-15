const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: [0.01, 'Amount must be greater than zero']
  },
  category: {
    type: String,
    enum: [
      'Food', 'Grocery', 'Travel', 'Fuel', 'Shopping', 
      'Entertainment', 'Healthcare', 'Bills', 'Salary', 
      'Income', 'Investment', 'Other'
    ],
    default: 'Other',
    index: true
  },
  merchant: { 
    type: String, 
    required: true, 
    trim: true 
  },
  source: { 
    type: String, 
    enum: ['manual', 'sms', 'gmail'], 
    required: true,
    index: true 
  },
  transactionType: { 
    type: String, 
    enum: ['expense', 'income'], 
    required: true, 
    index: true 
  },
  transactionReference: { 
    type: String, 
    required: true,
    trim: true
  },
  paymentMethod: { 
    type: String, 
    default: 'UPI',
    trim: true 
  },
  accountMasked: { 
    type: String, 
    default: '',
    trim: true 
  },
  transactionDate: { 
    type: Date, 
    required: true, 
    index: true 
  },
  rawSourceData: { 
    type: String, 
    select: false 
  }
}, { 
  timestamps: true 
});

// COMPOUND UNIQUE INDEX: Guaranteed prevention of duplicate SMS or Gmail imports
transactionSchema.index({ userId: 1, transactionReference: 1, transactionDate: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', transactionSchema);
