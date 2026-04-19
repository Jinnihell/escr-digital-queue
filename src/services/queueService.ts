import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  setDoc,
  increment,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import type { 
  QueueTicket, 
  TransactionType, 
  Window, 
  SystemSettings, 
  TicketStatus,
  QueueStats,
  StudentDetails
} from '../types';

// Collections
const TICKETS_COLLECTION = 'tickets';
const TRANSACTIONS_COLLECTION = 'transactions';
const WINDOWS_COLLECTION = 'windows';
const SETTINGS_COLLECTION = 'settings';
const COUNTERS_COLLECTION = 'counters';

// Helper to convert Firestore timestamp to Date
const toDate = (timestamp: Timestamp | Date | null | undefined): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return new Date(timestamp);
};

// Generate ticket number
export const generateTicketNumber = async (prefix: string): Promise<string> => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
  
  // Get or create daily counter with atomic increment to prevent duplicates
  const counterRef = doc(db, COUNTERS_COLLECTION, `${prefix}_${dateStr}`);
  
  try {
    // Use atomic increment to prevent race conditions
    const counterDoc = await getDoc(counterRef);
    let currentCount = 0;
    
    if (counterDoc.exists()) {
      currentCount = counterDoc.data().count || 0;
    } else {
      // Initialize counter with 0
      await setDoc(counterRef, { count: 0, date: dateStr, prefix });
    }
    
    // Use atomic increment for thread-safe counter
    await setDoc(counterRef, { count: increment(1) }, { merge: true });
    
    // Get the incremented value after update
    const updatedDoc = await getDoc(counterRef);
    const newCount = updatedDoc.data()?.count || currentCount + 1;
    
    // Format: X001 (e.g., A001, E001, P001, O001)
    return `${prefix}${newCount.toString().padStart(3, '0')}`;
  } catch (err) {
    console.error('Error generating ticket number:', err);
    throw err;
  }
};

// Get waiting tickets for a transaction type
export const getWaitingTickets = async (transactionTypeId: string): Promise<QueueTicket[]> => {
  // Use composite index for efficient query
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('transactionTypeId', '==', transactionTypeId),
    where('status', '==', 'waiting'),
    orderBy('createdAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    calledAt: toDate(doc.data().calledAt),
    startedAt: toDate(doc.data().startedAt),
    completedAt: toDate(doc.data().completedAt)
  })) as QueueTicket[];
};

// Get all active tickets (waiting + serving)
export const getActiveTickets = async (): Promise<QueueTicket[]> => {
  // Use composite index for efficient query
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', 'in', ['waiting', 'serving']),
    orderBy('status', 'desc'),
    orderBy('createdAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    calledAt: toDate(doc.data().calledAt),
    startedAt: toDate(doc.data().startedAt),
    completedAt: toDate(doc.data().completedAt)
  })) as QueueTicket[];
};

// Create new ticket
export const createTicket = async (
  transactionTypeId: string,
  transactionTypeName: string,
  prefix: string,
  isPriority: boolean = false,
  userId: string | null = null,
  studentDetails?: StudentDetails
): Promise<QueueTicket> => {
  const ticketNumber = await generateTicketNumber(prefix);
  
  // Build ticket data, only including defined student details
  const ticketData: Record<string, unknown> = {
    ticketNumber,
    transactionTypeId,
    transactionTypeName,
    userId: userId || null,
    status: 'waiting' as TicketStatus,
    priority: isPriority,
    createdAt: serverTimestamp(),
    calledAt: null,
    startedAt: null,
    completedAt: null,
    windowId: null,
    windowName: null,
    waitTime: 0,
    serveTime: 0
  };
  
  // Only add student details if provided
  if (studentDetails) {
    if (studentDetails.name) ticketData.studentName = studentDetails.name;
    if (studentDetails.studentId) ticketData.studentId = studentDetails.studentId;
    if (studentDetails.course) ticketData.course = studentDetails.course;
    if (studentDetails.yearLevel) ticketData.yearLevel = studentDetails.yearLevel;
  }
  
  const docRef = await addDoc(collection(db, TICKETS_COLLECTION), ticketData);
  
  return {
    id: docRef.id,
    ...ticketData,
    createdAt: new Date()
  } as QueueTicket;
};

// Call next ticket
export const callNextTicket = async (
  transactionTypeId: string,
  windowId: string,
  windowName: string
): Promise<QueueTicket | null> => {
  const waitingTickets = await getWaitingTickets(transactionTypeId);
  
  if (waitingTickets.length === 0) {
    return null;
  }
  
  const nextTicket = waitingTickets[0];
  
  // Update ticket to serving
  await updateDoc(doc(db, TICKETS_COLLECTION, nextTicket.id), {
    status: 'serving',
    calledAt: serverTimestamp(),
    windowId,
    windowName
  });
  
  // Update window
  await updateDoc(doc(db, WINDOWS_COLLECTION, windowId), {
    currentTicketId: nextTicket.id
  });
  
  return {
    ...nextTicket,
    status: 'serving',
    calledAt: new Date(),
    windowId,
    windowName
  };
};

// Complete ticket
export const completeTicket = async (ticketId: string): Promise<void> => {
  const ticketDoc = await getDoc(doc(db, TICKETS_COLLECTION, ticketId));
  
  if (!ticketDoc.exists()) return;
  
  const ticketData = ticketDoc.data();
  const completedAt = new Date();
  const startedAt = ticketData.startedAt?.toDate() || ticketData.calledAt?.toDate();
  const serveTime = startedAt ? Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000) : 0;
  
  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    serveTime
  });
  
  // Clear window if assigned
  if (ticketData.windowId) {
    await updateDoc(doc(db, WINDOWS_COLLECTION, ticketData.windowId), {
      currentTicketId: null
    });
  }
};

// Cancel ticket
export const cancelTicket = async (ticketId: string): Promise<void> => {
  const ticketDoc = await getDoc(doc(db, TICKETS_COLLECTION, ticketId));
  
  if (!ticketDoc.exists()) return;
  
  const ticketData = ticketDoc.data();
  
  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
    status: 'cancelled',
    completedAt: serverTimestamp()
  });
  
  // Clear window if assigned
  if (ticketData.windowId) {
    await updateDoc(doc(db, WINDOWS_COLLECTION, ticketData.windowId), {
      currentTicketId: null
    });
  }
};

// Get queue statistics
export const getQueueStats = async (transactionTypeId?: string): Promise<QueueStats> => {
  const ticketsRef = collection(db, TICKETS_COLLECTION);
  
  const waitingQuery = transactionTypeId
    ? query(ticketsRef, where('transactionTypeId', '==', transactionTypeId), where('status', '==', 'waiting'))
    : query(ticketsRef, where('status', '==', 'waiting'));
    
  const servingQuery = transactionTypeId
    ? query(ticketsRef, where('transactionTypeId', '==', transactionTypeId), where('status', '==', 'serving'))
    : query(ticketsRef, where('status', '==', 'serving'));
    
  const completedQ = transactionTypeId
    ? query(ticketsRef, where('transactionTypeId', '==', transactionTypeId), where('status', '==', 'completed'))
    : query(ticketsRef, where('status', '==', 'completed'));
  
  const [waitingSnap, servingSnap, completedSnap] = await Promise.all([
    getDocs(waitingQuery),
    getDocs(servingQuery),
    getDocs(completedQ)
  ]);
  
  const waitingTickets = waitingSnap.size;
  const servingTickets = servingSnap.size;
  const completedTickets = completedSnap.size;
  const totalTickets = waitingTickets + servingTickets + completedTickets;
  
  const completedDocs = completedSnap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => d.data().waitTime && d.data().serveTime);
  const completedWithTimes = completedDocs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data());
  
  const averageWaitTime = completedWithTimes.length > 0
    ? completedWithTimes.reduce((sum: number, t: DocumentData) => sum + (Number(t.waitTime) || 0), 0) / completedWithTimes.length
    : 0;
  const averageServeTime = completedWithTimes.length > 0
    ? completedWithTimes.reduce((sum: number, t: DocumentData) => sum + (Number(t.serveTime) || 0), 0) / completedWithTimes.length
    : 0;
  
  return {
    totalTickets,
    waitingTickets,
    servingTickets,
    completedTickets,
    averageWaitTime: Math.round(averageWaitTime),
    averageServeTime: Math.round(averageServeTime)
  };
};

// Get transaction types
export const getTransactionTypes = async (): Promise<TransactionType[]> => {
  const snapshot = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
  const transactions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TransactionType[];
  
  // Sort by name
  return transactions.sort((a, b) => {
    return (a.name || '').localeCompare(b.name || '');
  });
};

// Initialize default transactions if database is empty
export const initializeDefaultTransactions = async (): Promise<void> => {
  const existing = await getTransactionTypes();
  if (existing.length > 0) return;

  const defaultTransactions = [
    { name: 'Assessments', description: 'Assessment of fees and charges', code: 'ASSESS', prefix: 'A', windowNumber: 1 },
    { name: 'Enrollment', description: 'New enrollment and registration', code: 'ENROLL', prefix: 'E', windowNumber: 2 },
    { name: 'Payments', description: 'Payment of tuition and other fees', code: 'PAY', prefix: 'P', windowNumber: 3 },
    { name: 'Other Concerns', description: 'Other inquiries and concerns', code: 'OTHER', prefix: 'O', windowNumber: 4 }
  ];

  for (const t of defaultTransactions) {
    await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      ...t,
      active: true
    });
  }
};

// Initialize default windows if database is empty
export const initializeDefaultWindows = async (): Promise<void> => {
  const existing = await getWindows();
  if (existing.length > 0) return;

  const defaultWindows = [
    { name: 'Assessments', number: 1, active: true },
    { name: 'Enrollment', number: 2, active: true },
    { name: 'Payments', number: 3, active: true },
    { name: 'Other Concerns', number: 4, active: true }
  ];

  for (const w of defaultWindows) {
    await addDoc(collection(db, WINDOWS_COLLECTION), {
      ...w,
      currentTicketId: null,
      staffId: null,
      lockedAt: null
    });
  }
};

// Get windows
export const getWindows = async (): Promise<Window[]> => {
  const snapshot = await getDocs(query(collection(db, WINDOWS_COLLECTION), orderBy('number', 'asc')));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Window[];
};

// Get single window by ID
export const getWindowById = async (windowId: string): Promise<Window | null> => {
  const docRef = doc(db, WINDOWS_COLLECTION, windowId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Window;
  }
  return null;
};

// Subscribe to windows (real-time updates)
export const subscribeToWindows = (callback: (windows: Window[]) => void) => {
  const q = query(collection(db, WINDOWS_COLLECTION), orderBy('number', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const windows = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Window[];
    callback(windows);
  });
};

// Subscribe to transaction types (real-time updates)
export const subscribeToTransactionTypes = (callback: (transactions: TransactionType[]) => void) => {
  const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TransactionType[];
    callback(transactions);
  });
};

// Create transaction type
export const createTransactionType = async (
  name: string,
  description: string,
  code: string,
  prefix: string,
  windowNumber: number = 1
): Promise<TransactionType> => {
  const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
    name,
    description,
    code,
    prefix: prefix.toUpperCase(),
    active: true,
    windowNumber
  });
  
  return {
    id: docRef.id,
    name,
    description,
    code,
    prefix: prefix.toUpperCase(),
    active: true,
    windowNumber
  };
};

// Update transaction type
export const updateTransactionType = async (
  id: string,
  updates: Partial<TransactionType>
): Promise<void> => {
  await updateDoc(doc(db, TRANSACTIONS_COLLECTION, id), updates);
};

// Create window
export const createWindow = async (
  name: string,
  number: number
): Promise<Window> => {
  const docRef = await addDoc(collection(db, WINDOWS_COLLECTION), {
    name,
    number,
    active: true,
    currentTicketId: null,
    staffId: null,
    lockedAt: null
  });
  
  return {
    id: docRef.id,
    name,
    number,
    active: true,
    currentTicketId: null,
    staffId: null,
    lockedAt: null
  };
};

// Update window
export const updateWindow = async (
  id: string,
  updates: Partial<Window>
): Promise<void> => {
  await updateDoc(doc(db, WINDOWS_COLLECTION, id), updates);
};

// Lock window for staff
export const lockWindow = async (windowId: string, staffId: string): Promise<void> => {
  await updateDoc(doc(db, WINDOWS_COLLECTION, windowId), {
    staffId,
    lockedAt: serverTimestamp()
  });
};

// Unlock window (called on logout)
export const unlockWindow = async (windowId: string): Promise<void> => {
  await updateDoc(doc(db, WINDOWS_COLLECTION, windowId), {
    staffId: null,
    lockedAt: null
  });
};

// Get settings
export const getSettings = async (): Promise<SystemSettings> => {
  const docRef = doc(db, SETTINGS_COLLECTION, 'system');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      systemName: data.systemName || 'ESCR Digital Queueing System',
      resetTime: data.resetTime || '00:00',
      maxDailyTickets: data.maxDailyTickets || 100,
      enablePriority: data.enablePriority ?? true,
      enableNotifications: data.enableNotifications ?? true,
      averageServiceTime: data.averageServiceTime || 300,
      operatingHours: data.operatingHours ? {
        enabled: data.operatingHours.enabled ?? false,
        monday: data.operatingHours.monday || { start: '08:00', end: '17:00' },
        tuesday: data.operatingHours.tuesday || { start: '08:00', end: '17:00' },
        wednesday: data.operatingHours.wednesday || { start: '08:00', end: '17:00' },
        thursday: data.operatingHours.thursday || { start: '08:00', end: '17:00' },
        friday: data.operatingHours.friday || { start: '08:00', end: '17:00' },
        saturday: data.operatingHours.saturday || { start: '08:00', end: '12:00' },
        sunday: data.operatingHours.sunday || { start: '00:00', end: '00:00' }
      } : {
        enabled: false,
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
        saturday: { start: '08:00', end: '12:00' },
        sunday: { start: '00:00', end: '00:00' }
      },
      alerts: data.alerts ? {
        enabled: data.alerts.enabled ?? true,
        announcerVoice: data.alerts.announcerVoice ?? true,
        showAllWindows: data.alerts.showAllWindows ?? true
      } : {
        enabled: true,
        announcerVoice: true,
        showAllWindows: true
      },
      displayMode: data.displayMode || 'standard',
      autoReset: data.autoReset ?? false,
      autoResetTime: data.autoResetTime || '00:00',
      maxWaitTime: data.maxWaitTime || 3600,
      lastBackup: data.lastBackup || null
    };
  }
  
  // Return default settings
  return {
    systemName: 'ESCR Digital Queueing System',
    resetTime: '00:00',
    maxDailyTickets: 100,
    enablePriority: true,
    enableNotifications: true,
    averageServiceTime: 300,
    operatingHours: {
      enabled: false,
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '08:00', end: '17:00' },
      wednesday: { start: '08:00', end: '17:00' },
      thursday: { start: '08:00', end: '17:00' },
      friday: { start: '08:00', end: '17:00' },
      saturday: { start: '08:00', end: '12:00' },
      sunday: { start: '00:00', end: '00:00' }
    },
    alerts: {
      enabled: true,
      announcerVoice: true,
      showAllWindows: true
    },
    displayMode: 'standard',
    autoReset: false,
    autoResetTime: '00:00',
    maxWaitTime: 3600,
    lastBackup: null
  };
};

// Save settings
export const saveSettings = async (settings: SystemSettings): Promise<void> => {
  await setDoc(doc(db, SETTINGS_COLLECTION, 'system'), {
    ...settings,
    updatedAt: serverTimestamp()
  });
};

// Subscribe to active tickets (real-time)
export const subscribeToActiveTickets = (
  callback: (tickets: QueueTicket[]) => void
) => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', 'in', ['waiting', 'serving']),
    orderBy('status', 'desc'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      calledAt: toDate(doc.data().calledAt),
      startedAt: toDate(doc.data().startedAt),
      completedAt: toDate(doc.data().completedAt)
    })) as QueueTicket[];
    callback(tickets);
  });
};

// Subscribe to ALL tickets for real-time history/reports (including completed)
export const subscribeToAllTickets = (
  callback: (tickets: QueueTicket[]) => void
) => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      calledAt: toDate(doc.data().calledAt),
      startedAt: toDate(doc.data().startedAt),
      completedAt: toDate(doc.data().completedAt)
    })) as QueueTicket[];
    callback(tickets);
  });
};

// Reset queue (admin function)
export const resetQueue = async (): Promise<void> => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', 'in', ['waiting', 'serving'])
  );
  
  const snapshot = await getDocs(q);
  
  const updates = snapshot.docs.map(doc => 
    updateDoc(doc.ref, { status: 'cancelled', completedAt: serverTimestamp() })
  );
  
  await Promise.all(updates);
};

// Get all tickets (for history/reports)
export const getAllTickets = async (
  startDate?: Date,
  endDate?: Date,
  status?: TicketStatus
): Promise<QueueTicket[]> => {
  const q = query(collection(db, TICKETS_COLLECTION), orderBy('createdAt', 'desc'));
  
  const snapshot = await getDocs(q);
  let tickets = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    calledAt: toDate(doc.data().calledAt),
    startedAt: toDate(doc.data().startedAt),
    completedAt: toDate(doc.data().completedAt)
  })) as QueueTicket[];
  
  // Filter by status if provided
  if (status) {
    tickets = tickets.filter(t => t.status === status);
  }
  
  // Filter by date range if provided
  if (startDate) {
    tickets = tickets.filter(t => t.createdAt && t.createdAt >= startDate);
  }
  if (endDate) {
    tickets = tickets.filter(t => t.createdAt && t.createdAt <= endDate);
  }
  
  return tickets;
};

// Get tickets by transaction type
export const getTicketsByTransaction = async (transactionTypeId: string): Promise<QueueTicket[]> => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('transactionTypeId', '==', transactionTypeId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    calledAt: toDate(doc.data().calledAt),
    startedAt: toDate(doc.data().startedAt),
    completedAt: toDate(doc.data().completedAt)
  })) as QueueTicket[];
};

// Get active ticket for a specific user and transaction type
export const getUserActiveTicket = async (
  userId: string,
  transactionTypeId: string
): Promise<QueueTicket | null> => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('userId', '==', userId),
    where('transactionTypeId', '==', transactionTypeId),
    where('status', 'in', ['waiting', 'serving'])
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    calledAt: toDate(doc.data().calledAt),
    startedAt: toDate(doc.data().startedAt),
    completedAt: toDate(doc.data().completedAt)
  } as QueueTicket;
};

// Get all active tickets for a user
export const getUserActiveTickets = async (userId: string): Promise<QueueTicket[]> => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('userId', '==', userId),
    where('status', 'in', ['waiting', 'serving'])
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    calledAt: toDate(doc.data().calledAt),
    startedAt: toDate(doc.data().startedAt),
    completedAt: toDate(doc.data().completedAt)
  })) as QueueTicket[];
};

// Get tickets by window
export const getTicketsByWindow = async (windowId: string): Promise<QueueTicket[]> => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('windowId', '==', windowId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    calledAt: toDate(doc.data().calledAt),
    startedAt: toDate(doc.data().startedAt),
    completedAt: toDate(doc.data().completedAt)
  })) as QueueTicket[];
};

// Get history with filters (matches PHP history.php)
export const getHistoryWithFilters = async (
  startDate?: Date,
  endDate?: Date,
  windowId?: string,
  transactionTypeId?: string,
  search?: string
): Promise<QueueTicket[]> => {
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where('status', '==', 'completed'),
    orderBy('completedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  let tickets = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    calledAt: toDate(doc.data().calledAt),
    startedAt: toDate(doc.data().startedAt),
    completedAt: toDate(doc.data().completedAt)
  })) as QueueTicket[];
  
  // Apply filters
  if (startDate && endDate) {
    tickets = tickets.filter(t => 
      t.completedAt && t.completedAt >= startDate && t.completedAt <= endDate
    );
  }
  
  if (windowId) {
    tickets = tickets.filter(t => t.windowId === windowId);
  }
  
  if (transactionTypeId) {
    tickets = tickets.filter(t => t.transactionTypeId === transactionTypeId);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    tickets = tickets.filter(t => 
      t.studentName?.toLowerCase().includes(searchLower) ||
      t.ticketNumber?.toLowerCase().includes(searchLower)
    );
  }
  
  return tickets;
};

// Get report data (matches PHP admin_reports.php)
export const getReportData = async (
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalServed: number;
  averageWaitTime: number;
  averageServeTime: number;
  byTransaction: Record<string, { count: number; avgWait: number; avgServe: number }>;
  byWindow: Record<string, number>;
  hourlyData: number[];
}> => {
  const tickets = await getAllTickets(startDate, endDate, 'completed');
  
  const byTransaction: Record<string, { count: number; totalWait: number; totalServe: number }> = {};
  const byWindow: Record<string, number> = {};
  const hourlyData = Array(10).fill(0); // 8AM to 5PM
  
  let totalWait = 0;
  let totalServe = 0;
  
  tickets.forEach(ticket => {
    // By transaction type
    if (!byTransaction[ticket.transactionTypeName]) {
      byTransaction[ticket.transactionTypeName] = { count: 0, totalWait: 0, totalServe: 0 };
    }
    byTransaction[ticket.transactionTypeName].count++;
    byTransaction[ticket.transactionTypeName].totalWait += ticket.waitTime || 0;
    byTransaction[ticket.transactionTypeName].totalServe += ticket.serveTime || 0;
    
    // By window
    const windowName = ticket.windowName || 'Unknown';
    byWindow[windowName] = (byWindow[windowName] || 0) + 1;
    
    // By hour
    if (ticket.createdAt) {
      const hour = ticket.createdAt.getHours();
      const hourIndex = hour - 8;
      if (hourIndex >= 0 && hourIndex < 10) {
        hourlyData[hourIndex]++;
      }
    }
    
    totalWait += ticket.waitTime || 0;
    totalServe += ticket.serveTime || 0;
  });
  
  // Calculate averages
  const processedByTransaction: Record<string, { count: number; avgWait: number; avgServe: number }> = {};
  Object.entries(byTransaction).forEach(([key, data]) => {
    processedByTransaction[key] = {
      count: data.count,
      avgWait: data.count > 0 ? Math.round(data.totalWait / data.count) : 0,
      avgServe: data.count > 0 ? Math.round(data.totalServe / data.count) : 0
    };
  });
  
  return {
    totalServed: tickets.length,
    averageWaitTime: tickets.length > 0 ? Math.round(totalWait / tickets.length) : 0,
    averageServeTime: tickets.length > 0 ? Math.round(totalServe / tickets.length) : 0,
    byTransaction: processedByTransaction,
    byWindow,
    hourlyData
  };
};

// Feedback functions
const FEEDBACK_COLLECTION = 'feedback';

export interface Feedback {
  id: string;
  userId: string | null;
  userName: string;
  ticketNumber: string | null;
  transactionType: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export const getFeedback = async (): Promise<Feedback[]> => {
  const q = query(collection(db, FEEDBACK_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as Feedback[];
};

export const subscribeToFeedback = (callback: (feedback: Feedback[]) => void) => {
  const q = query(collection(db, FEEDBACK_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const feedback = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Feedback[];
    callback(feedback);
  });
};
