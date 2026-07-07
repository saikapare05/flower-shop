import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — no token' });
    return;
  }
  const token = header.slice(7);
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}
