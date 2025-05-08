import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faMapMarkerAlt, faTimes } from '@fortawesome/free-solid-svg-icons';

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

interface ProfilePreviewProps {
  userId: string;
  onClose: () => void;
}

const ProfilePreview: React.FC<ProfilePreviewProps> = ({ userId, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/auth/users/${userId}`);
        setUser(response.data);
        setError('');
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

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
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