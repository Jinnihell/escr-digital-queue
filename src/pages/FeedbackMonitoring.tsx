import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToFeedback, type Feedback } from '../services/queueService';
import Navbar from '../components/Navbar';

export default function FeedbackMonitoring() {
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleBack = () => {
    navigate('/admin/dashboard');
  };

  useEffect(() => {
    const unsubscribe = subscribeToFeedback((feedback) => {
      setFeedbackList(feedback);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 pt-16">
      <Navbar title="Feedback Monitoring" showBackButton onBack={handleBack} showHelpButton={false} />

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Feedback</h2>

          {feedbackList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No feedback submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((feedback) => (
                <div key={feedback.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{feedback.userName}</p>
                      <p className="text-sm text-gray-500">
                        {feedback.transactionType && (
                          <span className="mr-3">Transaction: {feedback.transactionType}</span>
                        )}
                        {feedback.ticketNumber && (
                          <span>Ticket: {feedback.ticketNumber}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getRatingColor(feedback.rating)}`}>
                        {getRatingStars(feedback.rating)}
                      </p>
                      <p className="text-xs text-gray-400">{formatDateTime(feedback.createdAt)}</p>
                    </div>
                  </div>
                  {feedback.comment && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                      <p className="text-gray-600 text-sm">"{feedback.comment}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}