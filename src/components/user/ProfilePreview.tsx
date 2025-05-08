import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faMapMarkerAlt, faTimes, faStar, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import './ProfilePreview.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'TUTOR';
  fullname?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  bio?: string;
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
  postTitle?: string;
  student?: ReviewStudent;
}

interface ProfilePreviewProps {
  userId: string;
  onClose: () => void;
}

const ProfilePreview: React.FC<ProfilePreviewProps> = ({ userId, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReviews, setShowReviews] = useState(false);
  const [studentInfoMap, setStudentInfoMap] = useState<Record<string, User>>({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/auth/users/${userId}`);
        setUser(response.data);
        setError('');
        
        // If the user is a tutor, fetch their reviews
        if (response.data.role === 'TUTOR') {
          fetchTutorReviews(userId);
        }
      } catch (err: any) {
        setError(err.response?.status === 404 
          ? 'User not found.' 
          : 'Failed to fetch user profile. Please try again later.');
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchTutorReviews = async (tutorId: string) => {
    try {
      setReviewsLoading(true);
      const response = await api.get(`/api/reviews/tutor/${tutorId}`);
      const fetchedReviews = response.data;
      
      // Calculate average rating
      if (fetchedReviews.length > 0) {
        const sum = fetchedReviews.reduce((acc: number, review: Review) => acc + review.rating, 0);
        setAverageRating(parseFloat((sum / fetchedReviews.length).toFixed(1)));
      }

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
      const studentMap: Record<string, User> = {};
      
      studentInfoResults.forEach(result => {
        studentMap[result.id] = result.data;
      });
      
      setStudentInfoMap(studentMap);
      setReviews(fetchedReviews);
    } catch (err) {
      console.error('Error fetching tutor reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const toggleReviews = () => {
    setShowReviews(!showReviews);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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

  const getStudentInfo = (review: Review) => {
    // First try to use the student object from the review
    if (review.student) {
      return {
        id: review.student.id,
        username: review.student.username,
        fullname: review.student.fullname,
        avatar: review.student.avatar
      };
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

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 rounded-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close"
        >
          <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
        </button>
        
        <h2 className="text-xl font-bold mb-6 text-center text-gray-900 mt-2">User Profile</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : user ? (
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.fullname || user.username}'s avatar`}
                  className="h-20 w-20 rounded-full object-cover border-2 border-indigo-600"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold border-2 border-indigo-600">
                  {(user.fullname?.charAt(0) || user.username.charAt(0)).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{user.fullname || user.username}</h3>
              <p className="text-sm text-indigo-600">{user.role}</p>
              
              {user.role === 'TUTOR' && !reviewsLoading && (
                <div className="mt-2 flex items-center justify-center">
                  {reviews.length > 0 ? (
                    <>
                      <div className="flex items-center">
                        <span className="text-yellow-500 font-bold mr-1">{averageRating}</span>
                        <FontAwesomeIcon icon={faStar} className="text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">No reviews yet</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Username</p>
                  <p className="text-sm text-gray-900">{user.username}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
              </div>
              
              {user.phone && (
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faPhone} className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
              
              {user.address && (
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">{user.address}</p>
                  </div>
                </div>
              )}
            </div>
            
            {user.bio && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Bio</p>
                <p className="text-sm text-gray-900">{user.bio}</p>
              </div>
            )}
            
            {user.role === 'TUTOR' && reviews.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={toggleReviews}
                  className="flex items-center justify-between w-full py-2 text-left text-sm font-medium text-indigo-600 hover:text-indigo-800 focus:outline-none"
                >
                  <span>Student Reviews ({reviews.length})</span>
                  <FontAwesomeIcon 
                    icon={showReviews ? faChevronUp : faChevronDown} 
                    className="h-4 w-4"
                  />
                </button>
                
                {showReviews && (
                  <div className="mt-2 space-y-4">
                    {reviewsLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : (
                      reviews.map(review => {
                        const studentInfo = getStudentInfo(review);
                        return (
                          <div key={review.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                {studentInfo.avatar ? (
                                  <img 
                                    src={studentInfo.avatar} 
                                    alt={`${studentInfo.fullname || studentInfo.username}'s avatar`}
                                    className="h-8 w-8 rounded-full mr-2"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-2">
                                    {(studentInfo.fullname || studentInfo.username).charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-gray-900">{studentInfo.fullname || studentInfo.username}</span>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                            </div>
                            
                            <div className="mt-2">
                              {review.postTitle && (
                                <p className="text-xs font-medium text-indigo-600 mb-1">{review.postTitle}</p>
                              )}
                              <div className="flex items-center">
                                {renderStars(review.rating)}
                                <span className="ml-2 text-sm text-gray-700">{review.rating}/5</span>
                              </div>
                              
                              {review.comment && (
                                <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No user data found
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePreview; 