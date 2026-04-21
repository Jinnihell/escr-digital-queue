import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import Navbar from '../components/Navbar';
import { 
  getAvailableDates, 
  getTransactionTypes, 
  createAppointment,
  subscribeToAppointments
} from '../services/queueService';
import type { TransactionType, Appointment } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';

export default function AppointmentBooking() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [currentAppointments, setCurrentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [course, setCourse] = useState('');
  const [yearLevel, setYearLevel] = useState('');

  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToAppointments((appointments) => {
      setCurrentAppointments(appointments);
    });
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      const [trans, dates] = await Promise.all([
        getTransactionTypes(),
        getAvailableDates()
      ]);
      console.log('Available dates:', dates);
      setTransactions(trans.filter(t => t.active));
      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      showAlert('error', 'Failed to load available dates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      setSelectedTime('');
    }
  }, [selectedDate]);

  const handleBooking = async () => {
    console.log('Selected:', { selectedTransaction, selectedDate, selectedTime, studentName, course, yearLevel });
    
    if (!selectedTransaction) {
      showAlert('error', 'Please select a transaction type');
      return;
    }
    if (!selectedDate) {
      showAlert('error', 'Please select a date');
      return;
    }
    if (!selectedTime) {
      showAlert('error', 'Please select a time (Morning or Afternoon)');
      return;
    }
    if (!studentName.trim()) {
      showAlert('error', 'Please enter your name');
      return;
    }
    if (!course) {
      showAlert('error', 'Please select your course');
      return;
    }
    if (!yearLevel) {
      showAlert('error', 'Please select your year level');
      return;
    }

    setBooking(true);
    try {
      const result = await createAppointment(
        studentName,
        selectedTransaction.id,
        selectedTransaction.name,
        selectedDate,
        selectedTime,
        user?.id || null,
        {
          studentId: studentId || undefined,
          course: course || undefined,
          yearLevel: yearLevel || undefined,
          email: email || undefined,
          phone: ''
        },
        notes || undefined
      );
      console.log('Appointment created:', result);
      showAlert('success', 'Appointment booked successfully!');
      navigate('/');
    } catch (err) {
      console.error('Booking error:', err);
      showAlert('error', 'Failed to book appointment. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = formatDate(date);
    return availableDates.includes(dateStr);
  };

  const formatTime = (time: string) => {
    if (time === 'Morning') return 'Morning (8:00 AM - 12:00 PM)';
    if (time === 'Afternoon') return 'Afternoon (1:00 PM - 5:00 PM)';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-blue-100 to-blue-300">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-blue-100 to-blue-300">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg bg-white/80 hover:bg-white transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">APPOINTMENT DETAILS</h1>
        </div>

        <p className="text-gray-600 mb-4">Please select your preferred date and time for your appointment</p>

        

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Date
              </h2>
              
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium text-gray-700">
                  {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="font-medium text-gray-500 py-2">{day}</div>
                ))}
                {getDaysInMonth(viewMonth).map((date, idx) => (
                  <div key={idx}>
                    {date ? (
                      <button
                        onClick={() => isDateAvailable(date) && setSelectedDate(formatDate(date))}
                        disabled={!isDateAvailable(date)}
                        className={`w-full aspect-square flex items-center justify-center rounded-lg transition-colors font-medium ${
                          !isDateAvailable(date) 
                            ? 'text-gray-200 cursor-not-allowed' 
                            : formatDate(date) === selectedDate
                              ? 'bg-blue-500 text-white'
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    ) : <div />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Select Time
              </h2>
              
              {!selectedDate ? (
                <p className="text-gray-500 p-4 text-center">Please select a date from the calendar first</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedTime('Morning')}
                    className={`p-6 rounded-xl text-center font-medium transition-colors border-2 ${
                      selectedTime === 'Morning'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-green-300 bg-green-50 hover:bg-green-100 text-green-700'
                    }`}
                  >
                    <div className="text-xl">Morning</div>
                    <div className="text-sm">8:00 AM - 12:00 PM</div>
                  </button>
                  <button
                    onClick={() => setSelectedTime('Afternoon')}
                    className={`p-6 rounded-xl text-center font-medium transition-colors border-2 ${
                      selectedTime === 'Afternoon'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-green-300 bg-green-50 hover:bg-green-100 text-green-700'
                    }`}
                  >
                    <div className="text-xl">Afternoon</div>
                    <div className="text-sm">1:00 PM - 5:00 PM</div>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Select Transaction
              </h2>
              
              <div className="space-y-2">
                {transactions.map(trans => (
                  <button
                    key={trans.id}
                    onClick={() => setSelectedTransaction(trans)}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      selectedTransaction?.id === trans.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{trans.name}</div>
                    <div className={`text-sm ${selectedTransaction?.id === trans.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {trans.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Your Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your student ID (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select course *</option>
                    <option value="Senior High - Grade 11">Senior High - Grade 11</option>
                    <option value="Senior High - Grade 12">Senior High - Grade 12</option>
                    <option value="Senior High - GAS">Senior High - GAS</option>
                    <option value="Senior High - HUMSS">Senior High - HUMSS</option>
                    <option value="Senior High - ICT">Senior High - ICT</option>
                    <option value="Senior High - STEM">Senior High - STEM</option>
                    <option value="BSBA">BSBA</option>
                    <option value="BSAIS">BSAIS</option>
                    <option value="BSOA">BSOA</option>
                    <option value="BSCS">BSCS</option>
                    <option value="BSIT">BSIT</option>
                    <option value="BTVTED ELEC">BTVTED ELEC</option>
                    <option value="BTVTED">BTVTED</option>
                    <option value="BSBA-FM">BSBA-FM</option>
                    <option value="BSBA-HM">BSBA-HM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select year *</option>
                    <option value="Senior High - Grade 11">Senior High - Grade 11</option>
                    <option value="Senior High - Grade 12">Senior High - Grade 12</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Appointment Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{selectedTime ? formatTime(selectedTime) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction:</span>
                  <span className="font-medium">{selectedTransaction?.name || '-'}</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={!selectedDate || !selectedTime || !selectedTransaction || !studentName.trim() || booking}
                className="w-full mt-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {booking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Booking...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {currentAppointments.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Your Appointments
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Transaction</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentAppointments.slice(0, 5).map(apt => (
                    <tr key={apt.id}>
                      <td className="px-4 py-3">
                        {new Date(apt.appointmentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{apt.appointmentTime}</td>
                      <td className="px-4 py-3">{apt.transactionTypeName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}