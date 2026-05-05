import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Clock, Facebook, Instagram } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AppSettings } from '../../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings | null;
}

export default function ContactModal({ isOpen, onClose, settings }: ContactModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20, rotateX: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20, rotateX: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl max-w-2xl w-full overflow-hidden relative border border-white/20 dark:border-gray-800"
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600/10 to-purple-600/10 -z-10" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
          >
            <X size={24} />
          </button>

          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:items-center">
              {/* Left Column: Branding & Info */}
              <div className="space-y-8 text-center md:text-left flex flex-col items-center md:items-start">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20"
                >
                  <ShieldCheck size={48} />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Selltium PSG</h2>
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">Todos los derechos reservados</p>
                </div>

                <div className="hidden md:block pt-8">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Desarrollado por</p>
                  <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                    LUIGUI CARLO ARATA V. &<br />
                    ANGELO RODRIGUEZ ALTEZ
                  </p>
                </div>
              </div>

              {/* Right Column: Details & Socials */}
              <div className="space-y-8">
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 space-y-8 relative overflow-hidden backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-8 relative z-10">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">PROPIETARIO</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">POSSOLUTIONGROUP</p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">AÑO</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">2026</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">VERSIÓN DEL SISTEMA</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">v2.5.0 Stable</p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">SOPORTE</p>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-[9px] font-black uppercase rounded-md border border-blue-200 dark:border-blue-800">
                        DISPONIBLE
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-xl">
                        <Clock size={16} className="text-blue-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">INSTALACIÓN</p>
                        <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                          {settings?.installation_date ? new Date(settings.installation_date).toLocaleDateString() : 'Pendiente'}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Conecta con nosotros</p>
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                  </div>

                  <div className="flex justify-center md:justify-start gap-4">
                    {[
                      { 
                        href: "https://www.facebook.com/profile.php?id=61584020012816", 
                        icon: Facebook, 
                        color: "bg-[#1877F2]", 
                        shadow: "shadow-blue-500/20"
                      },
                      { 
                        href: "https://www.instagram.com/possolutiongroup", 
                        icon: Instagram, 
                        color: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]", 
                        shadow: "shadow-pink-500/20"
                      },
                      { 
                        href: "https://wa.me/51953812626", 
                        icon: null, 
                        color: "bg-[#25D366]", 
                        shadow: "shadow-green-500/20",
                        customIcon: (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        )
                      }
                    ].map((social, idx) => (
                      <motion.a
                        key={idx}
                        whileHover={{ scale: 1.1, translateY: -5 }}
                        whileTap={{ scale: 0.9 }}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg transition-all",
                          social.color,
                          social.shadow
                        )}
                      >
                        {social.icon ? (
                          <social.icon size={24} />
                        ) : social.customIcon}
                      </motion.a>
                    ))}
                  </div>
                </div>

                <div className="md:hidden text-center pt-8 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desarrollado por</p>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mt-2">LUIGUI CARLO ARATA V. & ANGELO RODRIGUEZ ALTEZ</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
