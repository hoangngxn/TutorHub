import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faSpinner, faCalendarAlt, faClock, faUser } from '@fortawesome/free-solid-svg-icons';

interface Schedule {
  weekday: string;
  startHour: string;
  endHour: string;
}

interface Booking {
  id: string;
  studentId: string;
  tutorId: string;
  postId: string;
  subject: string;
  schedule: Schedule;
  status: string;
  createdAt: string;
  studentInfo?: {
    fullname?: string;
    username: string;
  };
  tutorInfo?: {
    fullname?: string;
    username: string;
  };
  postTitle?: string;
}

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const HOURS = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`); // 7:00 to 22:00

const CalendarPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bookings');
      const confirmedBookings = await Promise.all(response.data
        .filter((booking: Booking) => booking.status === 'CONFIRMED')
        .map(async (booking: any) => {
          let tutorInfo, studentInfo, postTitle;
          
          try {
            const tutorResponse = await api.get(`/api/auth/users/${booking.tutorId}`);
            tutorInfo = {
              id: tutorResponse.data.id,
              username: tutorResponse.data.username,
              fullname: tutorResponse.data.fullname
            };
          } catch (error) {
            console.error(`Error fetching tutor info for ID ${booking.tutorId}:`, error);
            tutorInfo = {
              id: booking.tutorId,
              username: `tutor_${booking.tutorId.substring(0, 5)}`,
              fullname: `Tutor ${booking.tutorId.substring(0, 5)}`
            };
          }

          try {
            const studentResponse = await api.get(`/api/auth/users/${booking.studentId}`);
            studentInfo = {
              id: studentResponse.data.id,
              username: studentResponse.data.username,
              fullname: studentResponse.data.fullname
            };
          } catch (error) {
            console.error(`Error fetching student info for ID ${booking.studentId}:`, error);
            studentInfo = {
              id: booking.studentId,
              username: `student_${booking.studentId.substring(0, 5)}`,
              fullname: `Student ${booking.studentId.substring(0, 5)}`
            };
          }

          try {
            const postResponse = await api.get(`/api/posts/${booking.postId}`);
            postTitle = postResponse.data.title;
          } catch (error) {
            console.error(`Error fetching post info for ID ${booking.postId}:`, error);
            postTitle = booking.subject;
          }
          
          return {
            ...booking,
            tutorInfo,
            studentInfo,
            postTitle
          };
        }));
      
      setBookings(confirmedBookings);
      setError('');
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlotBookings = (weekday: string, hour: string) => {
    if (user?.role === 'STUDENT') {
      return bookings.filter(booking => {
        const bookingStartHour = parseInt(booking.schedule.startHour.split(':')[0]);
        const currentHour = parseInt(hour.split(':')[0]);
        const bookingEndHour = parseInt(booking.schedule.endHour.split(':')[0]);
        return booking.schedule.weekday === weekday && 
               bookingStartHour <= currentHour && 
               currentHour < bookingEndHour;
      });
    } else {
      // For tutors, group bookings by post
      const slotBookings = bookings.filter(booking => {
        const bookingStartHour = parseInt(booking.schedule.startHour.split(':')[0]);
        const currentHour = parseInt(hour.split(':')[0]);
        const bookingEndHour = parseInt(booking.schedule.endHour.split(':')[0]);
        return booking.schedule.weekday === weekday && 
               bookingStartHour <= currentHour && 
               currentHour < bookingEndHour;
      });

      // Group by postId and return only one booking per post
      const postGroups = slotBookings.reduce((groups: { [key: string]: Booking }, booking) => {
        if (!groups[booking.postId]) {
          groups[booking.postId] = booking;
        }
        return groups;
      }, {});

      return Object.values(postGroups);
    }
  };

  const formatBookingTime = (schedule: Schedule) => {
    const start = schedule.startHour.split(':').slice(0, 2).join(':');
    const end = schedule.endHour.split(':').slice(0, 2).join(':');
    return `${start} - ${end}`;
  };

  const calculateBookingHeight = (booking: Booking) => {
    const startHour = parseInt(booking.schedule.startHour.split(':')[0]);
    const endHour = parseInt(booking.schedule.endHour.split(':')[0]);
    const duration = endHour - startHour;
    // Subtract 0.25rem (4px) from the bottom to prevent overlap
    return `calc(${duration * 4}rem - 0.25rem)`;
  };

  const shouldShowBookingInSlot = (booking: Booking, hour: string) => {
    const slotHour = parseInt(hour.split(':')[0]);
    const bookingStartHour = parseInt(booking.schedule.startHour.split(':')[0]);
    return slotHour === bookingStartHour;
  };

  const renderBookingContent = (booking: Booking) => {
    if (user?.role === 'STUDENT') {
      return (
        <>
          <div className="font-medium text-sm mb-1">{booking.postTitle || booking.subject}</div>
          <div className="flex items-center text-xs text-indigo-700 mb-1">
            <FontAwesomeIcon icon={faClock} className="h-3 w-3 mr-1" />
            {formatBookingTime(booking.schedule)}
          </div>
          <div className="flex items-center text-xs text-indigo-700">
            <FontAwesomeIcon icon={faUser} className="h-3 w-3 mr-1" />
            Tutor: {booking.tutorInfo?.fullname || booking.tutorInfo?.username}
          </div>
        </>
      );
    } else {
      // For tutors, show a simpler view with just the post title and time
      return (
        <>
          <div className="font-medium text-sm mb-1">{booking.postTitle || booking.subject}</div>
          <div className="flex items-center text-xs text-indigo-700">
            <FontAwesomeIcon icon={faClock} className="h-3 w-3 mr-1" />
            {formatBookingTime(booking.schedule)}
          </div>
          <div className="text-xs text-indigo-700 mt-1">
            {booking.status === 'CONFIRMED' && `${getBookingCountForPost(booking.postId, booking.schedule.weekday, booking.schedule.startHour)} bookings`}
          </div>
        </>
      );
    }
  };

  const getBookingCountForPost = (postId: string, weekday: string, startHour: string) => {
    return bookings.filter(b => 
      b.postId === postId && 
      b.schedule.weekday === weekday && 
      b.schedule.startHour === startHour
    ).length;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const getWeekRange = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // End on Sunday
    
    return `${start.toLocaleDateString('en-US', { day: 'numeric' })} - ${end.toLocaleDateString('en-US', { day: 'numeric' })} ${end.toLocaleDateString('en-US', { month: 'short' })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-indigo-600 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-white mr-3" />
              <h1 className="text-2xl font-bold text-white">Class Calendar</h1>
            </div>

          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-8 border-b bg-gray-50">
            <div className="p-4 text-sm font-medium text-gray-500 border-r">Time</div>
            {WEEKDAYS.map(day => (
              <div key={day} className="p-4 text-sm font-medium text-gray-900 text-center border-r last:border-r-0">
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="divide-y">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8">
                <div className="p-2 text-sm text-gray-500 border-r bg-gray-50 h-16 flex items-center justify-center">
                  {hour}
                </div>
                {WEEKDAYS.map(day => {
                  const slotBookings = getTimeSlotBookings(day, hour);
                  return (
                    <div key={`${day}-${hour}`} className="relative p-2 border-r last:border-r-0 h-16 hover:bg-gray-50 transition-colors">
                      {slotBookings.map(booking => (
                        shouldShowBookingInSlot(booking, hour) && (
                          <div
                            key={booking.id}
                            className="absolute left-0 right-0 mx-2 bg-indigo-200 hover:bg-indigo-300 text-indigo-900 p-3 rounded-lg shadow-sm transition-colors overflow-hidden"
                            style={{
                              height: calculateBookingHeight(booking),
                              zIndex: 10,
                              top: '0.25rem'
                            }}
                          >
                            {renderBookingContent(booking)}
                          </div>
                        )
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage; 