import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createTicket, getQueueStats, subscribeToActiveTickets } from '../services/queueService';
import { ArrowLeft, Home, Clock, AlertTriangle, Share2 } from 'lucide-react';
import type { QueueTicket, QueueStats } from '../types';

interface SelectedTransaction {
  id: string;
  name: string;
  prefix: string;
  priority: boolean;
}

export default function DisplayTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<QueueTicket | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [waitingPosition, setWaitingPosition] = useState(0);

  // Use ref to track current ticket to avoid stale closure in subscription
  const ticketRef = useRef<QueueTicket | null>(null);
  useEffect(() => {
    ticketRef.current = ticket;
  }, [ticket]);

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
          selected.priority,
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
  }, [navigate, user]);

  useEffect(() => {
    generateTicket();
  }, [generateTicket]);

  useEffect(() => {
    // Subscribe to queue updates
    const unsubscribe = subscribeToActiveTickets((tickets) => {
      const currentTicket = ticketRef.current;
      if (currentTicket) {
        const waiting = tickets.filter(t => 
          t.transactionTypeId === currentTicket.transactionTypeId && 
          t.status === 'waiting'
        );
        setWaitingPosition(waiting.length);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleShare = async () => {
    if (!ticket) return;
    
    const shareData = {
      title: 'My Queue Ticket',
      text: `Ticket Number: ${ticket.ticketNumber}\nTransaction: ${ticket.transactionTypeName}\nPosition: #${waitingPosition}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.text);
        alert('Ticket info copied to clipboard!');
      } catch {
        alert('Failed to copy. Please copy manually.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Generating your ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 flex items-center justify-center p-4">
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

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 p-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>
      </div>

      {/* Ticket Card */}
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-blue-600 p-6 text-white text-center">
            <p className="text-blue-100 mb-1">Your Ticket</p>
            <h1 className="text-5xl font-bold tracking-wider">{ticket.ticketNumber}</h1>
            {ticket.priority && (
              <span className="inline-block mt-2 bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                PRIORITY
              </span>
            )}
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
                onClick={handleShare}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Share2 className="w-5 h-5" />
                Share Ticket
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </button>
            </div>

            {/* Note */}
            <p className="mt-4 text-center text-sm text-gray-500">
              Please wait for your number to be called. You can check the monitor or stay on this page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
