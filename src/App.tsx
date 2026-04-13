import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Landing from './pages/Landing';
import TransactionSelection from './pages/TransactionSelection';
import StudentDetails from './pages/StudentDetails';
import DisplayTicket from './pages/DisplayTicket';
import AdminSelection from './pages/AdminSelection';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import PublicMonitor from './pages/PublicMonitor';
import History from './pages/History';
import WindowSelection from './pages/WindowSelection';
import FeedbackMonitoring from './pages/FeedbackMonitoring';
import ProtectedRoute from './components/ProtectedRoute';
import Alert from './components/Alert';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-blue-100 to-blue-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/monitor" element={<PublicMonitor />} />
      
      {/* Protected Routes - Students */}
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Landing />
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute allowedRoles={['student']}>
          <TransactionSelection />
        </ProtectedRoute>
      } />
      <Route path="/student-details" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDetails />
        </ProtectedRoute>
      } />
      <Route path="/ticket" element={
        <ProtectedRoute allowedRoles={['student']}>
          <DisplayTicket />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute allowedRoles={['student', 'admin', 'staff']}>
          <History />
        </ProtectedRoute>
      } />
      
      {/* Protected Routes - Admin */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSelection />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard tab="reports" />
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard tab="settings" />
        </ProtectedRoute>
      } />
      <Route path="/admin/transactions" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard tab="transactions" />
        </ProtectedRoute>
      } />
      <Route path="/admin/windows" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard tab="windows" />
        </ProtectedRoute>
      } />
      <Route path="/admin/feedback" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <FeedbackMonitoring />
        </ProtectedRoute>
      } />
      
      {/* Protected Routes - Staff */}
      <Route path="/window-selection" element={
        <ProtectedRoute allowedRoles={['staff', 'admin']}>
          <WindowSelection />
        </ProtectedRoute>
      } />
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles={['staff', 'admin']}>
          <StaffDashboard />
        </ProtectedRoute>
      } />
      
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AlertProvider>
          <Alert />
          <AppRoutes />
        </AlertProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
