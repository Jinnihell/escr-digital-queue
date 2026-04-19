// User roles
export type UserRole = 'admin' | 'staff' | 'student';

// User model
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// Course options (from PHP system)
export type Course = 
  | 'Senior High - Grade 11'
  | 'Senior High - Grade 12'
  | 'Senior High - GAS'
  | 'Senior High - HUMSS'
  | 'Senior High - ICT'
  | 'Senior High - STEM'
  | 'BSBA'
  | 'BSAIS'
  | 'BSOA'
  | 'BSCS'
  | 'BSIT'
  | 'BTVTED ELEC'
  | 'BTVTED'
  | 'BSBA-FM'
  | 'BSBA-HM';

// Year level options
export type YearLevel = 
  | 'Senior High - Grade 11'
  | 'Senior High - Grade 12'
  | 'Senior High'
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '4th Year';

// Student details for ticket
export interface StudentDetails {
  name: string;
  studentId?: string;
  course: Course | '';
  yearLevel: YearLevel | '';
}

// Transaction types (services)
export interface TransactionType {
  id: string;
  name: string;
  description: string;
  code: string;
  prefix: string; // e.g., 'A' for Assessments, 'E' for Enrollment
  active: boolean;
  windowNumber: number; // which window handles this transaction
}

// Window/Serving station
export interface Window {
  id: string;
  name: string;
  number: number;
  active: boolean;
  currentTicketId: string | null;
  staffId: string | null; // Track which staff is using this window
  lockedAt: Date | null; // When the window was locked
}

// Queue ticket status
export type TicketStatus = 'waiting' | 'serving' | 'completed' | 'cancelled' | 'no_show';

// Queue ticket
export interface QueueTicket {
  id: string;
  ticketNumber: string;
  transactionTypeId: string;
  transactionTypeName: string;
  userId: string | null;
  // Student details
  studentName?: string;
  studentId?: string;
  course?: string;
  yearLevel?: string;
  // Status
  status: TicketStatus;
  createdAt: Date;
  calledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  windowId: string | null;
  windowName: string | null;
  waitTime: number; // in seconds
  serveTime: number; // in seconds
}

// Queue statistics
export interface QueueStats {
  totalTickets: number;
  waitingTickets: number;
  servingTickets: number;
  completedTickets: number;
  averageWaitTime: number;
  averageServeTime: number;
}

// Settings
export interface SystemSettings {
  systemName: string;
  resetTime: string;
  maxDailyTickets: number;
  enablePriority: boolean;
  enableNotifications: boolean;
  averageServiceTime: number;
  // Operating Hours
  operatingHours: {
    enabled: boolean;
    monday: { start: string; end: string };
    tuesday: { start: string; end: string };
    wednesday: { start: string; end: string };
    thursday: { start: string; end: string };
    friday: { start: string; end: string };
    saturday: { start: string; end: string };
    sunday: { start: string; end: string };
  };
  // In-App Alerts
  alerts: {
    enabled: boolean;
    announcerVoice: boolean;
    showAllWindows: boolean;
  };
  // Display Mode
  displayMode: 'standard' | 'compact' | 'large';
  // Queue Settings
  autoReset: boolean;
  autoResetTime: string;
  maxWaitTime: number;
  // Backup
  lastBackup: string | null;
}

// Report data
export interface DailyReport {
  date: string;
  totalServed: number;
  averageWaitTime: number;
  averageServeTime: number;
  transactions: {
    name: string;
    count: number;
    avgWaitTime: number;
    avgServeTime: number;
  }[];
}
