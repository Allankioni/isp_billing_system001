import mongoose from 'mongoose';
import Voucher from '../../../models/Voucher';
import Session from '../../../models/Session';

// Ensure MongoDB connection
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return;
  }
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      try {
        const vouchers = await Voucher.find().populate({ path: 'planId', strictPopulate: false }).sort({ createdAt: -1 });
        res.status(200).json(vouchers);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
      }
    } else if (req.method === 'POST') {
      // Handle voucher validation for login
      try {
        const { code, phoneNumber, macAddress } = req.body;

        if (!code || !phoneNumber) {
          return res.status(400).json({ message: 'Voucher code and phone number are required' });
        }

        const voucher = await Voucher.findOne({ code }).populate({ path: 'planId', strictPopulate: false });

        if (!voucher) {
          return res.status(404).json({ message: 'Voucher not found' });
        }

        // Check if voucher is active and not expired
        if (!voucher.isActive) {
          return res.status(400).json({ message: 'Voucher is not active' });
        }

        if (voucher.expiresAt < new Date()) {
          return res.status(400).json({ message: 'Voucher has expired' });
        }

        // Check if phone number matches (if it was associated during purchase)
        if (voucher.phoneNumber && voucher.phoneNumber !== phoneNumber) {
          return res.status(400).json({ message: 'Phone number does not match voucher records' });
        }

        // Check concurrent device limit
        const activeSessions = await Session.countDocuments({
          voucherId: voucher._id,
          status: 'active'
        });

        if (activeSessions >= voucher.concurrentDevices) {
          return res.status(400).json({ message: 'Device limit reached for this voucher' });
        }

        // Create a new session
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
        const session = new Session({
          voucher: voucher._id,
          macAddress: macAddress || 'unknown',
          ipAddress: ipAddress,
          status: 'active',
          lastActivity: new Date()
        });

        await session.save();

        // Update voucher usage
        voucher.lastUsed = new Date();
        await voucher.save();

        res.status(200).json({
          message: 'Authentication successful',
          voucher: {
            code: voucher.code,
            plan: voucher.planId ? voucher.planId.name : 'Unknown Plan',
            dataLimit: voucher.dataLimit,
            dataUsed: voucher.dataUsed || 0,
            timeLimit: voucher.timeLimit,
            timeUsed: voucher.timeUsed || 0,
            expiresAt: voucher.expiresAt
          }
        });
      } catch (error) {
        console.error('Error validating voucher:', error);
        res.status(500).json({ message: 'Server error during voucher validation', error: error.message, stack: error.stack });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection error', error: error.message, stack: error.stack });
  }
}
