import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faClock, faUser, faMapMarkerAlt, faCheck, faTimes, faChevronDown, faChevronUp, faBook, faGraduationCap, faBriefcase, faStar, faSearch, faSort, faFilter } from '@fortawesome/free-solid-svg-icons';
import ProfilePreview from '../../components/user/ProfilePreview';
import ReviewModal from '../../components/review/ReviewModal';
import StudentBooking from './StudentBooking';
import TutorBooking from './TutorBooking';

interface Schedule {
  weekday: string;
  startHour: string;
  endHour: string;
}

interface BookingItem {
  id: string;
  studentId: string;
  tutorId: string;
  postId: string;
  subject: string;
  schedule: Schedule;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED';
  createdAt: string;
}

interface UserInfo {
  id: string;
  fullname?: string;
  username: string;
}

interface EnhancedBooking extends BookingItem {
  studentInfo?: UserInfo;
  tutorInfo?: UserInfo;
  hasReview?: boolean;
  postTitle?: string;
}

interface PostGroup {
  postId: string;
  subject: string;
  postTitle?: string;
  schedule: Schedule;
  bookings: EnhancedBooking[];
}

interface FilterState {
  search: string;
  subject: string;
  status: string;
  tutorId?: string;
  sortBy: string;
}

// Update the helper function to format schedule
const formatSchedule = (schedule: Schedule): string => {
  const startTime = schedule.startHour.split(':').slice(0, 2).join(':');
  const endTime = schedule.endHour.split(':').slice(0, 2).join(':');
  return `${schedule.weekday}: ${startTime} - ${endTime}`;
};

export default function BookingManagementPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="mt-4 text-lg text-gray-500">Please log in to view your bookings.</p>
          </div>
        </div>
      </div>
    );
  }

  return user.role === 'STUDENT' ? <StudentBooking /> : <TutorBooking />;
} 