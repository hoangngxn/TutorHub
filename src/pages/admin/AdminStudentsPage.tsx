import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faSearch, faTrash, faEnvelope, faPhone, faMapMarkerAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

interface Student {
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
  bookingCount?: number;
  reviewCount?: number;
}

export default function AdminStudentsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
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

    fetchStudents();
  }, [isAuthenticated, user, navigate]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Fetch all users with STUDENT role
      const response = await api.get('/api/admin/users', { params: { role: 'STUDENT' } });
      
      // Enhance students with additional information
      const enhancedStudents = await Promise.all(response.data.map(async (student: Student) => {
        try {
          // Fetch student's bookings count
          const bookingsResponse = await api.get('/api/bookings', {
            params: { studentId: student.id }
          });
          
          // Fetch student's reviews count
          const reviewsResponse = await api.get('/api/reviews', {
            params: { studentId: student.id }
          });
          
          return {
            ...student,
            bookingCount: bookingsResponse.data.length,
            reviewCount: reviewsResponse.data.length
          };
        } catch (error) {
          console.error(`Error fetching additional info for student ${student.id}:`, error);
          return {
            ...student,
            bookingCount: 0,
            reviewCount: 0
          };
        }
      }));
      
      setStudents(enhancedStudents);
      setError('');
    } catch (err) {
      setError('Failed to fetch students. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student? All associated bookings and reviews will also be deleted. This action cannot be undone.')) {
      return;
    }

    setProcessing(prev => ({ ...prev, [studentId]: true }));
    try {
      await api.delete(`/api/admin/users/${studentId}`);
      setStudents(students.filter(student => student.id !== studentId));
    } catch (err) {
      setError('Failed to delete student. Please try again.');
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[studentId];
        return newState;
      });
    }
  };

  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (student.fullname || '').toLowerCase().includes(searchTermLower) ||
      student.username.toLowerCase().includes(searchTermLower) ||
      student.email.toLowerCase().includes(searchTermLower) ||
      (student.phone || '').toLowerCase().includes(searchTermLower) ||
      (student.address || '').toLowerCase().includes(searchTermLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center bg-white p-12 rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-500">Loading students...</p>
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
                Manage Students
              </h2>
              <p className="mt-1 text-indigo-100">View and manage all students on the platform</p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={fetchStudents}
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
                placeholder="Search students by name, email, username..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Students list */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Information
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No students found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={student.avatar}
                              alt={student.fullname || student.username}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-bold">
                                {(student.fullname?.[0] || student.username[0]).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.fullname || student.username}
                          </div>
                          <div className="text-sm text-gray-500">@{student.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                      {student.phone && (
                        <div className="text-sm text-gray-500">{student.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium text-blue-600">{student.bookingCount || 0}</span> bookings
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-green-600">{student.reviewCount || 0}</span> reviews
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 text-gray-400 mr-1" />
                        {new Date(student.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        disabled={processing[student.id]}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {processing[student.id] ? (
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                        ) : (
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        )}
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