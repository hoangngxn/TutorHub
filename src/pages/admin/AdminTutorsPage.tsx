import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserGraduate, 
  faSearch, 
  faTrash, 
  faCheck, 
  faTimes, 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt,
  faStar,
  faBook,
  faCalendarAlt,
  faMapMarkerAlt as faMapPin,
  faGraduationCap,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';

interface Tutor {
  id: string;
  username: string;
  email: string;
  role: string;
  fullname?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  postCount?: number;
  reviewCount?: number;
  averageRating?: number;
}

interface Post {
  id: string;
  userId: string;
  title: string;
  description: string;
  subject: string;
  location: string;
  schedule: string;
  grade: string;
  createdAt: string;
  visibility: boolean;
  approvedStudent: number;
  maxStudent: number;
}

interface ReviewStudent {
  id: string;
  username: string;
  fullname?: string;
  avatar?: string;
}

interface Review {
  id: string;
  bookingId: string;
  studentId: string;
  rating: number;
  comment: string;
  createdAt: string;
  student?: ReviewStudent;
}

export default function AdminTutorsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  
  // Modal states
  const [postsModalOpen, setPostsModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutorPosts, setTutorPosts] = useState<Post[]>([]);
  const [tutorReviews, setTutorReviews] = useState<Review[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [studentInfoMap, setStudentInfoMap] = useState<Record<string, Tutor>>({});

  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    fetchTutors();
  }, [isAuthenticated, user, navigate]);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      // Fetch all users with TUTOR role
      const response = await api.get('/api/admin/users', { params: { role: 'TUTOR' } });
      
      // Enhance tutors with additional information
      const enhancedTutors = await Promise.all(response.data.map(async (tutor: Tutor) => {
        try {
          // Fetch tutor's posts count
          const postsResponse = await api.get(`/api/posts/tutor/${tutor.id}`);
          
          // Fetch tutor's reviews
          const reviewsResponse = await api.get(`/api/reviews/tutor/${tutor.id}`);
          
          // Calculate average rating
          let averageRating = 0;
          if (reviewsResponse.data.length > 0) {
            const sum = reviewsResponse.data.reduce((acc: number, review: any) => acc + review.rating, 0);
            averageRating = parseFloat((sum / reviewsResponse.data.length).toFixed(1));
          }
          
          return {
            ...tutor,
            postCount: postsResponse.data.length,
            reviewCount: reviewsResponse.data.length,
            averageRating
          };
        } catch (error) {
          console.error(`Error fetching additional info for tutor ${tutor.id}:`, error);
          return {
            ...tutor,
            postCount: 0,
            reviewCount: 0,
            averageRating: 0
          };
        }
      }));
      
      setTutors(enhancedTutors);
      setError('');
    } catch (err) {
      setError('Failed to fetch tutors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteTutor = async (tutorId: string) => {
    if (!window.confirm('Are you sure you want to delete this tutor? All associated posts and bookings will also be deleted. This action cannot be undone.')) {
      return;
    }

    setProcessing(prev => ({ ...prev, [tutorId]: true }));
    try {
      await api.delete(`/api/admin/users/${tutorId}`);
      setTutors(tutors.filter(tutor => tutor.id !== tutorId));
    } catch (err) {
      setError('Failed to delete tutor. Please try again.');
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[tutorId];
        return newState;
      });
    }
  };

  const handleShowPosts = async (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setModalLoading(true);
    try {
      const response = await api.get(`/api/posts/tutor/${tutor.id}`);
      setTutorPosts(response.data);
      setPostsModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch tutor posts:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleShowReviews = async (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setModalLoading(true);
    try {
      const response = await api.get(`/api/reviews/tutor/${tutor.id}`);
      const fetchedReviews = response.data;
      
      // Fetch student information for each review
      const studentIds = fetchedReviews.map((review: Review) => review.studentId).filter(Boolean);
      const uniqueStudentIds = [...new Set(studentIds)] as string[];
      
      const studentInfoPromises = uniqueStudentIds.map(async (studentId: string) => {
        try {
          const studentResponse = await api.get(`/api/auth/users/${studentId}`);
          return { id: studentId, data: studentResponse.data };
        } catch (error) {
          console.error(`Error fetching student info for ID ${studentId}:`, error);
          return { 
            id: studentId, 
            data: { 
              id: studentId, 
              username: `student_${studentId.substring(0, 5)}`,
              avatar: undefined
            } 
          };
        }
      });
      
      const studentInfoResults = await Promise.all(studentInfoPromises);
      const studentMap: Record<string, Tutor> = {};
      
      studentInfoResults.forEach(result => {
        studentMap[result.id] = result.data;
      });
      
      setStudentInfoMap(studentMap);
      setTutorReviews(fetchedReviews);
      setReviewsModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch tutor reviews:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const getStudentInfo = (review: Review) => {
    // First try to use the student object from the review
    if (review.student && review.student.username) {
      return review.student;
    }
    
    // Fall back to our locally fetched student info
    const studentId = review.studentId;
    if (studentId && studentInfoMap[studentId]) {
      const student = studentInfoMap[studentId];
      return {
        id: student.id,
        username: student.username || `Student ${student.id.substring(0, 5)}`,
        fullname: student.fullname,
        avatar: student.avatar
      };
    }
    
    // Last resort default
    return {
      id: review.studentId || 'unknown',
      username: 'Anonymous Student',
      fullname: undefined,
      avatar: undefined
    };
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <FontAwesomeIcon
            key={star}
            icon={star <= rating ? faStar : farStar}
            className={star <= rating ? "text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredTutors = tutors.filter(tutor => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (tutor.fullname || '').toLowerCase().includes(searchTermLower) ||
      tutor.username.toLowerCase().includes(searchTermLower) ||
      tutor.email.toLowerCase().includes(searchTermLower) ||
      (tutor.phone || '').toLowerCase().includes(searchTermLower) ||
      (tutor.address || '').toLowerCase().includes(searchTermLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center bg-white p-12 rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-500">Loading tutors...</p>
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
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="bg-indigo-600 py-6 px-4 sm:px-6 lg:px-8 mb-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
                Manage Tutors
              </h2>
              <p className="mt-1 text-indigo-100">View and manage all tutors on the platform</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={fetchTutors}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search section */}
        <div className="bg-white p-4 shadow rounded-lg mb-6">
          <div className="flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tutors by name, email, username..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Tutors list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredTutors.length === 0 ? (
              <li className="px-6 py-10 text-center text-gray-500">
                No tutors found matching your criteria
              </li>
            ) : (
              filteredTutors.map((tutor) => (
                <li key={tutor.id}>
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {tutor.avatar ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={tutor.avatar}
                              alt={tutor.fullname || tutor.username}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <FontAwesomeIcon icon={faUserGraduate} className="h-6 w-6 text-indigo-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{tutor.fullname || tutor.username}</h3>
                          <div className="text-sm text-gray-500">@{tutor.username}</div>
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() => handleDeleteTutor(tutor.id)}
                          disabled={processing[tutor.id]}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {processing[tutor.id] ? (
                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                          ) : (
                            <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{tutor.email}</span>
                        </div>
                        
                        {tutor.phone && (
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faPhone} className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{tutor.phone}</span>
                          </div>
                        )}
                        
                        {tutor.address && (
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{tutor.address}</span>
                          </div>
                        )}
                      </div>
                      
                      {tutor.bio && (
                        <div className="sm:col-span-2">
                          <p className="text-sm text-gray-500">{tutor.bio}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div 
                        className="bg-blue-50 p-3 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                        onClick={() => handleShowPosts(tutor)}
                      >
                        <div className="text-xs font-medium text-blue-800 uppercase">Posts</div>
                        <div className="mt-1 text-2xl font-semibold text-blue-900">{tutor.postCount || 0}</div>
                      </div>
                      
                      <div 
                        className="bg-green-50 p-3 rounded-lg cursor-pointer hover:bg-green-100 transition-colors duration-200"
                        onClick={() => handleShowReviews(tutor)}
                      >
                        <div className="text-xs font-medium text-green-800 uppercase">Reviews</div>
                        <div className="mt-1 text-2xl font-semibold text-green-900">{tutor.reviewCount || 0}</div>
                      </div>
                      
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-yellow-800 uppercase">Rating</div>
                        <div className="mt-1 text-2xl font-semibold text-yellow-900">
                          {tutor.averageRating ? tutor.averageRating.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Posts Modal */}
      {postsModalOpen && selectedTutor && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setPostsModalOpen(false)}
              className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 rounded-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            </button>
            
            <h2 className="text-xl font-bold mb-6 text-center text-gray-900 mt-2">
              Posts by {selectedTutor.fullname || selectedTutor.username}
            </h2>
            
            {modalLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : tutorPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No posts found for this tutor.
              </div>
            ) : (
              <div className="space-y-6">
                {tutorPosts.map(post => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${post.visibility ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {post.visibility ? 'Public' : 'Private'}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-500">{post.description}</p>
                    
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <FontAwesomeIcon icon={faBook} className="h-4 w-4 text-indigo-400 mr-2" />
                        {post.subject}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-indigo-400 mr-2" />
                        {post.schedule}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <FontAwesomeIcon icon={faMapPin} className="h-4 w-4 text-indigo-400 mr-2" />
                        {post.location}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center text-sm">
                      <div className="flex items-center text-gray-500">
                        <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4 text-indigo-400 mr-2" />
                        Grade: {post.grade}
                      </div>
                      
                      <div className="flex items-center text-gray-500">
                        <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-indigo-400 mr-2" />
                        Students: {post.approvedStudent}/{post.maxStudent}
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Created: {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {reviewsModalOpen && selectedTutor && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setReviewsModalOpen(false)}
              className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 rounded-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            </button>
            
            <h2 className="text-xl font-bold mb-6 text-center text-gray-900 mt-2">
              Reviews for {selectedTutor.fullname || selectedTutor.username}
            </h2>
            
            {modalLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : tutorReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No reviews found for this tutor.
              </div>
            ) : (
              <div className="space-y-4">
                {tutorReviews.map(review => {
                  const studentInfo = getStudentInfo(review);
                  return (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {studentInfo.avatar ? (
                            <img 
                              src={studentInfo.avatar} 
                              alt={`${studentInfo.fullname || studentInfo.username}'s avatar`}
                              className="h-10 w-10 rounded-full mr-3 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
                              {(studentInfo.fullname || studentInfo.username).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{studentInfo.fullname || studentInfo.username}</div>
                            <div className="flex items-center mt-1">
                              {renderStars(review.rating)}
                              <span className="ml-2 text-sm text-gray-700">{review.rating}/5</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                      </div>
                      
                      {review.comment && (
                        <div className="mt-3 pl-13 ml-13">
                          <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">{review.comment}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 