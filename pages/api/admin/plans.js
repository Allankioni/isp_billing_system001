// pages/api/admin/plans.js
import { connectToDatabase } from '../../../utils/db';
import Plan from '../../../models/Plan';
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
      const plans = await Plan.find().sort({ displayOrder: 1, price: 1 });
      return res.json(plans);
    } catch (error) {
      console.error('Plans fetch error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const planData = req.body;
      const newPlan = new Plan(planData);
      await newPlan.save();
      return res.status(201).json(newPlan);
    } catch (error) {
      console.error('Plan creation error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const planData = req.body;
      const updatedPlan = await Plan.findByIdAndUpdate(id, planData, { new: true });
      if (!updatedPlan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      return res.json(updatedPlan);
    } catch (error) {
      console.error('Plan update error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const deletedPlan = await Plan.findByIdAndDelete(id);
      if (!deletedPlan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      return res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
      console.error('Plan deletion error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
