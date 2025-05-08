import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faChalkboardTeacher, faUserGraduate, faClock, faMapMarkerAlt, faEyeSlash, faGraduationCap, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';

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
  tutorInfo?: {
    id: string;
    username: string;
    fullname?: string;
  };
}

export default function AdminPostsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    fetchPosts();
  }, [isAuthenticated, user, navigate]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/posts');
      
      // Enhance posts with tutor information
      const enhancedPosts = await Promise.all(response.data.map(async (post: Post) => {
        try {
          // Fetch tutor info for each post
          const tutorResponse = await api.get(`/api/admin/users/${post.userId}`);
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
      setError('');
    } catch (err) {
      setError('Failed to fetch posts. Please try again later.');
    } finally {
      setLoading(false);
    }
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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setProcessing(prev => ({ ...prev, [postId]: true }));
    try {
      await api.delete(`/api/admin/posts/${postId}`);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      setError('Failed to delete post. Please try again.');
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    }
  };

  const handleToggleVisibility = async (postId: string, currentVisibility: boolean) => {
    setProcessing(prev => ({ ...prev, [postId]: true }));
    try {
      await api.put(`/api/admin/posts/${postId}`, { visibility: !currentVisibility });
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, visibility: !currentVisibility } 
          : post
      ));
    } catch (err) {
      setError('Failed to update post visibility. Please try again.');
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
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
      post.schedule.toLowerCase().includes(searchTermLower) ||
      (post.grade || '').toLowerCase().includes(searchTermLower) ||
      (post.tutorInfo?.fullname || '').toLowerCase().includes(searchTermLower) ||
      (post.tutorInfo?.username || '').toLowerCase().includes(searchTermLower);
    
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const subjects = Array.from(new Set(posts.map(post => post.subject)));
  const grades = Array.from(new Set(posts.map(post => post.grade).filter(Boolean)));

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
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="bg-indigo-600 py-6 px-4 sm:px-6 lg:px-8 mb-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
                Manage Posts
              </h2>
              <p className="mt-1 text-indigo-100">View and manage all tutoring posts</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={fetchPosts}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and filter section */}
        <div className="bg-white p-4 shadow rounded-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Grades</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title & Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location & Schedule
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No posts found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{post.title}</div>
                      <div className="flex mt-1">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {post.subject}
                        </span>
                        {post.grade && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {post.grade}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{post.tutorInfo?.fullname || post.tutorInfo?.username}</div>
                      <div className="text-xs text-gray-500">{post.tutorInfo?.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{post.location}</div>
                      <div className="text-xs text-gray-500">{post.schedule}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={post.approvedStudent >= post.maxStudent ? 'text-red-600 font-medium' : ''}>
                        {post.approvedStudent}
                      </span>/{post.maxStudent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.visibility ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {post.visibility ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleToggleVisibility(post.id, post.visibility)}
                        disabled={processing[post.id]}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <FontAwesomeIcon icon={post.visibility ? faEyeSlash : faEye} className="mr-1" />
                        {post.visibility ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        disabled={processing[post.id]}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 