// pages/api/admin/initialize.js
import { connectToDatabase } from '../../../utils/db';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({ message: 'Database connection failed', error: error.message });
  }

  if (req.method === 'POST') {
    try {
      // Check if an admin user already exists
      let existingAdmin = await User.findOne({ username: 'admin' });
      let message = 'Admin user initialized successfully';
      
      if (existingAdmin) {
        // Reset the password if admin exists
        const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
        existingAdmin.password = hashedPassword;
        existingAdmin.isActive = true;
        await existingAdmin.save();
        message = 'Admin user already exists. Password has been reset.';
      } else {
        // Create a default admin user
        const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
        const adminUser = new User({
          username: 'admin',
          password: hashedPassword,
          name: 'Administrator',
          email: 'admin@example.com',
          role: 'admin',
          isActive: true
        });
        await adminUser.save();
      }

      return res.status(201).json({ message: message, username: 'admin', defaultPassword: 'AdminPass123!' });
    } catch (error) {
      console.error('Initialization error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
