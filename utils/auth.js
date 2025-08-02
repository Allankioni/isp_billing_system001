// utils/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'MySecretKey123!@#';

export async function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return { authenticated: true, user: decoded };
  } catch (error) {
    console.error('Token verification error:', error);
    return { authenticated: false };
  }
}

export function checkRole(allowedRoles) {
  return (user) => {
    return user && allowedRoles.includes(user.role);
  };
}
