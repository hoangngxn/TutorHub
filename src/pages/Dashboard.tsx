import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faUser, faMapMarkerAlt, faClock, faBook, faUsers, faChalkboardTeacher, faGraduationCap, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import ProfilePreview from '../components/user/ProfilePreview';

// Add predefined grades constant
const GRADES = [
  "Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5",
  "Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9",
  "Lớp 10", "Lớp 11", "Lớp 12",
  "Đại học", "Sau đại học"
];

interface Schedule {
  weekday: string;
  startHour: string;
  endHour: string;
}

interface Post {
  id: string;
  userId: string;
  title: string;
  description: string;
  subject: string;
  location: string;
  schedules: Schedule[];
  grade: string;
  createdAt: string;
  visibility: boolean;
  approvedStudent: number;
  maxStudent: number;
  startTime: string;
  endTime: string;
  tutorInfo?: {
    id: string;
    username: string;
    fullname?: string;
  };
}

interface Booking {
  id: string;
  studentId: string;
  tutorId: string;
  postId: string;
  subject: string;
  schedule: Schedule;
  status: string;
  createdAt: string;
}

// Add helper function to check course progress
const calculateCourseProgress = (startTime: string, endTime: string): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const now = new Date().getTime();
  
  // If course hasn't started yet, progress is 0
  if (now < start) return 0;
  // If course has ended, progress is 100
  if (now > end) return 100;
  
  // Calculate progress percentage
  const totalDuration = end - start;
  const elapsed = now - start;
  return (elapsed / totalDuration) * 100;
};

// Update the helper function to format schedules
const formatSchedules = (schedules: Schedule[]): string => {
  return schedules.map(schedule => {
    // Remove seconds from time display
    const startTime = schedule.startHour.split(':').slice(0, 2).join(':');
    const endTime = schedule.endHour.split(':').slice(0, 2).join(':');
    return `${schedule.weekday}: ${startTime} - ${endTime}`;
  }).join(', ');
};

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingStatus, setBookingStatus] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsResponse] = await Promise.all([
          api.get('/api/posts')
        ]);
        
        // Filter out private posts (visibility = false)
        const publicPosts = postsResponse.data.filter((post: Post) => post.visibility === true);
        
        // Enhance posts with tutor information
        const enhancedPosts = await Promise.all(publicPosts.map(async (post: Post) => {
          try {
            // Fetch tutor info for each post
            const tutorResponse = await api.get(`/api/auth/users/${post.userId}`);
            return {
              ...post,
              tutorInfo: {
                id: tutorResponse.data.id,
                username: tutorResponse.data.username,
                fullname: tutorResponse.data.fullname
              }
            };
          } catch (error) {
            console.error(`Error fetching tutor info for ID ${post.userId}:`, error);
            // Fallback to default data if API call fails
            return {
              ...post,
              tutorInfo: {
                id: post.userId,
                username: `user_${post.userId.substring(0, 5)}`,
                fullname: `Tutor ${post.userId.substring(0, 5)}`
              }
            };
          }
        }));
        
        setPosts(enhancedPosts);
        
        // Fetch user bookings if user is authenticated and is a student
        if (isAuthenticated && user?.role === 'STUDENT') {
          try {
            const bookingsResponse = await api.get('/api/bookings');
            setUserBookings(bookingsResponse.data);
          } catch (err) {
            console.error('Error fetching user bookings:', err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch posts. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  const hasBookingForPost = (postId: string) => {
    return userBookings.some(booking => booking.postId === postId);
  };

  const isCourseTooProgressed = (post: Post) => {
    const progress = calculateCourseProgress(post.startTime, post.endTime);
    return progress >= 50;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If search term is cleared, reset filters
    if (value === '') {
      setSelectedSubject('');
      setSelectedGrade('');
    }
  };

  const filteredPosts = posts.filter(post => {
    // Apply subject and grade filters
    const matchesSubject = !selectedSubject || post.subject === selectedSubject;
    const matchesGrade = !selectedGrade || post.grade === selectedGrade;
    
    // If search term is empty, only apply subject and grade filters
    if (!searchTerm) {
      return matchesSubject && matchesGrade;
    }
    
    // Search across all relevant fields
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTermLower) ||
      post.description.toLowerCase().includes(searchTermLower) ||
      post.subject.toLowerCase().includes(searchTermLower) ||
      post.location.toLowerCase().includes(searchTermLower) ||
      formatSchedules(post.schedules).toLowerCase().includes(searchTermLower) ||
      (post.grade || '').toLowerCase().includes(searchTermLower) ||
      (post.tutorInfo?.fullname || '').toLowerCase().includes(searchTermLower) ||
      (post.tutorInfo?.username || '').toLowerCase().includes(searchTermLower);
    
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const subjects = Array.from(new Set(posts.map(post => post.subject)));
  const grades = Array.from(new Set(posts.map(post => post.grade).filter(Boolean)));

  const handleBookingRequest = async (postId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'STUDENT') {
      setError('Only students can book tutoring sessions');
      return;
    }

    try {
      setBookingStatus(prev => ({ ...prev, [postId]: 'loading' }));
      await api.post('/api/bookings', { postId });
      setBookingStatus(prev => ({ ...prev, [postId]: 'success' }));
      
      // Update userBookings after successful booking
      const updatedBookings = await api.get('/api/bookings');
      setUserBookings(updatedBookings.data);
      
      setTimeout(() => {
        setBookingStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[postId];
          return newStatus;
        });
      }, 3000);
    } catch (err) {
      setBookingStatus(prev => ({ ...prev, [postId]: 'error' }));
      setError('Failed to book tutoring session. Please try again later.');
      setTimeout(() => {
        setBookingStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[postId];
          return newStatus;
        });
      }, 3000);
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
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center bg-white p-12 rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-500">Loading posts...</p>
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
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md relative" role="alert">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="bg-indigo-600 rounded-xl shadow-lg mb-8 py-6 px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-white">Find Tutors</h1>
              <p className="mt-1 text-indigo-100">Browse available tutoring sessions and sign up</p>
            </div>
            
            {/* Search and filter section */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2 border border-indigo-300 rounded-md leading-5 bg-white bg-opacity-90 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-white sm:text-sm text-gray-900"
                />
              </div>
              <div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-indigo-300 bg-white bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm rounded-md text-gray-900"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-indigo-300 bg-white bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white focus:border-white sm:text-sm rounded-md text-gray-900"
                >
                  <option value="">All Grades</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Posts grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map(post => (
            <div key={post.id} className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              {/* Header with subject info */}
              <div className="bg-indigo-50 border-b border-gray-200 px-4 py-3 flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                  <FontAwesomeIcon icon={faBook} className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-medium text-indigo-700">{post.subject}</span>
                  {post.grade && (
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 py-0.5 px-2 rounded-full">
                      {post.grade}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-sm text-gray-500 border-b border-gray-100 pb-4">{post.description}</p>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2">{post.location}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faClock} className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Schedules:</span>
                    <span className="ml-2">{formatSchedules(post.schedules)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faCalendarAlt} className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Course Period:</span>
                    <span className="ml-2">
                      {new Date(post.startTime).toLocaleDateString()} - {new Date(post.endTime).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faGraduationCap} className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Grade Level:</span>
                    <span className="ml-2">{post.grade || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FontAwesomeIcon icon={faUsers} className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Students:</span>
                    <span className="ml-2">{post.approvedStudent}/{post.maxStudent}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 pt-2 border-t border-gray-100">
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Tutor:</span>
                    <button 
                      onClick={() => handleUserClick(post.userId)}
                      className="ml-2 text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none bg-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors border border-gray-300"
                      style={{ backgroundColor: '#e5e7eb' }}                    >
                      {post.tutorInfo?.fullname || post.tutorInfo?.username || 'Tutor'}
                    </button>
                  </div>
                </div>
                
                {/* Only show the button for students, not for tutors */}
                {(!user || user.role === 'STUDENT') && (
                  <div className="mt-6">
                    <button
                      onClick={() => handleBookingRequest(post.id)}
                      disabled={
                        bookingStatus[post.id] === 'loading' || 
                        post.approvedStudent >= post.maxStudent || 
                        hasBookingForPost(post.id) ||
                        isCourseTooProgressed(post)
                      }
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm
                        ${post.approvedStudent >= post.maxStudent 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : hasBookingForPost(post.id)
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : isCourseTooProgressed(post)
                              ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                              : bookingStatus[post.id] === 'success'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : bookingStatus[post.id] === 'error'
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
                    >
                      {post.approvedStudent >= post.maxStudent 
                        ? 'Class Full' 
                        : hasBookingForPost(post.id)
                          ? 'Signed Up'
                          : isCourseTooProgressed(post)
                            ? 'Course In Progress (>50%)'
                            : bookingStatus[post.id] === 'loading'
                              ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </>
                              )
                              : bookingStatus[post.id] === 'success'
                                ? 'Booked Successfully!'
                                : bookingStatus[post.id] === 'error'
                                  ? 'Booking Failed'
                                  : 'Sign Up'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <FontAwesomeIcon icon={faSearch} className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg text-gray-500">No posts found matching your criteria.</p>
          </div>
        )}
      </div>
      
      {selectedUserId && (
        <ProfilePreview userId={selectedUserId} onClose={closeProfilePreview} />
      )}
    </div>
  );
} 