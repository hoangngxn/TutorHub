import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faChalkboardTeacher, faUserGraduate, faClock, faMapMarkerAlt, faEye, faEyeSlash, faGraduationCap } from '@fortawesome/free-solid-svg-icons';

interface Post {
  id: string;
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

export default function ManagePostsPage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/posts/tutor/${user?.id}`);
      setPosts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
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
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="bg-indigo-600 py-6 px-4 sm:px-6 lg:px-8 mb-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
                Manage Your Posts
              </h2>
              <p className="mt-1 text-indigo-100">Create and manage your tutoring sessions</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                to="/posts/create"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                New Post
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-12 text-center">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="h-12 w-12 text-indigo-400 mb-4" />
                <p className="text-lg text-gray-500 mb-6">You haven't created any posts yet.</p>
                <Link
                  to="/posts/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Create Your First Post
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-indigo-600 truncate">{post.title}</h3>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <Link
                          to={`/posts/edit/${post.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
                          Edit
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-gray-700">{post.description}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faChalkboardTeacher} className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Subject:</span>
                          <span className="ml-2 text-sm text-gray-900">{post.subject}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faGraduationCap} className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Grade:</span>
                          <span className="ml-2 text-sm text-gray-900">{post.grade || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Location:</span>
                          <span className="ml-2 text-sm text-gray-900">{post.location}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Schedule:</span>
                          <span className="ml-2 text-sm text-gray-900">{post.schedule}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faUserGraduate} className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Students:</span>
                          <span className="ml-2 text-sm text-gray-900">{post.approvedStudent}/{post.maxStudent}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex items-center">
                        <FontAwesomeIcon 
                          icon={post.visibility ? faEye : faEyeSlash} 
                          className={`h-5 w-5 ${post.visibility ? 'text-green-500' : 'text-gray-400'} mr-2`} 
                        />
                        <span className="text-sm text-gray-500">
                          Status: <span className={post.visibility ? 'text-green-600' : 'text-gray-600'}>
                            {post.visibility ? 'Public' : 'Private'}
                          </span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(post.createdAt).toLocaleDateString()}
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