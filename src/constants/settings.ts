// Default system settings
export const DEFAULT_SYSTEM_NAME = 'ESCR Digital Queueing System';
export const DEFAULT_RESET_TIME = '00:00';
export const DEFAULT_MAX_DAILY_TICKETS = 100;
export const DEFAULT_ENABLE_PRIORITY = true;
export const DEFAULT_ENABLE_NOTIFICATIONS = true;
export const DEFAULT_AVERAGE_SERVICE_TIME = 300;
export const DEFAULT_DISPLAY_MODE: 'standard' | 'compact' | 'large' = 'standard';
export const DEFAULT_AUTO_RESET = false;
export const DEFAULT_AUTO_RESET_TIME = '00:00';
export const DEFAULT_MAX_WAIT_TIME = 3600;

export const DEFAULT_OPERATING_HOURS = {
  enabled: false,
  monday: { start: '08:00', end: '17:00' },
  tuesday: { start: '08:00', end: '17:00' },
  wednesday: { start: '08:00', end: '17:00' },
  thursday: { start: '08:00', end: '17:00' },
  friday: { start: '08:00', end: '17:00' },
  saturday: { start: '08:00', end: '12:00' },
  sunday: { start: '00:00', end: '00:00' }
};

export const DEFAULT_ALERTS = {
  enabled: true,
  announcerVoice: true,
  showAllWindows: true
};

export const getDefaultSettings = () => ({
  systemName: DEFAULT_SYSTEM_NAME,
  resetTime: DEFAULT_RESET_TIME,
  maxDailyTickets: DEFAULT_MAX_DAILY_TICKETS,
  enablePriority: DEFAULT_ENABLE_PRIORITY,
  enableNotifications: DEFAULT_ENABLE_NOTIFICATIONS,
  averageServiceTime: DEFAULT_AVERAGE_SERVICE_TIME,
  operatingHours: DEFAULT_OPERATING_HOURS,
  alerts: DEFAULT_ALERTS,
  displayMode: DEFAULT_DISPLAY_MODE,
  autoReset: DEFAULT_AUTO_RESET,
  autoResetTime: DEFAULT_AUTO_RESET_TIME,
  maxWaitTime: DEFAULT_MAX_WAIT_TIME,
  lastBackup: null
});
