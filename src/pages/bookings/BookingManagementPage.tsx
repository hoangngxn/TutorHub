import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUser, faMapMarkerAlt, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Booking {
  id: string;
  postId: string;
  studentId: string;
  tutorId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  date: string;
  time: string;
  location: string;
  student: {
    fullname: string;
    email: string;
  };
  tutor: {
    fullname: string;
    email: string;
  };
  post: {
    title: string;
    subject: string;
  };
}

export default function BookingManagementPage() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/bookings/${user?.role.toLowerCase()}`);
      setBookings(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: 'APPROVED' | 'REJECTED' | 'COMPLETED') => {
    try {
      await api.put(
        `/api/bookings/${bookingId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(bookings.map(booking =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
    } catch (err) {
      setError('Failed to update booking status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-500">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          {user?.role === 'TUTOR' ? 'Student Bookings' : 'My Bookings'}
        </h2>

        <div className="mt-8">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No bookings found.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {bookings.map(booking => (
                  <li key={booking.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-indigo-600 truncate">
                            {booking.post.title}
                          </h3>
                          <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <FontAwesomeIcon icon={faCalendarAlt} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              {new Date(booking.date).toLocaleDateString()}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <FontAwesomeIcon icon={faClock} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              {booking.time}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              {booking.location}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <FontAwesomeIcon icon={faUser} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              {user?.role === 'TUTOR' ? booking.student.fullname : booking.tutor.fullname}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${booking.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              booking.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>

                      {user?.role === 'TUTOR' && booking.status === 'PENDING' && (
                        <div className="mt-4 flex space-x-3">
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <FontAwesomeIcon icon={faCheck} className="mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <FontAwesomeIcon icon={faTimes} className="mr-2" />
                            Reject
                          </button>
                        </div>
                      )}

                      {user?.role === 'TUTOR' && booking.status === 'APPROVED' && (
                        <div className="mt-4">
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Mark as Completed
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 