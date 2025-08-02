// pages/api/vouchers/[id].js
import { connectToDatabase } from '../../../utils/db';
import Voucher from '../../../models/Voucher';
import { authenticateToken } from '../../../utils/auth';

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ message: 'Database connection failed', error: error.message });
  }

  // Authenticate the request
  const authResult = await authenticateToken(req);
  if (!authResult.authenticated) {
    return res.status(401).json({ message: 'Authentication failed' });
  }

  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const voucher = await Voucher.findByIdAndDelete(id);
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher not found' });
      }
      return res.json({ success: true, message: 'Voucher deleted successfully' });
    } catch (error) {
      console.error('Voucher deletion error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
