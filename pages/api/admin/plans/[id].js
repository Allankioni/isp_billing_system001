// pages/api/admin/plans/[id].js
import { connectToDatabase } from '../../../../utils/db';
import Plan from '../../../../models/Plan';
import { authenticateToken } from '../../../../utils/auth';

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

  if (req.method === 'GET') {
    try {
      const plan = await Plan.findById(id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      return res.json(plan);
    } catch (error) {
      console.error('Plan fetch error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, description, type, price, dataLimit, timeLimit, bandwidthLimit, concurrentDevices, displayOrder, isActive } = req.body;
      const plan = await Plan.findByIdAndUpdate(
        id,
        {
          name,
          description,
          type,
          price,
          dataLimit,
          timeLimit,
          bandwidthLimit: bandwidthLimit || 0,
          concurrentDevices: concurrentDevices || 1,
          displayOrder: displayOrder || 0,
          isActive: isActive !== undefined ? isActive : true
        },
        { new: true, runValidators: true }
      );
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      return res.json({ success: true, message: 'Plan updated successfully', plan });
    } catch (error) {
      console.error('Plan update error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const plan = await Plan.findByIdAndDelete(id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      return res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
      console.error('Plan deletion error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
