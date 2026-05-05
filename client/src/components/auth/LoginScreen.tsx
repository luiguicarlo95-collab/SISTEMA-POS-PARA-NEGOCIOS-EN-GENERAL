import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Check } from 'lucide-react';
import { apiFetch } from '../../lib/api';

import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, mfaCode }),
        silent: true
      });
      const data = await res.json();

      if (data.mfaRequired) {
        setMfaRequired(true);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-200/50">
            <Users size={40} />
          </div>
          <h2 className="text-3xl font-black text-[#1F2937]">{mfaRequired ? 'Verificación MFA' : 'Iniciar Sesión'}</h2>
          <p className="text-gray-500 font-medium">
            {mfaRequired ? 'Ingrese su código de 6 dígitos' : 'Ingresa tus credenciales de acceso'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {!mfaRequired ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">USUARIO O CORREO</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-5 py-4 bg-[#F9FAFB] border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white transition-all outline-none"
                    placeholder="Ej. usuario@psg.la"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CONTRASEÑA</label>
                  <input 
                    type="password"
                    required
                    className="w-full px-5 py-4 bg-[#F9FAFB] border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white transition-all outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CÓDIGO MFA</label>
                <input 
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  className="w-full px-5 py-4 bg-[#F9FAFB] border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white transition-all outline-none text-center text-3xl font-mono tracking-[0.4em]"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setMfaRequired(false)}
                  className="text-xs text-blue-600 font-bold block mx-auto mt-2 hover:underline"
                >
                  Cambiar de usuario
                </button>
              </div>
            )}
          </div>
          {error && <p className="text-xs font-bold text-center text-red-500">{error}</p>}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200/50 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mfaRequired ? (
              <>
                <Check size={20} />
                VERIFICAR Y ENTRAR
              </>
            ) : (
              <>
                <Check size={20} />
                INGRESAR AL SISTEMA
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
