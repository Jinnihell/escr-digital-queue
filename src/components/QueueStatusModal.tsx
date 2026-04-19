import { X, Clock, Users, Building2, Bell, CheckCircle, ArrowRight } from 'lucide-react';
import type { QueueTicket } from '../types';

interface QueueStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: QueueTicket | null;
  waitingPosition: number;
}

export default function QueueStatusModal({ isOpen, onClose, ticket, waitingPosition }: QueueStatusModalProps) {
  const showCallAnimation = ticket?.status === 'serving';

  if (!isOpen || !ticket) return null;

  const getStatusColor = () => {
    switch (ticket.status) {
      case 'waiting': return 'text-yellow-600';
      case 'serving': return 'text-green-600';
      case 'completed': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (ticket.status) {
      case 'waiting': return 'In Queue';
      case 'serving': return 'Your Turn!';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden ${showCallAnimation ? 'animate-pulse' : ''}`}>
        {/* Header */}
        <div className={`p-6 text-center ${ticket.status === 'serving' ? 'bg-green-500' : ticket.status === 'completed' ? 'bg-blue-500' : 'bg-blue-600'}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          {ticket.status === 'serving' ? (
            <div className="flex flex-col items-center">
              <Bell className={`w-16 h-16 text-white mb-2 ${showCallAnimation ? 'animate-bounce' : ''}`} />
              <h2 className="text-2xl font-bold text-white">YOUR NUMBER IS CALLED!</h2>
            </div>
          ) : ticket.status === 'completed' ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="w-16 h-16 text-white mb-2" />
              <h2 className="text-2xl font-bold text-white">TRANSACTION COMPLETE!</h2>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Clock className="w-16 h-16 text-white mb-2" />
              <h2 className="text-2xl font-bold text-white">Queue Status</h2>
            </div>
          )}
        </div>

        {/* Ticket Number */}
        <div className="text-center py-6 border-b">
          <p className="text-gray-500 text-sm">Your Ticket Number</p>
          <p className="text-5xl font-black text-blue-600">{ticket.ticketNumber}</p>
        </div>

        {/* Queue Info */}
        <div className="p-6 space-y-4">
          {/* Position */}
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Position in Queue</p>
                <p className="font-bold text-gray-800">#{waitingPosition + 1}</p>
              </div>
            </div>
            <span className={`text-lg font-bold ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          {/* Ahead of you */}
          <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Students Ahead</p>
                <p className="font-bold text-gray-800">{waitingPosition} person{waitingPosition !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Window */}
          <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Go to Window</p>
                <p className="font-bold text-gray-800">{ticket.windowName || 'Will be assigned'}</p>
              </div>
            </div>
          </div>

          {/* Transaction */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transaction</p>
                <p className="font-bold text-gray-800">{ticket.transactionTypeName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="px-6 pb-6">
          {ticket.status === 'serving' ? (
            <div className="bg-green-100 border-2 border-green-500 rounded-xl p-4 text-center">
              <p className="text-green-800 font-bold text-lg">
                Please proceed to Window {ticket.windowName} now!
              </p>
              <p className="text-green-600 text-sm mt-1">
                Show your ticket number to the staff
              </p>
            </div>
          ) : ticket.status === 'waiting' ? (
            <div className="bg-yellow-100 border-2 border-yellow-500 rounded-xl p-4 text-center">
              <p className="text-yellow-800 font-semibold">
                Please wait. Your turn will be announced.
              </p>
            </div>
          ) : (
            <div className="bg-blue-100 border-2 border-blue-500 rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-blue-800 font-bold">
                Transaction Complete!
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}