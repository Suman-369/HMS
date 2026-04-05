import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import userModel from '../model/user.model.js';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'User is temporarily blocked' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = (req, res, next) => {
  // Allow students to view public staff directory
  if (req.path === '/users' && req.query.role === 'staff' && req.user.role === 'student') {
    return next();
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const checkNotBlocked = async (req, res, next) => {
  const user = await userModel.findById(req.user.id);
  if (user.isBlocked) {
    return res.status(403).json({ message: 'User is temporarily blocked' });
  }
  next();
};
