import mongoose from 'mongoose';
import Voucher from '../../../models/Voucher';
import Plan from '../../../models/Plan';

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

// Function to generate a shorter, memorable but complex voucher code
function generateShortVoucherCode() {
  const vowels = 'AEIOU';
  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
  const digits = '0123456789';
  
  // Pattern: CVC-DDD (Consonant-Vowel-Consonant-Digit-Digit-Digit)
  // This creates memorable yet somewhat complex codes like "KAP-239" or "TIR-847"
  const getRandomChar = (str) => str[Math.floor(Math.random() * str.length)];
  
  let code = '';
  code += getRandomChar(consonants);
  code += getRandomChar(vowels);
  code += getRandomChar(consonants);
  code += '-';
  code += getRandomChar(digits);
  code += getRandomChar(digits);
  code += getRandomChar(digits);
  
  return code;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { planId, phoneNumber, paymentId, expiresAt, isActive = true } = req.body;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    // Generate a unique voucher code
    let code;
    let existingVoucher;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateShortVoucherCode();
      existingVoucher = await Voucher.findOne({ code });
      attempts++;
      if (attempts > maxAttempts) {
        return res.status(500).json({ message: 'Unable to generate a unique voucher code after multiple attempts' });
      }
    } while (existingVoucher);

    const expiresDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days if not specified

    const voucher = new Voucher({
      code,
      planId,
      phoneNumber,
      paymentId,
      expiresAt: expiresDate,
      isActive
    });

    await voucher.save();

    // Fetch the plan details to include the plan name in the response
    const plan = await Plan.findById(planId);

    res.status(201).json({
      message: 'Voucher generated successfully',
      voucher: {
        id: voucher._id,
        code: voucher.code,
        password: 'N/A', // Included for compatibility with frontend expecting this field
        planId: voucher.planId,
        plan: plan ? plan.name : 'Unknown Plan',
        expiresAt: voucher.expiresAt.toISOString(),
        isActive: voucher.isActive
      }
    });
  } catch (error) {
    console.error('Error generating voucher:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
