import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from '../components/FeedbackModal';

// ESCR Landing Page - Matches MYPHPQUEUE landing.php design

export default function Landing() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Floating animation for logo
  const handleGetStarted = () => {
    if (user?.role === 'student') {
      navigate('/transactions');
    } else {
      navigate('/admin-selection');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300">
      {/* Help Button - matches PHP design */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={() => setShowHelp(true)}
          className="w-11 h-11 bg-white rounded-full flex items-center justify-center border-2 border-gray-800 shadow-lg hover:bg-gray-800 hover:text-white transition-all duration-300 animate-pulse"
        >
          <span className="font-bold text-lg">?</span>
        </button>
      </div>

      {/* Main Content - matches PHP gradient and layout */}
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* Logo with floating animation */}
        <div className="mb-6">
          <img 
            src="/escr-logo.png" 
            alt="ESCR Logo" 
            className="w-60 h-60 object-contain animate-bounce bg-white rounded-full  shadow-lg"
            style={{ animationDuration: '3s' }}
          />
        </div>

        {/* Title - matches PHP design */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 text-center mb-2 tracking-widest">
          ESCR
        </h1>
        <p className="text-gray-600 text-center mb-8 font-semibold tracking-widest uppercase text-sm md:text-base">
          Digital Queueing System
        </p>

        {/* Get Started Button - matches PHP design */}
        <button
          onClick={handleGetStarted}
          className="bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white text-xl font-semibold px-12 py-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
          Get Started
        </button>

        {/* About Button - matches PHP design */}
        <button
          onClick={() => setShowAbout(true)}
          className="mt-4 text-blue-800 hover:text-blue-600 flex items-center gap-2 font-semibold border-2 border-blue-800 px-6 py-2 rounded-full hover:bg-blue-50 transition"
        >
          About
        </button>
      </div>

      {/* Exit Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg transition"
        >
          <span className="text-sm font-semibold">Exit</span>
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
              <p>3. Select your transaction (Registrar or Cashier).</p>
              <p>4. Get your printed ticket.</p>
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 bg-gradient-to-r from-blue-800 to-blue-600 text-white py-2 rounded-xl font-semibold"
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
              className="w-full mt-4 bg-gradient-to-r from-blue-800 to-blue-600 text-white py-2 rounded-xl font-semibold"
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
    </div>
  );
}
