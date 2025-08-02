const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  phoneNumber: {
    type: String
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  dataLimit: {
    type: Number, // in MB
    default: 0 // 0 means unlimited or plan-defined
  },
  dataUsed: {
    type: Number, // in MB
    default: 0
  },
  timeLimit: {
    type: Number, // in minutes
    default: 0 // 0 means unlimited or plan-defined
  },
  timeUsed: {
    type: Number, // in minutes
    default: 0
  },
  concurrentDevices: {
    type: Number,
    default: 1
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Check if model already exists to prevent overwriting
module.exports = mongoose.models.Voucher || mongoose.model('Voucher', VoucherSchema);
