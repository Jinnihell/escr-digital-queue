import { createContext, useState, useContext, type ReactNode } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  onClose?: () => void;
}

export interface AlertContextType {
  alerts: Alert[];
  notifications: Notification[];
  showAlert: (type: AlertType, message: string, duration?: number) => void;
  showNotification: (title: string, message: string, type: AlertType, onClose?: () => void) => void;
  removeAlert: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllAlerts: () => void;
  clearAllNotifications: () => void;
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

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

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
