import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import { HeroPage } from './pages/HeroPage';
import { CourseDataProvider } from './contextAPI/courseAPI.tsx';
import CourseCreatorForm from './components/CourseCreatorForm';
import AppLayout from './layout/AppLayout';
import AnalyticsPage from './pages/AnalyticsPage';
import HomePage from './pages/HomePage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  // Routes that should NOT have the AppLayout wrapper (like Login/Register)
  const isAuthPage = ['/', '/login', '/register', '/registration', '/create-course', '/course-basic-info'].includes(location.pathname);

  const routes = (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/registration" element={<RegistrationPage />} />
        
        {/* Pages with Persistent Layout */}
        <Route path="/course-creator" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/course-details" element={<ProtectedRoute><HeroPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><HeroPage /></ProtectedRoute>} />
        <Route path="/course-dashboard" element={<ProtectedRoute><HeroPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        
        {/* Full Screen Pages */}
        <Route path="/create-course" element={<ProtectedRoute><CourseCreatorForm /></ProtectedRoute>} />
        <Route path="/course-basic-info" element={<ProtectedRoute><CourseCreatorForm /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );

  if (isAuthPage) {
    return routes;
  }

  return <AppLayout>{routes}</AppLayout>;
};

const App: React.FC = () => {
  React.useEffect(() => {
    localStorage.removeItem('currentCourseId');
    localStorage.removeItem('courseStatus');
  }, []);

  return (
    <CourseDataProvider>
      <ToastContainer position="top-right" autoClose={3000} limit={3} theme="dark" />
      <Router>
        <AnimatedRoutes />
      </Router>
    </CourseDataProvider>
  );
};

export default App;