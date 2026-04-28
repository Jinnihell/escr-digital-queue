import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from '../components/FeedbackModal';
import QueueStatusModal from '../components/QueueStatusModal';
import { subscribeToActiveTickets } from '../services/queueService';
import type { QueueTicket } from '../types';

// ESCR Landing Page - Matches MYPHPQUEUE landing.php design

export default function Landing() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Queue status modal state
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<QueueTicket | null>(null);
  const [waitingPosition, setWaitingPosition] = useState(0);

  // Check for active ticket when feedback is submitted
  useEffect(() => {
    const message = searchParams.get('message');
    if ((message === 'feedback_submitted' || message === 'logged_out') && user?.id) {
      const unsubscribe = subscribeToActiveTickets((tickets) => {
        const userTicket = tickets.find(t => t.userId === user.id);
        if (userTicket) {
          setCurrentTicket(userTicket);
          const waitingTickets = tickets.filter(t => 
            t.transactionTypeId === userTicket.transactionTypeId && 
            t.status === 'waiting'
          );
          const userIndex = waitingTickets.findIndex(t => t.id === userTicket.id);
          const position = userIndex >= 0 ? userIndex + 1 : waitingTickets.length + 1;
          setWaitingPosition(position - 1);
          setShowQueueModal(true);
        } else {
          setShowQueueModal(false);
          setCurrentTicket(null);
        }
      });

      return () => unsubscribe();
    }
  }, [searchParams, user]);

  // Floating animation for logo
  const handleGetStarted = () => {
    if (user?.role === 'student') {
      navigate('/transactions');
    } else {
      navigate('/admin-selection');
    }
  };

  const handleAppointment = () => {
    navigate('/appointment');
  };

  const handleLogout = async () => {
    setShowFeedback(true);
  };

  const handleFeedbackClose = async () => {
    setShowFeedback(false);
    await logout();
    navigate('/login?message=logged_out');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300">
      {/* Help Button - matches PHP design */}
      <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
        <button 
          onClick={() => setShowHelp(true)}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center border-2 border-gray-800 shadow-lg hover:bg-gray-800 hover:text-white transition-all duration-300 animate-pulse"
        >
          <span className="font-bold text-lg">?</span>
        </button>
      </div>

      {/* Main Content - matches PHP gradient and layout */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Logo with floating animation */}
        <div className="mb-4 sm:mb-6">
          <img 
            src="/escr-logo.png" 
            alt="ESCR Logo" 
            className="w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60 object-contain animate-bounce bg-white rounded-full shadow-lg"
            style={{ animationDuration: '3s' }}
          />
        </div>

        {/* Title - matches PHP design */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-800 text-center mb-2 tracking-widest">
          ESCR
        </h1>
        <p className="text-gray-600 text-center mb-6 sm:mb-8 font-semibold tracking-widest uppercase text-xs sm:text-sm md:text-base">
          Digital Queueing System
        </p>

        {/* Get Started Button - matches PHP design */}
        <button
          onClick={handleGetStarted}
          className="w-full sm:w-auto bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white text-lg sm:text-xl font-semibold px-8 sm:px-12 py-3 sm:py-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
          Get Started
        </button>

        {/* Book Appointment Button */}
        <button
          onClick={handleAppointment}
          className="mt-3 sm:mt-4 w-full sm:w-auto bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white text-lg sm:text-xl font-semibold px-8 sm:px-12 py-3 sm:py-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
        >
          Book Appointment
        </button>

        {/* About Button - matches PHP design */}
        <button
          onClick={() => setShowAbout(true)}
          className="mt-3 sm:mt-4 text-blue-800 hover:text-blue-600 flex items-center justify-center gap-2 font-semibold border-2 border-blue-800 px-5 sm:px-6 py-2 rounded-full hover:bg-blue-50 transition"
        >
          About
        </button>
      </div>

      {/* Exit Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg transition text-base font-semibold"
        >
          Exit
        </button>
      </div>

      {/* Help Modal - matches PHP design */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-blue-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Quick Help</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-gray-700">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>1. Click the <b>Get Started</b> button.</p>
              <p>2. Login with your account.</p>
              <p>3. Select your transaction:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><b>Cashier</b> - for payments</li>
                <li><b>Information</b> - for inquiries and document requests</li>
                <li><b>Registrar</b> - for admissions, etc.</li>
              </ul>
              <p>4. Get your queue number ticket.</p>
              <p>5. Wait for your number to be called.</p>
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 bg-gradient-to-r from-red-700 to-red-500 text-white py-2 rounded-xl font-semibold"
            >
              I See
            </button>
          </div>
        </div>
      )}

      {/* About Modal - matches PHP design */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-blue-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">About DQMS</h2>
              <button onClick={() => setShowAbout(false)} className="text-gray-500 hover:text-gray-700">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="space-y-3 text-gray-600">
              <p>
                The ESCR Digital Queueing System was developed to modernize school operations by ensuring a faster, more systematic, and highly organized flow of transactions. By transitioning from manual lines to a digital framework, 
                the system significantly reduces wait times and minimizes campus congestion, allowing students, parents, and staff to complete their tasks with greater ease.
              </p>
            </div>
            <button 
              onClick={() => setShowAbout(false)}
              className="w-full mt-4 bg-gradient-to-r from-red-700 to-red-500 text-white py-2 rounded-xl font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <FeedbackModal
        isOpen={showFeedback}
        onClose={handleFeedbackClose}
      />

      <QueueStatusModal
        isOpen={showQueueModal && !!currentTicket}
        onClose={() => setShowQueueModal(false)}
        ticket={currentTicket}
        waitingPosition={waitingPosition}
      />
    </div>
  );
}
