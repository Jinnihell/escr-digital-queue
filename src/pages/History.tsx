import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWindows, subscribeToAllTickets } from '../services/queueService';
import { History as HistoryIcon, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import type { QueueTicket, Window } from '../types';

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [windowFilter, setWindowFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');



  useEffect(() => {
    let mounted = true;
    const loadWindows = async () => {
      try {
        const windowList = await getWindows();
        if (mounted) setWindows(windowList);
      } catch (err) {
        console.error("Error loading windows:", err);
      }
    };
    loadWindows();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Subscribe to completed tickets only
    const unsubscribe = subscribeToAllTickets((allTickets) => {
      setTickets(allTickets);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filtered tickets - memoized filtering
  const getFilteredTickets = () => {
    let filtered = [...tickets];
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0);
      filtered = filtered.filter(t => t.createdAt && new Date(t.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(t => t.createdAt && new Date(t.createdAt) <= end);
    }
    if (windowFilter) {
      filtered = filtered.filter(t => t.windowId === windowFilter);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.ticketNumber?.toLowerCase().includes(searchLower) ||
        t.studentName?.toLowerCase().includes(searchLower) ||
        t.transactionTypeName?.toLowerCase().includes(searchLower)
      );
    }
    
    if (user?.role === 'student') {
      filtered = filtered.filter(t => 
        t.userId === user.id || 
        (t.studentName && t.studentName.toLowerCase().includes(user.username?.toLowerCase() || ''))
      );
    }
    
    return filtered.slice(0, 50);  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setWindowFilter('');
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

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 pt-16">
      <Navbar 
        title="Queue History" 
        showBackButton 
        onBack={handleBack}
        helpContent={
          <div className="space-y-3 text-gray-600">
            <p>View your queue history here.</p>
            <p>Use filters to narrow down your search by date.</p>
            <p>The table shows your past tickets with their status.</p>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filter Section - matches PHP design */}
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
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              Reset
            </button>
            <div className="flex-1"></div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Search:</label>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Student name or ticket number..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
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
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Student Name</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Service</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Window</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Date</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTickets().map((ticket) => (
                    <tr key={ticket.id} className="border-t hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg">{ticket.ticketNumber}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {ticket.studentName || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {ticket.transactionTypeName}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {ticket.windowName || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {formatDate(ticket.createdAt)}
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

