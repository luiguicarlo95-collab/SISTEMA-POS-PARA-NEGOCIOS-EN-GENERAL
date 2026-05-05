import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  ShieldCheck, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';
import { cn } from '../lib/utils';
import { useDataSync } from '../hooks/useDataSync';

export default function DeveloperMode({ user }: { user: any }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useDataSync(() => {
    fetchSettings();
  });

  const handleToggleUnlimitedUsers = async () => {
    if (!settings) return;
    const newValue = settings.unlimited_users === '1' ? '0' : '1';
    try {
      const res = await apiFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ ...settings, unlimited_users: newValue })
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        fetchSettings();
      }
    } catch (error) {
      console.error('Error toggling unlimited users:', error);
    }
  };

  if (!settings) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Modo Desarrollador</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Gestión avanzada del sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-green-500 shadow-green-200/50">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider">Estado del Sistema</h3>
              <p className="text-sm text-green-600 dark:text-green-400 font-black uppercase tracking-widest">Operativo</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-700 text-sm text-gray-500 font-medium uppercase tracking-widest">
             v2.5.0 Stable
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 shadow-sm space-y-6">
          <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-wider">Ajustes Avanzados</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                settings.unlimited_users === '1' ? "bg-purple-500" : "bg-gray-400"
              )}>
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white uppercase">Usuarios Ilimitados</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                  {settings.unlimited_users === '1' ? 'ACTIVADO' : 'LÍMITE DE 5'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleToggleUnlimitedUsers}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                settings.unlimited_users === '1' ? "bg-purple-500" : "bg-gray-300",
                "hover:scale-110"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                settings.unlimited_users === '1' ? "right-1" : "left-1"
              )} />
            </button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl border border-green-100 dark:border-green-800 shadow-2xl z-50"
        >
          <CheckCircle2 size={20} />
          <p className="text-sm font-bold uppercase tracking-widest">Cambio guardado</p>
        </motion.div>
      )}
    </div>
  );
}

function ChevronRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
