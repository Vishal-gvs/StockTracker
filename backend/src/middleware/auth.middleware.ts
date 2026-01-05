import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = req.cookies?.accessToken; 

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  try {
    const verified = jwt.verify(token, config.JWT_ACCESS_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    // If access token invalid, client might try refresh, but that's handled by a separate endpoint or logic.
    // Simple 403 here.
    res.status(403).json({ message: 'Invalid Token' });
  }
};
