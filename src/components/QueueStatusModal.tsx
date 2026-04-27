import { X, Clock, Users, Building2, Bell, CheckCircle, ArrowRight } from 'lucide-react';
import type { QueueTicket } from '../types';

interface QueueStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: QueueTicket | null;
  waitingPosition: number;
}

const statusThemes = {
  waiting: {
    headerBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-400',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    progress: 'bg-orange-200',
    progressFill: 'from-amber-400 to-orange-400'
  },
  serving: {
    headerBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    progress: 'bg-emerald-200',
    progressFill: 'from-emerald-400 to-teal-400'
  },
  completed: {
    headerBg: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    progress: 'bg-blue-200',
    progressFill: 'from-blue-400 to-indigo-400'
  },
  default: {
    headerBg: 'bg-gradient-to-br from-slate-500 to-gray-500',
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-400',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    iconBg: 'bg-slate-200',
    iconColor: 'text-slate-600',
    progress: 'bg-slate-200',
    progressFill: 'from-slate-400 to-gray-400'
  }
};

export default function QueueStatusModal({ isOpen, onClose, ticket, waitingPosition }: QueueStatusModalProps) {
  const showCallAnimation = ticket?.status === 'serving';

  if (!isOpen || !ticket) return null;

  const getStatusKey = () => {
    switch (ticket.status) {
      case 'waiting': return 'waiting';
      case 'serving': return 'serving';
      case 'completed': return 'completed';
      default: return 'default';
    }
  };

  const theme = statusThemes[getStatusKey()];

  const getStatusText = () => {
    switch (ticket.status) {
      case 'waiting': return 'In Queue';
      case 'serving': return 'Your Turn!';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden ${showCallAnimation ? 'animate-pulse' : ''}`}>
        <div className={`${theme.headerBg} p-3 sm:p-4 text-center relative`}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
          
          {ticket.status === 'serving' ? (
            <div className="flex flex-col items-center">
              <Bell className={`w-8 h-8 sm:w-10 sm:h-10 text-white ${showCallAnimation ? 'animate-bounce' : ''}`} />
              <h2 className="text-sm sm:text-base font-bold text-white">YOUR NUMBER IS CALLED!</h2>
            </div>
          ) : ticket.status === 'completed' ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              <h2 className="text-sm sm:text-base font-bold text-white">TRANSACTION COMPLETE!</h2>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              <h2 className="text-sm sm:text-base font-bold text-white">Queue Status</h2>
            </div>
          )}
        </div>

        <div className="text-center py-3 sm:py-4 border-b border-gray-100">
          <p className="text-gray-500 text-xs tracking-wider uppercase">Your Ticket</p>
          <p className="text-3xl sm:text-4xl font-black text-slate-700 font-mono" style={{ fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}>
            {ticket.ticketNumber}
          </p>
        </div>

        <div className="p-3 space-y-2">
          <div className={`flex items-center justify-between ${theme.bgColor} p-2 sm:p-3 rounded-lg`}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 ${theme.iconBg} rounded-full flex items-center justify-center`}>
                <Users className={`w-3 h-3 sm:w-4 sm:h-4 ${theme.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Position</p>
                <p className="font-bold text-gray-800 text-sm">#{waitingPosition + 1}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
              {getStatusText()}
            </span>
          </div>

          <div className={`flex items-center justify-between bg-gradient-to-r ${theme.progress} p-2 sm:p-3 rounded-lg`}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-white/50 rounded-full flex items-center justify-center`}>
                <ArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 ${theme.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Ahead</p>
                <p className="font-bold text-gray-800 text-sm">{waitingPosition}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-purple-50 p-2 sm:p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Window</p>
                <p className="font-bold text-gray-800 text-sm">{ticket.windowName || 'TBD'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Transaction</p>
                <p className="font-bold text-gray-800 text-sm">{ticket.transactionTypeName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3">
          {ticket.status === 'serving' ? (
            <div className={`bg-gradient-to-r ${theme.progress} border-2 ${theme.borderColor} rounded-lg p-2 sm:p-3 text-center`}>
              <p className={`${theme.badgeText} font-bold text-sm`}>
                Go to Window {ticket.windowName} now!
              </p>
            </div>
          ) : ticket.status === 'waiting' ? (
            <div className={`bg-gradient-to-r ${theme.progress} border-2 ${theme.borderColor} rounded-lg p-2 sm:p-3 text-center`}>
              <p className={`${theme.badgeText} text-xs font-medium`}>
                Please wait. Your turn will be announced.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-2 sm:p-3 text-center">
              <CheckCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-blue-800 font-bold text-sm">
                Transaction Complete!
              </p>
            </div>
          )}
        </div>

        <div className="px-3 pb-3">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}