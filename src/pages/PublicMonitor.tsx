import { useState, useEffect, useRef, useMemo } from 'react';
import { subscribeToActiveTickets, subscribeToWindows, subscribeToTransactionTypes } from '../services/queueService';
import type { QueueTicket, Window, TransactionType } from '../types';

export default function PublicMonitor() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  const servingTickets = useMemo(() => tickets.filter(t => t.status === 'serving'), [tickets]);
  const waitingTickets = useMemo(() => tickets.filter(t => t.status === 'waiting'), [tickets]);

  const lastAnnouncedRef = useRef<string>('');

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

  useEffect(() => {
    if (!soundEnabled || servingTickets.length === 0 || windows.length === 0) return;
    
    // Get the most recent serving ticket
    const latestTicket = servingTickets[0];
    const queueWindow = windows.find(w => w.id === latestTicket.windowId);
    const key = `${latestTicket.id}-${latestTicket.status}`;
    
    if (queueWindow && lastAnnouncedRef.current !== key) {
      lastAnnouncedRef.current = key;
      
      // Cancel any ongoing speech first
      window.speechSynthesis?.cancel();
      
      const utterance = new SpeechSynthesisUtterance(`Ticket ${latestTicket.ticketNumber}, please proceed to ${queueWindow.name}`);
      utterance.rate = 0.9;
      utterance.volume = 1;
      utterance.lang = 'en-US';
      
      // Try to get English voice
      const speak = () => {
        const voices = window.speechSynthesis?.getVoices() || [];
        const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (englishVoice) utterance.voice = englishVoice;
        window.speechSynthesis?.speak(utterance);
      };
      
      if (window.speechSynthesis?.getVoices()?.length > 0) {
        speak();
      } else {
        window.speechSynthesis.onvoiceschanged = speak;
      }
    }
  }, [servingTickets, windows, soundEnabled]);

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
      <div className="flex flex-1">
        {/* Left Sidebar - Announcements - Full height with light orange */}
        <div className="w-60 bg-orange-100 text-gray-900 p-6 flex-shrink-0 hidden lg:block h-[calc(100vh-48px)]">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-400 pb-2 uppercase">
            <span>📋</span> Announcements
          </h3>
          <div className="space-y-3 text-sm">
            <p className="font-bold text-gray-900 border-b border-gray-400 pb-1">PERIODICAL EXAMINATIONS</p>
            <p><span className="text-gray-700">PRELIM - February 9-14, 2026</span></p>
            <p><span className="text-gray-700">MIDTERM - March 9-14, 2026</span></p>
            <p><span className="text-gray-700">SEMI-FINALS - April 6-11, 2026</span></p>
            <p><span className="text-gray-700">FINALS - May 4-9, 2026</span></p>
            <p className="font-bold text-gray-900 border-b border-gray-400 pb-1 mt-4">SCHEDULE</p>
            <p><span className="text-orange-600 font-semibold">Compliance week</span> <span className="text-gray-700">- May 11-16, 2026</span></p>
            <p><span className="text-orange-600 font-semibold">End of 2nd Semester</span> <span className="text-gray-700">- May 16, 2026</span></p>
            <p><span className="text-green-700 font-semibold">Release of Grades</span> <span className="text-gray-700">- June 15, 2026</span></p>
          </div>
        </div>

{/* Center - Main Window Cards */}
        <div className="flex-1 p-4">
          <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-2">NOW SERVING!</h2>
          <p className="text-orange-400 text-lg text-center italic mb-6">Please proceed to your serving window</p>
          {/* Now Serving Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {windows.map((window) => {
              const windowTicket = servingTickets.find(t => t.windowId === window.id);
              return (
                <div 
                  key={window.id} 
                  className="bg-white rounded-2xl p-6 text-gray-800 shadow-xl"
                >
                  <div className="bg-orange-500 text-white px-4 py-2 rounded-lg text-center font-bold text-lg mb-4">
                    {window.name}
                  </div>
                  <p className="text-6xl md:text-7xl font-black text-center mb-2">
                    {windowTicket?.ticketNumber || '---'}
                  </p>
                  <p className="text-orange-500 italic text-center text-xl font-semibold">
                    {windowTicket?.transactionTypeName || ''}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Next Serving Queues */}
          <div className="bg-white/20 rounded-2xl p-4 text-white">
            <h3 className="text-xl font-bold text-left mb-4 text-white">Next Serving Queues</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {windows.map((window) => {
                const windowTransactions = transactions.filter(t => t.windowNumber === window.number);
                const transaction = windowTransactions[0];
                if (!transaction) return null;
                return (
                  <div key={transaction.id} className="border-r border-white/30 last:border-r-0 pr-4 last:pr-0">
                    <h4 className="text-center font-bold text-orange-400 mb-2">{transaction.name}</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                      {getWaitingForTransaction(transaction.id).length > 0 ? (
                        getWaitingForTransaction(transaction.id).map((ticket) => (
                          <span 
                            key={ticket.id} 
                            className="bg-orange-500 text-white px-3 py-1 rounded font-bold"
                          >
                            {ticket.ticketNumber}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">No waiting</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Ticker */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-orange-500 text-blue-900 font-bold flex items-center overflow-hidden">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] px-4 text-lg md:text-xl">
          Welcome to ESCR! Please check the monitor for your queue number and proceed to your assigned window when called.
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