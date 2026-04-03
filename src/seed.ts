// Seed script to populate Firestore with default data
// Run this script to initialize the database with default transactions and windows

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { firebaseConfig } from './firebase/config';

// Default transaction types from PHP system
const defaultTransactions = [
  {
    id: 'enrollment',
    name: 'Enrollment',
    description: 'New enrollments, subject enrollment',
    code: 'ENR',
    prefix: 'E',
    active: true,
    priority: false,
    windowNumber: 2
  },
  {
    id: 'assessments',
    name: 'Assessments',
    description: 'Assessment forms, evaluations',
    code: 'ASS',
    prefix: 'A',
    active: true,
    priority: true,
    windowNumber: 1
  },
  {
    id: 'payments',
    name: 'Payments',
    description: 'Tuition fees, other payments',
    code: 'PAY',
    prefix: 'P',
    active: true,
    priority: false,
    windowNumber: 3
  },
  {
    id: 'other',
    name: 'Other Concerns',
    description: 'Document requests, general inquiries',
    code: 'OTH',
    prefix: 'O',
    active: true,
    priority: false,
    windowNumber: 4
  }
];

// Default windows
const defaultWindows = [
  {
    id: 'window1',
    name: 'Assessments',
    number: 1,
    active: true,
    currentTicketId: null
  },
  {
    id: 'window2',
    name: 'Enrollment',
    number: 2,
    active: true,
    currentTicketId: null
  },
  {
    id: 'window3',
    name: 'Payments',
    number: 3,
    active: true,
    currentTicketId: null
  },
  {
    id: 'window4',
    name: 'Other Concerns',
    number: 4,
    active: true,
    currentTicketId: null
  }
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
  
  // Add transactions
  for (const transaction of defaultTransactions) {
    await setDoc(doc(db, 'transactions', transaction.id), transaction);
    console.log(`Added transaction: ${transaction.name}`);
  }
  
  console.log('Seeding windows...');
  
  // Add windows
  for (const window of defaultWindows) {
    await setDoc(doc(db, 'windows', window.id), window);
    console.log(`Added window: ${window.name}`);
  }
  
  console.log('Seeding settings...');
  
  // Add settings
  await setDoc(doc(db, 'settings', 'system'), defaultSettings);
  console.log('Added system settings');
  
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Default Transactions:');
  console.log('  - Enrollment (E001)');
  console.log('  - Assessments (A001)');
  console.log('  - Payments (P001)');
  console.log('  - Other Concerns (O001)');
  console.log('');
  console.log('Default Windows:');
  console.log('  - Window 1: Assessments');
  console.log('  - Window 2: Enrollment');
  console.log('  - Window 3: Payments');
  console.log('  - Window 4: Other Concerns');
}

// Run the seed function
seedDatabase().catch(console.error);
