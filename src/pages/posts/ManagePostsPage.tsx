import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus, faChalkboardTeacher, faUserGraduate, faClock, faMapMarkerAlt, faEye, faEyeSlash, faGraduationCap, faSearch, faSort, faFilter } from '@fortawesome/free-solid-svg-icons';

interface Schedule {
  weekday: string;
  startHour: string;
  endHour: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  subject: string;
  location: string;
  schedules: Schedule[];
  grade: string;
  createdAt: string;
  visibility: boolean;
  approvedStudent: number;
  maxStudent: number;
  startTime: string;
  endTime: string;
}

interface FilterState {
  search: string;
  subject: string;
  grade: string;
  studentCount: string;
  sortBy: string;
  visibility: string;
}

export default function ManagePostsPage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    subject: '',
    grade: '',
    studentCount: '',
    sortBy: 'newest',
    visibility: 'all'
  });

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof Post) => {
    return Array.from(new Set(posts.map(post => post[field])))
      .filter((value): value is string => 
        typeof value === 'string' && value.length > 0
      );
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [posts, filters]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/posts/tutor/${user?.id}`);
      setPosts(response.data);
      setFilteredPosts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...posts];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower) ||
        post.subject.toLowerCase().includes(searchLower)
      );
    }

    // Apply subject filter
    if (filters.subject) {
      result = result.filter(post => post.subject === filters.subject);
    }

    // Apply grade filter
    if (filters.grade) {
      result = result.filter(post => post.grade === filters.grade);
    }

    // Apply student count filter
    if (filters.studentCount) {
      switch (filters.studentCount) {
        case 'empty':
          result = result.filter(post => post.approvedStudent === 0);
          break;
        case 'available':
          result = result.filter(post => post.approvedStudent < post.maxStudent);
          break;
        case 'full':
          result = result.filter(post => post.approvedStudent >= post.maxStudent);
          break;
      }
    }

    // Apply visibility filter
    if (filters.visibility !== 'all') {
      result = result.filter(post => 
        filters.visibility === 'public' ? post.visibility : !post.visibility
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'students-high':
        result.sort((a, b) => b.approvedStudent - a.approvedStudent);
        break;
      case 'students-low':
        result.sort((a, b) => a.approvedStudent - b.approvedStudent);
        break;
    }

    setFilteredPosts(result);
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update the helper function to format schedules
  const formatSchedules = (schedules: Schedule[]): string => {
    return schedules.map(schedule => {
      const startTime = schedule.startHour.split(':').slice(0, 2).join(':');
      const endTime = schedule.endHour.split(':').slice(0, 2).join(':');
      return `${schedule.weekday}: ${startTime} - ${endTime}`;
    }).join(', ');
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

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search posts..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Subject Filter */}
            <div>
              <select
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Subjects</option>
                {getUniqueValues('subject').map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Grade Filter */}
            <div>
              <select
                value={filters.grade}
                onChange={(e) => handleFilterChange('grade', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Grades</option>
                {getUniqueValues('grade').map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            {/* Student Count Filter */}
            <div>
              <select
                value={filters.studentCount}
                onChange={(e) => handleFilterChange('studentCount', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Capacities</option>
                <option value="empty">Empty</option>
                <option value="available">Available</option>
                <option value="full">Full</option>
              </select>
            </div>

            {/* Visibility Filter */}
            <div>
              <select
                value={filters.visibility}
                onChange={(e) => handleFilterChange('visibility', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="all">All Status</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="students-high">Most Students</option>
                <option value="students-low">Least Students</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredPosts.length} of {posts.length} posts
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-12 text-center">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="h-12 w-12 text-indigo-400 mb-4" />
                <p className="text-lg text-gray-500 mb-6">
                  {posts.length === 0 ? "You haven't created any posts yet." : "No posts match your filters."}
                </p>
                {posts.length === 0 && (
                  <Link
                    to="/posts/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Create Your First Post
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
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
                          <span className="text-sm font-medium text-gray-500">Schedules:</span>
                          <span className="ml-2 text-sm text-gray-900">{formatSchedules(post.schedules)}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Course Period:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(post.startTime).toLocaleDateString()} - {new Date(post.endTime).toLocaleDateString()}
                          </span>
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