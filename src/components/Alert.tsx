import { useAlert } from '../context/useAlert';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function Alert() {
  const { alerts, removeAlert } = useAlert();

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2 max-w-md">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg animate-slide-in ${getAlertStyles(alert.type)}`}
          role="alert"
        >
          <div className="shrink-0">
            {getAlertIcon(alert.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{alert.message}</p>
          </div>
          <button
            onClick={() => removeAlert(alert.id)}
            className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
            aria-label="Close alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
