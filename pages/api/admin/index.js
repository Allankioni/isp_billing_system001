// pages/api/admin/index.js
import { connectToDatabase } from '../../../utils/db';
import User from '../../../models/User';
import Plan from '../../../models/Plan';
import Session from '../../../models/Session';
import Voucher from '../../../models/Voucher';
import Payment from '../../../models/Payment';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await connectToDatabase();

  // Authentication check for all admin routes
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.role || !['admin', 'manager'].includes(decoded.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (req.method === 'GET') {
    // Handle different admin data requests
    const { resource } = req.query;

    if (resource === 'dashboard') {
      try {
        const totalUsers = await User.countDocuments();
        const activeVouchers = await Voucher.countDocuments({ status: 'active' });
        const activeSessions = await Session.countDocuments({ status: 'active' });
        const totalRevenue = await Payment.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        return res.json({
          stats: {
            totalUsers,
            activeVouchers,
            activeSessions,
            totalRevenue: revenue
          }
        });
      } catch (error) {
        console.error('Get dashboard stats error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else if (resource === 'users') {
      // Only admin can access user management
      if (decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find().skip(skip).limit(limit);
        const total = await User.countDocuments();

        return res.json({
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else if (resource === 'plans') {
      try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const plans = await Plan.find().skip(skip).limit(limit);
        const total = await Plan.countDocuments();

        return res.json({
          plans,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Get plans error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else if (resource === 'sessions') {
      try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const sessions = await Session.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('voucherId');

        const total = await Session.countDocuments();

        return res.json({
          sessions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Get sessions error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid resource' });
    }
  } else if (req.method === 'POST') {
    // Handle creation of users, plans, or initialization
    const { resource } = req.query;

    if (resource === 'users') {
      // Only admin can create users
      if (decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      try {
        const { name, email, password, role, isActive } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
          name,
          email,
          password: hashedPassword,
          role: role || 'viewer',
          isActive: isActive !== undefined ? isActive : true
        });

        return res.json({
          success: true,
          message: 'User created successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          }
        });
      } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else if (resource === 'plans') {
      try {
        const { name, description, type, price, dataLimit, timeLimit, bandwidthLimit, concurrentDevices, displayOrder, isActive, features } = req.body;
        const plan = await Plan.create({
          name,
          description,
          type,
          price,
          dataLimit,
          timeLimit,
          bandwidthLimit: bandwidthLimit || 0,
          concurrentDevices: concurrentDevices || 1,
          displayOrder: displayOrder || 0,
          isActive: isActive !== undefined ? isActive : true,
          features: features || [],
          createdBy: decoded.userId
        });

        return res.json({
          success: true,
          message: 'Plan created successfully',
          plan
        });
      } catch (error) {
        console.error('Create plan error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else if (resource === 'initialize') {
      // Only admin can initialize data
      if (decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      try {
        // Check if there are any plans already
        const existingPlans = await Plan.countDocuments();
        if (existingPlans > 0) {
          return res.status(400).json({ message: 'Plans already exist. Initialization aborted.' });
        }

        // Create default plans
        const defaultPlans = Plan.getDefaultPlans();
        const createdPlans = await Plan.insertMany(defaultPlans.map(plan => ({
          ...plan,
          createdBy: decoded.userId
        })));

        // Check if there are any admin users, if not create one
        const adminCount = await User.countDocuments({ role: 'admin' });
        let adminUser = null;

        if (adminCount === 0) {
          const adminPassword = await bcrypt.hash('admin123', 10);
          adminUser = await User.create({
            name: 'Administrator',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin',
            isActive: true
          });
        }

        return res.json({
          success: true,
          message: 'System initialized successfully',
          plansCreated: createdPlans.length,
          adminCreated: adminUser ? true : false,
          adminDetails: adminUser ? { email: adminUser.email, password: 'admin123' } : null
        });
      } catch (error) {
        console.error('Initialize system error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else if (resource === 'terminate-session') {
      try {
        const { id } = req.body;
        const session = await Session.findById(id);

        if (!session) {
          return res.status(404).json({ message: 'Session not found' });
        }

        session.status = 'terminated';
        session.terminatedAt = new Date();
        await session.save();

        return res.json({
          success: true,
          message: 'Session terminated successfully'
        });
      } catch (error) {
        console.error('Terminate session error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid resource' });
    }
  } else if (req.method === 'PUT') {
    // Handle updates to users or plans
    const { resource, id } = req.query;

    if (resource === 'users') {
      // Only admin can update users
      if (decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      try {
        const user = await User.findById(id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const { name, role, isActive, password } = req.body;
        if (name) user.name = name;
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        if (password) user.password = await bcrypt.hash(password, 10);

        await user.save();

        return res.json({
          success: true,
          message: 'User updated successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          }
        });
      } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else if (resource === 'plans') {
      try {
        const plan = await Plan.findById(id);
        if (!plan) {
          return res.status(404).json({ message: 'Plan not found' });
        }

        const { name, description, type, price, dataLimit, timeLimit, bandwidthLimit, concurrentDevices, displayOrder, isActive, features } = req.body;
        if (name) plan.name = name;
        if (description) plan.description = description;
        if (type) plan.type = type;
        if (price !== undefined) plan.price = price;
        if (dataLimit !== undefined) plan.dataLimit = dataLimit;
        if (timeLimit !== undefined) plan.timeLimit = timeLimit;
        if (bandwidthLimit !== undefined) plan.bandwidthLimit = bandwidthLimit;
        if (concurrentDevices !== undefined) plan.concurrentDevices = concurrentDevices;
        if (displayOrder !== undefined) plan.displayOrder = displayOrder;
        if (isActive !== undefined) plan.isActive = isActive;
        if (features) plan.features = features;

        await plan.save();

        return res.json({
          success: true,
          message: 'Plan updated successfully',
          plan
        });
      } catch (error) {
        console.error('Update plan error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid resource' });
    }
  } else if (req.method === 'DELETE') {
    // Handle deletion of users or plans
    const { resource, id } = req.query;

    if (resource === 'users') {
      // Only admin can delete users
      if (decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      try {
        const user = await User.findById(id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting self
        if (user._id.toString() === decoded.userId) {
          return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.remove();
        return res.json({
          success: true,
          message: 'User deleted successfully'
        });
      } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else if (resource === 'plans') {
      try {
        const plan = await Plan.findById(id);
        if (!plan) {
          return res.status(404).json({ message: 'Plan not found' });
        }

        // Check if plan is in use by active vouchers
        const activeVouchers = await Voucher.countDocuments({ plan: plan.type, status: 'active' });
        if (activeVouchers > 0) {
          return res.status(400).json({ message: 'Cannot delete plan with active vouchers' });
        }

        await plan.remove();
        return res.json({
          success: true,
          message: 'Plan deleted successfully'
        });
      } catch (error) {
        console.error('Delete plan error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid resource' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
