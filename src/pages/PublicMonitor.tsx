import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { subscribeToActiveTickets, subscribeToWindows, subscribeToTransactionTypes } from '../services/queueService';
import type { QueueTicket, Window, TransactionType } from '../types';

export default function PublicMonitor() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
   const [soundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  const lastAnnouncedRef = useRef<string>('');
  const lastAnnouncedTimeRef = useRef<number>(0);
  const ANNOUNCE_COOLDOWN_MS = 5000;

  const servingTickets = useMemo(() => tickets.filter(t => t.status === 'serving'), [tickets]);
  const waitingTickets = useMemo(() => tickets.filter(t => t.status === 'waiting'), [tickets]);

  const servingTicketByWindowId = useMemo(() => {
    const map = new Map<string, QueueTicket>();
    servingTickets.forEach(t => { if (t.windowId) map.set(t.windowId, t); });
    return map;
  }, [servingTickets]);

  const waitingByTransaction = useMemo(() => {
    const map = new Map<string, QueueTicket[]>();
    waitingTickets.forEach(t => {
      const list = map.get(t.transactionTypeId) || [];
      list.push(t);
      map.set(t.transactionTypeId, list);
    });
    return map;
  }, [waitingTickets]);

  const activeWindowTransactions = useMemo(() => {
    return transactions
      .filter(t => t.active && t.windowNumber)
      .sort((a, b) => (a.windowNumber || 0) - (b.windowNumber || 0));
  }, [transactions]);

  const getWindowDisplayName = useCallback((window: Window) => `Window ${window.number}`, []);

  const getWaitingForTransaction = useCallback((transactionId: string) => {
    return (waitingByTransaction.get(transactionId) || []).slice(0, 4);
  }, [waitingByTransaction]);

  const speakTicket = useCallback((ticketNumber: string, windowNum: string, force: boolean = false) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    const key = `${ticketNumber}-${windowNum}`;
    const now = Date.now();
    if (!force && lastAnnouncedRef.current === key && (now - lastAnnouncedTimeRef.current) < ANNOUNCE_COOLDOWN_MS) return;
    lastAnnouncedRef.current = key;
    lastAnnouncedTimeRef.current = now;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Ticket ${ticketNumber}, please proceed to window ${windowNum}`);
    utterance.rate = 0.9; utterance.pitch = 1; utterance.volume = 1; utterance.lang = 'en-US';
    let resolved = false; let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const trySpeak = () => {
      if (resolved) return;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolved = true;
        const englishVoice = voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('en')) || voices[0];
        if (englishVoice) utterance.voice = englishVoice;
        window.speechSynthesis.onvoiceschanged = null;
        if (timeoutId) clearTimeout(timeoutId);
        window.speechSynthesis.speak(utterance);
      }
    };
    if (window.speechSynthesis.getVoices().length > 0) trySpeak();
    else {
      window.speechSynthesis.onvoiceschanged = trySpeak;
      timeoutId = setTimeout(() => { if (!resolved) { resolved = true; window.speechSynthesis.onvoiceschanged = null; window.speechSynthesis.speak(utterance); } }, 3000);
    }
  }, [soundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || window.AudioContext)();
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1000, audioContext.currentTime);
      gain1.gain.setValueAtTime(0, audioContext.currentTime);
      gain1.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 1);
      setTimeout(() => audioContext.close(), 1100);
    } catch { console.log('Audio not available'); }
  }, [soundEnabled]);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToTransactionTypes(setTransactions);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToWindows(windows => {
      setWindows(windows.filter(w => w.active));
          });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToActiveTickets(tickets => {
      setTickets(tickets);
          });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!soundEnabled || windows.length === 0 || servingTickets.length === 0) return;
    const latestTicket = servingTickets[0];
    const queueWindow = windows.find(w => w.id === latestTicket.windowId);
    const key = `${latestTicket.id}-${latestTicket.status}`;
    if (queueWindow && lastAnnouncedRef.current !== key) {
      speakTicket(latestTicket.ticketNumber, queueWindow.name || queueWindow.number.toString());
    }
  }, [servingTickets, windows, soundEnabled, speakTicket]);


  const handleRing = useCallback(() => {
    playNotificationSound();
    const latest = servingTickets[0];
    if (latest) {
      const queueWindow = windows.find(w => w.id === latest.windowId);
      if (queueWindow) {
        speakTicket(latest.ticketNumber, queueWindow.name || queueWindow.number.toString(), true);
      }
    }
  }, [servingTickets, windows, playNotificationSound, speakTicket]);


  return (
    <div className='min-h-screen bg-[#0a1628] text-white'>
      <div className='bg-[#0f2744] p-4'>
        <div className='flex items-center gap-4'>
          <img src='/escr-logo.png' alt='ESCR Logo' className='w-16 h-16 object-contain' />
          <div>
            <h1 className='text-2xl md:text-3xl font-serif font-bold'>ESCR QUEUE SYSTEM</h1>
            <p className='text-orange-400 font-mono text-lg'>{currentTime}</p>
          </div>
        </div>
      </div>

      <div className='flex flex-1'>
        <div className='flex-1 p-4'>
          <h2 className='text-3xl md:text-5xl font-black text-white text-center mb-2 animate-pulse'>NOW SERVING!</h2>
          <p className='text-orange-400 text-xl text-center italic mb-6 font-semibold'>Please proceed to your assigned window</p>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            {windows.map((window) => {
              const windowTicket = servingTicketByWindowId.get(window.id);
              const hasTicket = !!windowTicket?.ticketNumber;
              return (
                <div key={window.id} className={`bg-white rounded-3xl p-8 text-gray-800 shadow-2xl border-4 ${hasTicket ? 'border-orange-500 shadow-orange-500/50' : 'border-gray-300'}`}>
                  <div className={`${hasTicket ? 'bg-linear-to-r from-orange-500 to-orange-600' : 'bg-gray-400'} text-white px-6 py-3 rounded-xl text-center font-bold text-xl mb-6`}>
                    {getWindowDisplayName(window)}
                  </div>
                  <p className={`text-7xl md:text-8xl font-black text-center mb-4 ${hasTicket ? 'text-orange-600' : 'text-gray-400'}`}>
                    {windowTicket?.ticketNumber || '---'}
                  </p>
                  <p className='text-orange-500 italic text-center text-2xl font-bold'>{windowTicket?.transactionTypeName || ''}</p>
                </div>
              );
            })}
          </div>

          <div className='bg-white/20 rounded-2xl p-4 text-white'>
            <h3 className='text-xl font-bold text-left mb-4 text-white'>Next Serving Queues</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {activeWindowTransactions.map((transaction) => {
                const waitingList = getWaitingForTransaction(transaction.id);
                return (
                  <div key={transaction.id} className='border-r border-white/30 last:border-r-0 pr-4 last:pr-0'>
                    <div className='flex flex-wrap justify-center gap-2'>
                      {waitingList.length > 0 ? (
                        waitingList.map((ticket) => (
                          <span key={ticket.id} className='bg-orange-500 text-white px-3 py-1 rounded font-bold'>{ticket.ticketNumber}</span>
                        ))
                      ) : (
                        <span className='text-gray-400'>No waiting</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className='fixed bottom-0 left-0 right-0 h-14 bg-orange-500 text-blue-900 font-bold flex items-center overflow-hidden'>
        <div className='whitespace-nowrap animate-[marquee_30s_linear_infinite] px-4 text-lg md:text-xl'>
          📢 ANNOUNCEMENTS: PERIODICAL EXAMINATIONS - PRELIM (February 9-14, 2026), MIDTERM (March 9-14, 2026), SEMI-FINALS (April 6-11, 2026), FINALS (May 4-9, 2026) | SCHEDULE - Compliance week (May 11-16, 2026), End of 2nd Semester (May 16, 2026), Release of Grades (June 15, 2026) | Welcome to ESCR! Please check the monitor for your queue number and proceed to your assigned window when called.
        </div>
      </div>

      <button
        onClick={handleRing}
        className={`fixed top-4 right-4 p-3 rounded-full shadow-lg transition z-50 ${soundEnabled ? 'bg-green-500' : 'bg-gray-500'}`}
        aria-label={soundEnabled ? 'Mute' : 'Unmute'}
      >
        <span className='text-xl'>{soundEnabled ? '🔔' : '🔕'}</span>
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


