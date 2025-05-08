import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChalkboardTeacher, faUserGraduate, faChartLine } from '@fortawesome/free-solid-svg-icons';

interface DashboardStat {
  type: string;
  count: number;
  icon: any;
  color: string;
  link: string;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }

    // Fetch dashboard stats
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch real stats from the API
        const response = await api.get('/api/admin/stats');
        const apiStats = response.data;
        
        const dashboardStats: DashboardStat[] = [
          {
            type: 'Total Students',
            count: apiStats.studentCount,
            icon: faUsers,
            color: 'bg-blue-500',
            link: '/admin/students'
          },
          {
            type: 'Total Tutors',
            count: apiStats.tutorCount,
            icon: faUserGraduate,
            color: 'bg-green-500',
            link: '/admin/tutors'
          },
          {
            type: 'Total Posts',
            count: apiStats.totalPosts,
            icon: faChalkboardTeacher,
            color: 'bg-purple-500',
            link: '/admin/posts'
          },
          {
            type: 'Active Posts',
            count: apiStats.activePosts,
            icon: faChartLine,
            color: 'bg-yellow-500',
            link: '/admin/posts'
          }
        ];
        
        setStats(dashboardStats);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-500">Loading dashboard...</p>
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
                Admin Dashboard
              </h2>
              <p className="mt-1 text-indigo-100">Manage and monitor your tutoring platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <Link 
              key={index} 
              to={item.link}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${item.color}`}>
                    <FontAwesomeIcon icon={item.icon} className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.type}
                      </dt>
                      <dd>
                        <div className="text-lg font-bold text-gray-900">
                          {item.count}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <div className="font-medium text-indigo-600 hover:text-indigo-500">
                    View all
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Latest actions and updates from the platform.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-10">
                <p className="text-gray-500">No recent activity to display.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 