// pages/api/admin/sessions.js
import { connectToDatabase } from '../../../utils/db';
import Session from '../../../models/Session';
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
      const sessions = await Session.find()
        .sort({ startedAt: -1 })
        .limit(50); // Limit to recent 50 sessions for performance

      return res.json(sessions);
    } catch (error) {
      console.error('Sessions fetch error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else if (req.method === 'POST' && req.query.action === 'terminate') {
    try {
      const { id } = req.query;
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      session.status = 'terminated';
      session.endedAt = new Date();
      await session.save();
      
      return res.json({ message: 'Session terminated successfully' });
    } catch (error) {
      console.error('Session termination error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
