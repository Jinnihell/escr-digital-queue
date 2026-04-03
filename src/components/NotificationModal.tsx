import { useAlert } from '../context/useAlert';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function NotificationModal() {
  const { notifications, removeNotification } = useAlert();

  const getModalStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          icon: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-500',
          icon: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const getModalIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-600" />;
      case 'info':
        return <Info className="w-12 h-12 text-blue-600" />;
      default:
        return <Info className="w-12 h-12 text-gray-600" />;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => notifications.forEach(n => removeNotification(n.id))}
      />
      
      {/* Modals */}
      {notifications.map((notification, index) => {
        const styles = getModalStyles(notification.type);
        
        return (
          <div
            key={notification.id}
            className={`relative ${styles.bg} ${styles.border} border-2 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scale-in`}
            style={{ 
              zIndex: 51 + index,
              transform: `translateY(${index * 10}px)`
            }}
          >
            {/* Close button */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="mb-4">
                  {getModalIcon(notification.type)}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {notification.title}
                </h3>

                {/* Message */}
                <p className="text-gray-600 mb-6">
                  {notification.message}
                </p>

                {/* Action button */}
                <button
                  onClick={() => removeNotification(notification.id)}
                  className={`px-6 py-2 ${styles.button} text-white font-medium rounded-lg transition-colors`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
