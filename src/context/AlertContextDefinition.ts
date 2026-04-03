import { createContext } from 'react';

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
