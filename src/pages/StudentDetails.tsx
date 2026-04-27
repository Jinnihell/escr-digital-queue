import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, GraduationCap, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import type { Course, YearLevel } from '../types';

interface SelectedTransaction {
  id: string;
  name: string;
  prefix: string;
}

// Course options from PHP system
const COURSES: Course[] = [
  'Senior High - GAS',
  'Senior High - HUMSS',
  'Senior High - ICT',
  'Senior High - STEM',
  'BSBA',
  'BSAIS',
  'BSOA',
  'BSCS',
  'BSIT',
  'BTVTED ELEC',
  'BTVTED',
  'BSBA-FM',
  'BSBA-HM'
];

// Year level options from PHP system
const YEAR_LEVELS: YearLevel[] = [
  'Senior High - Grade 11',
  'Senior High - Grade 12', 
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year'
];

export default function StudentDetails() {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState<Course | ''>('');
  const [yearLevel, setYearLevel] = useState<YearLevel | ''>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!course) {
      setError('Please select your course');
      return;
    }
    
    if (!yearLevel) {
      setError('Please select your year level');
      return;
    }

    // Store student details
    sessionStorage.setItem('studentDetails', JSON.stringify({
      name: studentName.trim(),
      studentId: studentId.trim() || undefined,
      course,
      yearLevel
    }));
    
    navigate('/ticket');
  };

  const handleBack = () => {
    navigate('/transactions');
  };

  // Get transaction info from session
  const stored = sessionStorage.getItem('selectedTransaction');
  if (!stored) {
    navigate('/transactions');
    return null;
  }

  const selectedTransaction: SelectedTransaction = JSON.parse(stored);

  return (
    <div className="min-h-screen bg-linear-to-br from-green-200 via-blue-100 to-blue-300 pt-16">
      <Navbar 
        title="Student Details" 
        showBackButton 
        onBack={handleBack}
        helpContent={
          <div className="space-y-3 text-gray-600">
            <p>1. Enter your <b>full name</b> as it appears on your enrollment.</p>
            <p>2. Enter your <b>Student ID</b> (optional if not yet issued).</p>
            <p>3. Select your <b>course</b> from the dropdown.</p>
            <p>4. Select your <b>year level</b>.</p>
            <p>5. Click <b>Generate Ticket</b> to get your queue number.</p>
          </div>
        }
      />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-3 sm:p-4 pt-16 sm:pt-20">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800 text-center mb-3">
         📌 Student Details
        </h1>
        <p className="text-gray-600 text-center mb-4 text-xs sm:text-sm">
        Kindly enter your details to generate your queue ticket for the selected transaction.
        </p>
        <p className="text-gray-600 text-center mb-4 text-xs sm:text-sm">
          Transaction: <span className="font-semibold text-blue-600">{selectedTransaction.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-3 sm:p-4">
          {error && (
            <div className="mb-3 sm:mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Student Name */}
          <div className="mb-2 sm:mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              <User className="w-3 h-3 inline mr-1" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm sm:text-base"
            />
          </div>

          {/* Student ID (Optional) */}
          <div className="mb-2 sm:mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              Student ID <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter your student ID (if available)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
            />
          </div>

          {/* Course */}
          <div className="mb-2 sm:mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              <GraduationCap className="w-3 h-3 inline mr-1" />
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value as Course)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-sm"
            >
              <option value="">Select your course</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Year Level */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">
              <Clock className="w-3 h-3 inline mr-1" />
              Year Level <span className="text-red-500">*</span>
            </label>
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value as YearLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-sm"
            >
              <option value="">Select your year level</option>
              {YEAR_LEVELS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-sm bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-200"
          >
            Generate Ticket
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
