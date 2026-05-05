import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Tags, 
  Truck, 
  Users, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  Store,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Key,
  Clock,
  AlertCircle,
  Play,
  Check,
  Info,
  Facebook,
  Instagram,
  MessageCircle,
  Smartphone,
  FileText,
  Wallet,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, setDefaultCurrency } from './lib/utils';
import { AppSettings } from './types';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Categories from './components/Categories';
import Suppliers from './components/Suppliers';
import Customers from './components/Customers';
import Reports from './components/Reports';
import Configuration from './components/Configuration';
import SalesRecords from './components/SalesRecords';
import UsersTab from './components/Users';
import CashFlow from './components/CashFlow';
import DeveloperMode from './components/DeveloperMode';
import Dashboard from './components/Dashboard';
import SecuritySettings from './components/SecuritySettings';
import Branches from './components/Branches';
import { useDataSync } from './hooks/useDataSync';
import { apiFetch } from './lib/api';
import LoginScreen from './components/auth/LoginScreen';
import ContactModal from './components/modals/ContactModal';
import { Toaster, toast } from 'sonner';

import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';

type Section = 'dashboard' | 'pos' | 'inventory' | 'categories' | 'suppliers' | 'customers' | 'reports' | 'settings' | 'sales_records' | 'users' | 'dev_mode' | 'cash_flow' | 'security' | 'branches';

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [devClicks, setDevClicks] = useState(0);
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<number | 'all'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const { user, isLoggedIn, isLoading, setUser, setIsLoggedIn, setIsLoading, logout } = useAuthStore();
  const { settings, setSettings, fetchSettings } = useSettingsStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && settings) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const newSettings = { ...settings, user_avatar: base64 };
        
        // Optimistic update
        setSettings(newSettings as any);

        try {
          const res = await apiFetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify(newSettings)
          });
          if (!res.ok) {
            console.error('Failed to save avatar');
          }
        } catch (error) {
          console.error('Error saving avatar:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Listen for unauthorized events from apiFetch
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [logout]);

  // Centralized error handling
  useEffect(() => {
    const handleApiError = (event: any) => {
      const { message, details } = event.detail;
      toast.error(message, {
        description: Array.isArray(details) ? details.map(d => d.message).join(', ') : null,
        duration: 5000,
      });
    };

    window.addEventListener('api-error', handleApiError);
    return () => window.removeEventListener('api-error', handleApiError);
  }, []);

  const checkSession = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const res = await apiFetch('/api/auth/me', { silent: true });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed (token probably invalid or expired)');
        logout();
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'DESARROLLADOR' && !['users', 'dev_mode'].includes(activeSection)) {
        setActiveSection('users');
      } else if (user.role === 'ESTANDARD' && !['pos', 'reports', 'customers'].includes(activeSection)) {
        setActiveSection('pos');
      }
    }
  }, [user, activeSection]);

  useEffect(() => {
    fetchSettings();
    checkSession();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);

  useDataSync(fetchSettings);

  useEffect(() => {
    if (settings) {
      document.documentElement.classList.remove('dark');
      if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      }
      if (settings.currency) {
        setDefaultCurrency(settings.currency);
      }
    }
  }, [settings]);


  const showLogin = !isLoggedIn;

  const isPOSBlocked = false;
  const isSystemBlocked = false; // System is no longer fully blocked, only specific features

  const menuItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: BarChart3, hidden: user?.role === 'DESARROLLADOR', disabled: false },
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart, hidden: user?.role === 'DESARROLLADOR', disabled: false },
    { id: 'inventory', label: 'Inventario', icon: Package, hidden: user?.role === 'ESTANDARD' || user?.role === 'DESARROLLADOR', onClick: () => setInventoryCategoryFilter('all'), disabled: false },
    { id: 'categories', label: 'Categorías', icon: Tags, hidden: user?.role === 'ESTANDARD' || user?.role === 'DESARROLLADOR', disabled: false },
    { id: 'suppliers', label: 'Proveedores', icon: Truck, hidden: user?.role === 'ESTANDARD' || user?.role === 'DESARROLLADOR', disabled: false },
    { id: 'customers', label: 'Clientes', icon: Users, hidden: user?.role === 'DESARROLLADOR', disabled: false },
    { id: 'cash_flow', label: 'Flujo de Caja', icon: Wallet, hidden: user?.role === 'ESTANDARD' || user?.role === 'DESARROLLADOR', disabled: false },
    { id: 'sales_records', label: 'Ventas', icon: FileText, hidden: user?.role === 'ESTANDARD' || user?.role === 'DESARROLLADOR', disabled: false },
    { id: 'reports', label: 'Reportes', icon: BarChart3, hidden: user?.role === 'DESARROLLADOR', disabled: false },
    { id: 'settings', label: 'Configuración', icon: SettingsIcon, hidden: user?.role === 'DESARROLLADOR' || user?.role === 'ESTANDARD', disabled: false },
    { id: 'branches', label: 'Sucursales', icon: Building2, hidden: user?.role === 'ESTANDARD', disabled: false },
    { id: 'security', label: 'Seguridad', icon: ShieldCheck, disabled: false },
    { id: 'users', label: 'Usuarios', icon: Users, hidden: user?.role === 'ESTANDARD', disabled: false },
    { id: 'dev_mode', label: 'Modo desarrollador', icon: Code, hidden: user?.role !== 'DESARROLLADOR' },
  ].filter(item => !item.hidden);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return (
        isPOSBlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-200/50">
              <ShieldAlert size={40} />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Punto de Venta Bloqueado</h2>
              <p className="text-gray-500 font-medium">Esta función requiere una licencia activa. Por favor, regulariza tu suscripción en la sección de configuración para realizar ventas.</p>
            </div>
            <button 
              onClick={() => setActiveSection('settings')}
              className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200/50 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <SettingsIcon size={18} />
              IR A CONFIGURACIÓN
            </button>
          </div>
        ) : <POS />
      );
      case 'inventory': return <Inventory initialCategoryFilter={inventoryCategoryFilter} />;
      case 'categories': return (
        <Categories 
          onViewProducts={(categoryId) => {
            setInventoryCategoryFilter(categoryId);
            setActiveSection('inventory');
          }} 
        />
      );
      case 'suppliers': return <Suppliers />;
      case 'customers': return <Customers />;
      case 'cash_flow': return <CashFlow />;
      case 'sales_records': return <SalesRecords />;
      case 'reports': return <Reports />;
      case 'settings': return <Configuration user={user} />;
      case 'users': return <UsersTab currentUser={user} />;
      case 'dev_mode': return <DeveloperMode user={user} />;
      case 'security': return <SecuritySettings />;
      case 'branches': return <Branches />;
      default: return <POS />;
    }
  };


  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showLogin) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      <Toaster position="top-right" richColors closeButton />
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? (isMobile ? '280px' : '260px') : (isMobile ? '0px' : '80px'),
          x: isMobile && !isSidebarOpen ? -280 : 0
        }}
        className={cn(
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transition-all duration-300 ease-in-out overflow-hidden",
          isMobile ? "fixed inset-y-0 left-0" : "relative"
        )}
      >
        <div className={cn(
          "p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800",
          !isSidebarOpen && !isMobile && "justify-center px-0"
        )}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 overflow-hidden shrink-0">
            {settings?.business_logo ? (
              <img src={settings.business_logo} alt="Logo" className="w-full h-full object-cover bg-white" referrerPolicy="no-referrer" />
            ) : (
              <Store size={24} />
            )}
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-xl tracking-tight text-gray-900 dark:text-white truncate"
            >
              {settings?.business_name || 'Selltium PSG'}
            </motion.span>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 overflow-y-auto space-y-1">

          {menuItems.map((item) => (
            <button
              key={item.id}
              disabled={(item as any).disabled}
              onClick={() => {
                setActiveSection(item.id as Section);
                if ((item as any).onClick) (item as any).onClick();
                if (isMobile) setIsSidebarOpen(false);
              }}
              title={!isSidebarOpen ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                !isSidebarOpen && !isMobile && "justify-center px-0",
                activeSection === item.id 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                (item as any).disabled && "opacity-50 cursor-not-allowed grayscale"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-colors shrink-0",
                activeSection === item.id ? "text-white" : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
              )} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-medium truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {isSidebarOpen && activeSection === item.id && (
                <ChevronRight size={16} className="ml-auto opacity-70 shrink-0" />
              )}
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white capitalize">
              {menuItems.find(m => m.id === activeSection)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-4">

            <div className="hidden sm:flex items-center gap-3">
              <button 
                onClick={() => setIsContactModalOpen(true)}
                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
                title="Información de Contacto"
              >
                <Info size={20} />
              </button>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || settings?.user_name || 'Admin Usuario'}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{user?.role || settings?.user_role || 'Administrador'}</span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors border border-red-100"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
            <div 
              onClick={() => avatarInputRef.current?.click()}
              className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:scale-110 active:scale-95 transition-transform group relative"
            >
              <img 
                src={settings?.user_avatar || "https://picsum.photos/seed/admin/100/100"} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <SettingsIcon size={14} className="text-white" />
              </div>
            </div>
            <input 
              type="file"
              ref={avatarInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
            />
          </div>
        </header>

        {/* Content Area */}
        <div className={cn("flex-1 overflow-y-auto p-6 relative")}>
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            {renderSection()}
          </motion.div>
        </div>

        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} settings={settings} />
      </main>
    </div>
  );
}
