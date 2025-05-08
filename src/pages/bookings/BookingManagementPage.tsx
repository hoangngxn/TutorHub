import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUser, faMapMarkerAlt, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import ProfilePreview from '../../components/user/ProfilePreview';

interface BookingItem {
  id: string;
  studentId: string;
  tutorId: string;
  postId: string;
  subject: string;
  schedule: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED';
  createdAt: string;
}

interface UserInfo {
  id: string;
  fullname?: string;
  username: string;
}

interface EnhancedBooking extends BookingItem {
  studentInfo?: UserInfo;
  tutorInfo?: UserInfo;
}

export default function BookingManagementPage() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get<BookingItem[]>('/api/bookings');
      console.log('Bookings response:', response.data);
      
      // Enhance bookings with user info by fetching student and tutor details
      const enhancedBookings = await Promise.all(response.data.map(async (booking) => {
        let studentInfo: UserInfo | undefined;
        let tutorInfo: UserInfo | undefined;
        
        try {
          // Fetch student info
          const studentResponse = await api.get(`/api/auth/users/${booking.studentId}`);
          studentInfo = {
            id: studentResponse.data.id,
            username: studentResponse.data.username,
            fullname: studentResponse.data.fullname
          };
        } catch (error) {
          console.error(`Error fetching student info for ID ${booking.studentId}:`, error);
          studentInfo = {
            id: booking.studentId,
            username: `student_${booking.studentId.substring(0, 5)}`,
            fullname: `Student ${booking.studentId.substring(0, 5)}`
          };
        }
        
        try {
          // Fetch tutor info
          const tutorResponse = await api.get(`/api/auth/users/${booking.tutorId}`);
          tutorInfo = {
            id: tutorResponse.data.id,
            username: tutorResponse.data.username,
            fullname: tutorResponse.data.fullname
          };
        } catch (error) {
          console.error(`Error fetching tutor info for ID ${booking.tutorId}:`, error);
          tutorInfo = {
            id: booking.tutorId,
            username: `tutor_${booking.tutorId.substring(0, 5)}`,
            fullname: `Tutor ${booking.tutorId.substring(0, 5)}`
          };
        }
        
        return {
          ...booking,
          studentInfo,
          tutorInfo
        };
      }));
      
      setBookings(enhancedBookings);
      setError('');
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to fetch bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: 'CONFIRMED' | 'CANCELED' | 'COMPLETED') => {
    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: true }));
      setError('');
      
      // Make sure API is correctly configured with Authorization headers
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      console.log(`Updating booking ${bookingId} status to ${newStatus}`);
      
      // The status should be sent as a query parameter, not in the request body
      const response = await api.put(
        `/api/bookings/${bookingId}/status?status=${newStatus}`,
        {}, // Empty body
        config
      );
      
      console.log('Status update response:', response.data);
      
      // Update the local state with the new status
      setBookings(bookings.map(booking =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update booking status. Please try again.';
      setError(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
  };

  const closeProfilePreview = () => {
    setSelectedUserId(null);
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
              <button 
                className="mt-3 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
                onClick={() => setError('')}
              >
                Dismiss
              </button>
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
                            {booking.subject}
                          </h3>
                          <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <FontAwesomeIcon icon={faCalendarAlt} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <FontAwesomeIcon icon={faClock} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              {booking.schedule}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <FontAwesomeIcon icon={faUser} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                              <button 
                                onClick={() => handleUserClick(user?.role === 'TUTOR' ? booking.studentId : booking.tutorId)}
                                className="text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none bg-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors border border-gray-300"
                                style={{ backgroundColor: '#e5e7eb' }}
                              >
                                {user?.role === 'TUTOR' 
                                  ? booking.studentInfo?.fullname || booking.studentInfo?.username || 'Student'
                                  : booking.tutorInfo?.fullname || booking.tutorInfo?.username || 'Tutor'}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              booking.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
                              booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>

                      {user?.role === 'TUTOR' && booking.status === 'PENDING' && (
                        <div className="mt-4 flex space-x-3">
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                            disabled={actionLoading[booking.id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[booking.id] ? (
                              <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <FontAwesomeIcon icon={faCheck} className="mr-2" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'CANCELED')}
                            disabled={actionLoading[booking.id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[booking.id] ? (
                              <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <FontAwesomeIcon icon={faTimes} className="mr-2" />
                            )}
                            Reject
                          </button>
                        </div>
                      )}

                      {user?.role === 'TUTOR' && booking.status === 'CONFIRMED' && (
                        <div className="mt-4">
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                            disabled={actionLoading[booking.id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[booking.id] ? (
                              <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : 'Mark as Completed'}
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
      
      {selectedUserId && (
        <ProfilePreview userId={selectedUserId} onClose={closeProfilePreview} />
      )}
    </div>
  );
} 