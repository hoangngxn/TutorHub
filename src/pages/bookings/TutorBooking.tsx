import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUser, faCheck, faTimes, faChevronDown, faChevronUp, faBook, faGraduationCap, faBriefcase, faSearch } from '@fortawesome/free-solid-svg-icons';
import ProfilePreview from '../../components/user/ProfilePreview';
import type { EnhancedBooking, FilterState, PostGroup } from '../../types/booking';
import { formatSchedule, formatSchedules } from '../../types/booking';

export default function TutorBooking() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [groupedBookings, setGroupedBookings] = useState<PostGroup[]>([]);
  const [filteredGroupedBookings, setFilteredGroupedBookings] = useState<PostGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    subject: '',
    status: '',
    sortBy: 'newest'
  });

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof EnhancedBooking) => {
    return Array.from(new Set(bookings.map(booking => booking[field])))
      .filter((value): value is string => typeof value === 'string' && value.length > 0);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  useEffect(() => {
    if (bookings.length > 0) {
      const groups: Record<string, PostGroup> = {};
      
      bookings.forEach(booking => {
        if (!groups[booking.postId]) {
          groups[booking.postId] = {
            postId: booking.postId,
            subject: booking.subject,
            postTitle: booking.postTitle,
            schedules: booking.schedules,
            bookings: []
          };
        }
        
        groups[booking.postId].bookings.push(booking);
      });
      
      setGroupedBookings(Object.values(groups));
    }
  }, [bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/bookings');
      const enhancedBookings = await Promise.all(response.data.map(async (booking: any) => {
        let studentInfo, postTitle, schedules;
        
        try {
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
          const postResponse = await api.get(`/api/posts/${booking.postId}`);
          postTitle = postResponse.data.title;
          // Get schedules from post response if available
          schedules = postResponse.data.schedules || [];
        } catch (error) {
          console.error(`Error fetching post info for ID ${booking.postId}:`, error);
          postTitle = booking.subject;
          schedules = booking.schedules || [];
        }
        
        return {
          ...booking,
          studentInfo,
          postTitle,
          schedules: Array.isArray(schedules) ? schedules : []
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
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await api.put(
        `/api/bookings/${bookingId}/status?status=${newStatus}`,
        {},
        config
      );
      
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

  const toggleExpand = (postId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
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

  const applyFilters = () => {
    let result = [...bookings];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(booking =>
        booking.subject.toLowerCase().includes(searchLower) ||
        booking.postTitle?.toLowerCase().includes(searchLower) ||
        booking.studentInfo?.fullname?.toLowerCase().includes(searchLower) ||
        booking.studentInfo?.username.toLowerCase().includes(searchLower)
      );
    }

    if (filters.subject) {
      result = result.filter(booking => booking.subject === filters.subject);
    }

    if (filters.status) {
      result = result.filter(booking => booking.status === filters.status);
    }

    // Group filtered bookings
    const groups: Record<string, PostGroup> = {};
    result.forEach(booking => {
      if (!groups[booking.postId]) {
        groups[booking.postId] = {
          postId: booking.postId,
          subject: booking.subject,
          postTitle: booking.postTitle,
          schedules: booking.schedules || [],
          bookings: []
        };
      }
      groups[booking.postId].bookings.push(booking);
    });

    let groupedResult = Object.values(groups);

    // Apply sorting to groups
    switch (filters.sortBy) {
      case 'newest':
        groupedResult.sort((a, b) => {
          const dateA = new Date(a.bookings[0].createdAt).getTime();
          const dateB = new Date(b.bookings[0].createdAt).getTime();
          return dateB - dateA;
        });
        break;
      case 'oldest':
        groupedResult.sort((a, b) => {
          const dateA = new Date(a.bookings[0].createdAt).getTime();
          const dateB = new Date(b.bookings[0].createdAt).getTime();
          return dateA - dateB;
        });
        break;
      case 'subject':
        groupedResult.sort((a, b) => a.subject.localeCompare(b.subject));
        break;
      case 'bookings-high':
        groupedResult.sort((a, b) => b.bookings.length - a.bookings.length);
        break;
      case 'bookings-low':
        groupedResult.sort((a, b) => a.bookings.length - b.bookings.length);
        break;
    }

    setFilteredGroupedBookings(groupedResult);
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
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
              Student Bookings
            </h2>
            <p className="mt-1 text-indigo-100">Manage student session requests and bookings</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <option value="bookings-high">Most Bookings</option>
                <option value="bookings-low">Least Bookings</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredGroupedBookings.reduce((acc, group) => acc + group.bookings.length, 0)} of {bookings.length} bookings
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4">
          {filteredGroupedBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-12 text-center">
                <FontAwesomeIcon icon={faBook} className="h-12 w-12 text-indigo-400 mb-4" />
                <p className="text-lg text-gray-500">
                  {bookings.length === 0 ? "No bookings found." : "No bookings match your filters."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroupedBookings.map(group => {
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
                              {group.postTitle || group.subject}
                            </h3>
                          </div>
                          <p className="mt-2 text-sm text-gray-500 flex items-center">
                            {group.postTitle && group.postTitle !== group.subject && (
                              <span className="mr-2 text-indigo-500">{group.subject}</span>
                            )}
                            <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-gray-400 mr-2" />
                            {formatSchedules(group.schedules)} • {group.bookings.length} bookings
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
                                        className="ml-1 text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none bg-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors border border-gray-300"
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