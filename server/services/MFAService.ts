import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { query } from '../db/database.js';

// Global MFA window configuration (3 minutes)
authenticator.options = { window: 6 };

export class MFAService {
  static generateSecret(userEmail: string) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(userEmail, 'PSG POS', secret);
    return { secret, otpauth };
  }

  static async generateQRCode(otpauth: string) {
    return await qrcode.toDataURL(otpauth);
  }

  static verifyToken(token: string, secret: string) {
    if (!token || !secret) return false;
    
    // Clean token from any spaces
    const cleanToken = token.replace(/\s/g, '');
    
    try {
      return authenticator.verify({ 
        token: cleanToken, 
        secret 
      });
    } catch (e) {
      console.error("MFA Verify Error:", e);
      return false;
    }
  }

  static enableMFA(userId: number, secret: string) {
    return query.run(
      "UPDATE users SET mfa_secret = ?, mfa_enabled = 1 WHERE id = ?",
      secret, userId
    );
  }

  static disableMFA(userId: number) {
    return query.run(
      "UPDATE users SET mfa_secret = NULL, mfa_enabled = 0 WHERE id = ?",
      userId
    );
  }
}
