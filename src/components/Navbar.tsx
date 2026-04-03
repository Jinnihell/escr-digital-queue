import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  helpContent?: React.ReactNode;
}

export default function Navbar({ title, showBackButton, onBack, helpContent }: NavbarProps) {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const defaultHelpContent = (
    <div className="space-y-3 text-gray-600">
      <p>1. Click <b>Get Started</b> to begin.</p>
      <p>2. Select your transaction type.</p>
      <p>3. Enter your details and generate a ticket.</p>
      <p>4. Wait for your number to be called.</p>
      <p>5. Proceed to the assigned window.</p>
    </div>
  );

  return (
    <>
      <div className="w-full bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={onBack || (() => navigate(-1))}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <img 
                  src="/escr-logo.png" 
                  alt="ESCR Logo" 
                  className="w-12 h-12 object-contain bg-white rounded-full p-1"
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-800">{title || 'ESCR DQMS'}</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">East Systems Colleges of Rizal</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowHelp(true)}
              className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition shadow-md"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-blue-800" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Help</h2>
              <button 
                onClick={() => setShowHelp(false)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="mb-6">
              {helpContent || defaultHelpContent}
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="w-full bg-gradient-to-r from-blue-800 to-blue-600 text-white py-2 rounded-xl font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}