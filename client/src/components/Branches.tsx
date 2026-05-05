import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Edit2, 
  Trash2, 
  ArrowLeftRight, 
  History,
  Search,
  Package,
  AlertCircle,
  ChevronDown,
  Check,
  X,
  Scan,
  Loader2,
  Minimize2,
  Maximize2,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Product } from '../types';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_main: number;
  status: string;
}

interface Transfer {
  id: number;
  from_branch_name: string;
  to_branch_name: string;
  product_name: string;
  product_code: string;
  quantity: number;
  user_name: string;
  status: string;
  notes: string;
  created_at: string;
}

export default function Branches() {
  const [activeTab, setActiveTab] = useState<'list' | 'transfers' | 'history'>('list');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Search states for transfer
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Form states
  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    is_main: false
  });

  const [transferForm, setTransferForm] = useState({
    from_branch_id: '',
    to_branch_id: '',
    product_id: '',
    serial_number: '',
    quantity: 1,
    notes: ''
  });

  // New Transfer states
  const [transferFromInventory, setTransferFromInventory] = useState<any[]>([]);
  const [transferList, setTransferList] = useState<any[]>([]);
  const [originSearch, setOriginSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLargeModal, setIsLargeModal] = useState(true);

  const fetchBranches = async () => {
    try {
      const res = await apiFetch('/api/branches');
      if (res.ok) setBranches(await res.json());
    } catch (error) {
      toast.error('Error al cargar sucursales');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await apiFetch('/api/branches/transfers/history');
      if (res.ok) setTransfers(await res.json());
    } catch (error) {
      toast.error('Error al cargar historial de transferencias');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchProducts();
    if (activeTab === 'history') fetchTransfers();
  }, [activeTab]);

  useEffect(() => {
    const searchProducts = async () => {
      if (productSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Filter local products for name/code
        const filtered = products.filter(p => 
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.code.toLowerCase().includes(productSearch.toLowerCase())
        ).map(p => ({ ...p, type: 'product' }));

        // Search for serial numbers via API if needed, or filter local if items are loaded
        // For now, let's try a dedicated serial search API if it exists or use a generic one
        // If the product search includes serials, we can show them
        
        // Let's call the backend to search by serial too
        const serialRes = await apiFetch(`/api/inventory-search?q=${productSearch}`);
        if (serialRes.ok) {
          const serialData = await serialRes.json();
          // Merge results
          const results = [...filtered];
          serialData.forEach((item: any) => {
            if (item.serial_number && !results.find(r => r.serial_number === item.serial_number)) {
              results.push({ ...item, type: 'serial' });
            }
          });
          setSearchResults(results.slice(0, 10));
        } else {
          setSearchResults(filtered.slice(0, 10));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [productSearch, products]);

  const handleSubmitBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches';
      const method = editingBranch ? 'PUT' : 'POST';
      
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(branchForm)
      });

      if (res.ok) {
        toast.success(editingBranch ? 'Sucursal actualizada' : 'Sucursal creada');
        fetchBranches();
        setShowModal(false);
        setEditingBranch(null);
        setBranchForm({ name: '', address: '', phone: '', email: '', is_main: false });
      }
    } catch (error) {
      toast.error('Error al procesar la sucursal');
    }
  };

  const fetchBranchInventory = async (branchId: string) => {
    if (!branchId) {
      setTransferFromInventory([]);
      return;
    }
    try {
      const res = await apiFetch(`/api/branches/${branchId}/inventory`);
      if (res.ok) {
        setTransferFromInventory(await res.json());
      }
    } catch (error) {
      toast.error('Error al cargar inventario de la sucursal');
    }
  };

  const addToTransferList = (product: any) => {
    const productId = product.product_id || product.id;
    const productName = product.product_name || product.name;
    const originProduct = transferFromInventory.find(p => p.product_id === productId);
    const availableStock = originProduct ? originProduct.stock : 0;

    setTransferList(prev => {
      const existingIndex = prev.findIndex(item => item.product_id === productId && (!item.serial_number || item.serial_number === product.serial_number));
      
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        // If it's a serial, don't increment as quantity is always 1 for a specific serial
        if (product.serial_number || existing.serial_number) {
          toast.error('Este item ya está en la lista');
          return prev;
        }

        if (existing.quantity >= availableStock) {
          toast.error(`Stock insuficiente para ${productName} (Máx: ${availableStock})`);
          return prev;
        }

        const newList = [...prev];
        newList[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        toast.success(`Incrementada cantidad de ${productName}`);
        return newList;
      }

      if (availableStock <= 0 && !product.serial_number) {
        toast.error(`No hay stock disponible para ${productName}`);
        return prev;
      }

      toast.success(`${productName} agregado a la lista`);
      return [...prev, {
        product_id: productId,
        name: productName,
        code: product.product_code || product.code,
        serial_number: product.serial_number || null,
        quantity: 1,
        unit: product.unit
      }];
    });
  };

  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      // 1. Check in origin inventory first
      const locallyFound = transferFromInventory.find(p => p.product_code === barcodeInput);
      if (locallyFound) {
        addToTransferList(locallyFound);
        setBarcodeInput('');
        return;
      }

      // 2. Search globally if not in origin (might need to check if it belongs to origin via API)
      const res = await apiFetch(`/api/inventory-search?q=${barcodeInput}`);
      if (res.ok) {
        const data = await res.json();
        const found = data.find((item: any) => item.code === barcodeInput || item.serial_number === barcodeInput);
        if (found) {
          // Verify it belongs to origin branch
          if (found.branch_id !== parseInt(transferForm.from_branch_id)) {
            toast.error(`El producto está en otra sucursal: ${branches.find(b => b.id === found.branch_id)?.name || 'Desconocida'}`);
          } else {
            addToTransferList(found);
          }
        } else {
          toast.error('Producto no encontrado');
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setBarcodeInput('');
    }
  };

  const handleBulkTransfer = async () => {
    if (transferList.length === 0) {
      toast.error('La lista de transferencia está vacía');
      return;
    }
    if (!transferForm.to_branch_id) {
      toast.error('Seleccione sucursal de destino');
      return;
    }

    try {
      const res = await apiFetch('/api/branches/transfers/bulk', {
        method: 'POST',
        body: JSON.stringify({
          from_branch_id: parseInt(transferForm.from_branch_id),
          to_branch_id: parseInt(transferForm.to_branch_id),
          items: transferList.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            serial_number: item.serial_number
          })),
          notes: transferForm.notes
        })
      });

      if (res.ok) {
        toast.success('Transferencia masiva completada');
        setShowTransferModal(false);
        setTransferList([]);
        setTransferForm({ from_branch_id: '', to_branch_id: '', product_id: '', serial_number: '', quantity: 1, notes: '' });
        fetchBranches();
        if (activeTab === 'history') fetchTransfers();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Error en la transferencia');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    try {
      const res = await apiFetch('/api/branches/transfers', {
        method: 'POST',
        body: JSON.stringify({
          from_branch_id: parseInt(transferForm.from_branch_id),
          to_branch_id: parseInt(transferForm.to_branch_id),
          product_id: selectedProduct.id,
          serial_number: selectedProduct.serial_number || null,
          quantity: transferForm.quantity,
          notes: transferForm.notes
        })
      });

      if (res.ok) {
        toast.success('Transferencia completada');
        setShowTransferModal(false);
        setTransferForm({ from_branch_id: '', to_branch_id: '', product_id: '', serial_number: '', quantity: 1, notes: '' });
        setProductSearch('');
        setSelectedProduct(null);
        fetchBranches();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Error en la transferencia');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Sucursales</h2>
          <p className="text-gray-500">Administra tus locales y transfiere mercadería entre ellos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingBranch(null);
              setBranchForm({ name: '', address: '', phone: '', email: '', is_main: false });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Sucursal
          </button>
          <button
            onClick={() => {
              setTransferForm({ from_branch_id: '', to_branch_id: '', product_id: '', serial_number: '', quantity: 1, notes: '' });
              setTransferList([]);
              setShowTransferModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transferir Stock
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Lista de Sucursales
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Historial de Transferencias
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'list' && (
          branches.map((branch) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-lg",
                      branch.is_main ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                    )}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        {branch.name}
                        {branch.is_main === 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1 fill-current" /> Principal
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{branch.status === 'active' ? 'Operativa' : 'Cerrada'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingBranch(branch);
                        setBranchForm({
                          name: branch.name,
                          address: branch.address || '',
                          phone: branch.phone || '',
                          email: branch.email || '',
                          is_main: branch.is_main === 1
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!branch.is_main && (
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{branch.address || 'Sin dirección'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{branch.phone || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{branch.email || 'Sin correo'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Ventas hoy:</span>
                  <span className="font-semibold text-gray-800">$0.00</span>
                </div>
              </div>
            </motion.div>
          ))
        )}

        {activeTab === 'history' && (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Fecha</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Producto</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Origen</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Destino</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Cantidad</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Usuario</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(t.created_at), 'dd MMM, HH:mm', { locale: es })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{t.product_name}</div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-mono">{t.product_code}</span>
                          {t.serial_number && (
                            <span className="text-[10px] text-blue-600 font-bold">SN: {t.serial_number}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.from_branch_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.to_branch_name}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{t.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.user_name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transfers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No hay transferencias registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Branch Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                </h3>
              </div>
              <form onSubmit={handleSubmitBranch} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Sucursal</label>
                  <input
                    type="text"
                    required
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={branchForm.phone}
                      onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={branchForm.email}
                      onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="is_main"
                    checked={branchForm.is_main}
                    onChange={(e) => setBranchForm({ ...branchForm, is_main: e.target.checked })}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <label htmlFor="is_main" className="text-sm font-medium text-gray-700">
                    Establecer como Sucursal Principal
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer Modal - REFACTORED */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "bg-white rounded-2xl shadow-xl flex flex-col transition-all duration-300",
                isLargeModal ? "w-full max-w-6xl h-[90vh]" : "w-full max-w-2xl"
              )}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <ArrowLeftRight className="w-5 h-5" />
                  <h3 className="text-xl font-bold">Transferencia de Mercadería</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsLargeModal(!isLargeModal)} className="p-2 hover:bg-white/10 rounded-lg">
                    {isLargeModal ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sucursal Origen</label>
                  <select
                    required
                    value={transferForm.from_branch_id}
                    onChange={(e) => {
                      setTransferForm({ ...transferForm, from_branch_id: e.target.value });
                      fetchBranchInventory(e.target.value);
                      setTransferList([]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                  >
                    <option value="">Seleccionar Origen</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sucursal Destino</label>
                  <select
                    required
                    value={transferForm.to_branch_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_branch_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                  >
                    <option value="">Seleccionar Destino</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id} disabled={Number(transferForm.from_branch_id) === b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Escanear Código</label>
                  <form onSubmit={handleBarcodeScan} className="relative">
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="Escanee o escriba código..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      autoFocus
                    />
                  </form>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Source Column */}
                <div className="w-1/2 border-r border-gray-100 flex flex-col">
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Productos en Origen</span>
                    <div className="relative w-48">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Filtrar..."
                        value={originSearch}
                        onChange={(e) => setOriginSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded-md outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {!transferForm.from_branch_id ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Building2 className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm font-medium">Seleccione sucursal de origen</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {transferFromInventory
                          .filter(p => 
                            p.product_name.toLowerCase().includes(originSearch.toLowerCase()) || 
                            p.product_code.toLowerCase().includes(originSearch.toLowerCase())
                          )
                          .map((p) => (
                            <button
                              key={p.product_id}
                              onDoubleClick={() => addToTransferList(p)}
                              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                  <Package className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">{p.product_name}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono text-gray-500">{p.product_code}</span>
                                    <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-600">Stock: {p.stock}</span>
                                  </div>
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                          ))
                        }
                        {transferFromInventory.length === 0 && (
                          <div className="text-center py-12">
                            <p className="text-gray-400 text-sm italic">No hay productos en esta sucursal</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Destination Column */}
                <div className="w-1/2 flex flex-col bg-gray-50/30">
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Lista de Transferencia</span>
                    <button 
                      onClick={() => setTransferList([])}
                      className="text-[10px] text-red-500 hover:underline font-bold"
                    >
                      Limpiar todo
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {transferList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <ArrowLeftRight className="w-12 h-12 mb-2 opacity-10" />
                        <p className="text-sm font-medium">Escanee productos o de doble click en la lista de origen para agregar</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {transferList.map((item, index) => (
                          <div key={`${item.product_id}-${index}`} className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-800">{item.name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-500 font-mono">{item.code}</span>
                                  {item.serial_number && (
                                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded">SN: {item.serial_number}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center border border-gray-200 rounded-lg px-2 py-1 bg-gray-50">
                                {!item.serial_number ? (
                                  <>
                                    <button 
                                      onClick={() => setTransferList(prev => prev.map((it, i) => i === index ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))}
                                      className="px-2 text-gray-500 hover:text-blue-600"
                                    >
                                      -
                                    </button>
                                    <span className="px-3 text-sm font-bold min-w-[2rem] text-center">{item.quantity}</span>
                                    <button 
                                      onClick={() => setTransferList(prev => prev.map((it, i) => i === index ? { ...it, quantity: it.quantity + 1 } : it))}
                                      className="px-2 text-gray-500 hover:text-blue-600"
                                    >
                                      +
                                    </button>
                                  </>
                                ) : (
                                  <span className="px-2 text-xs font-bold text-blue-600">Único</span>
                                )}
                              </div>
                              <button 
                                onClick={() => setTransferList(prev => prev.filter((_, i) => i !== index))}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full md:w-auto">
                  <textarea
                    placeholder="Notas de la transferencia (Opcional)..."
                    value={transferForm.notes}
                    onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm h-12 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Resumen</p>
                    <p className="text-lg font-bold text-gray-900">
                      {transferList.reduce((sum, item) => sum + item.quantity, 0)} <span className="text-sm font-normal text-gray-500">Items</span>
                    </p>
                  </div>
                  <button
                    onClick={handleBulkTransfer}
                    disabled={transferList.length === 0 || !transferForm.to_branch_id}
                    className={cn(
                      "flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all",
                      (transferList.length === 0 || !transferForm.to_branch_id) ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                    )}
                  >
                    <ArrowLeftRight className="w-5 h-5" />
                    Proceder con Transferencia
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
