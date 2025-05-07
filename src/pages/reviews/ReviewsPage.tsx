import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faUser, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

interface Review {
  id: string;
  bookingId: string;
  studentId: string;
  tutorId: string;
  rating: number;
  comment: string;
  createdAt: string;
  student: {
    fullname: string;
  };
  tutor: {
    fullname: string;
  };
  booking: {
    post: {
      title: string;
      subject: string;
    };
  };
}

export default function ReviewsPage() {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/reviews/${user?.role.toLowerCase()}`);
      setReviews(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch reviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-500">Loading reviews...</p>
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
          {user?.role === 'TUTOR' ? 'My Reviews from Students' : 'My Reviews for Tutors'}
        </h2>

        <div className="mt-8">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No reviews found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-indigo-600">
                          {review.booking.post.title}
                        </h3>
                        <div className="mt-1 flex items-center">
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                          <span className="ml-2 text-sm text-gray-500">
                            ({review.rating} out of 5)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-gray-700">{review.comment}</p>
                    </div>

                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <div className="flex items-center mr-6">
                        <FontAwesomeIcon icon={faUser} className="mr-2" />
                        {user?.role === 'TUTOR' ? review.student.fullname : review.tutor.fullname}
                      </div>
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 