import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWindows } from '../services/queueService';
import { Monitor, ArrowRight } from 'lucide-react';
import type { Window as WindowType } from '../types';

export default function WindowSelection() {
  const navigate = useNavigate();
  const [windows, setWindows] = useState<WindowType[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWindows();
  }, []);

  const loadWindows = async () => {
    try {
      const data = await getWindows();
      // Only show active windows
      setWindows(data.filter(w => w.active));
    } catch (err) {
      console.error('Error loading windows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedWindow) return;

    const window = windows.find(w => w.id === selectedWindow);
    if (!window) return;

    // Store selected window in sessionStorage
    sessionStorage.setItem('selectedWindow', JSON.stringify({
      id: window.id,
      name: window.name,
      number: window.number
    }));

    navigate('/staff');
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
      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Select Your Window
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Choose the window you are assigned to
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
              {windows.map((window) => (
                <button
                  key={window.id}
                  onClick={() => setSelectedWindow(window.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                    selectedWindow === window.id
                      ? 'bg-blue-600 text-white shadow-lg transform scale-[1.02]'
                      : 'bg-white hover:bg-blue-50 text-gray-800 shadow'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedWindow === window.id
                        ? 'bg-white/20'
                        : 'bg-blue-100'
                    }`}>
                      <span className={`text-xl font-bold ${
                        selectedWindow === window.id
                          ? 'text-white'
                          : 'text-blue-600'
                      }`}>
                        {window.number}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{window.name}</p>
                      <p className={`text-sm ${
                        selectedWindow === window.id
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}>
                        Window {window.number}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!selectedWindow}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                selectedWindow
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Admin Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
