import { useState, useEffect } from 'react';
import { subscribeToActiveTickets, subscribeToWindows, subscribeToTransactionTypes } from '../services/queueService';
import type { QueueTicket, Window, TransactionType } from '../types';

export default function PublicMonitor() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribeTickets = subscribeToActiveTickets((updatedTickets) => {
      setTickets(updatedTickets);
      setDataLoaded(true);
    });
    return () => unsubscribeTickets();
  }, []);

  useEffect(() => {
    const unsubscribeWindows = subscribeToWindows((updatedWindows) => {
      setWindows(updatedWindows.filter(w => w.active));
      setDataLoaded(true);
    });
    return () => unsubscribeWindows();
  }, []);

  useEffect(() => {
    const unsubscribeTransactions = subscribeToTransactionTypes((updatedTransactions) => {
      setTransactions(updatedTransactions);
    });
    return () => unsubscribeTransactions();
  }, []);

  const servingTickets = tickets.filter(t => t.status === 'serving');
  const waitingTickets = tickets.filter(t => t.status === 'waiting');

  const getWaitingForTransaction = (transactionId: string) => {
    return waitingTickets
      .filter(t => t.transactionTypeId === transactionId)
      .slice(0, 4);
  };

  if (!dataLoaded || windows.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-orange-400 font-bold">Loading queue system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <div className="bg-[#0f2744] p-4">
        <div className="flex items-center gap-4">
          <img src="/escr-logo.png" alt="ESCR Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">ESCR QUEUE SYSTEM</h1>
            <p className="text-orange-400 font-mono text-lg">{currentTime}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar - News Board */}
        <div className="w-64 bg-white text-gray-800 p-4 flex-shrink-0 hidden lg:block">
          <h3 className="text-lg font-bold text-orange-600 mb-3 flex items-center gap-2">
            <span>📋</span> ESCR News Board!!
          </h3>
          <div className="space-y-3 text-sm">
            <p className="font-bold text-blue-900">PERIODICAL EXAMINATIONS</p>
            <p><span className="text-orange-600 font-semibold">PRELIM</span> - February 09-14, 2026</p>
            <p><span className="text-orange-600 font-semibold">MIDTERM</span> - March 09-14, 2026</p>
            <p><span className="text-orange-600 font-semibold">SEMI-FINALS</span> - April 06-11, 2026</p>
            <p><span className="text-orange-600 font-semibold">FINALS</span> - May 04-11, 2026</p>
            <p><span className="text-blue-600 font-semibold">Compliance Week</span> - May 11-16, 2026</p>
            <p><span className="text-blue-600 font-semibold">End of 2nd Semester</span> - May 16, 2026</p>
            <p><span className="text-green-600 font-semibold">Release of Grades</span> - June 15, 2026</p>
          </div>
        </div>

{/* Center - Main Window Cards */}
        <div className="flex-1 p-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-6">NOW SERVING!</h2>
          {/* Now Serving Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {windows.map((window) => {
              const windowTicket = servingTickets.find(t => t.windowId === window.id);
              return (
                <div 
                  key={window.id} 
                  className="bg-white rounded-2xl p-6 text-gray-800 shadow-xl"
                >
                  <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg text-center font-bold text-lg mb-4">
                    {window.name}
                  </div>
                  <p className="text-6xl md:text-7xl font-black text-center mb-2">
                    {windowTicket?.ticketNumber || '---'}
                  </p>
                  <p className="text-red-600 italic text-center text-xl font-semibold">
                    {windowTicket?.transactionTypeName || ''}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Next Serving Queues */}
          <div className="bg-white rounded-2xl p-4 text-gray-800">
            <h3 className="text-xl font-bold text-center mb-4 text-purple-900">Next Serving Queues</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="border-r border-gray-200 last:border-r-0 pr-4 last:pr-0">
                  <h4 className="text-center font-bold text-blue-900 mb-2">{transaction.name}</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {getWaitingForTransaction(transaction.id).length > 0 ? (
                      getWaitingForTransaction(transaction.id).map((ticket) => (
                        <span 
                          key={ticket.id} 
                          className="bg-blue-800 text-white px-3 py-1 rounded font-bold"
                        >
                          {ticket.ticketNumber}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">No waiting</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Ticker */}
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-orange-500 text-blue-900 font-bold flex items-center overflow-hidden">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] px-4 text-base">
          Welcome to ESCR! Always check your Queue Number on the monitor and proceed to your assigned window. Send your own feedback.
        </div>
      </div>

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={`fixed top-4 right-4 p-3 rounded-full shadow-lg transition z-50 ${
          soundEnabled ? 'bg-green-500' : 'bg-gray-500'
        }`}
      >
        <span className="text-xl">{soundEnabled ? '🔔' : '🔕'}</span>
      </button>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}