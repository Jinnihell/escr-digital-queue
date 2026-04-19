import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email);
      setMessage('Password reset link sent! Please check your email and click the link to reset your password.');
    } catch (err: unknown) {
      let errMessage = 'Failed to send reset email';
      
      if (err instanceof Error) {
        if (err.message.includes('user-not-found') || err.message.includes('no user record')) {
          errMessage = 'No account found with this email address';
        } else if (err.message.includes('invalid-email')) {
          errMessage = 'Invalid email address format';
        } else if (err.message.includes('too-many-requests')) {
          errMessage = 'Too many attempts. Please try again later';
        } else if (err.message.includes('network')) {
          errMessage = 'Network error. Please check your connection';
        } else {
          errMessage = err.message;
        }
      }
      
      setError(errMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-200 via-blue-100 to-blue-300 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <img 
              src="/escr-logo.png" 
              alt="ESCR Logo" 
              className="w-40 h-40 object-contain mx-auto mb-4 bg-white rounded-full p-4 shadow-lg"
            />
            <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-500 mt-1">Enter your email to receive a reset link</p>
          </div>

            {/* Message */}
            {message && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Email Sent Successfully!</span>
                </div>
                <p className="text-sm">{message}</p>
                <p className="text-xs mt-2 text-green-600">If you don't see the email, check your spam folder.</p>
              </div>
            )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter your registered email"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link to="/login" className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
