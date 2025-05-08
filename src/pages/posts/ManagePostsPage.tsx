import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Post {
  id: string;
  title: string;
  description: string;
  subject: string;
  location: string;
  schedule: string;
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
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Manage Your Posts
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/posts/create"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              New Post
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">You haven't created any posts yet.</p>
              <Link
                to="/posts/create"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create Your First Post
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {posts.map(post => (
                  <li key={post.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-indigo-600 truncate">{post.title}</h3>
                          <div className="mt-2 flex">
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="truncate">{post.subject}</span>
                              <span className="mx-2">•</span>
                              <span className="truncate">{post.location}</span>
                              <span className="mx-2">•</span>
                              <span className="truncate">{post.schedule}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <Link
                            to={`/posts/edit/${post.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Link>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">{post.description}</p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="mr-4">
                          Students: {post.approvedStudent}/{post.maxStudent}
                        </span>
                        <span className="mr-4">
                          Status: {post.visibility ? 'Public' : 'Private'}
                        </span>
                        <span>
                          Created: {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 