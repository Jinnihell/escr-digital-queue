import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getTransactionTypes, 
  getQueueStats, 
  resetQueue,
  createTransactionType,
  updateTransactionType,
  getWindows,
  createWindow,
  updateWindow,
  subscribeToAllTickets
} from '../services/queueService';
import { RefreshCw, BarChart3, Monitor, Settings, Download, Printer } from 'lucide-react';
import Navbar from '../components/Navbar';
import type { TransactionType, QueueStats, Window as WindowType } from '../types';

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

  // Date filter state for reports
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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

  useEffect(() => {
    loadData();

    const unsubscribe = subscribeToAllTickets(() => {
      loadData();
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const [transactionTypes, queueStats, windowList] = await Promise.all([
        getTransactionTypes(),
        getQueueStats(),
        getWindows()
      ]);
      setTransactions(transactionTypes);
      setStats(queueStats);
      setWindows(windowList);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'transactions', label: 'Transactions', icon: Monitor },
    { id: 'windows', label: 'Windows', icon: Monitor }
  ];

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

  const adminHelpContent = (
    <div className="space-y-3 text-gray-600">
      <p><b>Dashboard:</b> Overview of system stats and quick actions.</p>
      <p><b>Reports:</b> View analytics and export reports.</p>
      <p><b>Transactions:</b> Manage transaction types (add/edit).</p>
      <p><b>Windows:</b> Manage service windows.</p>
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
      />
      
      {/* Tab Navigation - positioned below navbar */}
      <div className="bg-white shadow-sm pt-16">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as 'dashboard' | 'transactions' | 'windows')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
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
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Reports</h2>
            <div className="flex flex-wrap gap-4 items-end mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date:</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date:</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-800">{stats?.totalTickets || 0}</p>
                <p className="text-sm text-gray-600">Total Tickets</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-800">{stats?.completedTickets || 0}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-yellow-800">{stats?.waitingTickets || 0}</p>
                <p className="text-sm text-gray-600">Waiting</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-purple-800">{stats?.servingTickets || 0}</p>
                <p className="text-sm text-gray-600">Serving</p>
              </div>
            </div>
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
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">System Settings</h2>
            <p className="text-gray-500">Settings configuration coming soon.</p>
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
