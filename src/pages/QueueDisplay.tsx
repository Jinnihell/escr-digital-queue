import { useState, useEffect } from 'react';
import { subscribeToActiveTickets, subscribeToWindows } from '../services/queueService';
import type { QueueTicket, Window } from '../types';

export default function QueueDisplay() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
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

  if (!dataLoaded || windows.length === 0) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-orange-400 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      {/* Header */}
      <div className="bg-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/escr-logo.png" alt="ESCR Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-bold">ESCR QUEUE DISPLAY</h1>
            <p className="text-orange-400 font-bold">{currentTime}</p>
          </div>
        </div>
      </div>

      {/* Windows Display - One by One */}
      <div className="p-4 space-y-6 pb-20">
        {windows.map((window) => {
          const servingTicket = tickets.find(t => t.status === 'serving' && t.windowId === window.id);
          const windowWaiting = tickets.filter(t => 
            t.status === 'waiting' && 
            t.transactionTypeId
          ).slice(0, 5);
          
          return (
            <div key={window.id} className="bg-white rounded-2xl overflow-hidden">
              {/* Window Header */}
              <div className="bg-blue-800 px-4 py-2 flex items-center justify-between">
                <span className="font-bold text-lg">Window {window.number}</span>
                <span className="text-orange-400 text-sm">{window.name}</span>
              </div>
              
              {/* Currently Serving */}
              <div className="p-6 text-center">
                <p className="text-gray-500 text-sm mb-2">NOW SERVING</p>
                <p className="text-6xl md:text-8xl font-black text-blue-900">
                  {servingTicket?.ticketNumber || '---'}
                </p>
                {servingTicket && (
                  <p className="text-orange-500 font-bold text-xl mt-2">
                    {servingTicket.transactionTypeName}
                  </p>
                )}
              </div>
              
              {/* Next in Queue */}
              <div className="bg-gray-100 px-4 py-3">
                <p className="text-gray-500 text-sm mb-2">NEXT IN QUEUE</p>
                <div className="flex flex-wrap gap-2">
                  {windowWaiting.length > 0 ? (
                    windowWaiting.map((ticket) => (
                      <span 
                        key={ticket.id} 
                        className="bg-blue-800 text-white px-3 py-1 rounded font-bold"
                      >
                        {ticket.ticketNumber}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400">No waiting</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-orange-500 text-blue-900 font-bold flex items-center justify-center">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] px-4">
          Welcome to East Systems Colleges of Rizal! Please proceed to your assigned window when your number is called.
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}