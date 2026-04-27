import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToActiveTickets } from '../services/queueService';
import { Settings, BarChart3, Users, LayoutDashboard, LogOut, Monitor, ArrowRight } from 'lucide-react';
import logo from '../assets/escr-logo.png';

export default function AdminSelection() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ waiting: 0, serving: 0, completed: 0 });

  useEffect(() => {
    const unsubscribe = subscribeToActiveTickets((tickets) => {
      setStats({
        waiting: tickets.filter(t => t.status === 'waiting').length,
        serving: tickets.filter(t => t.status === 'serving').length,
        completed: tickets.filter(t => t.status === 'completed').length
      });
    });
    return () => unsubscribe();
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', description: 'View queue statistics and reports', color: 'bg-blue-600', action: () => navigate('/admin/dashboard') },
    { icon: BarChart3, label: 'Reports', description: 'Generate and view detailed reports', color: 'bg-green-600', action: () => navigate('/admin/reports') },
    { icon: Settings, label: 'Settings', description: 'Manage windows and transactions', color: 'bg-gray-600', action: () => navigate('/admin/settings') },
    { icon: Monitor, label: 'Public Display', description: 'View the public monitor', color: 'bg-purple-600', action: () => navigate('/monitor') }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login?message=logged_out');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-3 bg-emerald-700 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="ESCR Logo" className="w-14 h-14 object-contain bg-white/20 rounded-full p-1" />
              <div>
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-xs text-emerald-200">East Systems Colleges of Rizal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-white hidden sm:block">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-emerald-200">Admin</p>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 text-white hover:text-red-300 transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item, index) => (
              <button key={index} onClick={item.action} className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-all hover:scale-[1.02]">
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

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Overview</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{stats.waiting + stats.serving}</p>
                <p className="text-sm text-gray-500">Active Queues</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{stats.serving}</p>
                <p className="text-sm text-gray-500">Serving Now</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
                <p className="text-sm text-gray-500">Waiting</p>
              </div>
            </div>
          </div>

          {/* Staff */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <button onClick={() => navigate('/window-selection')} className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
              <Users className="w-5 h-5" />
              Go to Staff Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
