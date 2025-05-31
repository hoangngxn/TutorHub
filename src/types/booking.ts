export interface Schedule {
  weekday: string;
  startHour: string;
  endHour: string;
}

export interface BookingItem {
  id: string;
  studentId: string;
  tutorId: string;
  postId: string;
  subject: string;
  schedules: Schedule[];
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED';
  createdAt: string;
}

export interface UserInfo {
  id: string;
  fullname?: string;
  username: string;
}

export interface EnhancedBooking extends BookingItem {
  studentInfo?: UserInfo;
  tutorInfo?: UserInfo;
  hasReview?: boolean;
  postTitle?: string;
}

export interface PostGroup {
  postId: string;
  subject: string;
  postTitle?: string;
  schedules: Schedule[];
  bookings: EnhancedBooking[];
}

export interface FilterState {
  search: string;
  subject: string;
  status: string;
  tutorId?: string;
  sortBy: string;
}

// Helper function to format a single schedule
export const formatSchedule = (schedule: Schedule): string => {
  const startTime = schedule.startHour.split(':').slice(0, 2).join(':');
  const endTime = schedule.endHour.split(':').slice(0, 2).join(':');
  return `${schedule.weekday}: ${startTime} - ${endTime}`;
};

// Helper function to format multiple schedules
export const formatSchedules = (schedules: Schedule[]): string => {
  return schedules.map(schedule => {
    const startTime = schedule.startHour.split(':').slice(0, 2).join(':');
    const endTime = schedule.endHour.split(':').slice(0, 2).join(':');
    return `${schedule.weekday}: ${startTime} - ${endTime}`;
  }).join(', ');
}; 