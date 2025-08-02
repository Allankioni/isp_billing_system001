// pages/api/admin/dashboard.js
import { connectToDatabase } from '../../../utils/db';
import User from '../../../models/User';
import Voucher from '../../../models/Voucher';
import Payment from '../../../models/Payment';
import Session from '../../../models/Session';
import { authenticateToken, checkRole } from '../../../utils/auth';

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ message: 'Database connection failed', error: error.message });
  }

  // Authenticate and check role
  const authResult = await authenticateToken(req);
  if (!authResult.authenticated) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!checkRole(['admin', 'manager'])(req.user)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  if (req.method === 'GET') {
    try {
      // Get counts for dashboard stats
      const usersCount = await User.countDocuments();
      const vouchersCount = await Voucher.countDocuments();
      const paymentsCount = await Payment.countDocuments();
      const sessionsCount = await Session.countDocuments({ status: 'active' });

      return res.json({
        users: usersCount,
        vouchers: vouchersCount,
        payments: paymentsCount,
        sessions: sessionsCount
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
