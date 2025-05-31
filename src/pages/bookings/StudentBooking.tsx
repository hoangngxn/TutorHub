import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUser, faTimes, faStar, faSearch } from '@fortawesome/free-solid-svg-icons';
import ProfilePreview from '../../components/user/ProfilePreview';
import ReviewModal from '../../components/review/ReviewModal';
import type { EnhancedBooking, FilterState } from '../../types/booking';
import { formatSchedules } from '../../types/booking';

interface Schedule {
  weekday: string;
  startHour: string;
  endHour: string;
}

interface BookingItem {
  id: string;
  studentId: string;
  tutorId: string;
  postId: string;
  subject: string;
  schedules: Schedule[];  // Changed from schedule to schedules array
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED';
  createdAt: string;
}

export default function StudentBooking() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<EnhancedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<EnhancedBooking | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    subject: '',
    status: '',
    tutorId: '',
    sortBy: 'newest'
  });

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof EnhancedBooking | 'tutorName' | 'tutorId') => {
    return Array.from(new Set(bookings.map(booking => {
      if (field === 'tutorName') {
        return booking.tutorInfo?.fullname || booking.tutorInfo?.username;
      }
      if (field === 'tutorId') {
        return booking.tutorInfo?.id;
      }
      return booking[field];
    }))).filter((value): value is string => 
      typeof value === 'string' && value.length > 0
    );
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/bookings');
      const enhancedBookings = await Promise.all(response.data.map(async (booking: any) => {
        let studentInfo, tutorInfo, hasReview = false, postTitle;
        
        try {
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

        try {
          const postResponse = await api.get(`/api/posts/${booking.postId}`);
          postTitle = postResponse.data.title;
        } catch (error) {
          console.error(`Error fetching post info for ID ${booking.postId}:`, error);
          postTitle = booking.subject;
        }

        if (booking.status === 'COMPLETED') {
          try {
            const reviewResponse = await api.get(`/api/reviews/booking/${booking.id}`);
            hasReview = !!reviewResponse.data;
          } catch (error) {
            hasReview = false;
          }
        }
        
        return {
          ...booking,
          tutorInfo,
          hasReview,
          postTitle
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

  const applyFilters = () => {
    let result = [...bookings];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(booking =>
        booking.subject.toLowerCase().includes(searchLower) ||
        booking.postTitle?.toLowerCase().includes(searchLower) ||
        booking.tutorInfo?.fullname?.toLowerCase().includes(searchLower) ||
        booking.tutorInfo?.username.toLowerCase().includes(searchLower)
      );
    }

    if (filters.subject) {
      result = result.filter(booking => booking.subject === filters.subject);
    }

    if (filters.tutorId) {
      result = result.filter(booking => booking.tutorId === filters.tutorId);
    }

    if (filters.status) {
      result = result.filter(booking => booking.status === filters.status);
    }

    switch (filters.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'subject':
        result.sort((a, b) => a.subject.localeCompare(b.subject));
        break;
      case 'tutor':
        result.sort((a, b) => {
          const tutorA = a.tutorInfo?.fullname || a.tutorInfo?.username || '';
          const tutorB = b.tutorInfo?.fullname || b.tutorInfo?.username || '';
          return tutorA.localeCompare(tutorB);
        });
        break;
    }

    setFilteredBookings(result);
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: true }));
      setError('');
      
      await api.delete(`/api/bookings/${bookingId}`);
      setBookings(bookings.filter(booking => booking.id !== bookingId));
      
    } catch (err: any) {
      console.error('Error deleting booking:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete booking. Please try again.';
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

  const handleReviewClick = (booking: EnhancedBooking) => {
    setSelectedBookingForReview(booking);
  };

  const handleReviewSuccess = () => {
    setBookings(bookings.map(booking => 
      booking.id === selectedBookingForReview?.id 
        ? { ...booking, hasReview: true } 
        : booking
    ));
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

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search bookings..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Subject Filter */}
            <div>
              <select
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Subjects</option>
                {getUniqueValues('subject').map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Tutor Filter */}
            <div>
              <select
                value={filters.tutorId}
                onChange={(e) => handleFilterChange('tutorId', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Tutors</option>
                {getUniqueValues('tutorId').map(tutorId => {
                  const tutor = bookings.find(b => b.tutorId === tutorId)?.tutorInfo;
                  return (
                    <option key={tutorId} value={tutorId}>
                      {tutor?.fullname || tutor?.username}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="subject">Subject A-Z</option>
                <option value="tutor">Tutor Name</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-12 text-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-12 w-12 text-indigo-400 mb-4" />
                <p className="text-lg text-gray-500">
                  {bookings.length === 0 ? "No bookings found." : "No bookings match your filters."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-indigo-600 truncate">
                          {booking.postTitle || booking.subject}
                        </h3>
                        {booking.postTitle && booking.postTitle !== booking.subject && (
                          <p className="text-sm text-gray-500 mt-1">{booking.subject}</p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-center">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Date:</span>
                          <span className="ml-2 text-sm text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-center">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Schedules:</span>
                          <span className="ml-2 text-sm text-gray-900 flex-1">{formatSchedules(booking.schedules)}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-center">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Tutor: </span>
                          <button 
                            onClick={() => handleUserClick(booking.tutorId)}
                            className="ml-2 text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none bg-gray-200 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors border border-gray-300"
                            style={{ backgroundColor: '#e5e7eb' }}
                          >
                            {booking.tutorInfo?.fullname || booking.tutorInfo?.username || 'Tutor'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex justify-end space-x-4">
                        {booking.status === 'PENDING' && (
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            disabled={actionLoading[booking.id]}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[booking.id] ? (
                              <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                            ) : (
                              <FontAwesomeIcon icon={faTimes} className="mr-1" />
                            )}
                            Cancel Booking
                          </button>
                        )}
                        {booking.status === 'COMPLETED' && !booking.hasReview && (
                          <button
                            onClick={() => handleReviewClick(booking)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <FontAwesomeIcon icon={faStar} className="mr-1" />
                            Leave Review
                          </button>
                        )}
                        {booking.status === 'COMPLETED' && booking.hasReview && (
                          <div className="flex items-center text-green-600">
                            <FontAwesomeIcon icon={faStar} className="mr-1" />
                            <span className="text-sm">Review submitted</span>
                          </div>
                        )}
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

      {selectedBookingForReview && (
        <ReviewModal
          bookingId={selectedBookingForReview.id}
          tutorName={selectedBookingForReview.tutorInfo?.fullname || selectedBookingForReview.tutorInfo?.username || 'Tutor'}
          subject={selectedBookingForReview.subject}
          onClose={() => setSelectedBookingForReview(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
} 