import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: true
  },
  macAddress: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  dataUsed: {
    type: Number, // in MB
    default: 0
  },
  timeUsed: {
    type: Number, // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'terminated', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Method to check if session is still active
SessionSchema.methods.isActive = function() {
  return this.status === 'active' && (!this.endTime || this.endTime > new Date());
};

// Static method to find active session by MAC address
SessionSchema.statics.findActiveByMacAddress = function(macAddress) {
  return this.findOne({
    macAddress,
    status: 'active',
    endTime: { $gte: new Date() }
  }).populate('voucher');
};

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
