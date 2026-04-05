import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWindows, lockWindow } from '../services/queueService';
import { ArrowRight, Lock, ArrowLeft, Monitor } from 'lucide-react';
import logo from '../assets/escr-logo.png';
import type { Window as WindowType } from '../types';

export default function WindowSelection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [windows, setWindows] = useState<WindowType[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    loadWindows();
  }, []);

  const loadWindows = async () => {
    try {
      const data = await getWindows();
      setWindows(data.filter(w => w.active));
    } catch (err) {
      console.error('Error loading windows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isWindowLocked = (window: WindowType) => {
    // Admin can access any window without being blocked
    if (user?.role === 'admin') return false;
    if (!window.staffId) return false;
    // Window is locked if it has a staffId and it's not the current user
    return window.staffId !== user?.id;
  };

  const handleWindowSelect = (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (!window || isWindowLocked(window)) return;
    setSelectedWindow(windowId);
  };

  const handleContinue = async () => {
    if (!selectedWindow || !user) return;

    const window = windows.find(w => w.id === selectedWindow);
    if (!window) return;

    setLocking(true);
    try {
      // Only lock window for staff, not for admin
      if (user.role !== 'admin') {
        await lockWindow(window.id, user.id);
      }

      // Store selected window in sessionStorage
      sessionStorage.setItem('selectedWindow', JSON.stringify({
        id: window.id,
        name: window.name,
        number: window.number
      }));

      navigate('/staff');
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLocking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading windows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 p-4">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-3 bg-gradient-to-r from-blue-800/90 to-blue-600/90 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-white hover:text-blue-200 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img 
                src={logo} 
                alt="ESCR Logo" 
                className="w-10 h-10 object-contain bg-white/20 rounded-full p-0.5"
              />
              <div>
                <h1 className="text-lg font-bold text-white">ESCR DQMS</h1>
                <p className="text-xs text-blue-200">East Systems Colleges of Rizal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto pt-20">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Select Window
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Choose your preferred serving window...
        </p>

        {windows.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No windows available</p>
            <p className="text-gray-500 text-sm">Please contact admin to set up windows</p>
          </div>
        ) : (
          <>
            {/* Window List */}
            <div className="space-y-3 mb-6">
              {windows.map((window) => {
                const locked = isWindowLocked(window);
                const isSelected = selectedWindow === window.id;

                return (
                  <button
                    key={window.id}
                    onClick={() => handleWindowSelect(window.id)}
                    disabled={locked}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                      locked
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                        : isSelected
                          ? 'bg-blue-600 text-white shadow-lg transform scale-[1.02]'
                          : 'bg-white hover:bg-[#000080] hover:text-white text-gray-800 shadow'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        locked
                          ? 'bg-gray-300'
                          : isSelected
                            ? 'bg-white/20'
                            : 'hover:bg-[#000080] bg-blue-100'
                      }`}>
                        {locked ? (
                          <Lock className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                        ) : (
                        <span className={`text-xl font-bold ${
                          isSelected
                            ? 'text-white'
                            : 'text-[#000080]'
                        }`}>
                            {window.number}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{window.name}</p>
                        <p className={`text-sm ${
                          locked
                            ? 'text-gray-400'
                            : isSelected
                              ? 'text-blue-100'
                              : 'text-gray-500'
                        }`}>
                          {locked ? 'In use by another staff' : `Window ${window.number}`}
                        </p>
                      </div>
                      {locked && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Locked</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!selectedWindow || locking}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                selectedWindow && !locking
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {locking ? 'Locking...' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Admin Link - only show for admins */}
        {user?.role === 'admin' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Go to Admin Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
