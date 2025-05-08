import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUser, faMapMarkerAlt, faCheck, faTimes, faChevronDown, faChevronUp, faBook, faGraduationCap, faBriefcase } from '@fortawesome/free-solid-svg-icons';
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

interface PostGroup {
  postId: string;
  subject: string;
  schedule: string;
  bookings: EnhancedBooking[];
}

export default function BookingManagementPage() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [groupedBookings, setGroupedBookings] = useState<PostGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    // Group bookings by postId
    if (bookings.length > 0) {
      const groups: Record<string, PostGroup> = {};
      
      bookings.forEach(booking => {
        if (!groups[booking.postId]) {
          groups[booking.postId] = {
            postId: booking.postId,
            subject: booking.subject,
            schedule: booking.schedule,
            bookings: []
          };
        }
        
        groups[booking.postId].bookings.push(booking);
      });
      
      setGroupedBookings(Object.values(groups));
    }
  }, [bookings]);

  const toggleExpand = (postId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

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

  const getStatusCount = (postGroup: PostGroup) => {
    const counts = {
      PENDING: 0,
      CONFIRMED: 0,
      CANCELED: 0,
      COMPLETED: 0
    };
    
    postGroup.bookings.forEach(booking => {
      counts[booking.status]++;
    });
    
    return counts;
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm" role="alert">
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

  if (user?.role === 'STUDENT') {
    // For students, display bookings as a standard list
    return (
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="bg-indigo-600 py-6 px-4 sm:px-6 lg:px-8 mb-6 shadow-md">
          <div className="max-w-7xl mx-auto">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
                My Bookings
              </h2>
              <p className="mt-1 text-indigo-100">Manage your tutoring sessions</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-4">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-12 text-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="h-12 w-12 text-indigo-400 mb-4" />
                  <p className="text-lg text-gray-500">No bookings found.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-indigo-600 truncate">
                            {booking.subject}
                          </h3>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-500">Date:</span>
                            <span className="ml-2 text-sm text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-500">Schedule:</span>
                            <span className="ml-2 text-sm text-gray-900">{booking.schedule}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-500">Tutor:</span>
                            <button 
                              onClick={() => handleUserClick(booking.tutorId)}
                              className="text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none bg-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors border border-gray-300"
                              style={{ backgroundColor: '#e5e7eb' }}
                            >
                              {booking.tutorInfo?.fullname || booking.tutorInfo?.username || 'Tutor'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

  // For tutors, display bookings grouped by post
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="bg-indigo-600 py-6 px-4 sm:px-6 lg:px-8 mb-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
              Student Bookings
            </h2>
            <p className="mt-1 text-indigo-100">Manage student session requests and bookings</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4">
          {groupedBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-12 text-center">
                <FontAwesomeIcon icon={faBook} className="h-12 w-12 text-indigo-400 mb-4" />
                <p className="text-lg text-gray-500">No bookings found.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedBookings.map(group => {
                const statusCounts = getStatusCount(group);
                const isExpanded = expandedGroups[group.postId] || false;
                
                return (
                  <div key={group.postId} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Post header - always visible */}
                    <div 
                      className="px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleExpand(group.postId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faBook} className="h-5 w-5 text-indigo-500 mr-2" />
                            <h3 className="text-xl font-semibold text-indigo-600">
                              {group.subject}
                            </h3>
                          </div>
                          <p className="mt-2 text-sm text-gray-500 flex items-center">
                            <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-gray-400 mr-2" />
                            {group.schedule} • {group.bookings.length} bookings
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-2">
                            {statusCounts.PENDING > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {statusCounts.PENDING} pending
                              </span>
                            )}
                            {statusCounts.CONFIRMED > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {statusCounts.CONFIRMED} confirmed
                              </span>
                            )}
                          </div>
                          <div className="bg-gray-200 rounded-full p-1">
                            <FontAwesomeIcon 
                              icon={isExpanded ? faChevronUp : faChevronDown} 
                              className="h-4 w-4 text-gray-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded bookings list */}
                    {isExpanded && (
                      <div className="border-t border-gray-200">
                        <div className="divide-y divide-gray-200">
                          {group.bookings.map(booking => (
                            <div key={booking.id} className="p-4 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center bg-white p-2 rounded-lg border border-gray-200">
                                      <FontAwesomeIcon icon={faGraduationCap} className="h-5 w-5 text-indigo-500 mr-2" />
                                      <button 
                                        onClick={() => handleUserClick(booking.studentId)}
                                        className="text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none bg-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors border border-gray-300"
                                        style={{ backgroundColor: '#e5e7eb' }}
                                      >
                                        {booking.studentInfo?.fullname || booking.studentInfo?.username || 'Student'}
                                      </button>
                                    </div>
                                    <div className="flex items-center bg-white p-2 rounded-lg border border-gray-200">
                                      <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-indigo-500 mr-2" />
                                      <span className="text-gray-900 text-sm">{new Date(booking.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                                      {booking.status}
                                    </span>
                                  </div>
                                </div>
                                
                                {booking.status === 'PENDING' && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                                      disabled={actionLoading[booking.id]}
                                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {actionLoading[booking.id] ? (
                                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                                      ) : (
                                        <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                      )}
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(booking.id, 'CANCELED')}
                                      disabled={actionLoading[booking.id]}
                                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {actionLoading[booking.id] ? (
                                        <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                                      ) : (
                                        <FontAwesomeIcon icon={faTimes} className="mr-1" />
                                      )}
                                      Reject
                                    </button>
                                  </div>
                                )}

                                {booking.status === 'CONFIRMED' && (
                                  <button
                                    onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                                    disabled={actionLoading[booking.id]}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {actionLoading[booking.id] ? (
                                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                                    ) : (
                                      <FontAwesomeIcon icon={faBriefcase} className="mr-1" />
                                    )}
                                    Mark Complete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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