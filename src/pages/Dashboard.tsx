import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faUser, faMapMarkerAlt, faClock } from '@fortawesome/free-solid-svg-icons';
import ProfilePreview from '../components/user/ProfilePreview';

interface Post {
  id: string;
  userId: string;
  title: string;
  description: string;
  subject: string;
  location: string;
  schedule: string;
  createdAt: string;
  visibility: boolean;
  approvedStudent: number;
  maxStudent: number;
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
  schedule: string;
  status: string;
  createdAt: string;
}

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
  const [selectedLocation, setSelectedLocation] = useState('');
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

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || post.subject === selectedSubject;
    const matchesLocation = !selectedLocation || post.location === selectedLocation;
    return matchesSearch && matchesSubject && matchesLocation;
  });

  const subjects = Array.from(new Set(posts.map(post => post.subject)));
  const locations = Array.from(new Set(posts.map(post => post.location)));

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
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-500">Loading posts...</p>
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
        {/* Search and filter section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Posts grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map(post => (
            <div key={post.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{post.description}</p>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium text-gray-900">Subject:</span>
                    <span className="ml-2">{post.subject}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">Location:</span>
                    <span className="ml-2">{post.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <FontAwesomeIcon icon={faClock} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">Schedule:</span>
                    <span className="ml-2">{post.schedule}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <span className="font-medium text-gray-900">Students:</span>
                    <span className="ml-2">{post.approvedStudent}/{post.maxStudent}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <FontAwesomeIcon icon={faUser} className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">Tutor:</span>
                    <button
                      onClick={() => handleUserClick(post.userId)}
                      className="ml-2 text-indigo-600 hover:text-indigo-900 hover:underline focus:outline-none bg-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors border border-gray-300"
                      style={{ backgroundColor: '#e5e7eb' }}
                    >
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
                        hasBookingForPost(post.id)
                      }
                      className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                        ${post.approvedStudent >= post.maxStudent 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : hasBookingForPost(post.id)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : bookingStatus[post.id] === 'success'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : bookingStatus[post.id] === 'error'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      {post.approvedStudent >= post.maxStudent 
                        ? 'Class Full' 
                        : hasBookingForPost(post.id)
                          ? 'Signed Up'
                          : bookingStatus[post.id] === 'loading'
                            ? 'Processing...'
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
          <div className="text-center py-12">
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