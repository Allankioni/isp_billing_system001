// pages/api/payments/mpesa-callback.js
import { connectToDatabase } from '../../../utils/db';
import Payment from '../../../models/Payment';
import Voucher from '../../../models/Voucher';

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ message: 'Database connection failed', error: error.message });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const callbackData = req.body;
    console.log('MPESA Callback received:', JSON.stringify(callbackData, null, 2));

    // Check if it's a valid callback from MPESA
    if (!callbackData || !callbackData.Body || !callbackData.Body.stkCallback) {
      return res.status(400).json({ message: 'Invalid callback data' });
    }

    const { stkCallback } = callbackData.Body;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    // Find the payment by MPESA request IDs
    const payment = await Payment.findOne({
      'mpesa.checkoutRequestID': CheckoutRequestID,
      'mpesa.merchantRequestID': MerchantRequestID
    });

    if (!payment) {
      console.error('Payment not found for callback:', { MerchantRequestID, CheckoutRequestID });
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status based on ResultCode
    if (ResultCode === 0) {
      // Payment successful
      payment.status = 'completed';
      payment.transactionId = CallbackMetadata?.Item?.find(item => item.Name === 'MpesaReceiptNumber')?.Value || 'N/A';
      payment.notes = ResultDesc || 'Payment completed successfully';
      
      // Optionally, create a voucher if not already created
      if (!payment.voucherId) {
        const plan = await Plan.findById(payment.planId);
        if (plan) {
          const voucherCode = generateVoucherCode();
          const voucherPassword = generateVoucherPassword();
          const expiresAt = new Date(Date.now() + plan.timeLimit * 60 * 1000); // Convert minutes to milliseconds
          
          const voucher = new Voucher({
            code: voucherCode,
            password: voucherPassword,
            planId: plan._id,
            plan: plan.name,
            dataLimit: plan.dataLimit,
            timeLimit: plan.timeLimit,
            expiresAt: expiresAt,
            status: 'active',
            paymentId: payment._id
          });
          
          await voucher.save();
          payment.voucherId = voucher._id;
        }
      }
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.notes = ResultDesc || 'Payment failed';
    }

    await payment.save();
    console.log(`Payment updated: ${payment.paymentId} to status ${payment.status}`);

    return res.status(200).json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('MPESA callback processing error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Helper function to generate a random voucher code
function generateVoucherCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + 
         Math.random().toString(36).substring(2, 7).toUpperCase();
}

// Helper function to generate a random voucher password
function generateVoucherPassword() {
  return Math.random().toString(36).substring(2, 10);
}
