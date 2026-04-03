import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHistoryWithFilters, getWindows, getTransactionTypes } from '../services/queueService';
import { ArrowLeft, History as HistoryIcon, Clock, CheckCircle, XCircle, AlertTriangle, Printer, RefreshCw } from 'lucide-react';
import type { QueueTicket, Window, TransactionType, TicketStatus } from '../types';

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [windowFilter, setWindowFilter] = useState<string>('');
  const [transactionFilter, setTransactionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadWindows = useCallback(async () => {
    try {
      const windowList = await getWindows();
      setWindows(windowList);
    } catch (err) {
      console.error('Error loading windows:', err);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const txList = await getTransactionTypes();
      setTransactions(txList);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0);
      }
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59);
      }

      const status = statusFilter || undefined;
      
      const ticketData = await getHistoryWithFilters(
        start,
        end,
        windowFilter || undefined,
        transactionFilter || undefined,
        searchTerm || undefined,
        status as TicketStatus | 'all' | undefined
      );
      
      // Filter by userId for student view, show all for admin/staff
      let filteredTickets = ticketData;
      if (user.role === 'student') {
        filteredTickets = ticketData.filter(t => t.userId === user.id);
      }
      
      setTickets(filteredTickets.slice(0, 100));
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, startDate, endDate, windowFilter, transactionFilter, statusFilter, searchTerm]);

  useEffect(() => {
    loadHistory();
    loadWindows();
    loadTransactions();
  }, [loadHistory, loadWindows, loadTransactions]);

  // handleFilter removed - filters now apply automatically via useEffect

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setWindowFilter('');
    setTransactionFilter('');
    setStatusFilter('');
    setSearchTerm('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'no_show':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      case 'waiting':
        return 'Waiting';
      case 'serving':
        return 'Serving';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-700';
      case 'waiting':
        return 'bg-blue-100 text-blue-700';
      case 'serving':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <img 
                  src="/escr-logo.png" 
                  alt="ESCR Logo" 
                  className="w-10 h-10 object-contain"
                />
                <h1 className="text-xl font-bold text-gray-800">Queue History</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Date:</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Date:</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Transaction:</label>
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Transactions</option>
                {transactions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Window:</label>
              <select
                value={windowFilter}
                onChange={(e) => setWindowFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Windows</option>
                {windows.map((w) => (
                  <option key={w.id} value={w.id}>Window {w.number}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleReset}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
            <div className="flex-1"></div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Search:</label>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or Ticket..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No queue history yet</p>
            <p className="text-gray-400">Your ticket history will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Ticket</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Service</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Student</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Date & Time</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Wait Time</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Serve Time</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg">{ticket.ticketNumber}</span>
                          {ticket.priority && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">PRIORITY</span>
                          )}
                        </div>
                        {ticket.windowName && (
                          <span className="text-xs text-gray-500">{ticket.windowName}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {ticket.transactionTypeName}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {ticket.studentName || '-'}
                        {ticket.studentId && (
                          <span className="text-xs text-gray-500 block">{ticket.studentId}</span>
                        )}
                        {(ticket.course || ticket.yearLevel) && (
                          <span className="text-xs text-gray-500">{ticket.course} {ticket.yearLevel}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {formatTime(ticket.waitTime)}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {formatTime(ticket.serveTime)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
