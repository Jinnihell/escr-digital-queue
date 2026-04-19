// Seed script to populate Firestore with default data
// Run this script to initialize the database with default transactions and windows

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { firebaseConfig } from './firebase/config';

// Default transaction types - matches queueService.ts initializeDefaultTransactions
const defaultTransactions = [
  { id: 'assessments', name: 'Assessments', description: 'Assessment of fees and charges', code: 'ASSESS', prefix: 'A', active: true, priority: false, windowNumber: 1 },
  { id: 'enrollment', name: 'Enrollment', description: 'New enrollment and registration', code: 'ENROLL', prefix: 'E', active: true, priority: false, windowNumber: 2 },
  { id: 'payments', name: 'Payments', description: 'Payment of tuition and other fees', code: 'PAY', prefix: 'P', active: true, priority: false, windowNumber: 3 },
  { id: 'other', name: 'Other Concerns', description: 'Other inquiries and concerns', code: 'OTHER', prefix: 'O', active: true, priority: false, windowNumber: 4 }
];

// Default windows - matches queueService.ts initializeDefaultWindows
const defaultWindows = [
  { id: 'window1', name: 'Assessments', number: 1, active: true, currentTicketId: null, staffId: null, lockedAt: null },
  { id: 'window2', name: 'Enrollment', number: 2, active: true, currentTicketId: null, staffId: null, lockedAt: null },
  { id: 'window3', name: 'Payments', number: 3, active: true, currentTicketId: null, staffId: null, lockedAt: null },
  { id: 'window4', name: 'Other Concerns', number: 4, active: true, currentTicketId: null, staffId: null, lockedAt: null }
];

// Default system settings
const defaultSettings = {
  systemName: 'ESCR Digital Queueing System',
  resetTime: '00:00',
  maxDailyTickets: 100,
  enablePriority: true,
  enableNotifications: true,
  averageServiceTime: 300
};

async function seedDatabase() {
  console.log('Initializing Firebase...');
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('Seeding transactions...');
  
  for (const t of defaultTransactions) {
    await setDoc(doc(db, 'transactions', t.id), t);
    console.log(`Added transaction: ${t.name}`);
  }
  
  console.log('Seeding windows...');
  
  for (const w of defaultWindows) {
    await setDoc(doc(db, 'windows', w.id), w);
    console.log(`Added window: ${w.name}`);
  }
  
  console.log('Seeding settings...');
  await setDoc(doc(db, 'settings', 'system'), defaultSettings);
  console.log('Added system settings');
  
  console.log('✅ Database seeded successfully!');
}

seedDatabase().catch(console.error);
