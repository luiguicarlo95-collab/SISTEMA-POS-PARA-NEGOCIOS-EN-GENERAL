import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, QrCode, ClipboardCheck, History, XCircle, Globe, Laptop as DeviceLaptop } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';

export default function SecuritySettings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'mfa' | 'sessions' | 'logs'>('mfa');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaStep, setMfaStep] = useState<'intro' | 'qr' | 'verify'>('intro');
  const [qrData, setQrData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'sessions') fetchSessions();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      const res = await apiFetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      toast.error('Error al cargar sesiones');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await apiFetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      toast.error('No tienes permiso para ver registros de auditoría');
    }
  };

  const handleSetupMFA = async () => {
    try {
      const res = await apiFetch('/api/auth/mfa/setup', { method: 'POST' });
      const data = await res.json();
      setQrData(data);
      setMfaStep('qr');
    } catch (error) {
      toast.error('Error al iniciar setup de MFA');
    }
  };

  const handleEnableMFA = async () => {
    try {
      const res = await apiFetch('/api/auth/mfa/enable', {
        method: 'POST',
        body: JSON.stringify({ secret: qrData?.secret, code: mfaCode })
      });
      if (res.ok) {
        toast.success('MFA activado correctamente');
        setMfaEnabled(true);
        setMfaStep('intro');
      } else {
        toast.error('Código inválido');
      }
    } catch (error) {
      toast.error('Error al activar MFA');
    }
  };

  const revokeSession = async (tokenId: string) => {
    try {
      await apiFetch(`/api/sessions/${tokenId}/revoke`, { method: 'POST' });
      toast.success('Sesión revocada');
      fetchSessions();
    } catch (error) {
      toast.error('Error al revocar sesión');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seguridad Avanzada</h1>
          <p className="text-slate-500">MFA, Control de Sesiones y Auditoría</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-8 w-fit">
        <button 
          onClick={() => setActiveTab('mfa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'mfa' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Smartphone className="w-4 h-4" />
          MFA/2FA
        </button>
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'sessions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <DeviceLaptop className="w-4 h-4" />
          Sesiones
        </button>
        {(user?.role === 'ADMINISTRADOR' || user?.role === 'DESARROLLADOR') && (
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'logs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <History className="w-4 h-4" />
            Auditoría
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'mfa' && (
          <div className="p-8">
            {mfaStep === 'intro' && (
              <div className="max-w-md mx-auto text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold mb-2">Doble Factor de Autenticación</h2>
                <p className="text-slate-500 mb-8">
                  Añade una capa extra de seguridad a tu cuenta. Se te solicitará un código generado por tu móvil cada vez que inicies sesión.
                </p>
                <button 
                  onClick={handleSetupMFA}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  Configurar MFA
                </button>
              </div>
            )}

            {mfaStep === 'qr' && (
              <div className="max-w-md mx-auto text-center">
                <h2 className="text-xl font-bold mb-4">Escanea el código QR</h2>
                <p className="text-slate-500 mb-6 text-sm">
                  Usa Google Authenticator, Authy o cualquier app compatible para escanear este código.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl inline-block mb-6 border border-slate-100">
                  <img src={qrData?.qrCode} alt="MFA QR Code" className="w-48 h-48 mx-auto" />
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl text-yellow-800 text-xs mb-8 text-left border border-yellow-100">
                  <p className="font-bold mb-1">Clave Secreta (si no puedes escanear):</p>
                  <code className="bg-white px-2 py-1 rounded border border-yellow-200 block text-center mt-2">{qrData?.secret}</code>
                </div>
                <button 
                  onClick={() => setMfaStep('verify')}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
                >
                  Ya lo escaneé, siguiente
                </button>
              </div>
            )}

            {mfaStep === 'verify' && (
              <div className="max-w-md mx-auto text-center">
                <h2 className="text-xl font-bold mb-4">Verificar Activación</h2>
                <p className="text-slate-500 mb-6 text-sm">
                  Ingrese el código de 6 dígitos que aparece en su aplicación para confirmar.
                </p>
                <input 
                  type="text" 
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000000"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center text-3xl tracking-[0.4em] font-mono mb-8"
                  maxLength={6}
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => setMfaStep('qr')}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-200"
                  >
                    Atrás
                  </button>
                  <button 
                    onClick={handleEnableMFA}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-100"
                  >
                    Activar MFA
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                  <th className="px-6 py-4">DISPOSITIVO / NAVEGADOR</th>
                  <th className="px-6 py-4">IP</th>
                  <th className="px-6 py-4">ÚLTIMA ACTIVIDAD</th>
                  <th className="px-6 py-4">INICIO</th>
                  <th className="px-6 py-4">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <tr key={session.id} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <DeviceLaptop className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900 truncate max-w-[200px]">{session.device_info || 'Desconocido'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Globe className="w-4 h-4" />
                        {session.ip_address || '0.0.0.0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(session.last_active).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(session.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => revokeSession(session.token_id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Revocar acceso"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                  <th className="px-6 py-4">USUARIO</th>
                  <th className="px-6 py-4">ACCIÓN</th>
                  <th className="px-6 py-4">MÓDULO</th>
                  <th className="px-6 py-4">FECHA/HORA</th>
                  <th className="px-6 py-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{log.user_name || 'Sistema'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        log.action.includes('LOGIN') ? 'bg-green-100 text-green-700' :
                        log.action.includes('DELETE') ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{log.module}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
