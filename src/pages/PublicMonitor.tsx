import { useState, useEffect } from 'react';
import { subscribeToActiveTickets, getWindows } from '../services/queueService';
import type { QueueTicket, Window } from '../types';

// Public Monitor - Matches MYPHPQUEUE public_monitor.php dark theme design

export default function PublicMonitor() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Announce serving tickets per window every minute
  useEffect(() => {
    const announceServingTickets = () => {
      if (!soundEnabled || windows.length === 0) return;
      
      // Get serving tickets from state
      const serving = tickets.filter(t => t.status === 'serving');
      
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
    };

    // Initial announcement after 3 seconds
    const initialTimer = setTimeout(announceServingTickets, 3000);
    
    // Then every 60 seconds
    const intervalId = setInterval(announceServingTickets, 60000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [tickets, windows, soundEnabled]);

  // Subscribe to real-time ticket updates
  useEffect(() => {
    const unsubscribe = subscribeToActiveTickets((updatedTickets) => {
      setTickets(updatedTickets);
    });

    return () => unsubscribe();
  }, []);

  // Load initial windows data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const windowList = await getWindows();
        setWindows(windowList);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const waitingTickets = tickets.filter(t => t.status === 'waiting');
  const servingTickets = tickets.filter(t => t.status === 'serving');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* LEFT SIDE: QUEUE CONTENT (55%) - matches PHP design */}
      <div className="w-[55%] p-4 flex flex-col">
        {/* Header */}
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-4 mb-4">
          <img src="/escr-logo.png" alt="ESCR Logo" className="w-20 h-20 object-contain bg-white rounded-full p-1" />
          <div>
            <h2 className="text-xl font-bold">ESCR QUEUE SYSTEM</h2>
            <p className="text-orange-400 font-bold">{currentTime}</p>
          </div>
        </div>

        {/* Window Cards Grid */}
        <div className="grid grid-cols-2 gap-4 flex-grow">
          {windows.map((window) => {
            const windowTicket = servingTickets.find(t => t.windowId === window.id);
            const windowDisplayName = `Window ${window.number}`;
            return (
              <div 
                key={window.id} 
                className={`bg-white rounded-2xl p-4 text-gray-800 flex flex-col items-center justify-center relative border-b-8 ${
                  windowTicket ? 'border-orange-500' : 'border-gray-300'
                }`}
              >
                <span className="absolute top-3 bg-blue-800 text-white px-4 py-1 rounded-lg font-bold">
                  {windowDisplayName}
                </span>
                <p className="text-6xl md:text-8xl font-black mt-8">
                  {windowTicket?.ticketNumber || '---'}
                </p>
                <p className="text-orange-500 font-bold text-lg">
                  {windowTicket?.transactionTypeName || ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* MIDDLE SIDE: WAITING QUEUES (20%) - matches PHP design */}
      <div className="w-[20%] bg-white border-l-4 border-blue-800 flex flex-col">
        <div className="text-center p-3 border-b-2 border-orange-500">
          <h3 className="text-2xl font-bold text-purple-900">Next in Line</h3>
          <p className="text-sm text-gray-600">Upcoming queue numbers</p>
        </div>
        <div className="flex-grow overflow-y-auto p-3">
          {waitingTickets.length > 0 ? (
            waitingTickets.slice(0, 10).map((ticket) => (
              <div 
                key={ticket.id}
                className="bg-blue-800 text-white p-3 rounded-lg text-center mb-2"
              >
                <span className="text-orange-400 font-bold text-2xl">{ticket.ticketNumber}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center p-4">No waiting</p>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: VIDEO SIDEBAR (25%) - matches PHP design */}
      <div className="w-[25%] bg-black border-l-4 border-orange-500 flex flex-col">
        {/* Video/Logo placeholder */}
        <div className="aspect-video bg-gradient-to-br from-blue-800 to-blue-600 flex flex-col items-center justify-center relative overflow-hidden">
          <img src="/escr-logo.png" alt="ESCR Logo" className="w-32 h-32 object-contain mb-4 animate-bounce bg-white rounded-full p-2" />
          <p className="text-xl font-bold">ESCR DQMS</p>
          <p className="text-sm text-gray-300">East Systems Colleges of Rizal</p>
          <p className="text-xs text-gray-500 mt-4">Digital Queue Management System</p>
          <div className="flex gap-4 mt-6">
            <div className="text-center">
              <span className="block text-2xl text-orange-400">⚖️</span>
              <p className="text-xs">Fair Queue</p>
            </div>
            <div className="text-center">
              <span className="block text-2xl text-orange-400">⏱️</span>
              <p className="text-xs">Fast Service</p>
            </div>
            <div className="text-center">
              <span className="block text-2xl text-orange-400">⭐</span>
              <p className="text-xs">Quality</p>
            </div>
          </div>
        </div>
        
        {/* Announcements - matches PHP design */}
        <div className="flex-grow bg-blue-800 p-4 border-t-4 border-orange-500 overflow-y-auto">
          <h3 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
            <span>📢</span> ESCR News
          </h3>
          <div className="space-y-2 text-sm">
            <p>• Enrollment for Mid-Year 2026 is now open.</p>
            <p>• Please prepare your Student ID and Assessment form.</p>
            <p>• Free WiFi is available in the student lounge.</p>
            <p>• Operating hours: 8:00 AM - 5:00 PM</p>
          </div>
        </div>
      </div>

      {/* Footer Ticker - matches PHP design */}
      <div className="fixed bottom-0 left-0 right-0 h-10 bg-orange-500 text-blue-900 font-bold flex items-center overflow-hidden">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          Welcome to East Systems Colleges of Rizal! Kindly check your queue number on the display monitor and proceed to your assigned window. Thank you!
        </div>
      </div>

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={`fixed top-4 right-4 p-3 rounded-full shadow-lg transition z-50 ${
          soundEnabled ? 'bg-green-500' : 'bg-gray-500'
        }`}
      >
        {soundEnabled ? '🔔' : '🔕'}
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
