// pages/api/payments/status/[paymentId].js
import { connectToDatabase } from '../../../../utils/db';
import Payment from '../../../../models/Payment';
import Voucher from '../../../../models/Voucher';

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ message: 'Database connection failed', error: error.message });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { paymentId } = req.query;

  try {
    const payment = await Payment.findOne({ paymentId }).populate('voucherId');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // For simulation purposes, we can return a static status
    // In a real implementation, this would check with MPESA or another payment gateway
    return res.json({
      status: payment.status,
      voucher: payment.voucherId || null,
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}
