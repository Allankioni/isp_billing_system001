// pages/api/admin/users.js
import { connectToDatabase } from '../../../utils/db';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
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

  if (!checkRole(['admin'])(req.user)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  if (req.method === 'GET') {
    try {
      const users = await User.find().select('-password');
      return res.json(users);
    } catch (error) {
      console.error('Users fetch error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const userData = req.body;
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      const newUser = new User(userData);
      await newUser.save();
      // Remove password from response
      const userResponse = newUser.toObject();
      delete userResponse.password;
      return res.status(201).json(userResponse);
    } catch (error) {
      console.error('User creation error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const userData = req.body;
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true }).select('-password');
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(updatedUser);
    } catch (error) {
      console.error('User update error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('User deletion error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
