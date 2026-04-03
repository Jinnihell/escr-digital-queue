import { useState, type ReactNode } from 'react';
import { AlertContext, type Alert, type Notification, type AlertType } from './AlertContextDefinition';

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const showAlert = (type: AlertType, message: string, duration: number = 5000) => {
    const id = generateId();
    const newAlert: Alert = { id, type, message, duration };
    
    setAlerts(prev => [...prev, newAlert]);

    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
  };

  const showNotification = (title: string, message: string, type: AlertType, onClose?: () => void) => {
    const id = generateId();
    const newNotification: Notification = { id, title, message, type, onClose };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const removeNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification?.onClose) {
      notification.onClose();
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const clearAllNotifications = () => {
    notifications.forEach(notification => {
      if (notification.onClose) {
        notification.onClose();
      }
    });
    setNotifications([]);
  };

  return (
    <AlertContext.Provider value={{
      alerts,
      notifications,
      showAlert,
      showNotification,
      removeAlert,
      removeNotification,
      clearAllAlerts,
      clearAllNotifications
    }}>
      {children}
    </AlertContext.Provider>
  );
}
