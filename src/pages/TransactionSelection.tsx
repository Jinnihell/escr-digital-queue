import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTransactionTypes, initializeDefaultTransactions, initializeDefaultWindows, subscribeToActiveTickets, getUserActiveTickets } from '../services/queueService';
import Navbar from '../components/Navbar';
import type { TransactionType, QueueTicket } from '../types';

// Transaction Selection Page - Matches MYPHPQUEUE transaction_selection.php design

export default function TransactionSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPriority, setIsPriority] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Queue tracker state
  const [myTicket, setMyTicket] = useState<QueueTicket | null>(null);
  const [showTracker, setShowTracker] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [currentWindow] = useState<number>(0);
  const [servingNumber, setServingNumber] = useState<string>('---');
  const [trackerStatus, setTrackerStatus] = useState<string>('Waiting');

  useEffect(() => {
    loadTransactions();
    
    // Check if user already has active tickets from Firestore
    const checkExistingTickets = async () => {
      if (user?.id) {
        try {
          const activeTickets = await getUserActiveTickets(user.id);
          if (activeTickets.length > 0) {
            // Use the most recent active ticket
            const ticket = activeTickets[0];
            setMyTicket(ticket);
            setShowTracker(true);
            sessionStorage.setItem('currentTicket', JSON.stringify(ticket));
          }
        } catch (e) {
          console.error('Error checking existing tickets:', e);
        }
      }
    };
    checkExistingTickets();
    
    // Check session storage as fallback
    const storedTicket = sessionStorage.getItem('currentTicket');
    if (storedTicket && !myTicket) {
      try {
        const ticket = JSON.parse(storedTicket);
        setMyTicket(ticket);
        setShowTracker(true);
      } catch (e) {
        console.error('Error parsing stored ticket:', e);
      }
    }
  }, [myTicket, user]);

  // Subscribe to active tickets for real-time updates
  useEffect(() => {
    if (!myTicket) return;
    
    const unsubscribe = subscribeToActiveTickets((tickets) => {
      // Find user's ticket
      const userTicket = tickets.find(t => t.ticketNumber === myTicket.ticketNumber);
      if (userTicket) {
        setTrackerStatus(userTicket.status === 'serving' ? 'Being Served' : 'Waiting');
        
        // Calculate position
        const waitingTickets = tickets.filter(t => 
          t.status === 'waiting' && 
          t.transactionTypeId === myTicket.transactionTypeId
        );
        const position = waitingTickets.findIndex(t => t.id === userTicket.id) + 1;
        setCurrentPosition(position || 1);
      }
      
      // Get serving ticket for the same transaction type
      const serving = tickets.find(t => 
        t.status === 'serving' && 
        t.transactionTypeId === myTicket.transactionTypeId
      );
      if (serving) {
        setServingNumber(serving.ticketNumber);
      }
    });
    
    return () => unsubscribe();
  }, [myTicket]);

  const loadTransactions = async () => {
    try {
      setError(null);
      
      // Initialize default data if needed
      try {
        await initializeDefaultTransactions();
        await initializeDefaultWindows();
      } catch (initErr) {
        console.warn('Initialization skipped (may already exist):', initErr);
      }
      
      const data = await getTransactionTypes();
      // Show transactions that are active or have no active field
      setTransactions(data.filter(t => t.active !== false));
    } catch (err) {
      console.error('Error loading transactions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load transactions: ${errorMessage}. Please check Firestore rules.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedId) return;
    
    const selected = transactions.find(t => t.id === selectedId);
    if (!selected) return;

    // Store selection in sessionStorage for the next page
    sessionStorage.setItem('selectedTransaction', JSON.stringify({
      id: selected.id,
      name: selected.name,
      prefix: selected.prefix || selected.name.charAt(0).toUpperCase(),
      priority: isPriority && selected.priority
    }));
    
    navigate('/student-details');
  };

  const toggleTrackerDetails = () => {
    const details = document.getElementById('trackerDetails');
    if (details) {
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 pt-16">
      {/* Queue Status Tracker - matches PHP design */}
      {showTracker && myTicket && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-linear-to-r from-blue-800 to-blue-600 text-white p-2 shadow-lg">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs opacity-80">Your Queue:</span>
                <span className="text-2xl font-bold text-orange-400 ml-2">{myTicket.ticketNumber}</span>
              </div>
              <div>
                <span className="text-xs opacity-80">Status:</span>
                <span className="text-base font-bold ml-2">{trackerStatus}</span>
              </div>
              <div>
                <span className="text-xs opacity-80">Position:</span>
                <span className="text-base font-bold ml-2">#{currentPosition}</span>
              </div>
              <div>
                <span className="text-xs opacity-80">Window:</span>
                <span className="text-base font-bold ml-2">{currentWindow || '---'}</span>
              </div>
            </div>
            <button 
              onClick={toggleTrackerDetails}
              className="bg-white/20 px-3 py-1 rounded text-sm"
            >
              ▼ Details
            </button>
          </div>
          {/* Expandable Details */}
          <div id="trackerDetails" className="hidden max-w-4xl mx-auto mt-2 p-2 bg-white/10 rounded">
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="opacity-70">NOW SERVING</p>
                <p className="font-bold text-orange-400">{servingNumber}</p>
              </div>
              <div>
                <p className="opacity-70">TRANSACTION</p>
                <p className="font-bold">{myTicket.transactionTypeName}</p>
              </div>
              <div>
                <p className="opacity-70">YOUR STATUS</p>
                <p className="font-bold">{trackerStatus}</p>
              </div>
              <div>
                <p className="opacity-70">TIME IN QUEUE</p>
                <p className="font-bold">---</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navbar 
        title="ESCR DQMS - Select Transaction"
        helpContent={
          <div className="space-y-3 text-gray-600">
            <p>1. <b>Select your transaction</b> type (Registrar, Cashier, etc.)</p>
            <p>2. If you're a <b>Senior Citizen or PWD</b>, check the priority box.</p>
            <p>3. Click <b>Continue</b> to proceed.</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-800 text-sm">
                <b>Priority:</b> Priority queue is available for seniors and persons with disability.
              </p>
            </div>
          </div>
        }
      />

      {/* Main Content - matches PHP design */}
      <div className="max-w-4xl mx-auto pt-16">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-2 mt-8">
          WELCOME!
        </h1>
        <p className="text-gray-600 text-center mb-8 font-semibold">
          Please select your transaction...
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-red-50 rounded-xl border border-red-200">
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={loadTransactions}
              className="text-blue-600 hover:underline text-sm"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Transaction Buttons Grid - matches PHP design */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {transactions.length === 0 ? (
                <div className="col-span-2 text-center py-8 bg-white rounded-xl shadow">
                  <p className="text-gray-600 mb-2">No transactions available at the moment.</p>
                  <p className="text-gray-500 text-sm">Please try again later or contact support.</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    onClick={() => setSelectedId(transaction.id)}
                    className={`p-6 rounded-2xl text-center transition-all duration-300 flex flex-col items-center gap-3 ${
                      selectedId === transaction.id
                        ? 'bg-linear-to-r from-blue-800 to-blue-600 text-white shadow-xl transform scale-[1.02]'
                        : 'bg-white hover:bg-blue-50 text-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    {/* Icon based on transaction type */}
                    <div className="text-4xl">
                      {transaction.name.toLowerCase().includes('enrollment') && '👥'}
                      {transaction.name.toLowerCase().includes('assessment') && '📋'}
                      {transaction.name.toLowerCase().includes('payment') && '💳'}
                      {transaction.name.toLowerCase().includes('other') && '🔔'}
                      {!transaction.name.toLowerCase().includes('enrollment') && 
                       !transaction.name.toLowerCase().includes('assessment') && 
                       !transaction.name.toLowerCase().includes('payment') && 
                       !transaction.name.toLowerCase().includes('other') && '📌'}
                    </div>
                    <span className="font-bold text-xl">{transaction.name}</span>
                  </button>
                ))
              )}
            </div>

            {/* Priority Toggle - matches PHP design */}
            {selectedId && transactions.find(t => t.id === selectedId)?.priority && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPriority}
                    onChange={(e) => setIsPriority(e.target.checked)}
                    className="w-5 h-5 rounded text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="text-yellow-800 font-medium">
                    Mark as Priority (Senior Citizen / PWD)
                  </span>
                </label>
              </div>
            )}

            {/* Continue Button - matches PHP design */}
            <div className="flex justify-center">
              <button
                onClick={handleContinue}
                disabled={!selectedId}
                className={`px-12 py-3 rounded-xl font-bold text-lg transition-all duration-300 ${
                  selectedId
                    ? 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-1'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
