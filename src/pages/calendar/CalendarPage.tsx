import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faSpinner, faCalendarAlt, faClock, faUser, faSun, faMoon, faCoffee } from '@fortawesome/free-solid-svg-icons';
import type { Schedule, EnhancedBooking } from '../../types/booking';

interface Booking extends EnhancedBooking {}

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const HOURS = Array.from({ length: 15 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`); // 7:00 to 22:00

const getTimeOfDay = (hour: string) => {
  const hourNum = parseInt(hour);
  if (hourNum >= 7 && hourNum < 12) return 'morning';
  if (hourNum >= 12 && hourNum < 18) return 'afternoon';
  return 'evening';
};

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
          let tutorInfo, studentInfo, postTitle, schedules;
          
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
            // Get schedules from post response if available
            schedules = postResponse.data.schedules || [];
          } catch (error) {
            console.error(`Error fetching post info for ID ${booking.postId}:`, error);
            postTitle = booking.subject;
            schedules = booking.schedules || [];
          }
          
          return {
            ...booking,
            tutorInfo,
            studentInfo,
            postTitle,
            schedules: Array.isArray(schedules) ? schedules : []
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
        return booking.schedules.some(schedule => {
          const bookingStartHour = parseInt(schedule.startHour.split(':')[0]);
          const currentHour = parseInt(hour.split(':')[0]);
          const bookingEndHour = parseInt(schedule.endHour.split(':')[0]);
          return schedule.weekday === weekday && 
                 bookingStartHour <= currentHour && 
                 currentHour < bookingEndHour;
        });
      });
    } else {
      // For tutors, group bookings by post
      const slotBookings = bookings.filter(booking => {
        return booking.schedules.some(schedule => {
          const bookingStartHour = parseInt(schedule.startHour.split(':')[0]);
          const currentHour = parseInt(hour.split(':')[0]);
          const bookingEndHour = parseInt(schedule.endHour.split(':')[0]);
          return schedule.weekday === weekday && 
                 bookingStartHour <= currentHour && 
                 currentHour < bookingEndHour;
        });
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

  const calculateBookingHeight = (booking: Booking, weekday: string) => {
    const schedule = booking.schedules.find(s => s.weekday === weekday);
    if (!schedule) return '4rem'; // Default height if no matching schedule
    
    const startHour = parseInt(schedule.startHour.split(':')[0]);
    const endHour = parseInt(schedule.endHour.split(':')[0]);
    const duration = endHour - startHour;
    
    // Base height calculation (4rem per hour)
    const baseHeight = duration * 4;
    
    // Add additional height for section headers if the booking spans across different time periods
    let additionalHeight = 0;
    
    // Check if booking spans across time period boundaries (12:00 or 18:00)
    if (startHour < 12 && endHour > 12) additionalHeight += 2; // Crosses morning to afternoon
    if (startHour < 18 && endHour > 18) additionalHeight += 2; // Crosses afternoon to evening
    
    // Subtract a small amount to prevent overlap
    return `calc(${baseHeight}rem + ${additionalHeight}rem - 0.25rem)`;
  };

  const shouldShowBookingInSlot = (booking: Booking, weekday: string, hour: string) => {
    return booking.schedules.some(schedule => {
      const slotHour = parseInt(hour.split(':')[0]);
      const bookingStartHour = parseInt(schedule.startHour.split(':')[0]);
      return schedule.weekday === weekday && slotHour === bookingStartHour;
    });
  };

  const getScheduleForWeekday = (booking: Booking, weekday: string): Schedule | undefined => {
    return booking.schedules.find(schedule => schedule.weekday === weekday);
  };

  const renderBookingContent = (booking: Booking, weekday: string) => {
    const schedule = getScheduleForWeekday(booking, weekday);
    if (!schedule) return null;

    if (user?.role === 'STUDENT') {
      return (
        <>
          <div className="font-medium text-sm mb-1">{booking.postTitle || booking.subject}</div>
          <div className="flex items-center text-xs text-indigo-700 mb-1">
            <FontAwesomeIcon icon={faClock} className="h-3 w-3 mr-1" />
            {formatBookingTime(schedule)}
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
            {formatBookingTime(schedule)}
          </div>
          <div className="text-xs text-indigo-700 mt-1">
            {booking.status === 'CONFIRMED' && `${getBookingCountForPost(booking.postId, weekday, schedule.startHour)} bookings`}
          </div>
        </>
      );
    }
  };

  const getBookingCountForPost = (postId: string, weekday: string, startHour: string) => {
    return bookings.filter(b => 
      b.postId === postId && 
      b.schedules.some(s => s.weekday === weekday && s.startHour === startHour)
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
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-500">Loading calendar...</p>
          </div>
        </div>
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
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="h-6 w-6 text-white mr-3" />
              <h1 className="text-2xl font-bold text-white">Class Calendar</h1>
            </div>
          </div>
        </div>

        {/* Time Period Legend */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex space-x-6">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faSun} className="h-4 w-4 text-yellow-500 mr-2" />
            <span className="text-sm text-gray-600">Morning (7:00 - 12:00)</span>
          </div>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCoffee} className="h-4 w-4 text-orange-500 mr-2" />
            <span className="text-sm text-gray-600">Afternoon (12:00 - 18:00)</span>
          </div>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faMoon} className="h-4 w-4 text-indigo-500 mr-2" />
            <span className="text-sm text-gray-600">Evening (18:00 - 22:00)</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-8 border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="p-4 text-sm font-medium text-gray-500 border-r">Time</div>
            {WEEKDAYS.map(day => (
              <div key={day} className="p-4 text-sm font-semibold text-gray-900 text-center border-r last:border-r-0">
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="divide-y">
            {HOURS.map((hour, index) => {
              const timeOfDay = getTimeOfDay(hour);
              const isNewSection = index > 0 && getTimeOfDay(HOURS[index - 1]) !== timeOfDay;
              
              return (
                <div key={hour}>
                  {isNewSection && (
                    <div className="grid grid-cols-8 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-b border-gray-200 h-8">
                      <div className="col-span-8 px-4 py-2 text-xs font-medium text-gray-500">
                        {timeOfDay === 'afternoon' ? (
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faCoffee} className="h-3 w-3 text-orange-500 mr-2" />
                            Afternoon
                          </div>
                        ) : timeOfDay === 'evening' ? (
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={faMoon} className="h-3 w-3 text-indigo-500 mr-2" />
                            Evening
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                  <div className={`grid grid-cols-8 ${timeOfDay === 'morning' ? 'bg-yellow-50/30' : timeOfDay === 'afternoon' ? 'bg-orange-50/30' : 'bg-indigo-50/30'}`}>
                    <div className="p-2 text-sm text-gray-500 border-r bg-gray-50/80 h-16 flex items-center justify-center font-medium">
                      {hour}
                    </div>
                    {WEEKDAYS.map(day => {
                      const slotBookings = getTimeSlotBookings(day, hour);
                      return (
                        <div 
                          key={`${day}-${hour}`} 
                          className="relative p-2 border-r last:border-r-0 h-16 hover:bg-gray-50/50 transition-colors"
                          style={{
                            minHeight: '4rem',
                            height: '100%'
                          }}
                        >
                          {slotBookings.map(booking => (
                            shouldShowBookingInSlot(booking, day, hour) && (
                              <div
                                key={booking.id}
                                className="absolute left-0 right-0 mx-2 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-900 p-3 rounded-lg shadow-sm transition-colors overflow-hidden"
                                style={{
                                  height: calculateBookingHeight(booking, day),
                                  zIndex: 10,
                                  top: '0.25rem',
                                  marginBottom: '0.25rem'
                                }}
                              >
                                {renderBookingContent(booking, day)}
                              </div>
                            )
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage; 