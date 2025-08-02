// pages/api/payments/index.js
import { connectToDatabase } from '../../../utils/db';
import Payment from '../../../models/Payment';
import Plan from '../../../models/Plan';
import Voucher from '../../../models/Voucher';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ message: 'Database connection failed', error: error.message });
  }

  if (req.method === 'GET') {
    // Handle getting plans or payment history
    if (req.query.plans) {
      try {
        const plans = await Plan.find({ isActive: true }).sort({ displayOrder: 1, price: 1 });
        return res.json(plans);
      } catch (error) {
        console.error('Get plans error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
      }
    } else {
      // Payment history - requires authentication
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;

        const query = {};
        
        if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
          query.status = status;
        }
        
        if (search) {
          query.$or = [
            { phoneNumber: { $regex: search, $options: 'i' } },
            { transactionId: { $regex: search, $options: 'i' } },
          ];
        }

        const payments = await Payment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('planId')
          .populate('voucherId');

        const total = await Payment.countDocuments(query);

        return res.json({
          payments,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Get payments error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
      }
    }
  } else if (req.method === 'POST') {
    // Handle payment initiation
    try {
      const { planId, phoneNumber } = req.body;

      if (!planId || !phoneNumber) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      if (!plan.isActive) {
        return res.status(400).json({ message: 'This plan is no longer available' });
      }

      const paymentId = uuidv4();
      const payment = new Payment({
        paymentId,
        planId,
        phoneNumber,
        amount: plan.price,
        status: 'pending',
      });

      await payment.save();

      // Integrate with MPESA API for payment processing
      const mpesaResponse = await initiateMpesaStkPush({
        phoneNumber,
        amount: plan.price,
        paymentId: payment.paymentId,
        callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://example.com/callback'
      });

      if (!mpesaResponse || mpesaResponse.ResponseCode !== '0') {
        payment.status = 'failed';
        payment.notes = mpesaResponse.ResponseDescription || 'Failed to initiate payment';
        await payment.save();
        return res.status(400).json({ 
          message: 'Failed to initiate payment', 
          error: mpesaResponse.ResponseDescription || 'Unknown error' 
        });
      }

      payment.mpesa = {
        checkoutRequestID: mpesaResponse.CheckoutRequestID,
        merchantRequestID: mpesaResponse.MerchantRequestID
      };
      await payment.save();

      return res.status(200).json({
        success: true,
        message: 'Payment request sent to your phone. Please complete the payment.',
        paymentId: payment.paymentId,
      });
    } catch (error) {
      console.error('Initiate payment error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

// Helper function to initiate MPESA STK Push
async function initiateMpesaStkPush({ phoneNumber, amount, paymentId, callbackUrl }) {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE;
    
    if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
      throw new Error('MPESA credentials not configured');
    }
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const authResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    
    const accessToken = authResponse.data.access_token;
    
    let formattedPhone = phoneNumber.replace(/^\+254/, '254').replace(/^0/, '254');
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    
    const stkPushResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `WIFI-${paymentId}`,
        TransactionDesc: 'WiFi Voucher Payment'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return stkPushResponse.data;
  } catch (error) {
    console.error('MPESA STK Push error:', error.response ? error.response.data : error.message);
    throw error;
  }
}
