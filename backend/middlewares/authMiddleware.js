import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { logger } from '../utils/logger.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.auth_token || 
                req.header('Authorization')?.replace('Bearer ', '');


  if (!token) {
    logger.warn('Authentication attempt without token');
    return res.status(401).json({
      success: false,
      message: 'Authentication token is required',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.sub) {
      logger.warn('Token missing userId');
      throw new Error('Invalid token payload');
    }

    req.userId = decoded.sub;
    req.userRole = decoded.role;
    
    logger.info(`User ${decoded.sub} authenticated successfully`);
    next();
  } catch (error) {
    logger.error('Authentication error:', { error: error.message, token: token.substring(0, 20) });
    
    const message = error.name === 'TokenExpiredError' 
      ? 'Token has expired' 
      : 'Invalid authentication token';
    
    res.status(401).json({
      success: false,
      message,
      code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    });
  }
});

// Optional: Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};