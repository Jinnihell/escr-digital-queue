import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getSettings, 
  saveSettings, 
  getTransactionTypes, 
  getQueueStats, 
  resetQueue,
  createTransactionType,
  updateTransactionType,
  getWindows,
  createWindow,
  updateWindow,
  getReportData
} from '../services/queueService';
import { ArrowLeft, Save, RefreshCw, Settings, BarChart3, Monitor, Download, Printer } from 'lucide-react';
import type { SystemSettings, TransactionType, QueueStats, Window as WindowType } from '../types';

interface AdminDashboardProps {
  tab?: 'dashboard' | 'settings' | 'reports' | 'transactions' | 'windows';
}

export default function AdminDashboard({ tab = 'dashboard' }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'reports' | 'transactions' | 'windows'>(tab);
  const [settings, setSettings] = useState<SystemSettings>({
    systemName: 'ESCR Digital Queueing System',
    resetTime: '00:00',
    maxDailyTickets: 100,
    enablePriority: true,
    enableNotifications: true,
    averageServiceTime: 300
  });
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [windows, setWindows] = useState<WindowType[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  // Date filter state for reports
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<{
    totalServed: number;
    byTransaction: Record<string, number>;
    byWindow: Record<string, number>;
    hourlyData: number[];
  }>({
    totalServed: 0,
    byTransaction: {},
    byWindow: {},
    hourlyData: Array(10).fill(0)
  });
  const [showWindowForm, setShowWindowForm] = useState(false);
  const [editingWindow, setEditingWindow] = useState<WindowType | null>(null);
  const [windowForm, setWindowForm] = useState({
    name: '',
    number: 1
  });

  useEffect(() => {
    loadData();
    // Load initial report data
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, transactionTypes, queueStats, windowList] = await Promise.all([
        getSettings(),
        getTransactionTypes(),
        getQueueStats(),
        getWindows()
      ]);
      setSettings(settingsData);
      setTransactions(transactionTypes);
      setStats(queueStats);
      setWindows(windowList);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save settings');
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetQueue = async () => {
    if (!confirm('Are you sure you want to reset all active queues? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const count = await resetQueue();
      setMessage(`Queue reset successfully! ${count} tickets were cancelled.`);
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Reset queue error:', err);
      setMessage('Failed to reset queue: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
    } catch (err) {
      setMessage('Failed to save transaction');
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTransactionActive = async (t: TransactionType) => {
    try {
      await updateTransactionType(t.id, { active: !t.active });
      loadData();
    } catch (err) {
      setMessage('Failed to update transaction');
      console.error('Failed to update transaction:', err);
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
    } catch (err) {
      setMessage('Failed to save window');
      console.error('Failed to save window:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWindowActive = async (w: WindowType) => {
    try {
      await updateWindow(w.id, { active: !w.active });
      loadData();
    } catch (err) {
      setMessage('Failed to update window');
      console.error('Failed to update window:', err);
    }
  };

  // Load report data - now uses the new getReportData function
  const loadReportData = async () => {
    try {
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59);
      }
      
      const report = await getReportData(start, end);
      
      setReportData({
        totalServed: report.totalServed,
        byTransaction: Object.fromEntries(
          Object.entries(report.byTransaction).map(([k, v]) => [k, v.count])
        ),
        byWindow: report.byWindow,
        hourlyData: report.hourlyData
      });
    } catch (err) {
      console.error('Error loading report data:', err);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'transactions', label: 'Transactions', icon: Settings },
    { id: 'windows', label: 'Windows', icon: Monitor },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img src="/escr-logo.png" alt="ESCR Logo" className="w-10 h-10 object-contain" />
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as 'dashboard' | 'transactions' | 'windows' | 'settings')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    activeTab === t.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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
            {/* Reports Header - matches PHP design */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-800">📊 System Performance</h2>
                <div className="flex gap-2">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                </div>
              </div>

              {/* Date Filter - matches PHP design */}
              <div className="flex flex-wrap gap-4 items-end mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date:</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date:</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
                <button 
                  onClick={loadReportData}
                  className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Filter
                </button>
              </div>

              {/* Summary Cards - matches PHP design */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-linear-to-r from-blue-800 to-blue-600 text-white rounded-xl p-6">
                  <p className="text-blue-100 uppercase text-sm">Total Students Served</p>
                  <p className="text-5xl font-bold">{reportData.totalServed}</p>
                </div>
                <div className="bg-linear-to-r from-orange-500 to-orange-400 text-white rounded-xl p-6">
                  <p className="text-orange-100 uppercase text-sm">Best Service Window</p>
                  <p className="text-3xl font-bold">
                    {Object.entries(reportData.byWindow).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                  </p>
                  <p className="text-sm text-orange-100">
                    {Object.entries(reportData.byWindow).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} served
                  </p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Transaction Breakdown */}
                <div className="bg-white rounded-xl p-4 border">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Transaction Type Breakdown</h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {Object.entries(reportData.byTransaction).map(([key, value], index) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                          style={{ backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'][index % 4] }}
                        >
                          {value}
                        </div>
                        <p className="text-xs mt-1">{key}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart - Transactions by Type */}
                <div className="bg-white rounded-xl p-4 border">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Transactions by Type</h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.byTransaction).map(([key, value]) => {
                      const max = Math.max(...Object.values(reportData.byTransaction), 1);
                      const percentage = (value / max) * 100;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{key}</span>
                            <span className="font-bold">{value}</span>
                          </div>
                          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-800 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Hourly Traffic Chart */}
              <div className="bg-white rounded-xl p-4 border">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Hourly Student Traffic</h3>
                <div className="flex items-end justify-around h-40 gap-2">
                  {['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'].map((hour, index) => {
                    const max = Math.max(...reportData.hourlyData, 1);
                    const height = (reportData.hourlyData[index] / max) * 100 || 5;
                    return (
                      <div key={hour} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-blue-800 rounded-t transition-all duration-500"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">{hour}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">System Settings</h2>
            
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Name
                </label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Reset Time
                </label>
                <input
                  type="time"
                  value={settings.resetTime}
                  onChange={(e) => setSettings({ ...settings, resetTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Daily Tickets
                </label>
                <input
                  type="number"
                  value={settings.maxDailyTickets}
                  onChange={(e) => setSettings({ ...settings, maxDailyTickets: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Service Time (seconds)
                </label>
                <input
                  type="number"
                  value={settings.averageServiceTime}
                  onChange={(e) => setSettings({ ...settings, averageServiceTime: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enablePriority}
                    onChange={(e) => setSettings({ ...settings, enablePriority: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-gray-700">Enable Priority Queue</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-gray-700">Enable Notifications</span>
                </label>
              </div>

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
                        className={`text-sm px-2 py-1 rounded ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
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
                        className={`text-sm px-2 py-1 rounded ${w.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
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
