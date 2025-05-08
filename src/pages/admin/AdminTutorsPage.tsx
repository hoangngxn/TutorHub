import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate, faSearch, faTrash, faCheck, faTimes, faEnvelope, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

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

export default function AdminTutorsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});

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
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs font-medium text-blue-800 uppercase">Posts</div>
                        <div className="mt-1 text-2xl font-semibold text-blue-900">{tutor.postCount || 0}</div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg">
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
    </div>
  );
} 