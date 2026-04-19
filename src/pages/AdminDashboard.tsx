import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../context/useAlert';
import { 
  getTransactionTypes, 
  getQueueStats, 
  resetQueue,
  createTransactionType,
  updateTransactionType,
  getWindows,
  createWindow,
  updateWindow,
  subscribeToAllTickets,
  getSettings,
  saveSettings
} from '../services/queueService';
import { RefreshCw, Settings, Download, Printer, Bell, Save, RotateCcw, DatabaseBackup, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Navbar from '../components/Navbar';
import type { TransactionType, QueueStats, Window as WindowType, QueueTicket, SystemSettings } from '../types';

interface AdminDashboardProps {
  tab?: 'dashboard' | 'reports' | 'settings' | 'transactions' | 'windows';
}

export default function AdminDashboard({ tab = 'dashboard' }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'settings' | 'transactions' | 'windows'>(tab);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [windows, setWindows] = useState<WindowType[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [allTickets, setAllTickets] = useState<QueueTicket[]>([]);

  // Transaction form state
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionType | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    name: '',
    description: '',
    code: '',
    prefix: '',
    priority: false,
    windowNumber: 1
  });

  const [showWindowForm, setShowWindowForm] = useState(false);
  const [editingWindow, setEditingWindow] = useState<WindowType | null>(null);
  const [windowForm, setWindowForm] = useState({
    name: '',
    number: 1
  });

  // Settings state with default values for instant display
  const [settingsForm, setSettingsForm] = useState<SystemSettings>({
    systemName: 'ESCR Digital Queue System',
    resetTime: '00:00',
    maxDailyTickets: 100,
    averageServiceTime: 300,
    enablePriority: true,
    enableNotifications: true,
    operatingHours: {
      enabled: false,
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '08:00', end: '17:00' },
      wednesday: { start: '08:00', end: '17:00' },
      thursday: { start: '08:00', end: '17:00' },
      friday: { start: '08:00', end: '17:00' },
      saturday: { start: '08:00', end: '17:00' },
      sunday: { start: '08:00', end: '17:00' }
    },
    alerts: {
      enabled: true,
      announcerVoice: true,
      showAllWindows: true
    },
    displayMode: 'standard',
    autoReset: false,
    autoResetTime: '00:00',
    maxWaitTime: 300,
    lastBackup: null
  });

  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [showFilter, setShowFilter] = useState(false);

  const { showAlert } = useAlert();

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  // Subscribe to all tickets for reports
  useEffect(() => {
    const unsubscribe = subscribeToAllTickets((tickets) => {
      setAllTickets(tickets);
    });
    return () => unsubscribe();
  }, []);

  // Load initial data without subscription to prevent issues
  useEffect(() => {
    const initData = async () => {
      console.log('Initializing AdminDashboard...');
      try {
        await loadData();
      } catch (err) {
        console.error('Init error:', err);
      }
    };
    initData();
  }, []);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getFilteredTickets = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) return allTickets;
    return allTickets.filter(ticket => {
      const ticketDate = ticket.createdAt ? new Date(ticket.createdAt) : null;
      if (!ticketDate) return false;
      const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
      const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
      if (start && ticketDate < start) return false;
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59);
        if (ticketDate > endDate) return false;
      }
      return true;
    });
  };

  const getTicketsByWindow = () => {
    const filteredTickets = getFilteredTickets();
    const windowMap = new Map<string, number>();
    windows.forEach(w => windowMap.set(w.name, 0));
    filteredTickets.forEach(ticket => {
      if (ticket.windowName) {
        const current = windowMap.get(ticket.windowName) || 0;
        windowMap.set(ticket.windowName, current + 1);
      }
    });
    return windows.map(w => ({
      name: w.name,
      value: windowMap.get(w.name) || 0
    })).filter(item => item.value > 0);
  };

  const getTicketsByTransaction = () => {
    const filteredTickets = getFilteredTickets();
    const transMap = new Map<string, number>();
    transactions.forEach(t => transMap.set(t.name, 0));
    filteredTickets.forEach(ticket => {
      if (ticket.transactionTypeName) {
        const current = transMap.get(ticket.transactionTypeName) || 0;
        transMap.set(ticket.transactionTypeName, current + 1);
      }
    });
    return transactions.map(t => ({
      name: t.name,
      value: transMap.get(t.name) || 0
    })).filter(item => item.value > 0);
  };

  const getDailyTracking = () => {
    const filteredTickets = getFilteredTickets();
    const dailyMap = new Map<string, number>();
    filteredTickets.forEach(ticket => {
      if (ticket.createdAt) {
        const date = new Date(ticket.createdAt).toLocaleDateString();
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
      }
    });
    return Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getPeakHours = () => {
    const filteredTickets = getFilteredTickets();
    const hourMap = new Map<number, number>();
    for (let i = 8; i <= 17; i++) hourMap.set(i, 0);
    filteredTickets.forEach(ticket => {
      if (ticket.createdAt) {
        const hour = new Date(ticket.createdAt).getHours();
        if (hour >= 8 && hour <= 17) {
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        }
      }
    });
    return Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .filter(item => item.count > 0);
  };

  const getMostServedWindows = () => {
    const data = getTicketsByWindow();
    return data.sort((a, b) => b.value - a.value);
  };

  const applyFilter = () => {
    setShowFilter(false);
  };

  const clearFilter = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setShowFilter(false);
  };

  const handleExportPDF = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ESCR Reports - ${new Date().toLocaleDateString()}</title>
          <style>
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; text-align: center; }
            h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background-color: #f3f4f6; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
            .stat-number { font-size: 24px; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>ESCR DQMS - Reports</h1>
          <p style="text-align:center">Generated on: ${new Date().toLocaleString()}</p>
          
          <h2>Summary Statistics</h2>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-number">${getFilteredTickets().length}</div>
              <div>Total Tickets</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${getFilteredTickets().filter(t => t.status === 'completed').length}</div>
              <div>Completed</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${getFilteredTickets().filter(t => t.status === 'waiting').length}</div>
              <div>Waiting</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${getFilteredTickets().filter(t => t.status === 'serving').length}</div>
              <div>Serving</div>
            </div>
          </div>
          
          <h2>Tickets by Transaction</h2>
          <table>
            <tr><th>Transaction Type</th><th>Count</th></tr>
            ${getTicketsByTransaction().map(t => `<tr><td>${t.name}</td><td>${t.value}</td></tr>`).join('')}
          </table>
          
          <h2>Tickets by Window</h2>
          <table>
            <tr><th>Window</th><th>Count</th></tr>
            ${getTicketsByWindow().map(w => `<tr><td>${w.name}</td><td>${w.value}</td></tr>`).join('')}
          </table>
          
          <h2>Most Served Windows</h2>
          <table>
            <tr><th>Rank</th><th>Window</th><th>Tickets Served</th></tr>
            ${getMostServedWindows().map((w, i) => `<tr><td>${i + 1}</td><td>${w.name}</td><td>${w.value}</td></tr>`).join('')}
          </table>
          
          <div class="footer">
            <p>East Systems Colleges of Rizal - Digital Queue Management System</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ESCR-Reports-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ESCR Reports - ${new Date().toLocaleDateString()}</title>
          <style>
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; text-align: center; }
            h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background-color: #f3f4f6; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
            .stat-number { font-size: 24px; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>ESCR DQMS - Reports</h1>
          <p style="text-align:center">Generated on: ${new Date().toLocaleString()}</p>
          
          <h2>Summary Statistics</h2>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-number">${getFilteredTickets().length}</div>
              <div>Total Tickets</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${getFilteredTickets().filter(t => t.status === 'completed').length}</div>
              <div>Completed</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${getFilteredTickets().filter(t => t.status === 'waiting').length}</div>
              <div>Waiting</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${getFilteredTickets().filter(t => t.status === 'cancelled' || t.status === 'no_show').length}</div>
              <div>Cancelled</div>
            </div>
          </div>

          <h2>Transaction Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Transaction Type</th>
                <th>Total</th>
                <th>Completed</th>
                <th>Waiting</th>
                <th>Cancelled</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(t => {
                const total = getFilteredTickets().filter(tk => tk.transactionTypeId === t.id).length;
                const completed = getFilteredTickets().filter(tk => tk.transactionTypeId === t.id && tk.status === 'completed').length;
                const waiting = getFilteredTickets().filter(tk => tk.transactionTypeId === t.id && tk.status === 'waiting').length;
                const cancelled = getFilteredTickets().filter(tk => tk.transactionTypeId === t.id && (tk.status === 'cancelled' || tk.status === 'no_show')).length;
                return `<tr><td>${t.name}</td><td>${total}</td><td>${completed}</td><td>${waiting}</td><td>${cancelled}</td></tr>`;
              }).join('')}
            </tbody>
          </table>

          <h2>Recent Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Transaction</th>
                <th>Student</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${getFilteredTickets().slice(0, 20).map(t => `
                <tr>
                  <td>${t.ticketNumber}</td>
                  <td>${t.transactionTypeName}</td>
                  <td>${t.studentName || 'N/A'}</td>
                  <td>${t.status}</td>
                  <td>${t.createdAt?.toLocaleDateString() || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>ESCR Digital Queue Management System</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log('Loading admin data...');
      
      // Load settings first with fallback
      let systemSettings: SystemSettings | null = null;
      try {
        systemSettings = await getSettings();
        console.log('Settings loaded:', systemSettings);
      } catch (settingsErr) {
        console.warn('Settings not loaded, using defaults:', settingsErr);
        systemSettings = {
          systemName: 'ESCR Digital Queueing System',
          resetTime: '00:00',
          maxDailyTickets: 100,
          enablePriority: true,
          enableNotifications: true,
          averageServiceTime: 300,
          operatingHours: {
            enabled: false,
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: { start: '08:00', end: '17:00' },
            saturday: { start: '08:00', end: '12:00' },
            sunday: { start: '08:00', end: '00:00' }
          },
          alerts: {
            enabled: true,
            announcerVoice: true,
            showAllWindows: true
          },
          displayMode: 'standard',
          autoReset: false,
          autoResetTime: '00:00',
          maxWaitTime: 3600,
          lastBackup: null
        };
      }
      
      // Load other data with fallbacks
      let transactionTypes: TransactionType[] = [];
      let queueStats: QueueStats | null = null;
      let windowList: WindowType[] = [];
      
      try {
        const results = await Promise.all([
          getTransactionTypes(),
          getQueueStats(),
          getWindows()
        ]);
        transactionTypes = results[0];
        queueStats = results[1];
        windowList = results[2];
      } catch (dataErr) {
        console.warn('Some data failed to load:', dataErr);
      }
      
      setTransactions(transactionTypes);
      setStats(queueStats);
      setWindows(windowList);
      setSettingsForm(systemSettings);
      
console.log('Admin data loaded successfully');
    } catch (err) {
      console.error('Critical error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setLoadError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show error state if data failed to load
  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 pt-16 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settingsForm);
      showAlert('success', 'Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      showAlert('error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSettings = () => {
    loadData();
    showAlert('info', 'Settings reverted to saved values');
  };

  const handleBackup = async () => {
    if (!confirm('Create a backup of all queue data?')) return;
    const backupData = {
      transactions,
      windows,
      settings: settingsForm,
      createdAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escr-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Backup created successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleResetQueue = async () => {
    if (!confirm('Are you sure you want to reset all active queues? This action cannot be undone.')) {
      return;
    }
    
    try {
      await resetQueue();
      setMessage('Queue reset successfully!');
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to reset queue');
    }
  };

  // Transaction handlers
  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setTransactionForm({
      name: '',
      description: '',
      code: '',
      prefix: '',
      priority: false,
      windowNumber: 1
    });
    setShowTransactionForm(true);
  };

  const handleEditTransaction = (t: TransactionType) => {
    setEditingTransaction(t);
    setTransactionForm({
      name: t.name,
      description: t.description,
      code: t.code,
      prefix: t.prefix,
      priority: t.priority,
      windowNumber: t.windowNumber || 1
    });
    setShowTransactionForm(true);
  };

  const handleSaveTransaction = async () => {
    if (!transactionForm.name || !transactionForm.code || !transactionForm.prefix) {
      setMessage('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTransaction) {
        await updateTransactionType(editingTransaction.id, transactionForm);
        setMessage('Transaction updated successfully!');
      } else {
        await createTransactionType(
          transactionForm.name,
          transactionForm.description,
          transactionForm.code,
          transactionForm.prefix,
          transactionForm.priority,
          transactionForm.windowNumber
        );
        setMessage('Transaction created successfully!');
      }
      setShowTransactionForm(false);
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTransactionActive = async (t: TransactionType) => {
    try {
      await updateTransactionType(t.id, { active: !t.active });
      loadData();
    } catch {
      setMessage('Failed to update transaction');
    }
  };

  // Window handlers
  const handleAddWindow = () => {
    setEditingWindow(null);
    setWindowForm({
      name: '',
      number: windows.length + 1
    });
    setShowWindowForm(true);
  };

  const handleEditWindow = (w: WindowType) => {
    setEditingWindow(w);
    setWindowForm({
      name: w.name,
      number: w.number
    });
    setShowWindowForm(true);
  };

  const handleSaveWindow = async () => {
    if (!windowForm.name) {
      setMessage('Please enter window name');
      return;
    }

    setIsSaving(true);
    try {
      if (editingWindow) {
        await updateWindow(editingWindow.id, windowForm);
        setMessage('Window updated successfully!');
      } else {
        await createWindow(windowForm.name, windowForm.number);
        setMessage('Window created successfully!');
      }
      setShowWindowForm(false);
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to save window');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWindowActive = async (w: WindowType) => {
    try {
      await updateWindow(w.id, { active: !w.active });
      loadData();
    } catch {
      setMessage('Failed to update window');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/admin');
  };

  // Debug: log current state
  console.log('AdminDashboard - activeTab:', activeTab, 'isLoading:', isLoading, 'settingsForm:', settingsForm);

  const adminHelpContent = (
    <div className="space-y-3 text-gray-600">
      <p><b>Dashboard:</b> Overview of system stats and quick actions.</p>
      <p><b>Reports:</b> View analytics and export reports.</p>
      <p><b>Settings:</b> Configure system settings.</p>
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-800 text-sm">
          <b>Warning:</b> Reset Queue clears all active tickets!
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 pt-16">
      <Navbar 
        title="Admin Dashboard" 
        showBackButton 
        onBack={handleBack}
        helpContent={adminHelpContent}
        showAdminNav={true}
      />
      
      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className={`p-3 rounded-lg ${message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500 text-sm">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.totalTickets || 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500 text-sm">Waiting</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.waitingTickets || 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500 text-sm">Serving</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.servingTickets || 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats?.completedTickets || 0}</p>
              </div>
            </div>

            {/* Transaction Types */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Transaction Types</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Code</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{t.name}</td>
                        <td className="py-3 px-4 font-mono">{t.code}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${t.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {t.priority ? '✓ Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <button
                onClick={handleResetQueue}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Queue
              </button>
            </div>
          </div>
)}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Header with Filter */}
            <div className="flex justify-between items-center no-print">
              <h2 className="text-2xl font-bold text-blue-800">Reports Overview</h2>
              <button
                onClick={() => setShowFilter(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            {/* Filter Modal */}
            {showFilter && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print" onClick={() => setShowFilter(false)}>
                <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-4">Filter by Date</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={clearFilter}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Clear
                    </button>
                    <button
                      onClick={applyFilter}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-800">{getFilteredTickets().length}</p>
                  <p className="text-sm text-gray-600">Total Tickets</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-800">{getFilteredTickets().filter(t => t.status === 'completed').length}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-yellow-800">{getFilteredTickets().filter(t => t.status === 'waiting').length}</p>
                  <p className="text-sm text-gray-600">Waiting</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-purple-800">{getFilteredTickets().filter(t => t.status === 'serving').length}</p>
                  <p className="text-sm text-gray-600">Serving</p>
                </div>
              </div>
            </div>

            {/* Daily Tracking Chart */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Tracking</h3>
              {getDailyTracking().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getDailyTracking()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="Tickets" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>

            {/* Peak Hours and Most Served Windows Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Peak Hours - Bar Chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Peak Hours</h3>
                {getPeakHours().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getPeakHours()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#F59E0B" name="Tickets" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">No data available</p>
                )}
              </div>

              {/* Most Served Windows - List */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Served Windows</h3>
                {getMostServedWindows().length > 0 ? (
                  <div className="space-y-3">
                    {getMostServedWindows().map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-800">{item.name}</span>
                        </div>
                        <span className="text-lg font-bold text-orange-600">{item.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No data available</p>
                )}
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart - Tickets by Window */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tickets by Window</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getTicketsByWindow()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {getTicketsByWindow().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart - Tickets by Transaction */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tickets by Transaction</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getTicketsByTransaction()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="bg-white rounded-xl shadow p-6 no-print">
              <div className="flex gap-2">
                <button 
                  onClick={handleExportPDF}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export PDF
                </button>
                <button 
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {message}
              </div>
            )}

            {/* General Settings */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">General Settings</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">System Name</label>
                  <input
                    type="text"
                    value={settingsForm.systemName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, systemName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Reset Time</label>
                  <input
                    type="time"
                    value={settingsForm.resetTime}
                    onChange={(e) => setSettingsForm({ ...settingsForm, resetTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Daily Tickets</label>
                  <input
                    type="number"
                    value={settingsForm.maxDailyTickets}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maxDailyTickets: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Service Time (seconds)</label>
                  <input
                    type="number"
                    value={settingsForm.averageServiceTime}
                    onChange={(e) => setSettingsForm({ ...settingsForm, averageServiceTime: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min={60}
                  />
                </div>
              </div>
            </div>

            {/* In-App Alerts */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">In-App Alerts</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settingsForm.alerts.enabled}
                    onChange={(e) => setSettingsForm({ 
                      ...settingsForm, 
                      alerts: { ...settingsForm.alerts, enabled: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Enable Alerts</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settingsForm.alerts.announcerVoice}
                    onChange={(e) => setSettingsForm({ 
                      ...settingsForm, 
                      alerts: { ...settingsForm.alerts, announcerVoice: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Voice Announcements</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settingsForm.alerts.showAllWindows}
                    onChange={(e) => setSettingsForm({ 
                      ...settingsForm, 
                      alerts: { ...settingsForm.alerts, showAllWindows: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Show All Active Windows</span>
                </label>
              </div>
            </div>

            {/* Backup & Recovery */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <DatabaseBackup className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Backup & Recovery</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Backup</p>
                    <p className="text-sm text-gray-500">
                      {settingsForm.lastBackup ? new Date(settingsForm.lastBackup).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <button
                    onClick={handleBackup}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <DatabaseBackup className="w-4 h-4" /> Create Backup
                  </button>
                </div>
                <button
                  onClick={handleResetQueue}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Queue
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelSettings}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Transaction Types</h2>
              <button
                onClick={handleAddTransaction}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                Add Transaction
              </button>
            </div>
            
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transactions configured</p>
            ) : (
              <div className="space-y-3">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{t.name}</p>
                      <p className="text-sm text-gray-500">{t.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTransaction(t)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleTransactionActive(t)}
                        className={`text-sm px-2 py-1 rounded ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}
                      >
                        {t.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'windows' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Service Windows</h2>
              <button
                onClick={handleAddWindow}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                Add Window
              </button>
            </div>
            
            {windows.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No windows configured</p>
            ) : (
              <div className="space-y-3">
                {windows.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{w.name}</p>
                      <p className="text-sm text-gray-500">Window #{w.number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditWindow(w)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleWindowActive(w)}
                        className={`text-sm px-2 py-1 rounded ${w.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}
                      >
                        {w.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transaction Form Modal */}
        {showTransactionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={transactionForm.name}
                    onChange={(e) => setTransactionForm({ ...transactionForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={transactionForm.code}
                    onChange={(e) => setTransactionForm({ ...transactionForm, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefix *</label>
                  <input
                    type="text"
                    value={transactionForm.prefix}
                    onChange={(e) => setTransactionForm({ ...transactionForm, prefix: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    maxLength={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Window Number</label>
                  <input
                    type="number"
                    value={transactionForm.windowNumber}
                    onChange={(e) => setTransactionForm({ ...transactionForm, windowNumber: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={transactionForm.priority}
                    onChange={(e) => setTransactionForm({ ...transactionForm, priority: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Priority Queue</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTransactionForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTransaction}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Window Form Modal */}
        {showWindowForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {editingWindow ? 'Edit Window' : 'Add Window'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={windowForm.name}
                    onChange={(e) => setWindowForm({ ...windowForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Window Number *</label>
                  <input
                    type="number"
                    value={windowForm.number}
                    onChange={(e) => setWindowForm({ ...windowForm, number: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWindowForm(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWindow}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
