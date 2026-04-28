import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTicket, getQueueStats, subscribeToActiveTickets, getUserActiveTicket } from '../services/queueService';
import { Clock, AlertTriangle, CheckCircle, XCircle, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import FeedbackModal from '../components/FeedbackModal';
import QueueStatusModal from '../components/QueueStatusModal';
import type { QueueTicket, QueueStats } from '../types';

interface SelectedTransaction {
  id: string;
  name: string;
  prefix: string;
}

const statusThemes = {
  waiting: {
    header: 'from-amber-500 to-orange-500',
    headerBg: 'bg-linear-to-br from-amber-500 to-orange-500',
    textColor: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    progress: 'bg-orange-200',
    progressFill: 'bg-gradient-to-r from-amber-400 to-orange-400'
  },
  serving: {
    header: 'from-emerald-500 to-teal-500',
    headerBg: 'bg-linear-to-br from-emerald-500 to-teal-500',
    textColor: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    progress: 'bg-emerald-200',
    progressFill: 'bg-gradient-to-r from-emerald-400 to-teal-400'
  },
  missed: {
    header: 'from-rose-500 to-red-500',
    headerBg: 'bg-linear-to-br from-rose-500 to-red-500',
    textColor: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-700',
    progress: 'bg-rose-200',
    progressFill: 'bg-gradient-to-r from-rose-400 to-red-400'
  },
  completed: {
    header: 'from-blue-500 to-indigo-500',
    headerBg: 'bg-linear-to-br from-blue-500 to-indigo-500',
    textColor: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    progress: 'bg-blue-200',
    progressFill: 'bg-gradient-to-r from-blue-400 to-indigo-400'
  }
};

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
  const [currentStatus, setCurrentStatus] = useState<'waiting' | 'serving' | 'missed' | 'completed'>('waiting');

const generateTicket = useCallback(async () => {
    const stored = sessionStorage.getItem('selectedTransaction');
    const studentStored = sessionStorage.getItem('studentDetails');
    
    if (!stored) {
        navigate('/transactions');
        return;
    }

    const selected: SelectedTransaction = JSON.parse(stored);
    const studentDetails = studentStored ? JSON.parse(studentStored) : undefined;

    try {
        if (user?.id) {
            const existingTicket = await getUserActiveTicket(user.id, selected.id);
            if (existingTicket) {
                setTicket(existingTicket);
                setCurrentStatus(existingTicket.status === 'serving' ? 'serving' : existingTicket.status === 'completed' ? 'completed' : 'waiting');
                const queueStats = await getQueueStats(selected.id);
                setStats(queueStats);
                setIsLoading(false);
                return;
            }
        }

        const queueStats = await getQueueStats(selected.id);
        setStats(queueStats);
        setWaitingPosition(queueStats.waitingTickets);

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
}, [user, navigate]);

  useEffect(() => {
    generateTicket();
  }, [generateTicket]);

  useEffect(() => {
    const unsubscribe = subscribeToActiveTickets((tickets) => {
      if (!ticket) return;
      
      const currentTicket = tickets.find(t => t.id === ticket.id);
      
      if (currentTicket) {
        const wasServing = ticket.status === 'serving';
        
        if (currentTicket.status === 'serving' && !wasServing) {
          setWaitingPosition(0);
          setCurrentStatus('serving');
          speakNotification(`Ticket ${ticket.ticketNumber}, please proceed to window ${currentTicket.windowName}`);
        }
        
        if (currentTicket.status === 'completed' && !ticketServed) {
          setTicketServed(true);
          setCurrentStatus('completed');
          setTimeout(() => setShowFeedback(true), 500);
        }
        
        if (currentTicket.status === 'no_show' || currentTicket.status === 'cancelled') {
          setCurrentStatus('missed');
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
  }, [ticket, ticketServed]);

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
      <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Generating your ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 pt-16 flex items-center justify-center p-4">
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

  const theme = statusThemes[currentStatus];
  const totalWaiting = stats?.waitingTickets || 0;
  const progressPercent = totalWaiting > 0 ? Math.max(5, ((totalWaiting - waitingPosition) / totalWaiting) * 100) : 100;

  const statusLabels = {
    waiting: { label: 'Waiting', icon: Clock },
    serving: { label: 'Your Turn!', icon: CheckCircle },
    missed: { label: 'Missed', icon: XCircle },
    completed: { label: 'Completed', icon: CheckCircle }
  };

  const { label: statusLabel, icon: StatusIcon } = statusLabels[currentStatus];

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 pt-16">
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

      <div className="max-w-md mx-auto p-3 sm:p-4 pt-6 sm:pt-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className={`${theme.headerBg} p-5 sm:p-6 text-white text-center relative`}>
            <div className="absolute top-0 left-0 right-0 h-2 bg-white/20"></div>
            <p className="text-white/80 mb-1 text-xs sm:text-sm tracking-wider uppercase">Present this to the counter</p>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-widest font-mono" style={{ fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>
              {ticket.ticketNumber}
            </h1>
            <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full ${currentStatus === 'serving' ? 'bg-white/30' : 'bg-white/20'}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">{statusLabel}</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-100 rounded-full border-4 border-white shadow"></div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex justify-center mb-5">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium tracking-wide">
                {ticket.transactionTypeName}
              </span>
            </div>

            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center">
                <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full ${theme.progress} flex items-center justify-center`}>
                  <div className="text-center">
                    <p className="text-4xl sm:text-5xl font-bold text-gray-800">#{waitingPosition + 1}</p>
                    <p className="text-xs text-gray-500 mt-1">in queue</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mb-5 px-4 py-3 rounded-xl ${theme.badge}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {waitingPosition === 0 ? 'You are next!' : `${waitingPosition} people ahead of you`}
                  </span>
                </div>
              </div>
              <div className={`mt-2 h-2 rounded-full ${theme.progress}`}>
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${theme.progressFill}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {stats && (
              <div className="mb-5 bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{stats.waitingTickets}</p>
                    <p className="text-xs text-gray-500">Waiting</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.servingTickets}</p>
                    <p className="text-xs text-gray-500">Serving</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-600">{stats.completedTickets}</p>
                    <p className="text-xs text-gray-500">Done</p> 
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <button
                onClick={() => {
                  sessionStorage.removeItem('selectedTransaction');
                  sessionStorage.removeItem('studentDetails');
                  sessionStorage.removeItem('currentTicket');
                  setShowThankYou(true);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
              >
                Done
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              Please wait for your number to be called. You can check the monitor or stay on this page.
            </p>
          </div>
        </div>
      </div>

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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition"
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
