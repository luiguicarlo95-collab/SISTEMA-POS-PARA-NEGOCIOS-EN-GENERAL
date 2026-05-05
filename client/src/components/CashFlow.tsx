import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiFetch } from '../lib/api';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  Tag,
  Box,
  ShoppingCart,
  User,
  X,
  History,
  ArrowLeftRight,
  RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn, roundTo2Decimals } from '../lib/utils';
import { useDataSync } from '../hooks/useDataSync';

interface CashSessionHistory {
  id: number;
  user_id: number;
  user_name: string;
  opening_balance: number;
  closing_balance: number | null;
  opening_description: string;
  closing_description: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  total_sales: number;
  total_profit: number;
  net_cash_flow: number;
}

interface SessionDetail {
  sales: any[];
  movements: any[];
  payments: { payment_method: string; amount: number }[];
  summary: {
    total_sales: number;
    cash_sales: number;
    electronic_sales: number;
    total_profit: number;
    manual_income: number;
    manual_expense: number;
    net_manual: number;
    grand_total: number;
  };
}

export default function CashFlow() {
  const [sessions, setSessions] = useState<CashSessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [manualMovements, setManualMovements] = useState<any[]>([]);
  const [manualLoading, setManualLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await apiFetch('/api/cash-sessions/history');
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (id: number) => {
    setDetailsLoading(true);
    try {
      const res = await apiFetch(`/api/cash-sessions/${id}/details`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Respuesta no válida del servidor');
      setSessionDetails(data);
    } catch (error) {
      console.error('Error fetching session details:', error);
      // Optional: set some UI error state here
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchManualMovements = async () => {
    setManualLoading(true);
    try {
      const res = await apiFetch('/api/cash-flow');
      const data = await res.json();
      // Filter manually added movements
      const manual = Array.isArray(data) ? data.filter((m: any) => m.source_type === 'manual') : [];
      setManualMovements(manual);
    } catch (error) {
      console.error('Error fetching manual movements:', error);
    } finally {
      setManualLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (showHistoryModal && !selectedSessionId) {
      fetchManualMovements();
    }
  }, [showHistoryModal, selectedSessionId]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionDetails(selectedSessionId);
    } else {
      setSessionDetails(null);
    }
  }, [selectedSessionId]);

  const onDataChange = useCallback(() => {
    fetchSessions();
    if (selectedSessionId) {
      fetchSessionDetails(selectedSessionId);
    }
    if (showHistoryModal) {
      fetchManualMovements();
    }
  }, [selectedSessionId, showHistoryModal]);

  useDataSync(onDataChange);

  const filteredSessions = sessions.filter(s => {
    const searchLower = search.toLowerCase();
    const dateStr = new Date(s.opened_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fullDateStr = new Date(s.opened_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).toLowerCase();
    
    return (
      s.id.toString().includes(searchLower) || 
      s.user_name.toLowerCase().includes(searchLower) ||
      s.opening_description?.toLowerCase().includes(searchLower) ||
      dateStr.includes(searchLower) ||
      fullDateStr.includes(searchLower)
    );
  });

  const generateSessionPDF = () => {
    if (!sessionDetails || !sessionDetails.summary || !selectedSessionId) return;

    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94); // Primary color
    doc.text('Selltium PSG', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('Reporte de Cierre de Caja', pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`ID Sesión: #${session.id}`, 14, 40);
    doc.text(`Usuario: ${session.user_name}`, 14, 45);
    doc.text(`Apertura: ${new Date(session.opened_at).toLocaleString()}`, 14, 50);
    if (session.closed_at) {
      doc.text(`Cierre: ${new Date(session.closed_at).toLocaleString()}`, 14, 55);
    }

    // summary blocks
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('RESUMEN GENERAL', 14, 70);
    
    const cashSales = sessionDetails.summary.cash_sales;
    const electronicSales = sessionDetails.summary.electronic_sales;
    const manualIncome = sessionDetails.summary.manual_income;
    const manualExpense = sessionDetails.summary.manual_expense;
    const grandTotal = sessionDetails.summary.grand_total;

    autoTable(doc, {
      startY: 75,
      head: [['Concepto', 'Descripción', 'Monto']],
      body: [
        ['Saldo Inicial', 'Efectivo con el que se abrió caja', formatCurrency(session.opening_balance)],
        ['Ventas (Efectivo)', 'Ingresos por ventas en moneda física', formatCurrency(cashSales)],
        ['Ventas (Digital)', 'Yape, Plin, Tarjeta, Transferencias', formatCurrency(electronicSales)],
        ['Ingresos Extra', 'Entradas manuales de dinero', `+${formatCurrency(manualIncome)}`],
        ['Egresos/Salidas', 'Gastos o retiros de caja', `-${formatCurrency(manualExpense)}`],
        ['UTILIDAD BRUTA', 'Ganancia estimada sobre ventas', formatCurrency(sessionDetails.summary.total_profit)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Highlighted Cash Total
    doc.setFillColor(240, 253, 244); // Light green
    doc.rect(14, currentY, pageWidth - 28, 15, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.text('TOTAL EFECTIVO REAL EN CAJA:', 20, currentY + 10);
    doc.text(formatCurrency(grandTotal), pageWidth - 20, currentY + 10, { align: 'right' });
    
    currentY += 25;

    // Payment Methods Breakdown
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('DETALLE POR MEDIO DE PAGO', 14, currentY);
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Plataforma / Medio', 'Monto Reportado']],
      body: sessionDetails.payments.map(p => [p.payment_method, formatCurrency(p.amount)]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // Blue
    });

    // Movements
    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (sessionDetails.movements.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('MOVIMIENTOS MANUALES REGISTRADOS', 14, currentY);
      
      const totalIncome = sessionDetails.movements.filter(m => m.type === 'income').reduce((acc, m) => acc + (m.amount || 0), 0);
      const totalExpense = sessionDetails.movements.filter(m => m.type === 'expense').reduce((acc, m) => acc + (m.amount || 0), 0);
      const balance = totalIncome - totalExpense;

      const movementsBody = sessionDetails.movements.map(m => [
        new Date(m.created_at).toLocaleTimeString(),
        m.description, 
        m.type === 'income' ? 'INGRESO' : 'EGRESO', 
        formatCurrency(m.amount)
      ]);

      // Add Summary rows for movements
      movementsBody.push(['', 'TOTAL INGRESOS (+)', '', formatCurrency(totalIncome)]);
      movementsBody.push(['', 'TOTAL EGRESOS (-)', '', formatCurrency(totalExpense)]);
      movementsBody.push(['', 'BALANCE MOVIMIENTOS', '', `${balance >= 0 ? '+' : ''}${formatCurrency(balance)}`]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Hora', 'Descripción', 'Tipo', 'Monto']],
        body: movementsBody,
        columnStyles: {
          2: { fontStyle: 'bold' }
        },
        didParseCell: (data) => {
          const isTotalRow = data.row.index >= movementsBody.length - 3;
          if (isTotalRow) {
            data.cell.styles.fillColor = [243, 244, 246];
            data.cell.styles.fontStyle = 'bold';
            if (data.row.index === movementsBody.length - 1 && data.column.index === 3) {
              data.cell.styles.textColor = balance >= 0 ? [21, 128, 61] : [185, 28, 28];
            }
          }
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Sales Table
    if (sessionDetails.sales.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text('LISTADO DETALLADO DE VENTAS', 14, currentY);
      doc.setFont("helvetica", "normal");
      
      const salesBody = sessionDetails.sales.map(s => {
        let method = s.payment_method;
        try {
          const m = JSON.parse(s.payment_method);
          if (Array.isArray(m)) method = m.map(item => item.method.replace('_', '/')).join(', ');
        } catch(e) {}

        return [
          `#${s.id}`,
          new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          s.cashier_name || 'N/A',
          s.customer_name || 'Venta Rápida',
          s.product_names || 'Venta de productos',
          method.toUpperCase(),
          formatCurrency(s.subtotal || (s.total / 1.18)),
          formatCurrency(s.tax || (s.total - (s.total / 1.18))),
          formatCurrency(s.total)
        ];
      });

      // Add Totals Row
      const totalSalesAmount = sessionDetails.sales.reduce((acc, s) => acc + (s.total || 0), 0);
      const totalSubtotal = sessionDetails.sales.reduce((acc, s) => acc + (s.subtotal || (s.total / 1.18)), 0);
      const totalTax = sessionDetails.sales.reduce((acc, s) => acc + (s.tax || (s.total - (s.total / 1.18))), 0);

      salesBody.push([
        '', '', '', '', 'TOTALES CONSOLIDADOS', '', 
        formatCurrency(totalSubtotal), 
        formatCurrency(totalTax), 
        formatCurrency(totalSalesAmount)
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['ID', 'Hora', 'Cajero', 'Cliente', 'Productos / Concepto', 'Método', 'Subt.', 'IGV', 'Total']],
        body: salesBody,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [75, 85, 99] },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 15 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 20 },
          6: { cellWidth: 18 },
          7: { cellWidth: 15 },
          8: { cellWidth: 20 },
        },
        didParseCell: (data) => {
          if (data.row.index === salesBody.length - 1) {
            data.cell.styles.fillColor = [243, 244, 246];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });
    }

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages} - Selltium PSG Sistema de Gestión`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Reporte_Caja_${session.id}_${new Date().getTime()}.pdf`);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Flujo de caja diaria</h2>
          <p className="text-gray-500 font-medium italic">Historial detallado de cada turno y liquidación</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchSessions();
              if (selectedSessionId) fetchSessionDetails(selectedSessionId);
              if (showHistoryModal) fetchManualMovements();
            }}
            className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-primary"
            title="Refrescar datos"
          >
            <RefreshCcw size={20} className={cn(loading || detailsLoading ? "animate-spin" : "")} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 items-start">
        {/* Table List */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col transition-all">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="Buscar por N° Caja, Usuario o Fecha (DD/MM/YYYY)..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-[0.2em]">
                  <th className="px-6 py-4">N° Caja / Fecha</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Apertura</th>
                  <th className="px-6 py-4">Cierre</th>
                  <th className="px-6 py-4 text-right">Mov. Efectivo</th>
                  <th className="px-6 py-4 text-right">Ventas Totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 cursor-pointer">
                {filteredSessions.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => {
                      setSelectedSessionId(s.id);
                      setShowHistoryModal(true);
                    }}
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group",
                      selectedSessionId === s.id ? "bg-primary/5 dark:bg-primary/10" : ""
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black",
                          s.status === 'open' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                        )}>
                          #{s.id}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {new Date(s.opened_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {s.status === 'open' ? 'Caja Abierta' : 'Finalizado'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{s.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(s.opening_balance)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {s.closing_balance !== null ? (
                        <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(s.closing_balance)}</p>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded">En curso</span>
                      )}
                    </td>
                    <td className="px-6 py-1 text-right">
                      <div className="inline-flex flex-col items-end">
                        <p className="text-sm font-black text-blue-600">{formatCurrency(s.net_cash_flow || 0)}</p>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Entrada Real</span>
                      </div>
                    </td>
                    <td className="px-6 py-1 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-500">{formatCurrency(s.total_sales || 0)}</p>
                        </div>
                        <ChevronRight className={cn(
                          "text-gray-300 transition-transform",
                          selectedSessionId === s.id ? "translate-x-1 text-primary" : "group-hover:translate-x-1"
                        )} size={16} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {sessions.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 text-center">
          <FileText size={48} className="mx-auto text-gray-200 dark:text-gray-800 mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay cierres de caja registrados</p>
        </div>
      )}

      {/* Manual Movements / Details Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <History size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {selectedSessionId ? `Detalle Caja #${selectedSessionId}` : 'Historial de Movimientos'}
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {selectedSessionId ? 'Resumen Completo de la Sesión' : 'Movimientos Generales de Caja'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {selectedSessionId && (
                    <button
                      onClick={generateSessionPDF}
                      disabled={detailsLoading || !sessionDetails}
                      className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all text-xs font-black uppercase tracking-wider"
                    >
                      <FileText size={18} />
                      Reporte PDF
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      setTimeout(() => setSelectedSessionId(null), 300);
                    }}
                    className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-colors group"
                  >
                    <X size={24} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {selectedSessionId ? (
                  detailsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : sessionDetails ? (
                    <div className="space-y-8">
                      {/* Session Statistics Summary */}
                      {sessionDetails?.summary && (
                        <div className="grid grid-cols-1 gap-6">
                          <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-[2.5rem] border border-primary/20 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Resumen Financiero del Turno</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                              <div className="bg-white/50 dark:bg-black/20 p-4 rounded-3xl text-center border border-white/20">
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Ventas (Efectivo)</span>
                                <span className="text-base font-black text-blue-600">{formatCurrency(sessionDetails.summary.cash_sales || 0)}</span>
                              </div>
                              <div className="bg-white/50 dark:bg-black/20 p-4 rounded-3xl text-center border border-white/20">
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1 underline decoration-primary decoration-2 underline-offset-4">Ventas (Digital)</span>
                                <span className="text-base font-black text-purple-600">{formatCurrency(sessionDetails.summary.electronic_sales || 0)}</span>
                              </div>
                              <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-4 rounded-3xl text-center border border-emerald-500/20 shadow-sm">
                                <span className="text-[10px] font-black text-emerald-600 uppercase block mb-1">Ganancia Est.</span>
                                <span className="text-base font-black text-emerald-600">{formatCurrency(sessionDetails.summary.total_profit || 0)}</span>
                              </div>
                              <div className="bg-white/50 dark:bg-black/20 p-4 rounded-3xl text-center border border-white/20">
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Ingresos (+)</span>
                                <span className="text-base font-black text-emerald-600">+{formatCurrency(sessionDetails.summary.manual_income || 0)}</span>
                              </div>
                              <div className="bg-white/50 dark:bg-black/20 p-4 rounded-3xl text-center border border-white/20">
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Egresos (-)</span>
                                <span className="text-base font-black text-orange-600">-{formatCurrency(sessionDetails.summary.manual_expense || 0)}</span>
                              </div>
                              <div className="bg-white/50 dark:bg-black/20 p-4 rounded-3xl text-center border border-white/20">
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Total Ventas</span>
                                <span className="text-base font-black text-gray-600 dark:text-gray-400">{formatCurrency(sessionDetails.summary.total_sales || 0)}</span>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1 flex justify-between items-center bg-gray-900 text-white p-6 rounded-3xl border border-white/10 shadow-xl">
                                <div className="flex items-center gap-3">
                                  <Wallet className="text-primary" size={24} />
                                  <div>
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400 block leading-none">Efectivo Total en Caja</span>
                                    <span className="text-[8px] text-gray-500 uppercase tracking-tighter">Solo dinero físico</span>
                                  </div>
                                </div>
                                <span className="text-2xl font-black text-white">{formatCurrency(sessionDetails.summary.grand_total || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Method Breakdown */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 text-center">Resumen por Método</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {(sessionDetails?.payments || []).map((p, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                              <span className="text-[10px] font-black text-gray-400 uppercase mb-1">{p.payment_method}</span>
                              <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sales List */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ventas del Turno</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(sessionDetails.sales || []).length > 0 ? (sessionDetails.sales || []).map((sale: any) => (
                            <div key={sale.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800 rounded-2xl group hover:border-primary/30 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                                  <ShoppingCart size={18} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                    {sale.product_names || `Venta #${String(sale.id).padStart(6, '0')}`}
                                  </p>
                                  <p className="text-[10px] font-black text-gray-400 uppercase">
                                    {(() => {
                                      try {
                                        const methods = JSON.parse(sale.payment_method);
                                        if (Array.isArray(methods)) {
                                          return methods.map((m: any) => m.method || 'Efectivo').join(', ');
                                        }
                                        return sale.payment_method;
                                      } catch (e) {
                                        return sale.payment_method;
                                      }
                                    })()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(sale.total)}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-center py-8 text-xs font-bold text-gray-300 italic col-span-2">No hubo ventas este turno</p>
                          )}
                        </div>
                      </div>

                      {/* Manual Movements */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Movimientos del Turno</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(sessionDetails.movements || []).length > 0 ? (sessionDetails.movements || []).map((mov: any) => (
                            <div key={mov.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-50 dark:border-gray-800 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  mov.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                                )}>
                                  {mov.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                </div>
                                <div className="max-w-[150px]">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{mov.description}</p>
                                  <p className="text-[10px] font-black text-gray-400 uppercase">{mov.type === 'income' ? 'Ingreso' : 'Egreso'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={cn(
                                  "text-sm font-black",
                                  mov.type === 'income' ? "text-emerald-600" : "text-orange-600"
                                )}>
                                  {mov.type === 'income' ? '+' : '-'}{formatCurrency(mov.amount)}
                                </p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-center py-8 text-xs font-bold text-gray-300 italic col-span-2">No hubo movimientos manuales</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null
                ) : (
                  manualLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando movimientos...</p>
                    </div>
                  ) : manualMovements.length > 0 ? (
                    <div className="space-y-4">
                      {manualMovements.map((mov) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={mov.id}
                          className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-3xl group hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                              mov.type === 'income' ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"
                            )}>
                              {mov.type === 'income' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  "text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                                  mov.type === 'income' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                                )}>
                                  {mov.type === 'income' ? 'Ingreso' : 'Egreso'}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">
                                  {new Date(mov.created_at).toLocaleDateString()} {new Date(mov.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm font-black text-gray-900 dark:text-white">{mov.description}</p>
                              {mov.session_id && (
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Caja #{mov.session_id}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-lg font-black tracking-tight",
                              mov.type === 'income' ? "text-emerald-600" : "text-orange-600"
                            )}>
                              {mov.type === 'income' ? '+' : '-'}{formatCurrency(mov.amount)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                        <History size={32} className="text-gray-200 dark:text-gray-700" />
                      </div>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No se encontraron movimientos manuales</p>
                      <p className="text-gray-300 dark:text-gray-600 text-xs mt-2">Los ingresos y egresos registrados aparecerán aquí.</p>
                    </div>
                  )
                )}
              </div>

              <div className="p-8 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-50 dark:border-gray-800 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Selltium PSG - Gestión de Tesorería</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
