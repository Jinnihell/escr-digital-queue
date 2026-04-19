import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/useAlert';
import { 
  subscribeToTransactionTypes,
  callNextTicket,
  completeTicket,
  subscribeToActiveTickets,
  getQueueStats,
  unlockWindow,
  getWindowById,
  checkAndExpireServingTickets
} from '../services/queueService';
import type { QueueTicket, QueueStats, TransactionType } from '../types';

// Staff Dashboard - Matches MYPHPQUEUE staff_dashboard.php design

export default function StaffDashboard() {
  const { logout, user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] = useState<string>('');
  const [selectedWindow, setSelectedWindow] = useState<{id: string; name: string; number: number} | null>(null);
  const [allTickets, setAllTickets] = useState<QueueTicket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<QueueTicket | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [allTransactions, setAllTransactions] = useState<TransactionType[]>([]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
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
    if (!selectedWindow) return;
    
    const unsubscribe = subscribeToActiveTickets((tickets) => {
      setAllTickets(tickets);
      
      // Find serving ticket for this window
      const serving = tickets.find(t => 
        t.status === 'serving' && 
        t.windowId === selectedWindow.id
      );
      setCurrentTicket(serving || null);
    });

    return () => unsubscribe();
  }, [selectedWindow]);

  // Auto-check for expired tickets every 30 seconds (5 minute timeout)
  useEffect(() => {
    const checkExpired = async () => {
      try {
        const expired = await checkAndExpireServingTickets(300); // 5 minutes
        if (expired > 0) {
          showAlert('info', `${expired} ticket(s) marked as no-show (expired after 5 minutes)`);
        }
      } catch (err) {
        console.error('Error checking expired tickets:', err);
      }
    };

    // Check immediately on mount
    checkExpired();

    // Then check every 30 seconds
    const interval = setInterval(checkExpired, 30000);

    return () => clearInterval(interval);
  }, [showAlert]);

  const loadData = async () => {
    try {
      // Load stats only (transactions will be loaded via real-time subscription)
      const queueStats = await getQueueStats();
      setStats(queueStats);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time subscription for transaction types
  useEffect(() => {
    const unsubscribe = subscribeToTransactionTypes((transactions) => {
      const activeTransactions = transactions.filter(t => t.active);
      
      // Filter transactions that this window can serve
      const myTransactions = activeTransactions.filter(
        t => t.windowNumber === selectedWindow?.number || !t.windowNumber
      );
      
      // Store all transactions for "Call Others" feature
      setAllTransactions(activeTransactions);
      
      // Select first matching transaction by default if none selected
      if (myTransactions.length > 0 && !selectedTransaction) {
        setSelectedTransaction(myTransactions[0].id);
      }
    });

    return () => unsubscribe();
  }, [selectedWindow]);

  // Get waiting tickets for selected transaction
  const waitingTickets = allTickets.filter(t => 
    t.status === 'waiting' && 
    t.transactionTypeId === selectedTransaction
  );

  const handleCallNext = async (transactionId?: string) => {
    const transactionToUse = transactionId || selectedTransaction;
    if (!transactionToUse || !selectedWindow || isCalling) return;
    
    setIsCalling(true);
    try {
      const ticket = await callNextTicket(transactionToUse, selectedWindow.id, selectedWindow.name);
      if (ticket) {
        setCurrentTicket(ticket);
        playNotificationSound();
        speakTicket(ticket.ticketNumber, selectedWindow.number.toString());
        showAlert('success', `Ticket ${ticket.ticketNumber} called`);
      } else {
        showAlert('warning', 'No tickets waiting in queue');
      }
    } catch (err) {
      console.error('Error calling ticket:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      showAlert('error', `Failed to call next ticket: ${errMsg}`);
    } finally {
      setIsCalling(false);
    }
  };

  const handleComplete = async () => {
    if (!currentTicket || isCompleting) return;

    setIsCompleting(true);
    try {
      await completeTicket(currentTicket.id);
      setCurrentTicket(null);
      loadData();
      showAlert('success', 'Ticket completed successfully');
    } catch (err) {
      console.error('Error completing ticket:', err);
      showAlert('error', 'Failed to complete ticket');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleLogout = async () => {
    const windowId = selectedWindow?.id;
    const windowName = selectedWindow?.name;
    const currentUserId = user?.id;
    
    // Verify window is still locked by this user before unlocking
    if (windowId && currentUserId) {
      try {
        const windowData = await getWindowById(windowId);
        
        // Only unlock if this user locked it
        if (windowData && windowData.staffId === currentUserId) {
          await unlockWindow(windowId);
          console.log(`Window ${windowName} unlocked successfully`);
        } else {
          console.log(`Window ${windowName} was not locked by current user or already unlocked`);
        }
      } catch (err) {
        console.error('Error unlocking window:', err);
      }
    }
    
    // Clear session storage
    sessionStorage.removeItem('selectedWindow');
    
    // Then logout
    await logout();
    navigate('/login?message=logged_out');
  };

  // Ringer/Notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
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
      
      setTimeout(() => audioContext.close(), 1100);
    } catch {
      console.log('Audio not available');
    }
  };

  // Voice announcement
  const speakTicket = (ticketNumber: string, windowNum: string) => {
    if (!('speechSynthesis' in window)) {
      console.log('Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(`Ticket ${ticketNumber}, please proceed to window ${windowNum}`);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = 'en-US';
    
    // Try to get an English voice
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      window.speechSynthesis.speak(utterance);
    };
    
    // If voices are already loaded, speak now
    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = trySpeak;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300">
      {/* Sidebar - matches PHP design */}
      <div className="fixed left-0 top-0 h-full w-64 bg-blue-800 text-white p-5 flex flex-col z-10">
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

        <nav className="grow">
          <ul className="space-y-2">
            <li>
              <button className="w-full text-left p-3 rounded-lg bg-white/10">
                Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/history')}
                className="w-full text-left p-3 rounded-lg hover:bg-white/10"
              >
                History
              </button>
            </li>
          </ul>
        </nav>

        <div className="border-t border-white/20 pt-4">
          <button 
            onClick={handleLogout}
            className="w-full text-left p-3 rounded-lg hover:bg-white/10 flex items-center gap-2"
          >
            Logout
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
                
                {/* Now Serving Title */}
                <h3 className="text-3xl font-bold text-orange-600 mt-2">NOW SERVING!</h3>
                
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
                    onClick={() => handleCallNext()}
                    disabled={!selectedTransaction || !selectedWindow || isCalling}
                    className="bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-bold py-4 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isCalling ? '⏳ Calling...' : '📞 Call Next Ticket'}
                  </button>
                  
                  {/* Call Others Button */}
                  <button
                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    📋 {showAllTransactions ? 'Hide Others' : 'Call Others'}
                  </button>
                  
                  {/* Other Transactions Dropdown */}
                  {showAllTransactions && (
                    <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-300">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Select Transaction to Call:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {allTransactions
                          .filter(t => t.id !== selectedTransaction)
                          .map(t => (
                            <button
                              key={t.id}
                              onClick={() => {
                                setSelectedTransaction(t.id);
                                setShowAllTransactions(false);
                                handleCallNext(t.id);
                              }}
                              className="w-full text-left p-2 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-800 font-medium"
                            >
                              {t.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        playNotificationSound();
                        if (currentTicket) {
                          speakTicket(currentTicket.ticketNumber, selectedWindow?.number.toString() || '');
                        }
                      }}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      🔔 Ring
                    </button>
                    <button
                      onClick={handleComplete}
                      disabled={!currentTicket || isCompleting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {isCompleting ? '⏳' : '✓ Complete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-72">
            {/* Stats - matches PHP design */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 bg-white rounded-2xl shadow-xl p-4 text-center">
                <p className="text-gray-500 text-xs uppercase">Waiting</p>
                <p className="text-3xl font-bold text-orange-500">
                  {waitingTickets.length}
                </p>
              </div>
              <div className="flex-1 bg-white rounded-2xl shadow-xl p-4 text-center">
                <p className="text-gray-500 text-xs uppercase">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.completedTickets || 0}
                </p>
              </div>
            </div>

            {/* Waiting List - matches PHP design */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-orange-500 text-white p-3 text-center font-bold">
                Next Serving Queue
              </div>
              <div className="p-3 max-h-[300px] overflow-y-auto">
                {waitingTickets.length > 0 ? (
                  <div className="space-y-2">
                    {waitingTickets.slice(0, 5).map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-3 rounded-lg text-center"
                      >
                        <span className="font-bold text-xl">{ticket.ticketNumber}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No waiting tickets</p>
                )}
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}
