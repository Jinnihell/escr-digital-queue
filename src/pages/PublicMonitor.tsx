import { useState, useEffect, useRef } from 'react';
import { subscribeToActiveTickets, subscribeToWindows } from '../services/queueService';
import type { QueueTicket, Window } from '../types';

// Public Monitor - Matches MYPHPQUEUE public_monitor.php dark theme design

export default function PublicMonitor() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const lastAnnouncedRef = useRef<string>('');

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Announce serving tickets when they change - real-time
  useEffect(() => {
    if (!soundEnabled || windows.length === 0) return;
    
    const serving = tickets.filter(t => t.status === 'serving');
    
    // Get current serving tickets as a string for comparison
    const currentServingStr = serving.map(t => `${t.ticketNumber}-${t.windowId}`).join(',');
    
    // Only announce if there's a change
    if (currentServingStr !== lastAnnouncedRef.current && serving.length > 0) {
      lastAnnouncedRef.current = currentServingStr;
      
      // Get the first serving ticket for each window
      const windowsWithTickets = windows.map(w => {
        const ticket = serving.find(t => t.windowId === w.id);
        return ticket ? { windowNumber: w.number, windowName: w.name, ticketNumber: ticket.ticketNumber } : null;
      }).filter(Boolean);
      
      if (windowsWithTickets.length === 0) return;
      
      // Build announcement for all serving tickets
      let announcement = '';
      windowsWithTickets.forEach((w, idx) => {
        if (idx > 0) announcement += '. ';
        announcement += `Queue ticket ${w?.ticketNumber}, please proceed to window ${w?.windowNumber}`;
      });
      
      if (announcement && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(announcement);
        utterance.rate = 0.9;
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
    }
    
    // If no serving tickets, reset the ref so it can announce again when new ticket is called
    if (serving.length === 0) {
      lastAnnouncedRef.current = '';
    }
  }, [tickets, windows, soundEnabled]);

  // Subscribe to real-time ticket updates
  useEffect(() => {
    const unsubscribeTickets = subscribeToActiveTickets((updatedTickets) => {
      setTickets(updatedTickets);
      // Mark as loaded after first update
      setDataLoaded(true);
    });

    return () => unsubscribeTickets();
  }, []);

  // Subscribe to real-time window updates
  useEffect(() => {
    const unsubscribeWindows = subscribeToWindows((updatedWindows) => {
      setWindows(updatedWindows.filter(w => w.active));
      // Mark as loaded after first update
      setDataLoaded(true);
    });

    return () => unsubscribeWindows();
  }, []);

  const waitingTickets = tickets.filter(t => t.status === 'waiting');
  const servingTickets = tickets.filter(t => t.status === 'serving');

  if (!dataLoaded || windows.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-orange-400 font-bold">Loading queue system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header - Bigger fonts */}
      <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4 mb-3">
        <img src="/escr-logo.png" alt="ESCR Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain bg-white rounded-full p-1" />
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">ESCR QUEUE SYSTEM</h2>
          <p className="text-orange-400 font-bold text-lg sm:text-xl">{currentTime}</p>
        </div>
      </div>

      {/* Main Content - Stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col md:flex-row flex-grow gap-2 sm:gap-4 pb-16 md:pb-14">
        
        {/* Window Cards - Full width on mobile */}
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-grow">
            {windows.map((window) => {
              const windowTicket = servingTickets.find(t => t.windowId === window.id);
              const windowDisplayName = `Window ${window.number}`;
              return (
                <div 
                  key={window.id} 
                  className={`bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 text-gray-800 flex flex-col items-center justify-center relative border-b-4 sm:border-b-8 ${
                    windowTicket ? 'border-orange-500' : 'border-gray-300'
                  }`}
                >
                  <span className="absolute top-1 sm:top-3 bg-blue-800 text-white px-2 sm:px-4 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-bold">
                    {windowDisplayName}
                  </span>
                  <p className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-black mt-6 sm:mt-8">
                    {windowTicket?.ticketNumber || '---'}
                  </p>
                  <p className="text-orange-500 font-bold text-xs sm:text-lg">
                    {windowTicket?.transactionTypeName || ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Waiting Queue - Hidden on small mobile, visible on md+ */}
        <div className="hidden md:flex w-full md:w-[20%] bg-white border-l-4 border-blue-800 flex-col">
          <div className="text-center p-2 sm:p-3 border-b-2 border-orange-500">
            <h3 className="text-lg sm:text-2xl font-bold text-purple-900">Next in Line</h3>
            <p className="text-xs sm:text-sm text-gray-600">Upcoming</p>
          </div>
          <div className="flex-grow overflow-y-auto p-2 sm:p-3">
            {waitingTickets.length > 0 ? (
              waitingTickets.slice(0, 10).map((ticket) => (
                <div 
                  key={ticket.id}
                  className="bg-blue-800 text-white p-2 sm:p-3 rounded-lg text-center mb-1 sm:mb-2"
                >
                  <span className="text-orange-400 font-bold text-lg sm:text-2xl">{ticket.ticketNumber}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center p-2 sm:p-4 text-sm">No waiting</p>
            )}
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile */}
        <div className="hidden lg:flex w-[25%] bg-black border-l-4 border-orange-500 flex-col">
          <div className="aspect-video bg-gradient-to-br from-blue-800 to-blue-600 flex flex-col items-center justify-center relative overflow-hidden p-4">
            <img src="/escr-logo.png" alt="ESCR Logo" className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-2 sm:mb-4 animate-bounce bg-white rounded-full p-1 sm:p-2" />
            <p className="text-lg sm:text-xl font-bold">ESCR DQMS</p>
            <p className="text-xs sm:text-sm text-gray-300">East Systems Colleges</p>
            <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-4">
              <div className="text-center">
                <span className="block text-xl sm:text-2xl">⚖️</span>
                <p className="text-xs">Fair</p>
              </div>
              <div className="text-center">
                <span className="block text-xl sm:text-2xl">⏱️</span>
                <p className="text-xs">Fast</p>
              </div>
              <div className="text-center">
                <span className="block text-xl sm:text-2xl">⭐</span>
                <p className="text-xs">Quality</p>
              </div>
            </div>
          </div>
          
          <div className="flex-grow bg-blue-800 p-3 sm:p-4 border-t-4 border-orange-500 overflow-y-auto">
            <h3 className="text-orange-400 font-bold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <span>📢</span> ESCR News
            </h3>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <p>• Enrollment for Mid-Year 2026 is open.</p>
              <p>• Prepare your Student ID.</p>
              <p>• Free WiFi in student lounge.</p>
              <p>• Hours: 8AM - 5PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Only: Simple Queue List */}
      <div className="md:hidden bg-white text-gray-800 p-3 border-t-4 border-blue-800">
        <h3 className="font-bold text-purple-900 text-center mb-2">Waiting Queue</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {waitingTickets.slice(0, 6).map((ticket) => (
            <span key={ticket.id} className="bg-blue-800 text-white px-3 py-1 rounded text-sm font-bold">
              {ticket.ticketNumber}
            </span>
          ))}
          {waitingTickets.length === 0 && <p className="text-gray-400 text-sm">No waiting</p>}
        </div>
      </div>

      {/* Footer Ticker - Bigger fonts */}
      <div className="fixed bottom-0 left-0 right-0 h-12 sm:h-14 bg-orange-500 text-blue-900 font-bold flex items-center overflow-hidden">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] px-4 text-base sm:text-lg md:text-xl">
          Welcome to East Systems Colleges of Rizal! Check your queue number on the display monitor and proceed to your assigned window. Thank you!
        </div>
      </div>

      {/* Sound Toggle - Smaller on mobile */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={`fixed top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-3 rounded-full shadow-lg transition z-50 ${
          soundEnabled ? 'bg-green-500' : 'bg-gray-500'
        }`}
      >
        <span className="text-lg sm:text-xl">{soundEnabled ? '🔔' : '🔕'}</span>
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
