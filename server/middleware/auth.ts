import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { query } from "../db/database.js";
import { AuthRequest } from "./types.js";

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(401).json({ message: "Invalid token" });

    // Verify session in database (Session Control)
    const session = query.get("SELECT revoked FROM user_sessions WHERE token_id = ? AND user_id = ?", token, decoded.id) as any;
    
    // If session tracking is enabled and session is revoked or non-existent
    if (session && session.revoked) {
      return res.status(401).json({ message: "La sesión ha sido revocada. Inicie sesión nuevamente." });
    }

    // Verify user still exists in database
    const user = query.get("SELECT id, email, name, role, branch_id FROM users WHERE id = ?", decoded.id) as any;
    if (!user) {
      return res.status(401).json({ message: "La sesión ha expirado o el usuario no existe. Por favor, inicie sesión nuevamente." });
    }

    // Update last active
    query.run("UPDATE user_sessions SET last_active = CURRENT_TIMESTAMP WHERE token_id = ?", token);

    req.user = user;
    next();
  });
};

export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acceso denegado: No tienes los permisos necesarios para esta acción." });
    }
    next();
  };
};

/**
 * Granular Permission Check middleware
 */
export const can = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "No autorizado" });
    
    if (req.user.role === 'DESARROLLADOR') return next();

    const hasPermission = query.get(`
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = ? AND p.name = ?
    `, req.user.role, permission);

    if (!hasPermission) {
      return res.status(403).json({ message: `Acceso denegado: No tienes el permiso '${permission}'` });
    }
    next();
  };
};

export const asyncHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>) => 
  (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };


