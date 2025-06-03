import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

// Predefined subjects
const SUBJECTS = [
  "Ngữ văn",
  "Toán",
  "Tiếng Anh",
  "Giáo dục kinh tế và pháp luật",
  "Lịch sử",
  "Địa lí",
  "Hóa học",
  "Vật lí",
  "Sinh học",
  "Tin học"
];

// Predefined grades
const GRADES = [
  "Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5",
  "Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9",
  "Lớp 10", "Lớp 11", "Lớp 12",
  "Đại học", "Sau đại học"
];

// Add weekday constants
const WEEKDAYS = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"
];

interface Schedule {
  weekday: string;
  startHour: string;
  endHour: string;
}

interface PostData {
  title: string;
  description: string;
  subject: string;
  location: string;
  schedules: Schedule[];
  grade: string;
  visibility: boolean;
  maxStudent: number;
  startTime: string;
  endTime: string;
}

export default function EditPostPage() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { token, user } = useAuth();
  const [formData, setFormData] = useState<PostData>({
    title: '',
    description: '',
    subject: SUBJECTS[0],
    location: '',
    schedules: [{ weekday: WEEKDAYS[0], startHour: '09:00', endHour: '17:00' }],
    grade: GRADES[0],
    visibility: true,
    maxStudent: 1,
    startTime: '',
    endTime: ''
  });
  const [originalData, setOriginalData] = useState<PostData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setFetchLoading(true);
      try {
        const response = await api.get(`/api/posts/${postId}`);
        const postData = response.data;
        
        // Verify the current user is the owner of this post
        if (postData.userId !== user?.id) {
          navigate('/posts/manage');
          return;
        }

        const formattedData = {
          title: postData.title,
          description: postData.description,
          subject: postData.subject,
          location: postData.location,
          schedules: postData.schedules,
          grade: postData.grade || GRADES[0],
          visibility: postData.visibility,
          maxStudent: postData.maxStudent,
          startTime: postData.startTime,
          endTime: postData.endTime
        };

        setFormData(formattedData);
        setOriginalData(formattedData);
      } catch (err) {
        setError('Failed to fetch post details. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchPost();
  }, [postId, user?.id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Special handling for dates
    if (name === 'startTime' || name === 'endTime') {
      // For date inputs, store the date at noon UTC to avoid timezone issues
      const date = new Date(value + 'T12:00:00Z');
      setFormData(prev => ({
        ...prev,
        [name]: date.toISOString()
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               name === 'maxStudent' ? parseInt(value) : value
    }));
  };

  const handleScheduleChange = (index: number, field: keyof Schedule, value: string) => {
    setFormData(prev => {
      const newSchedules = [...prev.schedules];
      newSchedules[index] = {
        ...newSchedules[index],
        [field]: value
      };
      return {
        ...prev,
        schedules: newSchedules
      };
    });
  };

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, { weekday: WEEKDAYS[0], startHour: '09:00', endHour: '17:00' }]
    }));
  };

  const removeSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  const getModifiedFields = () => {
    if (!originalData) return formData;

    const changes = {} as Record<keyof PostData, any>;
    
    (Object.keys(formData) as Array<keyof PostData>).forEach(key => {
      if (key === 'schedules') {
        // Deep comparison for schedules array
        if (JSON.stringify(formData[key]) !== JSON.stringify(originalData[key])) {
          changes[key] = formData[key];
        }
      } else if (formData[key] !== originalData[key]) {
        changes[key] = formData[key];
      }
    });

    // Only return fields that were actually modified
    return Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== undefined)
    ) as Partial<PostData>;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const modifiedFields = getModifiedFields();
      
      // If there are date fields in the modified fields, ensure they're formatted correctly
      if ('startTime' in modifiedFields) {
        modifiedFields.startTime = new Date(modifiedFields.startTime as string).toISOString();
      }
      if ('endTime' in modifiedFields) {
        modifiedFields.endTime = new Date(modifiedFields.endTime as string).toISOString();
      }

      await api.put(`/api/posts/${postId}`, modifiedFields);
      navigate('/posts/manage');
    } catch (err) {
      setError('Failed to update post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center p-12 bg-white rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-500">Loading post details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-indigo-600 py-6 px-6">
            <h2 className="text-2xl font-bold text-white">
              Edit Post
            </h2>
            <p className="mt-1 text-indigo-100">Update your tutoring post details</p>
          </div>

          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                  <p className="font-medium">Error</p>
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    minLength={5}
                    maxLength={100}
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a descriptive title"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    required
                    maxLength={1000}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what you'll be teaching, your qualifications, and other relevant details"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <div className="mt-1">
                  <select
                    name="subject"
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors bg-white"
                  >
                    {SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                  Education Grade Level
                </label>
                <div className="mt-1">
                  <select
                    name="grade"
                    id="grade"
                    required
                    value={formData.grade}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors bg-white"
                  >
                    {GRADES.map(grade => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Online, Campus Library, etc."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Schedules
                </label>
                <div className="mt-1 space-y-4">
                  {formData.schedules.map((schedule, index) => (
                    <div key={index} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                      <div className="flex-1">
                        <select
                          value={schedule.weekday}
                          onChange={(e) => handleScheduleChange(index, 'weekday', e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors bg-white"
                        >
                          {WEEKDAYS.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="time"
                          value={schedule.startHour}
                          onChange={(e) => handleScheduleChange(index, 'startHour', e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="time"
                          value={schedule.endHour}
                          onChange={(e) => handleScheduleChange(index, 'endHour', e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                        />
                      </div>
                      {formData.schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSchedule(index)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSchedule}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Schedule
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Course Start Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="startTime"
                      id="startTime"
                      required
                      value={formData.startTime ? new Date(formData.startTime).toISOString().split('T')[0] : ''}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    Course End Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="endTime"
                      id="endTime"
                      required
                      value={formData.endTime ? new Date(formData.endTime).toISOString().split('T')[0] : ''}
                      onChange={handleChange}
                      min={formData.startTime ? new Date(formData.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="maxStudent" className="block text-sm font-medium text-gray-700">
                  Maximum Number of Students
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="maxStudent"
                    id="maxStudent"
                    required
                    min={1}
                    max={50}
                    value={formData.maxStudent}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-gray-300 rounded-md p-2.5 text-black transition-colors"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="visibility"
                    id="visibility"
                    checked={formData.visibility}
                    onChange={handleChange}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="visibility" className="ml-3 block text-sm text-gray-900">
                    Make this post public
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500 ml-8">
                  Public posts will be visible to all students. Private posts can only be seen by you.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/posts/manage')}
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
                      Updating...
                    </>
                  ) : 'Update Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 