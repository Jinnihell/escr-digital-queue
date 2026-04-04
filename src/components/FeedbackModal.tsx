import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber?: string;
  transactionType?: string;
}

export default function FeedbackModal({ isOpen, onClose, ticketNumber, transactionType }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
      setIsSubmitted(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const storedUser = sessionStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      const feedbackData = {
        userId: user?.id || null,
        userName: user?.username || 'Guest',
        ticketNumber: ticketNumber || null,
        transactionType: transactionType || null,
        rating: Number(rating),
        comment: comment.trim() || null,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
      
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error saving feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to save feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setComment('');
    setIsSubmitted(false);
    setError('');
    onClose();
  };

  const handleDone = () => {
    setRating(0);
    setComment('');
    setIsSubmitted(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {isSubmitted ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-green-600">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">Your feedback helps us improve our service.</p>
            <button
              onClick={handleDone}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white">
              <h2 className="text-xl font-bold">Feedback</h2>
              <p className="text-blue-100 text-sm">How was your experience?</p>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <p className="block text-gray-700 font-medium mb-3">
                  Rate your experience
                </p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        setError('');
                      }}
                      className="text-5xl transition-transform hover:scale-125 focus:outline-none p-1"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {star <= rating ? (
                        <span style={{ color: '#FBBF24' }}>★</span>
                      ) : (
                        <span style={{ color: '#D1D5DB' }}>★</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-3">
                  {rating === 1 && 'Very Poor'}
                  {rating === 2 && 'Poor'}
                  {rating === 3 && 'Average'}
                  {rating === 4 && 'Good'}
                  {rating === 5 && 'Excellent'}
                  {rating === 0 && 'Tap to rate'}
                </p>
              </div>

              <div className="mb-6">
                <p className="block text-gray-700 font-medium mb-2">
                  Additional comments <span className="text-gray-400 font-normal">(optional)</span>
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px' }}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition"
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '12px',
                    backgroundColor: rating === 0 || isSubmitting ? '#9CA3AF' : '#2563EB',
                    cursor: rating === 0 || isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}