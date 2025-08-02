import mongoose from 'mongoose';

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'custom'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'KES'
  },
  dataLimit: {
    type: Number, // in MB
    required: true
  },
  timeLimit: {
    type: Number, // in minutes
    required: true
  },
  bandwidthLimit: {
    type: Number, // in Kbps
    default: 0 // 0 means unlimited
  },
  concurrentDevices: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  features: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Method to check if plan is active
PlanSchema.methods.checkActiveStatus = function() {
  return this.isActive === true;
};

// Static method to get all active plans
PlanSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1, price: 1 });
};

// Static method to get default plans
PlanSchema.statics.getDefaultPlans = function() {
  return [
    {
      name: 'Hourly Basic',
      description: 'Basic internet access for 1 hour',
      type: 'hourly',
      price: 20,
      dataLimit: 100, // 100 MB
      timeLimit: 60, // 60 minutes
      bandwidthLimit: 1024, // 1 Mbps
      concurrentDevices: 1,
      features: ['Basic browsing', 'Email access'],
      displayOrder: 1
    },
    {
      name: 'Daily Standard',
      description: 'Standard internet access for 24 hours',
      type: 'daily',
      price: 50,
      dataLimit: 500, // 500 MB
      timeLimit: 1440, // 24 hours in minutes
      bandwidthLimit: 2048, // 2 Mbps
      concurrentDevices: 1,
      features: ['Video streaming', 'Social media', 'Email access'],
      displayOrder: 2
    },
    {
      name: 'Weekly Premium',
      description: 'Premium internet access for 7 days',
      type: 'weekly',
      price: 250,
      dataLimit: 5000, // 5 GB
      timeLimit: 10080, // 7 days in minutes
      bandwidthLimit: 5120, // 5 Mbps
      concurrentDevices: 2,
      features: ['HD video streaming', 'Fast downloads', 'Multiple devices'],
      displayOrder: 3
    },
    {
      name: 'Monthly Unlimited',
      description: 'Unlimited internet access for 30 days',
      type: 'monthly',
      price: 1000,
      dataLimit: 50000, // 50 GB
      timeLimit: 43200, // 30 days in minutes
      bandwidthLimit: 10240, // 10 Mbps
      concurrentDevices: 3,
      features: ['Unlimited browsing', '4K video streaming', 'Gaming', 'Multiple devices'],
      displayOrder: 4
    }
  ];
};

export default mongoose.models.Plan || mongoose.model('Plan', PlanSchema);
