import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { rateLimit } from "express-rate-limit";
import { asyncHandler, verifyToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../schemas/index.js";
import { MFAService } from "../services/MFAService.js";
import { query } from "../db/database.js";
import { AuditService } from "../services/AuditService.js";

const router = express.Router();

// Rate limiter for login to prevent brute force
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { 
    error: "Demasiados intentos de inicio de sesión", 
    message: "Por favor intente de nuevo en 15 minutos" 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginRateLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password, mfaCode } = req.body;
  try {
    const userSource = query.get("SELECT * FROM users WHERE email = ?", email) as any;
    if (!userSource || !bcrypt.compareSync(password, userSource.password || '')) {
      throw new Error("Credenciales inválidas");
    }

    if (userSource.mfa_enabled) {
      if (!mfaCode) {
        return res.json({ mfaRequired: true });
      }
      if (!userSource.mfa_secret) {
        console.error(`User ${userSource.id} has MFA enabled but no secret set`);
        return res.status(500).json({ message: "Error en la configuración MFA del usuario" });
      }
      if (!MFAService.verifyToken(mfaCode, userSource.mfa_secret)) {
        return res.status(401).json({ message: "Código MFA inválido" });
      }
    }

    // Generate token
    const token = jwt.sign(
      { id: userSource.id, email: userSource.email, role: userSource.role }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    const result = {
      token,
      user: {
        id: userSource.id,
        email: userSource.email,
        name: userSource.name,
        role: userSource.role
      }
    };
    
    // Track session
    try {
      query.run(`
        INSERT INTO user_sessions (user_id, token_id, device_info, ip_address) 
        VALUES (?, ?, ?, ?)
      `, result.user.id, result.token, req.headers['user-agent'], req.ip);
    } catch (e) {
      console.error("Failed to track session:", e);
    }

    AuditService.log({
      userId: result.user.id,
      action: 'LOGIN',
      module: 'AUTH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string
    });

    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
}));

router.post("/mfa/setup", verifyToken, asyncHandler(async (req: any, res) => {
  if (!req.user || !req.user.email) {
    return res.status(401).json({ message: "Usuario no identificado" });
  }
  const { secret, otpauth } = MFAService.generateSecret(req.user.email);
  const qrCode = await MFAService.generateQRCode(otpauth);
  res.json({ secret, qrCode });
}));

router.post("/mfa/enable", verifyToken, asyncHandler(async (req: any, res) => {
  const { secret, code } = req.body;
  if (!MFAService.verifyToken(code, secret)) {
    return res.status(400).json({ message: "Código de verificación inválido" });
  }
  
  MFAService.enableMFA(req.user.id, secret);
  AuditService.log({
    userId: req.user.id,
    action: 'ENABLE_MFA',
    module: 'AUTH'
  });
  res.json({ success: true });
}));

router.get("/me", verifyToken, asyncHandler(async (req: any, res) => {
  res.json(req.user);
}));

export default router;
