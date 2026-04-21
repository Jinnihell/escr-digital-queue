import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, Settings, LayoutGrid, MessageSquare, Calendar } from 'lucide-react';
import logo from '../assets/escr-logo.png';

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  helpContent?: React.ReactNode;
  showAdminNav?: boolean;
  showHelpButton?: boolean;
}

export default function Navbar({ title, showBackButton, onBack, helpContent, showAdminNav, showHelpButton = true }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, path: '/admin/dashboard' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, path: '/admin/appointments' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/admin/feedback' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

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
      <div className="fixed top-0 left-0 right-0 z-50 no-print">
        <div className="px-4 py-3 bg-red-600 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={onBack || (() => navigate(-1))}
                  className="flex items-center gap-2 text-white hover:text-blue-200 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <img 
                  src={logo} 
                  alt="ESCR Logo" 
                  className="w-14 h-14 object-contain bg-white/20 rounded-full p-1"
                />
                <div>
                  <h1 className="text-xl font-bold text-white">{title || 'ESCR DQMS'}</h1>
                  <p className="text-xs text-blue-200 hidden sm:block">East Systems Colleges of Rizal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showAdminNav && (
                <div className="hidden md:flex items-center gap-1">
                  {adminNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
<button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition border ${
                        isActive
                          ? 'bg-red-700 text-white border-red-500'
                          : 'text-white hover:bg-yellow-500 hover:border-yellow-400'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                    );
                  })}
                </div>
              )}
              {showHelpButton && (
                <button
                  onClick={() => setShowHelp(true)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
                >
                  ?
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-red-600" 
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