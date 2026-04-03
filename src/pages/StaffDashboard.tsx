import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getTransactionTypes, 
  callNextTicket,
  completeTicket,
  subscribeToActiveTickets,
  getQueueStats
} from '../services/queueService';
import type { TransactionType, QueueTicket, QueueStats } from '../types';

// Staff Dashboard - Matches MYPHPQUEUE staff_dashboard.php design

export default function StaffDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<string>('');
  const [selectedWindow, setSelectedWindow] = useState<{id: string; name: string; number: number} | null>(null);
  const [waitingTickets, setWaitingTickets] = useState<QueueTicket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<QueueTicket | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if window is selected
    const storedWindow = sessionStorage.getItem('selectedWindow');
    if (!storedWindow) {
      navigate('/window-selection');
      return;
    }
    
    const windowData = JSON.parse(storedWindow);
    setSelectedWindow(windowData);
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedWindow || !selectedTransaction) return;
    
    // Subscribe to active tickets for real-time updates
    const unsubscribe = subscribeToActiveTickets((tickets) => {
      const waiting = tickets.filter(t => 
        t.status === 'waiting' && 
        t.transactionTypeId === selectedTransaction
      );
      setWaitingTickets(waiting);
      
      const serving = tickets.find(t => 
        t.status === 'serving' && 
        t.windowId === selectedWindow.id
      );
      if (serving) {
        setCurrentTicket(serving);
      } else {
        setCurrentTicket(null);
      }
    });

    return () => unsubscribe();
  }, [selectedTransaction, selectedWindow]);

  const loadData = async () => {
    try {
      const [transactionTypes, queueStats] = await Promise.all([
        getTransactionTypes(),
        getQueueStats()
      ]);
      
      const activeTransactions = transactionTypes.filter(t => t.active);
      
      // Filter transactions by window number if window is selected
      let filteredTransactions = activeTransactions;
      if (selectedWindow) {
        filteredTransactions = activeTransactions.filter(
          t => t.windowNumber === selectedWindow.number
        );
        
        // If no specific transactions for this window, show all
        if (filteredTransactions.length === 0) {
          filteredTransactions = activeTransactions;
        }
      }
      
      setTransactions(filteredTransactions);
      setStats(queueStats);
      
      if (filteredTransactions.length > 0) {
        setSelectedTransaction(filteredTransactions[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallNext = async () => {
    if (!selectedTransaction || !selectedWindow) return;
    
    try {
      const ticket = await callNextTicket(selectedTransaction, selectedWindow.id, selectedWindow.name);
      if (ticket) {
        setCurrentTicket(ticket);
        // Play notification sound
        playNotificationSound();
        // Voice announcement
        speakTicket(ticket.ticketNumber, selectedWindow.number.toString());
      } else {
        alert('No tickets waiting in queue');
      }
    } catch (err) {
      console.error('Error calling ticket:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to call next ticket: ${errMsg}`);
    }
  };

  const handleComplete = async () => {
    if (!currentTicket) return;

    try {
      await completeTicket(currentTicket.id);
      setCurrentTicket(null);
      loadData(); // Refresh stats
    } catch (err) {
      console.error('Error completing ticket:', err);
      alert('Failed to complete ticket');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login?message=logged_out');
  };

  // Ringer/Notification sound - matches PHP design
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Main tone
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1000, audioContext.currentTime);
      gain1.gain.setValueAtTime(0, audioContext.currentTime);
      gain1.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 1);
    } catch (err) {
      console.log('Audio not available');
    }
  };

  // Voice announcement - matches PHP design
  const speakTicket = (ticketNumber: string, windowNum: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(`Ticket ${ticketNumber}, please proceed to window ${windowNum}`);
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Try to get a clear voice
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-blue-200">
      {/* Sidebar - matches PHP design */}
      <div className="fixed left-0 top-0 h-full w-64 bg-blue-800 text-white p-5 flex flex-col">
        <div className="text-center mb-8">
          <img src="/escr-logo.png" alt="ESCR Logo" className="w-40 h-40 object-contain mx-auto  bg-white rounded-full" />
          <h2 className="font-bold text-lg">ESCR DQMS</h2>
          <p className="text-xs text-blue-200">East Systems Colleges of Rizal</p>
          <p className="text-sm mt-2">Window No: {selectedWindow?.number}</p>
          <button 
            onClick={() => navigate('/window-selection')}
            className="text-xs text-blue-200 underline mt-1"
          >
            Switch Window
          </button>
        </div>

        <nav className="flex-grow">
          <ul className="space-y-2">
            <li>
              <button className="w-full text-left p-3 rounded-lg bg-white/10">
                📊 Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/history')}
                className="w-full text-left p-3 rounded-lg hover:bg-white/10"
              >
                📋 History
              </button>
            </li>
          </ul>
        </nav>

        <div className="border-t border-white/20 pt-4">
          <button 
            onClick={handleLogout}
            className="w-full text-left p-3 rounded-lg hover:bg-white/10 flex items-center gap-2"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="flex flex-wrap gap-6">
          {/* Left Panel */}
          <div className="flex-1 min-w-[300px]">
            {/* Serving Card - matches PHP design */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="text-center">
                {/* Logo */}
                <img src="/escr-logo.png" alt="ESCR Logo" className="w-40 h-40 object-contain mx-auto" />
                
                {/* Queue Number */}
                <div className="border-4 border-blue-800 rounded-2xl p-6 my-4">
                  <p className="text-7xl md:text-8xl font-black text-blue-800">
                    {currentTicket?.ticketNumber || '---'}
                  </p>
                </div>
                
                {/* Student Info */}
                {currentTicket && (
                  <div className="bg-gray-50 rounded-xl p-3 text-left border-l-4 border-blue-800 mb-4">
                    <p className="text-sm text-gray-500">Student Name:</p>
                    <p className="font-semibold">{currentTicket.studentName || 'N/A'}</p>
                    <p className="text-sm text-gray-500 mt-2">Course & Year:</p>
                    <p className="font-semibold">{currentTicket.course || 'N/A'} - {currentTicket.yearLevel || 'N/A'}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCallNext}
                    disabled={!selectedTransaction || !selectedWindow}
                    className="bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                  >
                    📞 Call Next Ticket
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={playNotificationSound}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      🔔 Ring
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={!currentTicket}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      ✓ Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-72">
            {/* Transaction Selection - matches PHP design */}
            <div className="bg-white rounded-2xl shadow-xl p-5 mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Select Transaction</h3>
              <select
                value={selectedTransaction}
                onChange={(e) => setSelectedTransaction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
              >
                {transactions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Stats - matches PHP design */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 bg-white rounded-2xl shadow-xl p-4 text-center">
                <p className="text-gray-500 text-xs uppercase">Waiting</p>
                <p className="text-3xl font-bold text-orange-500">{stats?.waitingTickets || 0}</p>
              </div>
              <div className="flex-1 bg-white rounded-2xl shadow-xl p-4 text-center">
                <p className="text-gray-500 text-xs uppercase">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats?.completedTickets || 0}</p>
              </div>
            </div>

            {/* Waiting List - matches PHP design */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-orange-500 text-white p-3 text-center font-bold">
                Next in Line
              </div>
              <div className="p-3 max-h-[300px] overflow-y-auto">
                {waitingTickets.length > 0 ? (
                  <div className="space-y-2">
                    {waitingTickets.slice(0, 5).map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className={`bg-gradient-to-r from-blue-800 to-blue-600 text-white p-3 rounded-lg text-center ${
                          ticket.priority ? 'border-2 border-orange-500' : ''
                        }`}
                      >
                        <span className="font-bold text-xl">{ticket.ticketNumber}</span>
                        {ticket.priority && (
                          <span className="ml-2 bg-orange-500 text-xs px-2 py-1 rounded">PRIORITY</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No waiting tickets</p>
                )}
              </div>
            </div>

            {/* Window Info */}
            <div className="bg-white rounded-2xl shadow-xl p-5 mt-6">
              <h3 className="font-bold text-gray-800 mb-2">Your Window</h3>
              <p className="text-3xl font-bold text-blue-800">Window {selectedWindow?.number}</p>
              <p className="text-gray-500">{selectedWindow?.name}</p>
              <button
                onClick={() => navigate('/window-selection')}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Change Window
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
