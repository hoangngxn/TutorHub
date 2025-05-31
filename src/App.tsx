import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/auth/PrivateRoute';
import { useAuth } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/posts/CreatePostPage';
import ManagePostsPage from './pages/posts/ManagePostsPage';
import EditPostPage from './pages/posts/EditPostPage';
import BookingManagementPage from './pages/bookings/BookingManagementPage';
import CalendarPage from './pages/calendar/CalendarPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminTutorsPage from './pages/admin/AdminTutorsPage';
import AdminStudentsPage from './pages/admin/AdminStudentsPage';

// Admin role check higher-order component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <PrivateRoute requiredRole="ADMIN">
      {children}
    </PrivateRoute>
  );
};

// Dashboard route with role-based redirection
const DashboardRoute = () => {
  const { user } = useAuth();
  
  // Redirect admin users to admin dashboard
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // Regular users see the standard dashboard
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/posts/create"
                element={
                  <PrivateRoute>
                    <CreatePostPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/posts/manage"
                element={
                  <PrivateRoute>
                    <ManagePostsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/posts/edit/:postId"
                element={
                  <PrivateRoute>
                    <EditPostPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <PrivateRoute>
                    <BookingManagementPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <PrivateRoute>
                    <CalendarPage />
                  </PrivateRoute>
                }
              />
              
              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/posts"
                element={
                  <AdminRoute>
                    <AdminPostsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/tutors"
                element={
                  <AdminRoute>
                    <AdminTutorsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <AdminRoute>
                    <AdminStudentsPage />
                  </AdminRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
