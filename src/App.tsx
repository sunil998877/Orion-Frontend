import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import { HeroPage } from './pages/HeroPage';
import { CourseDataProvider } from './contextAPI/courseAPI';
import CourseCreatorForm from './components/CourseCreatorForm';
import AppLayout from './layout/AppLayout';
import AnalyticsPage from './pages/AnalyticsPage';
import HomePage from './pages/HomePage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  React.useEffect(() => {
    // Cleanup legacy local storage keys
    localStorage.removeItem('currentCourseId');
    localStorage.removeItem('courseStatus');
  }, []);

  return (
    <CourseDataProvider>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/course-creator" element={<ProtectedRoute><AppLayout><HomePage /></AppLayout></ProtectedRoute>} />
          <Route path="/create-course" element={<ProtectedRoute><CourseCreatorForm /></ProtectedRoute>} />
          <Route path="/course-basic-info" element={<ProtectedRoute><CourseCreatorForm /></ProtectedRoute>} />
          <Route path="/course-details" element={<ProtectedRoute><AppLayout><HeroPage /></AppLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><HeroPage /></AppLayout></ProtectedRoute>} />
          <Route path="/course-dashboard" element={<ProtectedRoute><AppLayout><HeroPage /></AppLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AppLayout><AnalyticsPage /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </CourseDataProvider>
  );
};

export default App;
