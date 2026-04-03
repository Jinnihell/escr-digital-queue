import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, GraduationCap, Clock } from 'lucide-react';
import type { Course, YearLevel } from '../types';

interface SelectedTransaction {
  id: string;
  name: string;
  prefix: string;
  priority: boolean;
}

// Course options from PHP system
const COURSES: Course[] = [
  'Senior High - Grade 11',
  'Senior High - Grade 12',
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
  'Senior High',
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
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Enter Your Details
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Transaction: <span className="font-semibold text-blue-600">{selectedTransaction.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Student Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Student ID (Optional) */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Student ID <span className="text-gray-500 text-sm">(Optional)</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter your student ID (if available)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Course */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value as Course)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
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
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Year Level <span className="text-red-500">*</span>
            </label>
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value as YearLevel)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              <option value="">Select your year level</option>
              {YEAR_LEVELS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Notice */}
          {selectedTransaction.priority && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-800 text-sm">
                <strong>Priority Queue:</strong> Your ticket will be marked as priority (Senior Citizen / PWD)
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl font-semibold text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-200"
          >
            Generate Ticket
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
