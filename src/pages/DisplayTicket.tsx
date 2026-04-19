import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTicket, getQueueStats, subscribeToActiveTickets, getUserActiveTicket } from '../services/queueService';
import { Clock, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import FeedbackModal from '../components/FeedbackModal';
import QueueStatusModal from '../components/QueueStatusModal';
import type { QueueTicket, QueueStats } from '../types';

interface SelectedTransaction {
  id: string;
  name: string;
  prefix: string;
}

export default function DisplayTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<QueueTicket | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [waitingPosition, setWaitingPosition] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [ticketServed, setTicketServed] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(true);

  const generateTicket = async () => {
    const stored = sessionStorage.getItem('selectedTransaction');
    const studentStored = sessionStorage.getItem('studentDetails');
    
    if (!stored) {
      navigate('/transactions');
      return;
    }

    const selected: SelectedTransaction = JSON.parse(stored);
    const studentDetails = studentStored ? JSON.parse(studentStored) : undefined;

    try {
      // Check if user already has an active ticket for this transaction
      if (user?.id) {
        const existingTicket = await getUserActiveTicket(user.id, selected.id);
        if (existingTicket) {
          setTicket(existingTicket);
          const queueStats = await getQueueStats(selected.id);
          setStats(queueStats);
          setIsLoading(false);
          return;
        }
      }

      // Get current stats
      const queueStats = await getQueueStats(selected.id);
      setStats(queueStats);
      setWaitingPosition(queueStats.waitingTickets);

      // Create new ticket
      try {
        const newTicket = await createTicket(
          selected.id,
          selected.name,
          selected.prefix,
          false,
          user?.id || null,
          studentDetails
        );
        setTicket(newTicket);
      } catch (ticketErr) {
        console.error('Ticket creation error:', ticketErr);
        const errMsg = ticketErr instanceof Error ? ticketErr.message : 'Unknown error';
        setError(`Failed to create ticket: ${errMsg}`);
      }
    } catch (err) {
      console.error('Error generating ticket:', err);
      setError('Failed to generate ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateTicket();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToActiveTickets((tickets) => {
      if (!ticket) return;
      
      const currentTicket = tickets.find(t => t.id === ticket.id);
      
      if (currentTicket) {
        const wasServing = ticket.status === 'serving';
        
        if (currentTicket.status === 'serving' && !wasServing) {
          setWaitingPosition(0);
          speakNotification(`Ticket ${ticket.ticketNumber}, please proceed to window ${currentTicket.windowName}`);
        }
        
        if (currentTicket.status === 'completed' && !ticketServed) {
          setTicketServed(true);
          setTimeout(() => setShowFeedback(true), 500);
        }
      }
      
      const waitingTickets = tickets.filter(t => 
        t.transactionTypeId === ticket.transactionTypeId && 
        t.status === 'waiting'
      );
      
      const userTicketIndex = waitingTickets.findIndex(t => t.id === ticket.id);
      const position = userTicketIndex >= 0 ? userTicketIndex + 1 : waitingTickets.length + 1;
      
      setWaitingPosition(position - 1);
    });

    return () => unsubscribe();
  }, [ticket]);

  const speakNotification = (message: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.9;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Generating your ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 pt-16 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Something went wrong'}</p>
          <button
            onClick={() => navigate('/transactions')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 pt-16">
      <Navbar 
        title="Your Ticket" 
        showBackButton 
        onBack={handleBack}
        helpContent={
          <div className="space-y-3 text-gray-600">
            <p>Your <b>ticket number</b> has been generated.</p>
            <p>Check the <b>position in queue</b> to see how many people are ahead of you.</p>
            <p>Wait for your number to be <b>called</b>.</p>
            <p>When called, proceed to the <b>assigned window</b>.</p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-800 text-sm">
                <b>Tip:</b> You can share your ticket or check the display monitor for updates.
              </p>
            </div>
          </div>
        }
      />

      {/* Ticket Card */}
      <div className="max-w-md mx-auto p-4 pt-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-blue-600 p-6 text-white text-center">
            <p className="text-blue-100 mb-1">Your Ticket</p>
            <h1 className="text-5xl font-bold tracking-wider">{ticket.ticketNumber}</h1>
          </div>

          {/* Ticket Details */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Transaction</span>
                <span className="font-semibold text-gray-800">{ticket.transactionTypeName}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold text-yellow-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Waiting
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Position in Queue</span>
                <span className="font-bold text-2xl text-blue-600">#{waitingPosition + 1}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Estimated Wait</span>
                <span className="font-semibold text-gray-800">
                  ~{Math.max(5, waitingPosition * 5)} minutes
                </span>
              </div>
            </div>

            {/* Queue Info */}
            {stats && (
              <div className="mt-6 bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.waitingTickets}</p>
                    <p className="text-xs text-gray-500">Waiting</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.servingTickets}</p>
                    <p className="text-xs text-gray-500">Serving</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{stats.completedTickets}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  sessionStorage.removeItem('selectedTransaction');
                  sessionStorage.removeItem('studentDetails');
                  sessionStorage.removeItem('currentTicket');
                  setShowThankYou(true);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
              >
                Done
              </button>
            </div>

            {/* Note */}
            <p className="mt-4 text-center text-sm text-gray-500">
              Please wait for your number to be called. You can check the monitor or stay on this page.
            </p>
          </div>
        </div>
      </div>

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">✓</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">Your ticket has been generated. Please wait for your number to be called.</p>
            <button
              onClick={() => {
                setShowThankYou(false);
                setShowFeedback(true);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      )}

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => {
          setShowFeedback(false);
          navigate('/login?message=feedback_submitted');
        }}
        ticketNumber={ticket?.ticketNumber}
        transactionType={ticket?.transactionTypeName}
      />

      <QueueStatusModal
        isOpen={showQueueModal && !!ticket}
        onClose={() => setShowQueueModal(false)}
        ticket={ticket}
        waitingPosition={waitingPosition}
      />
    </div>
  );
}
