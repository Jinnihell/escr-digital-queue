import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToActiveTickets } from '../services/queueService';
import { Settings, BarChart3, Users, LayoutDashboard, LogOut, Monitor, ArrowRight, History } from 'lucide-react';

export default function AdminSelection() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeQueues, setActiveQueues] = useState(0);
  const [servingNow, setServingNow] = useState(0);
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToActiveTickets((tickets) => {
      const waitingCount = tickets.filter(t => t.status === 'waiting').length;
      const servingCount = tickets.filter(t => t.status === 'serving').length;
      
      setActiveQueues(waitingCount + servingCount);
      setWaiting(waitingCount);
      setServingNow(servingCount);
    });

    return () => unsubscribe();
  }, []);

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Manage queues and view status',
      color: 'bg-blue-500',
      action: () => navigate('/admin/dashboard')
    },
    {
      icon: BarChart3,
      label: 'Reports',
      description: 'View analytics and reports',
      color: 'bg-green-500',
      action: () => navigate('/admin/reports')
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Configure system settings',
      color: 'bg-gray-500',
      action: () => navigate('/admin/settings')
    },
    {
      icon: Monitor,
      label: 'Public Monitor',
      description: 'View public display',
      color: 'bg-purple-500',
      action: () => navigate('/monitor')
    },
    {
      icon: History,
      label: 'Queue History',
      description: 'View all ticket history',
      color: 'bg-orange-500',
      action: () => navigate('/history')
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login?message=logged_out');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/escr-logo.png" alt="ESCR Logo" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
                <p className="text-gray-500">Welcome, {user?.username}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-200 hover:transform hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4">
                <div className={`${item.color} p-3 rounded-lg text-white`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{item.label}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Overview</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">{activeQueues}</p>
              <p className="text-sm text-gray-500">Active Queues</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">{servingNow}</p>
              <p className="text-sm text-gray-500">Serving Now</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-yellow-600">{waiting}</p>
              <p className="text-sm text-gray-500">Waiting</p>
            </div>
          </div>
        </div>

        {/* Staff Access */}
        <div className="mt-4 bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={() => navigate('/window-selection')}
            className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <Users className="w-5 h-5" />
            Go to Staff Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* System Info */}
        <div className="mt-4 bg-white/50 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-sm">
            ESCR Digital Queueing System • East Systems College of Rizal
          </p>
        </div>
      </div>
    </div>
  );
}
