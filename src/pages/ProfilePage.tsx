import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faMapMarkerAlt, faEdit, faSave, faTimes, faStar, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import api from '../services/api';

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

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullname: user?.fullname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(true);
  const [studentInfoMap, setStudentInfoMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user?.role === 'TUTOR') {
      fetchTutorReviews();
    }
  }, [user]);

  const fetchTutorReviews = async () => {
    if (!user) return;
    
    try {
      setReviewsLoading(true);
      const response = await api.get(`/api/reviews/tutor/${user.id}`);
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
      const studentMap: Record<string, any> = {};
      
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

  // Validation functions
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    // Remove any non-digit characters before checking length
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  };

  const validateForm = (): string | null => {
    if (formData.email && !isValidEmail(formData.email)) {
      return 'Please enter a valid email address';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      return 'Phone number must be between 10 and 15 digits';
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form before submission
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-indigo-600 py-6 px-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  My Profile
                </h2>
                <p className="mt-1 text-indigo-100">Manage your personal information</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium 
                  ${isEditing 
                    ? 'text-gray-700 bg-white hover:bg-gray-50' 
                    : 'text-white bg-indigo-700 hover:bg-indigo-800'} 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors`}
              >
                <FontAwesomeIcon icon={isEditing ? faTimes : faEdit} className="mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          <div className="px-6 py-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fullname" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="fullname"
                      id="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g., +84 123 456 789"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Your home or office address"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <div className="mt-1">
                    <textarea
                      name="bio"
                      id="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself, your interests, qualifications, etc."
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <FontAwesomeIcon icon={faUser} className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{user?.fullname || user?.username || 'Unnamed User'}</h3>
                      <p className="text-sm text-gray-500">{user?.role === 'TUTOR' ? 'Tutor' : 'Student'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-indigo-500" />
                      <h4 className="ml-2 text-sm font-medium text-gray-700">Email</h4>
                    </div>
                    <p className="mt-2 text-gray-900">{user?.email || 'Not provided'}</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faPhone} className="h-5 w-5 text-indigo-500" />
                      <h4 className="ml-2 text-sm font-medium text-gray-700">Phone Number</h4>
                    </div>
                    <p className="mt-2 text-gray-900">{user?.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="h-5 w-5 text-indigo-500" />
                    <h4 className="ml-2 text-sm font-medium text-gray-700">Address</h4>
                  </div>
                  <p className="mt-2 text-gray-900">{user?.address || 'Not provided'}</p>
                </div>

                {user?.bio && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Bio</h4>
                    <p className="text-gray-900 whitespace-pre-line">{user.bio}</p>
                  </div>
                )}

                {/* Reviews Section for Tutors */}
                {user?.role === 'TUTOR' && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">My Reviews</h3>
                        {reviews.length > 0 && (
                          <div className="mt-1 flex items-center">
                            <span className="text-yellow-500 font-bold mr-1">{averageRating}</span>
                            <FontAwesomeIcon icon={faStar} className="text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={toggleReviews}
                        className="text-indigo-600 hover:text-indigo-800 focus:outline-none"
                      >
                        <FontAwesomeIcon 
                          icon={showReviews ? faChevronUp : faChevronDown} 
                          className="h-5 w-5"
                        />
                      </button>
                    </div>

                    {showReviews && (
                      <div className="space-y-4">
                        {reviewsLoading ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          </div>
                        ) : reviews.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No reviews yet</p>
                        ) : (
                          reviews.map(review => {
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
                                      <div className="text-sm font-medium text-gray-900">
                                        {studentInfo.fullname || studentInfo.username}
                                      </div>
                                      <div className="flex items-center mt-1">
                                        {renderStars(review.rating)}
                                        <span className="ml-2 text-sm text-gray-700">{review.rating}/5</span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                                </div>
                                
                                {review.postTitle && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-indigo-600">{review.postTitle}</p>
                                  </div>
                                )}
                                
                                {review.comment && (
                                  <div className="mt-3">
                                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">
                                      {review.comment}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 